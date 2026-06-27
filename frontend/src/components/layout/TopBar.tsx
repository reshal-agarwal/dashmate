'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { Menu, X, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function TopBar({ 
  title, 
  showBack = false, 
  backHref = '/', 
  actions,
  className 
}: TopBarProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 pt-safe-top',
      className
    )}>
      <div className="flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          {showBack && (
            <a
              href={backHref}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-target tap-highlight-none"
            >
              <ChevronDown className="w-5 h-5 rotate-90" strokeWidth={2.5} />
            </a>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate flex-1 text-center">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          
          {isAuthenticated && (
            <div className="relative">
              <button
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 touch-target tap-highlight-none"
              >
                <Bell className="w-5 h-5" strokeWidth={2.5} />
              </button>
              
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 touch-target tap-highlight-none"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.name || 'Profile'}
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}