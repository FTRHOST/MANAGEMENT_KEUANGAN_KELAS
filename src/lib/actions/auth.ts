'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
  };

  const cookieStore = await cookies();

  if (password === 'UINSAGA25') {
    cookieStore.set('__session', 'true', cookieOptions);
    cookieStore.set('session_role', 'admin', cookieOptions);
    return { success: true };
  }
  
  if (password === 'TI25') {
    cookieStore.set('__session', 'true', cookieOptions);
    cookieStore.set('session_role', 'readonly', cookieOptions);
    return { success: true };
  }

  return { success: false, error: 'Password salah.' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('__session');
  cookieStore.delete('session_role');
}
