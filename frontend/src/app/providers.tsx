'use client';

import { useEffect } from 'react';
import { setAuthToken } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setAuthToken(token);
    }
  }, []);

  return <>{children}</>;
}
