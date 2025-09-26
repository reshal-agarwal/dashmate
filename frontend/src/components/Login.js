"use client"

import Image from 'next/image'
import { Inter } from 'next/font/google'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

export default function DashMateLogin() {
  const [registerNumber, setRegisterNumber] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Login attempt:', { registerNumber, password })
  }

  return (
    <div className={`min-h-screen ${inter.className}`}>
      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-8">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">
            DashMate
          </h1>
          <p className="text-blue-500 text-base leading-relaxed max-w-sm">
            Regain your access to the supercharged community
          </p>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Register Number Input */}
            <div>
              <label className="block text-blue-600 text-sm font-medium mb-2">
                Register Number
              </label>
              <input
                type="text"
                value={registerNumber}
                onChange={(e) => setRegisterNumber(e.target.value)}
                placeholder="24BCE2383"
                className="w-full px-4 py-3 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-blue-600 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="24BCE2383"
                className="w-full px-4 py-3 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Submit
            </button>
            
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-12 text-center">
          <p className="text-blue-600 mb-2">Not part of the clan?</p>
          <a href="/register" className="text-blue-600 underline hover:text-blue-800 transition-colors">
            Register here
          </a>
        </div>

      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        
        {/* Left Side - Visual Content */}
        <div className="flex-1 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 flex flex-col items-center justify-center p-12">
          
          <div className="text-center mb-8">
            <h1 className="text-6xl font-bold text-blue-600 mb-6">
              DashMate
            </h1>
            <p className="text-2xl text-blue-600 mb-8 max-w-md">
              Get your needs delivered to your doorstep
            </p>
          </div>

          {/* Illustration or Logo Area */}
          <div className="relative w-full max-w-md">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <p className="text-blue-600 font-medium text-lg">
                Join the supercharged community
              </p>
            </div>
          </div>

        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 bg-gray-50 flex items-center justify-center p-12">
          
          <div className="w-full max-w-md">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-600 mb-4">
                Welcome Back
              </h2>
              <p className="text-blue-500 text-lg">
                Regain your access to the supercharged community
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Register Number Input */}
              <div>
                <label className="block text-blue-600 text-sm font-medium mb-3">
                  Register Number
                </label>
                <input
                  type="text"
                  value={registerNumber}
                  onChange={(e) => setRegisterNumber(e.target.value)}
                  placeholder="24BCE2383"
                  className="w-full px-4 py-4 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-blue-600 text-sm font-medium mb-3">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="24BCE2383"
                  className="w-full px-4 py-4 bg-gray-200 border-none rounded-lg text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-lg"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-lg mt-8"
              >
                Submit
              </button>
              
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-blue-600 mb-2 text-lg">Not part of the clan?</p>
              <a href="/register" className="text-blue-600 underline hover:text-blue-800 transition-colors text-lg">
                Register here
              </a>
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}

// For Pages Router: Place this in pages/login.js
// For App Router (Next.js 13+): Place this in app/login/page.js