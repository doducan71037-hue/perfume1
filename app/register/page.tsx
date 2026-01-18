"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('请填写所有必填项');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('邮箱格式不正确');
      return false;
    }

    if (password.length < 8) {
      setError('密码至少需要8位字符');
      return false;
    }

    const hasNumber = /\d/.test(password);
    const hasLetter = /[a-zA-Z]/.test(password);
    if (!hasNumber || !hasLetter) {
      setError('密码必须包含至少一个数字和一个字母');
      return false;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
          displayName: displayName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '注册失败');
        setIsLoading(false);
        return;
      }

      // 注册成功，更新 AuthContext（通过调用 login 刷新用户状态）
      await login(email, password);
      router.push('/');
    } catch (error) {
      console.error('Register failed:', error);
      setError('注册失败，请重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-medium tracking-tight mb-4">Register</h1>
          <p className="text-gray-400 font-light text-sm">Create your account to access your olfactory profile.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="Your name (optional)"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-gray-400 mt-1">至少8位，包含数字和字母</p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-3 border-b border-gray-200 focus:border-black outline-none bg-transparent transition-colors font-light"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="pt-8">
            <Button 
              type="submit" 
              className="w-full uppercase tracking-wider"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Register'}
            </Button>
          </div>
        </form>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <span 
              className="text-black cursor-pointer hover:underline" 
              onClick={() => router.push('/login')}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
