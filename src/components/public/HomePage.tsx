
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const memberNames = members.map(m => m.name);
      const result = await suggestSimilarNames({ query: searchQuery, memberNames });
      setSuggestions(result.similarNames);
    } catch (error) {
      console.error('Error fetching similar names:', error);
      setSuggestions([]);
    }
    setIsSearching(false);
  };

  const handleSuggestionClick = (name: string) => {
    const member = members.find(m => m.name === name);
    if (member) {
      router.push(`/anggota/${member.id}`);
    }
  };

  const { heroTitle, heroDescription } = settings;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            id="default-search"
            className="block w-full p-4 ps-10 text-sm"
            placeholder="Cari nama anggota..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" className="absolute end-2.5 bottom-2.5" disabled={isSearching}>
            {isSearching ? <Loader2 className="animate-spin" /> : 'Search'}
          </Button>
        </form>

        {suggestions.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-2 text-left">Mungkin yang Anda maksud:</p>
              <ul className="space-y-2">
                {suggestions.map((name) => {
                  const member = members.find(m => m.name === name);
                  return (
                    <li key={member?.id || name}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleSuggestionClick(name)}
                      >
                        {name}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
