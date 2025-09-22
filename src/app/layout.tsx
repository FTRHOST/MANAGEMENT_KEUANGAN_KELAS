
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: {
    default: 'Class Cashier',
    template: `%s | Class Cashier`,
  },
  description: 'Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas.',
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    title: 'Class Cashier',
    description: 'Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas.',
    images: [
      {
        url: '/favicon.png',
        width: 800,
        height: 600,
        alt: `Class Cashier Logo`,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Class Cashier',
    description: 'Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas.',
    images: ['/favicon.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
