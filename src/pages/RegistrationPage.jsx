import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import axios from 'axios';

const Register = ({ onRegister, onSwitch }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('https://quick-clear-backend-production.up.railway.app/api/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      onRegister(response.data.user, response.data.token);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <h2 className="text-2xl font-bold text-white text-center">Create Account</h2>
      <p className="text-white/70 text-center">Join QuickClear today</p>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-white px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-5 h-5" />
          <input
            type="text"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-5 h-5" />
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-5 h-5" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Create password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-5 h-5" />
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-quickclear-purple py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
      
      <p className="text-white/70 text-center">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-white font-semibold hover:underline focus:outline-none"
        >
          Sign in
        </button>
      </p>
    </form>
  );
};

export default Register;