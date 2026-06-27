'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SafeAreaViewProps {
  children: ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export function SafeAreaView({ 
  children, 
  className, 
  top = true, 
  bottom = true, 
  left = false, 
  right = false 
}: SafeAreaViewProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50',
        top && 'pt-safe-top',
        bottom && 'pb-safe-bottom',
        left && 'pl-safe-left',
        right && 'pr-safe-right',
        className
      )}
    >
      {children}
    </div>
  );
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <main className={cn('flex-1 overflow-y-auto pb-16', className)}>
      {children}
    </main>
  );
}