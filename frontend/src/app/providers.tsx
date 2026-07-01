'use client';

import { useEffect } from 'react';
import { setAuthToken } from '@/lib/api';
import { useAuthStore } from '@/store';
import { connectSockets, disconnectSockets } from '@/lib/socket';

export function Providers({ children }: { children: React.ReactNode }) {
  const { token, user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const stored = localStorage.getItem('auth_token');
    if (stored) setAuthToken(stored);
  }, []);

  useEffect(() => {
    if (isAuthenticated && token && user) {
      connectSockets(token, user.role);
    } else {
      disconnectSockets();
    }
    return () => { disconnectSockets(); };
  }, [isAuthenticated, token, user]);

  return <>{children}</>;
}
