'use client';

import { ReactNode } from 'react';
import { SafeAreaView, PageContainer } from './SafeAreaView';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: ReactNode;
}

export function StudentLayout({ 
  children, 
  title, 
  showBack, 
  backHref,
  actions 
}: StudentLayoutProps) {
  return (
    <SafeAreaView top bottom>
      <TopBar title={title} showBack={showBack} backHref={backHref} actions={actions} />
      <PageContainer>
        {children}
      </PageContainer>
      <BottomNav role="student" />
    </SafeAreaView>
  );
}

interface CourierLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: ReactNode;
}

export function CourierLayout({ 
  children, 
  title, 
  showBack, 
  backHref,
  actions 
}: CourierLayoutProps) {
  return (
    <SafeAreaView top bottom>
      <TopBar title={title} showBack={showBack} backHref={backHref} actions={actions} />
      <PageContainer>
        {children}
      </PageContainer>
      <BottomNav role="courier" />
    </SafeAreaView>
  );
}

interface RestaurantLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: ReactNode;
}

export function RestaurantLayout({ 
  children, 
  title, 
  showBack, 
  backHref,
  actions 
}: RestaurantLayoutProps) {
  return (
    <SafeAreaView top bottom>
      <TopBar title={title} showBack={showBack} backHref={backHref} actions={actions} />
      <PageContainer>
        {children}
      </PageContainer>
      <BottomNav role="restaurant" />
    </SafeAreaView>
  );
}

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <SafeAreaView top bottom left right>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </SafeAreaView>
  );
}

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  actions?: ReactNode;
}

export function AdminLayout({ children, title, showBack, backHref, actions }: AdminLayoutProps) {
  return (
    <SafeAreaView top bottom>
      <TopBar title={title || 'Admin'} showBack={showBack} backHref={backHref} actions={actions} />
      <PageContainer>
        {children}
      </PageContainer>
      <BottomNav role="admin" />
    </SafeAreaView>
  );
}