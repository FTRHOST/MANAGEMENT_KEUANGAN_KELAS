
import { cookies } from 'next/headers';
import { getSettings } from '@/lib/actions';
import HeaderClient from './HeaderClient';

export async function Header() {
  const cookieStore = cookies();
  const isAuthenticated = !!cookieStore.get('__session');
  const settings = await getSettings();

  return <HeaderClient isAuthenticated={isAuthenticated} settings={settings} />;
}
