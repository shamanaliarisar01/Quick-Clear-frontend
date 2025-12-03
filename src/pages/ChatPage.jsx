import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

const ChatPage = () => {
  const { currentUser, logout } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);

  return (
    <div className="app-background min-h-screen">
      <div className="flex h-screen max-w-7xl mx-auto shadow-2xl">
        <Sidebar onSelectUser={setSelectedUser} selectedUser={selectedUser} />
        <ChatArea selectedUser={selectedUser} />
      </div>
    </div>
  );
};

export default ChatPage;