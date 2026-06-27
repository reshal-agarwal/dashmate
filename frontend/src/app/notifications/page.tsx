'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, handleApiError } from '@/lib/api';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Form';
import { StudentLayout } from '@/components/layout';
import {
  Bell,
  BellOff,
  CheckCheck,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  ShoppingBag,
  Truck,
  CreditCard,
  Coins,
  Megaphone,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
  data?: Record<string, any>;
}

interface NotificationsData {
  items: NotificationItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  unreadCount: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [readLoading, setReadLoading] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async (p: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: NotificationsData }>('/notifications', {
        params: { page: p, limit: 20, unreadOnly: false },
      });
      setData(res.data.data);
    } catch (err) {
      setError(handleApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchNotifications(page);
  }, [isAuthenticated, page, fetchNotifications, router]);

  const markAsRead = async (id: string) => {
    setReadLoading(id);
    try {
      await api.put(`/notifications/${id}/read`);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
          unreadCount: Math.max(0, prev.unreadCount - 1),
        };
      });
    } catch {
      // silently fail
    } finally {
      setReadLoading(null);
    }
  };

  const markAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      await api.put('/notifications/read-all');
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        };
      });
    } catch {
      // silently fail
    } finally {
      setMarkAllLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type.startsWith('order_placed')) return <ShoppingBag className="w-5 h-5 text-blue-600" />;
    if (type.startsWith('order_confirmed')) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (type.startsWith('order_ready') || type.startsWith('order_picked_up') || type.startsWith('courier'))
      return <Truck className="w-5 h-5 text-purple-600" />;
    if (type.startsWith('order_delivered')) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (type.startsWith('order_cancelled')) return <X className="w-5 h-5 text-red-600" />;
    if (type.startsWith('credits_earned')) return <Coins className="w-5 h-5 text-yellow-600" />;
    if (type.startsWith('payout')) return <CreditCard className="w-5 h-5 text-green-600" />;
    if (type.startsWith('promo')) return <Megaphone className="w-5 h-5 text-orange-600" />;
    if (type.startsWith('verification')) return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    return <Bell className="w-5 h-5 text-gray-600" />;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getPriorityDot = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-500',
      normal: 'bg-primary-500',
      low: 'bg-gray-300',
    };
    return <span className={cn('w-2 h-2 rounded-full shrink-0', colors[priority] || 'bg-gray-300')} />;
  };

  if (!isAuthenticated) return null;

  return (
    <StudentLayout
      title="Notifications"
      actions={
        data && data.unreadCount > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            loading={markAllLoading}
            onClick={markAllAsRead}
            className="text-primary-600"
          >
            <CheckCheck className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Mark all read</span>
          </Button>
        ) : undefined
      }
    >
      <div className="p-4">
        {/* Unread Badge */}
        {data && data.unreadCount > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
            <Bell className="w-5 h-5 text-primary-600" />
            <span className="text-sm font-medium text-primary-700">
              {data.unreadCount} unread notification{data.unreadCount !== 1 ? 's' : ''}
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={markAllLoading}
              onClick={markAllAsRead}
              className="ml-auto text-primary-600"
            >
              Mark all read
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && data?.items.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No notifications</h3>
            <p className="text-sm text-gray-500">You're all caught up! Check back later.</p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && data && data.items.length > 0 && (
          <div className="space-y-2">
            {data.items.map((notification) => (
              <button
                key={notification.id}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
                disabled={readLoading === notification.id}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors',
                  notification.isRead
                    ? 'bg-white border-gray-100'
                    : 'bg-primary-50/50 border-primary-100'
                )}
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                  notification.isRead ? 'bg-gray-50' : 'bg-white'
                )}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      'text-sm truncate',
                      notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                    )}>
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className={cn(
                    'text-xs mt-0.5 line-clamp-2',
                    notification.isRead ? 'text-gray-500' : 'text-gray-600'
                  )}>
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getPriorityDot(notification.priority)}
                    <span className="text-[11px] text-gray-400">{formatTimeAgo(notification.createdAt)}</span>
                  </div>
                </div>
                {readLoading === notification.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600 shrink-0 mt-1" />
                ) : !notification.isRead ? (
                  <ArrowRight className="w-4 h-4 text-primary-400 shrink-0 mt-1" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500 px-2">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
