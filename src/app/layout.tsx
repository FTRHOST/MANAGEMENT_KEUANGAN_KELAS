
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';
import { getSettings } from '@/lib/actions';
import type { Settings } from '@/lib/types';

export async function generateMetadata(): Promise<Metadata> {
  // To stabilize the build, we will use static metadata for now.
  // The dynamic properties were causing server-side rendering issues.
  const appName = 'Class Cashier';
  const description = 'Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas.';
  const logoUrl = '/favicon.png';
 
  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: description,
    icons: {
      icon: '/favicon.png',
    },
    openGraph: {
      title: appName,
      description: description,
      images: [
        {
          url: logoUrl,
          width: 800,
          height: 600,
          alt: `${appName} Logo`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: appName,
      description: description,
      images: [logoUrl],
    },
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
          appName={settings.appName}
          logoUrl={settings.logoUrl}
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

