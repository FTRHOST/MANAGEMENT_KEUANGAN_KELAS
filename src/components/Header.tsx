
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/actions';
import HeaderClient from './HeaderClient';

/**
 * A server component that fetches authentication status and settings,
 * and then renders the client-side Header component with this data.
 *
 * @returns {Promise<JSX.Element>} A promise that resolves to the HeaderClient component.
 */
export async function Header() {
  const cookieStore = cookies();
  const isAuthenticated = !!cookieStore.get('__session');
  const settings = await getSettings();

  return <HeaderClient isAuthenticated={isAuthenticated} settings={settings} />;
}
