
"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import { NameSearch } from './NameSearch';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { Kbd } from '../ui/kbd';
import { useMediaQuery } from 'usehooks-ts';


type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const { heroTitle, heroDescription, logoUrl, appName } = settings;
  const [isSearchOpen, setSearchOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');


  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-4">
        {logoUrl ? (
            <Image 
                src={logoUrl} 
                alt={`${appName} Logo`} 
                width={96} 
                height={96} 
                className="mx-auto h-24 w-24 object-contain"
            />
        ) : (
             <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             </div>
        )}
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
          className="relative h-12 w-full justify-start rounded-full bg-background text-muted-foreground shadow-sm sm:pr-12"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 h-5 w-5" />
          <span className="truncate">Cari anggota...</span>
          {isDesktop && (
            <Kbd className="absolute right-4 top-1/2 -translate-y-1/2">
              ⌘K
            </Kbd>
          )}
        </Button>
      </div>
      
      <NameSearch 
        members={members}
        isOpen={isSearchOpen}
        onOpenChange={setSearchOpen}
      />

    </div>
  );
}
