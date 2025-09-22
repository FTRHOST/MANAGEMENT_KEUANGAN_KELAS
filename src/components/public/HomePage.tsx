import type { Member, Settings } from '@/lib/types';
import NameSearch from '@/components/public/NameSearch';
import Image from 'next/image';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      {settings.logoUrl && (
        <Image
          src={settings.logoUrl}
          alt={`${settings.appName} Logo`}
          width={100}
          height={100}
          className="h-24 w-24 object-contain"
          priority
        />
      )}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {settings.heroTitle || 'Selamat Datang'}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings.heroDescription || 'Cari nama Anda untuk melihat detail.'}
        </p>
      </div>
      <div className="w-full max-w-md">
        <NameSearch members={members} />
      </div>
    </div>
  );
}
