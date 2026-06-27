'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore, useCartStore } from '@/store';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { StudentLayout } from '@/components/layout';
import { Restaurant, Product } from '@/types';
import { Star, Clock, ArrowLeft, Plus, Minus, ShoppingBag, ChevronLeft } from 'lucide-react';

interface GroupedProducts {
  [category: string]: Product[];
}

function HeaderSkeleton() {
  return (
    <div className="bg-white p-4 animate-pulse space-y-3">
      <div className="h-8 bg-gray-200 rounded w-2/3" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="flex gap-4">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-20" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="h-6 bg-gray-200 rounded w-32" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-4 animate-pulse space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

function SpiceLevel({ level }: { level: number }) {
  if (level === 0) return null;
  return (
    <span className="text-sm" aria-label={`Spice level ${level}`}>
      {Array.from({ length: level }).map((_, i) => (
        <span key={i}>🌶️</span>
      ))}
    </span>
  );
}

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const { isAuthenticated } = useAuthStore();
  const {
    addItem,
    updateQuantity,
    getItemQuantity,
    getItemCount,
    getSubtotal,
    items,
    restaurantId: cartRestaurantId,
    isFromSameRestaurant,
  } = useCartStore();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [restaurantRes, productsRes] = await Promise.all([
        api.get(`/restaurants/${restaurantId}`),
        api.get(`/restaurants/${restaurantId}/products`),
      ]);

      const restaurantData = restaurantRes.data;
      const productsData = productsRes.data;

      if (restaurantData.success) {
        setRestaurant(restaurantData.data);
      } else {
        setError('Failed to load restaurant details');
        return;
      }

      if (productsData.success) {
        setProducts(productsData.data.items || []);
      } else {
        setError('Failed to load menu');
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedProducts = products.reduce<GroupedProducts>((acc, product) => {
    const cat = product.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {});

  const handleAddToCart = (product: Product) => {
    if (!isFromSameRestaurant(product.restaurant)) {
      alert('Only items from one restaurant allowed');
      return;
    }
    try {
      addItem(product, 1);
      setAddedMessage(`${product.name} added to cart`);
      setTimeout(() => setAddedMessage(null), 2000);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    }
  };

  const cartCount = getItemCount();
  const cartSubtotal = getSubtotal();

  if (loading) {
    return (
      <StudentLayout title="Loading..." showBack backHref="/restaurants">
        <HeaderSkeleton />
        <MenuSkeleton />
      </StudentLayout>
    );
  }

  if (error || !restaurant) {
    return (
      <StudentLayout title="Error" showBack backHref="/restaurants">
        <div className="p-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error || 'Restaurant not found'}</p>
            <div className="flex gap-2 mt-3">
              <Button variant="outline" size="sm" onClick={() => router.push('/restaurants')}>
                Back to Restaurants
              </Button>
              <Button variant="primary" size="sm" onClick={fetchData}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const rating = restaurant.rating || 0;
  const fullStars = Math.floor(rating);

  return (
    <StudentLayout title={restaurant.name} showBack backHref="/restaurants">
      {/* Added to cart toast */}
      {addedMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {addedMessage}
        </div>
      )}

      {/* Restaurant Header */}
      <div className="bg-white border-b border-gray-100">
        {restaurant.images && restaurant.images.length > 0 && (
          <div className="h-48 sm:h-56 overflow-hidden">
            <img
              src={restaurant.images[0]}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
              <span className={cn(
                'inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                restaurant.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              )}>
                {restaurant.isActive ? 'Open' : 'Closed'}
              </span>
            </div>
            <span className="px-2 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
              {restaurant.category}
            </span>
          </div>

          {restaurant.description && (
            <p className="text-sm text-gray-600">{restaurant.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
              {restaurant.totalOrders > 0 && (
                <span className="text-gray-400">({restaurant.totalOrders}+ orders)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {restaurant.estimatedPrepTime} min
            </span>
            {restaurant.deliveryFee > 0 ? (
              <span>₹{restaurant.deliveryFee} delivery</span>
            ) : (
              <span className="text-green-600 font-medium">Free delivery</span>
            )}
            {restaurant.minimumOrderAmount > 0 && (
              <span className="text-gray-400">Min. ₹{restaurant.minimumOrderAmount}</span>
            )}
          </div>
        </div>
      </div>

      {/* Menu Items Grouped by Category */}
      <div className="p-4 pb-24 space-y-6">
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900">No menu items</h3>
            <p className="text-sm text-gray-500 mt-1">
              This restaurant hasn&apos;t added any products yet
            </p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize">
                {category}
              </h3>
              <div className="space-y-3">
                {categoryProducts.map((product) => {
                  const quantity = getItemQuantity(product.id);
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        'bg-white rounded-xl p-4 border border-gray-100',
                        !product.isAvailable && 'opacity-50'
                      )}
                    >
                      <div className="flex gap-3">
                        {product.images && product.images.length > 0 && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {product.isVegetarian && (
                                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0" title="Vegetarian" />
                                )}
                                {product.isVegan && (
                                  <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                    Vegan
                                  </span>
                                )}
                                <SpiceLevel level={product.spiceLevel} />
                              </div>
                            </div>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-sm text-gray-400 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            {product.isAvailable ? (
                              quantity > 0 ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(product.id, quantity - 1)}
                                    className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 touch-target tap-highlight-none"
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="w-8 text-center font-medium text-gray-900">
                                    {quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(product.id, quantity + 1)}
                                    className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 touch-target tap-highlight-none"
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAddToCart(product)}
                                >
                                  Add
                                </Button>
                              )
                            ) : (
                              <span className="text-xs font-medium text-red-500">Unavailable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe-bottom">
          <Link
            href="/cart"
            className="block bg-primary-600 text-white mx-4 mb-4 rounded-xl shadow-lg hover:bg-primary-700 transition-colors tap-highlight-none"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingBag className="w-6 h-6" />
                  <span className="absolute -top-2 -right-2 bg-white text-primary-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                </div>
                <span className="font-medium">View Cart</span>
              </div>
              <span className="font-semibold text-lg">₹{cartSubtotal.toFixed(0)}</span>
            </div>
          </Link>
        </div>
      )}
    </StudentLayout>
  );
}
