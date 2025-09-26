"use client";

import { useState } from 'react';
import { Eye, EyeOff, Users, Shield, Home } from 'lucide-react';

export default function Registration() {
  const [formData, setFormData] = useState({
    registerNumber: '',
    password: '',
    confirmPassword: '',
    roomNumber: '',
    hostelBlock: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.registerNumber.trim()) {
      newErrors.registerNumber = 'Register number is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }
    
    if (!formData.hostelBlock.trim()) {
      newErrors.hostelBlock = 'Hostel block is required';
    }
    
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle form submission here
      alert('Registration submitted successfully!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white-100">
      {/* Mobile View */}
      <div className="md:hidden">
  <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
    <div className="w-full max-w-sm">
      {/* Logo and Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">DashMate</h1>
        <p className="text-gray-600 text-lg">Become a part of the community</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Register Number */}
        <div>
          <label className="block text-blue-600 font-medium mb-2">
            Register Number
          </label>
          <input
            type="text"
            name="registerNumber"
            value={formData.registerNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="24BCE2383"
          />
          {errors.registerNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.registerNumber}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-blue-600 font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all pr-12"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-blue-600 font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all pr-12"
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Room Number */}
        <div>
          <label className="block text-blue-600 font-medium mb-2">
            Room Number
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="201"
          />
          {errors.roomNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
          )}
        </div>

        {/* Hostel Block */}
        <div>
          <label className="block text-blue-600 font-medium mb-2">
            Hostel Block
          </label>
          <input
            type="text"
            name="hostelBlock"
            value={formData.hostelBlock}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white border rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="T"
          />
          {errors.hostelBlock && (
            <p className="text-red-500 text-sm mt-1">{errors.hostelBlock}</p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-center space-x-3 py-2">
          <input
            type="checkbox"
            id="terms"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms" className="text-blue-600 text-sm">
            I agree to the terms and conditions
          </label>
        </div>
        {errors.terms && (
          <p className="text-red-500 text-sm">{errors.terms}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-600 font-semibold py-4 rounded-lg transition-colors duration-200 mt-6"
        >
          Submit
        </button>
      </form>
    </div>
  </div>
</div>

      {/* Desktop View */}
      <div className="hidden md:flex min-h-screen">
  {/* Left Side - Hero Section */}
  <div className="flex-1 bg-yellow-400 flex flex-col justify-center items-center text-blue-600 p-12">
    <div className="max-w-md text-center">
      <div className="mb-8">
        <Users size={80} className="mx-auto mb-4 opacity-90" />
      </div>
      <h1 className="text-5xl font-bold text-blue-600 mb-4">DashMate</h1>
      <p className="text-xl text-blue-600 mb-8 opacity-90">
        Join our community and connect with fellow students
      </p>

      <div className="space-y-4 text-left text-blue-600">
        <div className="flex items-center space-x-3">
          <Shield size={24} className="text-blue-600" />
          <span>Secure and private platform</span>
        </div>
        <div className="flex items-center space-x-3">
          <Home size={24} className="text-blue-600" />
          <span>Connect with hostel mates</span>
        </div>
        <div className="flex items-center space-x-3">
          <Users size={24} className="text-blue-600" />
          <span>Build lasting friendships</span>
        </div>
      </div>
    </div>
  </div>

  {/* Right Side - Form Section */}
  <div className="flex-1 bg-white flex items-center justify-center p-12">
    <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h2>
        <p className="text-gray-600">Become a part of the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Register Number */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Register Number
          </label>
          <input
            type="text"
            name="registerNumber"
            value={formData.registerNumber}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="24BCE2383"
          />
          {errors.registerNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.registerNumber}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
              placeholder="Enter password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12"
              placeholder="Confirm password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Room Number and Hostel Block */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Room Number
            </label>
            <input
              type="text"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="201"
            />
            {errors.roomNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Hostel Block
            </label>
            <input
              type="text"
              name="hostelBlock"
              value={formData.hostelBlock}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="T"
            />
            {errors.hostelBlock && (
              <p className="text-red-500 text-sm mt-1">{errors.hostelBlock}</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="terms-desktop"
            checked={agreeToTerms}
            onChange={(e) => setAgreeToTerms(e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="terms-desktop" className="text-gray-700">
            I agree to the{" "}
            <span className="text-blue-600 hover:underline cursor-pointer">
              terms and conditions
            </span>
          </label>
        </div>
        {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
        >
          Create Account
        </button>
      </form>

      {/* Additional Links */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          Already have an account?
          <span className="text-blue-600 hover:underline cursor-pointer ml-1">
            Sign in
          </span>
        </p>
      </div>
    </div>
  </div>
</div>
    </div>
  );
}