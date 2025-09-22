"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Member, Settings } from '@/lib/types';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';
import { Input } from '../ui/input';
import { Search, Loader2 } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';
import { Card, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);

  const memberNames = members.map(m => m.name);

  useEffect(() => {
    async function fetchSuggestions() {
      if (debouncedSearchTerm.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSearching(true);
      try {
        const result = await suggestSimilarNames({
          query: debouncedSearchTerm,
          memberNames,
        });
        setSuggestions(result.similarNames);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
      setIsSearching(false);
    }

    fetchSuggestions();
  }, [debouncedSearchTerm, memberNames]);

  const handleSuggestionClick = (name: string) => {
    const member = members.find(m => m.name === name);
    if (member) {
      router.push(`/anggota/${member.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {settings.heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings.heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cari nama atau NIM di sini..."
            className="w-full appearance-none bg-background pl-10 pr-4 py-6 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && (
             <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>

        {searchTerm.length > 0 && (
          <Card className="mt-2 text-left">
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {suggestions.length > 0 ? (
                    suggestions.map((name, index) => (
                      <TableRow key={index} className="cursor-pointer hover:bg-muted" onClick={() => handleSuggestionClick(name)}>
                        <TableCell className="font-medium">{name}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    !isSearching && debouncedSearchTerm.length >= 3 && (
                      <TableRow>
                        <TableCell>Nama tidak ditemukan.</TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}