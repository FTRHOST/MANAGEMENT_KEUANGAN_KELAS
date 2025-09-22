"use client";

import { useState, useEffect, useTransition } from 'react';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import { NameSearch } from './NameSearch';
import { Button } from '../ui/button';
import { Search, Loader2 } from 'lucide-react';
import { Kbd } from '../ui/kbd';
import { useRouter } from 'next/navigation';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User } from 'lucide-react';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSearchResults([]);
    if (!query.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        const memberNames = members.map(m => m.name);
        const result = await suggestSimilarNames({ query, memberNames });
        
        // Map back from names to full member objects
        const foundMembers = result.similarNames
          .map(name => members.find(m => m.name === name))
          .filter((m): m is Member => !!m);

        if (foundMembers.length > 0) {
            setSearchResults(foundMembers);
        } else {
            setError("Tidak ada anggota yang cocok ditemukan.");
        }

      } catch (err) {
        console.error(err);
        setError("Gagal melakukan pencarian. Silakan coba lagi.");
      }
    });
  };

  const handleSelectMember = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
  };

  const { heroTitle, heroDescription } = settings;
  const showShortcut = isClient && !/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md">
        <form onSubmit={handleSearch} className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full rounded-full border border-gray-300 bg-background p-4 pl-10 text-sm text-foreground focus:border-primary focus:ring-primary"
            placeholder="Cari nama anggota..."
          />
          <button
            type="submit"
            disabled={isPending}
            className="absolute bottom-2.5 right-2.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-ring disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {isPending && (
         <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-muted-foreground">Mencari anggota...</p>
        </div>
      )}

      {error && (
         <Alert variant="destructive" className="w-full max-w-md">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {searchResults.length > 0 && (
         <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Hasil Pencarian</CardTitle>
                <CardDescription>Ditemukan {searchResults.length} anggota yang cocok.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {searchResults.map(member => (
                        <Button
                            key={member.id}
                            variant="ghost"
                            className="flex w-full cursor-pointer items-center justify-start p-2 text-left"
                            onClick={() => handleSelectMember(member.id)}
                        >
                            <User className="mr-2 h-4 w-4" />
                            {member.name}
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
