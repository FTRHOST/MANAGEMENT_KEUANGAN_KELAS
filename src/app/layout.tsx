
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';
import { getSettings } from '@/lib/actions';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const title = settings.appName || 'Class Cashier';
  const description = settings.heroDescription || 'Aplikasi Bendahara Cerdas untuk mengelola keuangan kas kelas.';
  const imageUrl = settings.logoUrl || '/favicon.png';

  return {
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description: description,
    icons:{
      icon: '/favicon.png',
    },
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: `${title} Logo`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </head>
      <body className="font-sans bg-background text-text-primary">
        <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <div className="px-4 sm:px-8 md:px-16 lg:px-24 xl:px-40 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col w-full max-w-5xl flex-1">
                <Header />
                <main className="flex flex-col gap-10 mt-10">
                  {children}
                </main>
              </div>
            </div>
          </div>
        </div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
