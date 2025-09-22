import { cookies } from 'next/headers';
import LoginPrompt from '@/components/auth/LoginPrompt';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const isAuthenticated = !!cookieStore.get('__session');

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <LoginPrompt />;
}
