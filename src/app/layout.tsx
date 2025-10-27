
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { Header } from '@/components/Header';
import { Analytics } from '@vercel/analytics/react';
import { getSettings } from '@/lib/actions';

/**
 * Generates the metadata for the application.
 * This includes the title, description, icons, and openGraph and twitter metadata.
 * @returns {Promise<Metadata>} A promise that resolves to the metadata object.
 */
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

/**
 * The root layout for the application.
 * It sets up the HTML structure, includes the header, and renders the children.
 * @param {object} props - The props for the component.
 * @param {React.ReactNode} props.children - The children to render.
 * @returns {JSX.Element} The root layout component.
 */
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
        <link rel="icon" href="/favicon.png" type="image/png" />
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
