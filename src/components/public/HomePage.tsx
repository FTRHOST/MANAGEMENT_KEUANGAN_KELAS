
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import { NameSearch } from './NameSearch';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { Kbd } from '../ui/kbd';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        {settings.logoUrl && (
          <Image
            src={settings.logoUrl}
            alt={`${settings.appName} logo`}
            width={80}
            height={80}
            className="h-20 w-20"
            priority
          />
        )}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
            {settings.heroTitle}
          </h1>
          <p className="max-w-[700px] text-muted-foreground md:text-xl">
            {settings.heroDescription}
          </p>
        </div>

        <div className="w-full max-w-md">
           <Button
            variant="outline"
            className="relative h-12 w-full justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="truncate">Cari nama anggota...</span>
            {isClient && (
              <Kbd className="absolute right-3 top-1/2 -translate-y-1/2">
                {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl+'}K
              </Kbd>
            )}
          </Button>
        </div>
      </div>
      <NameSearch members={members} isOpen={isSearchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
