"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }
    
    try {
      await login(email, password);
      router.push('/');
    } catch (error: any) {
      setError(error.message || '登录失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-medium tracking-tight mb-4">Access</h1>
          <p className="text-gray-400 font-light text-sm">Enter your credentials to access your olfactory profile.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

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
              className="w-full uppercase tracking-wider"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 mb-4">还没有账号？</p>
          <Button
            type="button"
            variant="outline"
            className="w-full uppercase tracking-wider"
            onClick={() => router.push('/register')}
          >
            Sign Up
          </Button>
        </div>
      </div>
    </div>
  );
}
