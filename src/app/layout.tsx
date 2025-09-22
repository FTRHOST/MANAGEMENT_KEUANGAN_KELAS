
import type { Metadata, ResolvingMetadata } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';
import { getSettings } from '@/lib/actions';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const appName = settings.appName || 'Class Cashier';
 
  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: `Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas - ${appName}.`,
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const isAuthenticated = !!cookieStore.get('__session');
  const settings = await getSettings();

  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Header 
          isAuthenticated={isAuthenticated} 
          appName={settings.appName || 'Class Cashier'}
          logoUrl={settings.logoUrl || null}
        />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
