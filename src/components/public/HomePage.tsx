"use client";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsMac(window.navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const { heroTitle, heroDescription, logoUrl, appName } = settings;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-4">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`${appName} Logo`}
            width={80}
            height={80}
            className="mx-auto rounded-full object-cover"
          />
        ) : null}
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md">
        <Button
          variant="outline"
          className="relative h-12 w-full justify-start rounded-lg bg-background text-muted-foreground shadow-sm sm:pr-12"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Cari anggota...</span>
          <span className="inline-flex lg:hidden">Cari...</span>
          {isClient && (
            <Kbd className="absolute right-4 top-1/2 -translate-y-1/2">
              {isMac ? '⌘' : 'Ctrl'}+K
            </Kbd>
          )}
        </Button>
      </div>

      <NameSearch
        members={members}
        isOpen={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </div>
  );
}