import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    await login(email);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-medium tracking-tight mb-4">Access</h1>
          <p className="text-gray-400 font-light text-sm">Enter your credentials to access your olfactory profile.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="••••••••"
            />
          </div>

          <div className="pt-8">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </div>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            No account? <span className="text-black cursor-pointer hover:underline" onClick={() => navigate('/subscribe')}>Request Membership</span>
          </p>
        </div>
      </div>
    </div>
  );
};