'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  ShoppingBag, 
  Receipt, 
  User, 
  Wallet, 
  Truck, 
  CreditCard,
  MapPin,
  Menu,
  X,
  Bell,
  LogOut
} from 'lucide-react';

interface BottomNavProps {
  children?: ReactNode;
  role?: 'student' | 'courier' | 'restaurant';
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  match: string;
  badge?: boolean;
}

const navItems: Record<string, NavItem[]> = {
  student: [
    { href: '/', label: 'Home', icon: Home, match: '/' },
    { href: '/orders', label: 'Orders', icon: Receipt, match: '/orders' },
    { href: '/cart', label: 'Cart', icon: ShoppingBag, match: '/cart', badge: true },
    { href: '/wallet', label: 'Wallet', icon: Wallet, match: '/wallet' },
    { href: '/profile', label: 'Profile', icon: User, match: '/profile' },
  ],
  courier: [
    { href: '/courier', label: 'Map', icon: MapPin, match: '/courier' },
    { href: '/courier/orders/active', label: 'Active', icon: Truck, match: '/courier/orders/active' },
    { href: '/courier/earnings', label: 'Earnings', icon: CreditCard, match: '/courier/earnings' },
    { href: '/courier/profile', label: 'Profile', icon: User, match: '/courier/profile' },
  ],
  restaurant: [
    { href: '/restaurant', label: 'Dashboard', icon: Home, match: '/restaurant' },
    { href: '/restaurant/orders', label: 'Orders', icon: Receipt, match: '/restaurant/orders' },
    { href: '/restaurant/products', label: 'Products', icon: ShoppingBag, match: '/restaurant/products' },
    { href: '/restaurant/payouts', label: 'Payouts', icon: CreditCard, match: '/restaurant/payouts' },
  ],
};

export function BottomNav({ role = 'student' }: BottomNavProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  if (!isAuthenticated) return null;
  
  const items = navItems[role] || navItems.student;
  const currentPath = pathname || '/';
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-bottom z-50">
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {items.map((item) => {
          const isActive = currentPath.startsWith(item.match) && (item.match === '/' ? currentPath === '/' : true);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-colors',
                'min-h-[56px] touch-target tap-highlight-none',
                isActive 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              )}
              onClick={() => router.push(item.href)}
            >
              <Icon className={cn('w-6 h-6', isActive && 'fill-current')} strokeWidth={2.5} />
              <span className={cn('text-xs font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
              {item.badge && (
                <CartBadge />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CartBadge() {
  const { getItemCount } = useCartStore();
  const count = getItemCount();
  
  if (count === 0) return null;
  
  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
      {count > 99 ? '99+' : count}
    </span>
  );
}

import { useCartStore } from '@/store';