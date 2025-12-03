
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { 
  LogOut, 
  Search, 
  Send, 
  Paperclip, 
  Image as ImageIcon,
  User,
  FileText,
  Download,
  X,
  Trash2,
  MoreVertical
} from 'lucide-react';

const API_BASE_URL = 'https://quick-clear-backend-production.up.railway.app';

const ChatApp = ({ user, onLogout }) => {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileInputRef = useRef(null);

  // Safe user data access
  const getSafeUsername = (userObj) => {
    if (!userObj) return '?';
    return userObj.username || userObj.name || 'User';
  };

  const getSafeInitial = (userObj) => {
    const username = getSafeUsername(userObj);
    return username.charAt(0).toUpperCase();
  };

  const getSafeProfilePicture = (userObj) => {
    return userObj?.profilePicture || '';
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io(API_BASE_URL, {
      auth: { token }
    });
    
    setSocket(newSocket);

    newSocket.emit('user_online', {
      userId: user?.id || user?._id,
      username: getSafeUsername(user),
      profilePicture: getSafeProfilePicture(user)
    });

    fetchUsers();
    setupSocketListeners(newSocket);

    return () => {
      if (user?.id || user?._id) {
        newSocket.emit('user_logout', user.id || user._id);
      }
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocketListeners = (socket) => {
    socket.on('receive_message', (message) => {
      // Only add message if it's from the selected user
      if (selectedUser && (
        message.sender._id === selectedUser._id || 
        message.receiver._id === selectedUser._id
      )) {
        setMessages(prev => [...prev, message]);
      }
    });

    socket.on('user_online', (userData) => {
      setUsers(prev => prev.map(u => 
        u._id === userData.userId ? { ...u, isOnline: true } : u
      ));
    });

    socket.on('user_offline', (data) => {
      setUsers(prev => prev.map(u => 
        u._id === data.userId ? { ...u, isOnline: false } : u
      ));
    });

    socket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('message_read_receipt', (data) => {
      // Update message read status
      setMessages(prev => prev.map(msg =>
        msg._id === data.messageId ? { ...msg, isRead: true } : msg
      ));
    });
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    if (!user || !user._id) return;
    setSelectedUser(user);
    setShowMessageMenu(null);
    fetchMessages(user._id);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    const receiverId = selectedUser._id || selectedUser.id;
    if (!receiverId) return;

    socket.emit('send_message', {
      receiverId: receiverId,
      content: newMessage
    });

    setNewMessage('');
  };

  const deleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/messages/${messageId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      setShowMessageMenu(null);
    } catch (error) {
      console.error('Failed to delete message:', error);
      alert('Failed to delete message');
    }
  };

  const clearConversation = async () => {
    if (!selectedUser) return;
    
    if (window.confirm('Are you sure you want to clear this conversation? This action cannot be undone.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/conversation/${selectedUser._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setMessages([]);
        setShowMessageMenu(null);
      } catch (error) {
        console.error('Failed to clear conversation:', error);
        alert('Failed to clear conversation');
      }
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedUser || !socket) return;

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_BASE_URL}/api/upload-chat-file`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { fileUrl, fileName, fileSize, fileType } = response.data;

      socket.emit('send_message', {
        receiverId: selectedUser._id,
        content: fileType === 'image' ? 'Sent an image' : `Sent a file: ${fileName}`,
        messageType: fileType,
        fileUrl: fileUrl,
        fileName: fileName,
        fileSize: fileSize
      });

    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(`${API_BASE_URL}/api/upload-profile-pic`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = { ...user, profilePicture: response.data.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      window.location.reload();

    } catch (error) {
      console.error('Profile picture upload error:', error);
      alert('Failed to upload profile picture');
    } finally {
      setShowProfileUpload(false);
      event.target.value = '';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const username = getSafeUsername(u).toLowerCase();
    return username.includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isMessageFromCurrentUser = (message) => {
    if (!message || !message.sender || !user) return false;
    const senderId = message.sender._id || message.sender.id;
    const currentUserId = user.id || user._id;
    return senderId === currentUserId;
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}/uploads/${fileUrl}`;
    link.download = fileName;
    link.click();
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/20"></div>
      
      {/* Sidebar */}
      <div className="w-80 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col relative z-10">
        {/* Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {getSafeProfilePicture(user) ? (
                  <img
                    src={`${API_BASE_URL}/uploads/${getSafeProfilePicture(user)}`}
                    alt="Profile"
                    className="w-12 h-12 rounded-full border-2 border-white/30 cursor-pointer"
                    onClick={() => setShowProfileUpload(true)}
                  />
                ) : (
                  <div 
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold border-2 border-white/30 cursor-pointer"
                    onClick={() => setShowProfileUpload(true)}
                  >
                    {getSafeInitial(user)}
                  </div>
                )}
                <div className="online-dot"></div>
              </div>
              <div>
                <h3 className="font-semibold text-white">{getSafeUsername(user)}</h3>
                <span className="text-xs text-green-300">Online</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Team Members ({filteredUsers.filter(u => u?.isOnline).length} online)
            </h4>
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center text-white/60 py-4">
                  No users found
                </div>
              ) : (
                filteredUsers.map(user => (
                  <div
                    key={user?._id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                      selectedUser?._id === user?._id
                        ? 'bg-white/20 border border-white/30'
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="relative">
                      {getSafeProfilePicture(user) ? (
                        <img
                          src={`${API_BASE_URL}/uploads/${getSafeProfilePicture(user)}`}
                          alt="Profile"
                          className="w-10 h-10 rounded-full border border-white/30"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {getSafeInitial(user)}
                        </div>
                      )}
                      <div className={user?.isOnline ? 'online-dot' : 'offline-dot'}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {getSafeUsername(user)}
                      </p>
                      <p className="text-xs text-white/60 truncate">
                        {user?.isOnline ? 'Online' : 'Offline'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {getSafeProfilePicture(selectedUser) ? (
                      <img
                        src={`${API_BASE_URL}/uploads/${getSafeProfilePicture(selectedUser)}`}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border border-white/30"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {getSafeInitial(selectedUser)}
                      </div>
                    )}
                    <div className={selectedUser?.isOnline ? 'online-dot' : 'offline-dot'}></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{getSafeUsername(selectedUser)}</h3>
                    <span className="text-xs text-white/60">
                      {selectedUser?.isOnline ? 'Online - Private Chat' : 'Offline - Private Chat'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMessageMenu(showMessageMenu ? null : 'conversation')}
                    className="p-2 text-white/70 hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {showMessageMenu === 'conversation' && (
                    <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 z-20">
                      <button
                        onClick={clearConversation}
                        className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear Conversation</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-white/60">Loading messages...</div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white/60">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No messages yet. Start a private conversation!</p>
                    <p className="text-sm mt-2">💬 Only you and {getSafeUsername(selectedUser)} can see these messages</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={message._id || index}
                    className={`flex ${isMessageFromCurrentUser(message) ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm relative group ${
                        isMessageFromCurrentUser(message) 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-none' 
                          : 'bg-white/20 backdrop-blur-md text-white rounded-bl-none border border-white/20'
                      }`}
                      onMouseEnter={() => setShowMessageMenu(message._id)}
                      onMouseLeave={() => setShowMessageMenu(null)}
                    >
                      {/* Message Menu */}
                      {showMessageMenu === message._id && isMessageFromCurrentUser(message) && (
                        <button
                          onClick={() => deleteMessage(message._id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                          title="Delete message"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}

                      {message.messageType === 'image' ? (
                        <div className="space-y-2">
                          <img 
                            src={`${API_BASE_URL}/uploads/${message.fileUrl}`} 
                            alt="Shared image"
                            className="rounded-lg max-w-full h-auto cursor-pointer"
                            onClick={() => window.open(`${API_BASE_URL}/uploads/${message.fileUrl}`, '_blank')}
                          />
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ) : message.messageType === 'file' ? (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 p-2 bg-white/10 rounded-lg">
                            <FileText className="w-5 h-5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{message.fileName}</p>
                              <p className="text-xs opacity-70">{formatFileSize(message.fileSize)}</p>
                            </div>
                            <button
                              onClick={() => downloadFile(message.fileUrl, message.fileName)}
                              className="p-1 hover:bg-white/20 rounded transition-colors"
                              title="Download file"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <div className={`text-xs mt-1 flex justify-between items-center ${
                        isMessageFromCurrentUser(message) ? 'text-white/70' : 'text-white/60'
                      }`}>
                        <span>{formatTime(message.timestamp)}</span>
                        {isMessageFromCurrentUser(message) && (
                          <span className="text-xs">
                            {message.isRead ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4">
              <form onSubmit={sendMessage} className="flex space-x-3">
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="p-2 text-white/70 hover:text-white transition-colors disabled:opacity-50"
                    title="Attach file"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Paperclip className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Type a private message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/80">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Welcome to QuickClear</h3>
              <p>Select a user to start private chatting</p>
              <p className="text-sm mt-2 text-white/60">🔒 All messages are private and encrypted</p>
            </div>
          </div>
        )}
      </div>

      {/* Profile Picture Upload Modal */}
      {showProfileUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Update Profile Picture</h3>
              <button
                onClick={() => setShowProfileUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="file"
              ref={profileInputRef}
              onChange={handleProfilePictureUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => profileInputRef.current?.click()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Choose Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;