"use client"
import { useState } from 'react';
import Image from 'next/image';

const DeliveryApp = () => {
  const [activeTab, setActiveTab] = useState('order');

  const businesses = [
    {
      id: 1,
      name: 'Darling Cafe',
      image: '/images/darling-cafe.jpg'
    },
    {
      id: 2,
      name: 'K.C. Foods',
      image: '/images/kc-foods.jpg'
    },
    {
      id: 3,
      name: 'Balaji Store',
      image: '/images/balaji-store.jpg'
    },
    {
      id: 4,
      name: 'Madras Coffee',
      image: '/images/madras-coffee.jpg'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white">
        <button className="p-2">
          <div className="space-y-1">
            <div className="w-6 h-0.5 bg-gray-800"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
            <div className="w-6 h-0.5 bg-gray-800"></div>
          </div>
        </button>
      </header>

      {/* Toggle Buttons */}
      <div className="px-4 mb-8">
        <div className="flex bg-gray-100 rounded-full p-1 max-w-sm mx-auto">
          <button
            onClick={() => setActiveTab('order')}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all ${
              activeTab === 'order'
                ? 'bg-yellow-400 text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Order Now
          </button>
          <button
            onClick={() => setActiveTab('deliver')}
            className={`flex-1 py-3 px-6 rounded-full text-sm font-medium transition-all ${
              activeTab === 'deliver'
                ? 'bg-purple-200 text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            Deliver Now
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-8 text-blue-400 leading-tight">
          What would you like to
          <br />
          get delivered today ?
        </h1>

        {/* Business Cards - Mobile View (2x3 Grid) */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-4 mb-6">
            {businesses.slice(0, 6).map((business, index) => (
              <div
                key={business.id}
                className="bg-purple-100 rounded-2xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-200">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Image</span>
                  </div>
                </div>
                <h3 className="text-center font-semibold text-gray-900 text-sm">
                  {business.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Business Cards - Desktop View (3x2 Grid) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="bg-purple-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-200">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">Image</span>
                  </div>
                </div>
                <h3 className="text-center font-semibold text-gray-900 text-lg">
                  {business.name}
                </h3>
              </div>
            ))}
          </div>

          {/* Second Row for Desktop */}
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {businesses.map((business) => (
              <div
                key={`${business.id}-2`}
                className="bg-purple-100 rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-gray-200">
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">Image</span>
                  </div>
                </div>
                <h3 className="text-center font-semibold text-gray-900 text-lg">
                  {business.name}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Additional empty cards for mobile */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={`empty-${item}`}
              className="bg-purple-100 rounded-2xl p-4 opacity-30"
            >
              <div className="aspect-square rounded-xl bg-gray-300 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded mx-auto w-3/4"></div>
            </div>
          ))}
        </div>

        {/* Scrollable Container for Mobile */}
        <div className="md:hidden mt-8 pb-8">
          <div className="overflow-x-auto">
            <div className="flex space-x-4 px-2" style={{ width: 'max-content' }}>
              {[...businesses, ...businesses].map((business, index) => (
                <div
                  key={`scroll-${index}`}
                  className="bg-purple-100 rounded-2xl p-4 hover:shadow-lg transition-shadow cursor-pointer min-w-[140px]"
                >
                  <div className="w-32 h-32 rounded-xl overflow-hidden mb-3 bg-gray-200">
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Image</span>
                    </div>
                  </div>
                  <h3 className="text-center font-semibold text-gray-900 text-sm">
                    {business.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DeliveryApp;