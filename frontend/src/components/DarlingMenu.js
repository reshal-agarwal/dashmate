// components/DarlingMenu.js or directly in page.js
'use client';
import { useState } from 'react';
import { ArrowLeft, ShoppingCart } from 'lucide-react';

const DarlingMenu = () => {
  const [cartCount, setCartCount] = useState(4);
  const [itemQuantities, setItemQuantities] = useState({});

  const menuItems = [
    {
      id: 1,
      name: 'Chilli Cheese Toast',
      price: 96
    },
    {
      id: 2,
      name: 'Corn Cheese Pasta',
      price: 146
    },
    {
      id: 3,
      name: 'Pav Bhaji',
      price: 83
    },
    {
      id: 4,
      name: 'Garlic Mushroom Sandwich',
      price: 186
    },
    {
      id: 5,
      name: 'FarmHouse Pizza',
      price: 165
    },
    {
      id: 6,
      name: 'Potato Wedges',
      price: 78
    }
  ];

  const handleAddToCart = (item) => {
    setItemQuantities(prev => ({
      ...prev,
      [item.id]: 1
    }));
    setCartCount(prev => prev + 1);
  };

  const handleIncrement = (itemId) => {
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
    setCartCount(prev => prev + 1);
  };

  const handleDecrement = (itemId) => {
    setItemQuantities(prev => {
      const newQuantity = (prev[itemId] || 0) - 1;
      if (newQuantity <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [itemId]: newQuantity
      };
    });
    setCartCount(prev => Math.max(0, prev - 1));
  };

  const handleBackClick = () => {
    console.log('Navigate back');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 border-b border-gray-100">
        <button 
          onClick={handleBackClick}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-blue-600" />
        </button>
        
        <div className="relative">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ShoppingCart className="w-6 h-6 text-gray-800" />
          </button>
          {cartCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </div>
          )}
        </div>
      </header>

      {/* Restaurant Info */}
      <div className="px-4 py-6 bg-white">
        <p className="text-gray-600 text-sm mb-2">Ordering from</p>
        <h1 className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
          Darling Canteen
        </h1>
        <p className="text-blue-500 text-sm font-medium">
          Near Technology Tower
        </p>
      </div>

      {/* Menu Items */}
      <main className="px-4 pb-8">
        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {menuItems.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-lg mb-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-700 font-semibold">
                    Rs. {item.price}
                  </p>
                </div>
                {itemQuantities[item.id] ? (
                  <div className="flex items-center bg-yellow-400 rounded-full ml-4">
                    <button
                      onClick={() => handleDecrement(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-900 font-bold text-xl hover:bg-yellow-500 rounded-l-full transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-2 font-semibold text-gray-900 min-w-[3rem] text-center">
                      {itemQuantities[item.id]}
                    </span>
                    <button
                      onClick={() => handleIncrement(item.id)}
                      className="w-10 h-10 flex items-center justify-center text-gray-900 font-bold text-xl hover:bg-yellow-500 rounded-r-full transition-colors"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-full transition-colors ml-4 whitespace-nowrap"
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - 2 Column Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {menuItems.map((item) => (
              <div key={item.id} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-xl mb-3">
                      {item.name}
                    </h3>
                    <p className="text-gray-700 font-semibold text-lg">
                      Rs. {item.price}
                    </p>
                  </div>
                  {itemQuantities[item.id] ? (
                    <div className="flex items-center bg-yellow-400 rounded-full ml-6">
                      <button
                        onClick={() => handleDecrement(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-gray-900 font-bold text-xl hover:bg-yellow-500 rounded-l-full transition-colors"
                      >
                        -
                      </button>
                      <span className="px-6 py-3 font-semibold text-gray-900 min-w-[4rem] text-center">
                        {itemQuantities[item.id]}
                      </span>
                      <button
                        onClick={() => handleIncrement(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-gray-900 font-bold text-xl hover:bg-yellow-500 rounded-r-full transition-colors"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-8 rounded-full transition-colors ml-6 whitespace-nowrap"
                    >
                      Add to cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Cart Button for Mobile */}
      <div className="md:hidden fixed bottom-6 right-6">
        <button className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors">
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default DarlingMenu;