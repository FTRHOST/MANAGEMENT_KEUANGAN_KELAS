import { cookies } from 'next/headers';
import { Suspense } from 'react';
import LoginPrompt from '@/components/auth/LoginPrompt';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const isAuthenticated = !!cookieStore.get('__session');

  if (isAuthenticated) {
    return <Suspense fallback={<div>Loading admin...</div>}>{children}</Suspense>;
  }

  return <LoginPrompt />;
}
