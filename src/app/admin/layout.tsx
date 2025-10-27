import { cookies } from 'next/headers';
import LoginPrompt from '@/components/auth/LoginPrompt';

/**
 * A layout component for the admin section.
 * It checks if the user is authenticated and renders the children if they are.
 * Otherwise, it displays a login prompt.
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The children to render.
 * @returns {Promise<JSX.Element>} The admin layout component.
 */
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
