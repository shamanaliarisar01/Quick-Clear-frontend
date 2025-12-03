import React, { useState, useEffect } from 'react';
import Login from './pages/LoginPage';
import Register from './pages/RegistrationPage';
import ChatApp from './components/ChatApp';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quickclear-blue via-purple-400 to-quickclear-purple">
      {!user ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <div className="glass-effect rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">QuickClear</h1>
                <p className="text-white/80 text-lg">Connect with your team in real-time</p>
              </div>
              
              {showLogin ? (
                <Login onLogin={handleLogin} onSwitch={() => setShowLogin(false)} />
              ) : (
                <Register onRegister={handleLogin} onSwitch={() => setShowLogin(true)} />
              )}
            </div>
          </div>
        </div>
      ) : (
        <ChatApp user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;