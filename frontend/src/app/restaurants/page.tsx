'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import { Restaurant } from '@/types';
import { Search, Star, Clock, MapPin, X, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'mess', label: 'Mess' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'grocery', label: 'Grocery' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'other', label: 'Other' },
] as const;

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const rating = restaurant.rating || 0;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow active:scale-[0.98] tap-highlight-none"
    >
      <div className="relative h-40 bg-gray-100">
        {restaurant.images && restaurant.images.length > 0 ? (
          <img
            src={restaurant.images[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <MapPin className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium capitalize',
            restaurant.isActive
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          )}>
            {restaurant.isActive ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate">{restaurant.name}</h3>
        <span className="inline-block mt-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-full capitalize">
          {restaurant.category}
        </span>
        <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {rating.toFixed(1)}
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
        </div>
      </div>
    </Link>
  );
}

function RestaurantsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [openNow, setOpenNow] = useState(searchParams.get('openNow') === 'true');
  const [sortByRating, setSortByRating] = useState(searchParams.get('rating') === 'desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '12',
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (openNow) params.openNow = 'true';
      if (sortByRating) params.rating = 'desc';

      const response = await api.get('/restaurants', { params });
      const data = response.data;
      if (data.success) {
        setRestaurants(data.data.items);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        setError('Failed to load restaurants');
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [search, category, openNow, sortByRating, page]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (openNow) params.set('openNow', 'true');
    if (sortByRating) params.set('rating', 'desc');
    const qs = params.toString();
    router.replace(`/restaurants${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [search, category, openNow, sortByRating, router]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  return (
    <StudentLayout title="Restaurants">
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 touch-target tap-highlight-none"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => handleCategoryChange(cat.value)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors touch-target tap-highlight-none',
                category === cat.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Sort & Filter Toggles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setOpenNow(!openNow); setPage(1); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target tap-highlight-none border',
              openNow
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            <Clock className="w-4 h-4" />
            Open Now
          </button>
          <button
            onClick={() => { setSortByRating(!sortByRating); setPage(1); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-target tap-highlight-none border',
              sortByRating
                ? 'bg-primary-50 text-primary-700 border-primary-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            <Star className="w-4 h-4" />
            Top Rated
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchRestaurants}>
              Try Again
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && restaurants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No restaurants found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {search || category || openNow
                ? 'Try adjusting your filters or search terms'
                : 'No restaurants are available right now'}
            </p>
            {(search || category || openNow) && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearch('');
                  setCategory('');
                  setOpenNow(false);
                  setSortByRating(false);
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Restaurant Grid */}
        {!loading && !error && restaurants.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}

export default function RestaurantsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 animate-pulse"><div className="h-12 bg-gray-200 rounded-lg mb-4" /><div className="h-96 bg-gray-200 rounded-xl" /></div>}>
      <RestaurantsPage />
    </Suspense>
  );
}
