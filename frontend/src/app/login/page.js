'use client';

import { useState } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [registerNumber, setRegisterNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!registerNumber.trim() || !password) {
      setError('Please enter register number and password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { registerNumber, password });
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">DashMate</h1>
          <p className="text-blue-500 text-base leading-relaxed max-w-sm">
            Regain your access to the supercharged community
          </p>
        </div>

        <div className="w-full max-w-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-blue-600 text-sm font-medium mb-2">Register Number</label>
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => { setRegisterNumber(e.target.value); setError(''); }}
                placeholder="24BCE2383"
                className="w-full px-4 py-3 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-blue-600 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 pr-12 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Submit'}
            </button>
          </form>
        </div>

        <div className="mt-12 text-center">
          <p className="text-blue-600 mb-2">Not part of the clan?</p>
          <Link href="/register" className="text-blue-600 underline hover:text-blue-800 transition-colors">
            Register here
          </Link>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex flex-col items-center justify-center p-12">
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-blue-600 mb-6">DashMate</h1>
            <p className="text-2xl text-blue-600 mb-8 max-w-md">
              Get your needs delivered to your doorstep
            </p>
          </div>

          <div className="relative w-full max-w-md">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <p className="text-blue-600 font-medium text-lg">Join the supercharged community</p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gray-50 flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">Welcome Back</h2>
              <p className="text-blue-500 text-lg">Regain your access to the supercharged community</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-blue-600 text-sm font-medium mb-3">Register Number</label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => { setRegisterNumber(e.target.value); setError(''); }}
                  placeholder="24BCE2383"
                  className="w-full px-4 py-4 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-blue-600 text-sm font-medium mb-3">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter password"
                    className="w-full px-4 py-4 pr-12 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-8 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Signing in...' : 'Submit'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-blue-600 mb-2 text-lg">Not part of the clan?</p>
              <Link href="/register" className="text-blue-600 underline hover:text-blue-800 transition-colors text-lg">
                Register here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
