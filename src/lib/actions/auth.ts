'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(password: string) {
  if (password === 'UINSAGA25') {
    cookies().set('__session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    return { success: true };
  }
  return { success: false, error: 'Password salah.' };
}

export async function logout() {
  cookies().delete('__session');
}
