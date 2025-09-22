
"use client";

import { useState } from 'react';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import NameSearch from './NameSearch';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { Kbd } from '../ui/kbd';


type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const [isSearchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
        {settings.logoUrl && (
            <Image 
                src={settings.logoUrl} 
                alt={`${settings.appName} Logo`} 
                width={100} 
                height={100}
                className="h-24 w-24 object-contain"
            />
        )}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
          {settings.heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings.heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md">
        <Button 
          variant="outline" 
          className="relative h-12 w-full justify-start rounded-full bg-background text-muted-foreground shadow-sm sm:pr-12"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-5 w-5 mr-2" />
          <span className="truncate">Cari anggota...</span>
          <Kbd className="absolute right-4 hidden sm:flex">⌘K</Kbd>
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

