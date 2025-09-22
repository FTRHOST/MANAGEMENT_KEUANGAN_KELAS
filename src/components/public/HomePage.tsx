"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);

  const allMemberNames = useMemo(() => members.map(m => m.name), [members]);

  const fetchSuggestions = useCallback(async () => {
    if (debouncedSearchTerm.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const result = await suggestSimilarNames({
        query: debouncedSearchTerm,
        memberNames: allMemberNames,
      });
      setSuggestions(result.similarNames || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
    setIsSearching(false);
  }, [debouncedSearchTerm, allMemberNames]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);


  const getMemberId = (name: string) => {
    const member = members.find(m => m.name === name);
    return member ? member.id : null;
  };

  return (
    <div className="flex flex-col items-center justify-start space-y-8 text-center min-h-[60vh] pt-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {settings.heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {settings.heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md space-y-2">
        <form className="relative" onSubmit={(e) => e.preventDefault()}>
          <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </div>
          <Input
            type="search"
            id="default-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full p-4 ps-10"
            placeholder="Cari nama anggota..."
          />
          {isSearching && (
            <div className="absolute inset-y-0 end-0 flex items-center pe-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </form>

        { (debouncedSearchTerm.length >= 3) && (
          <Card>
            <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama yang Mungkin Cocok</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isSearching ? (
                        <TableRow>
                            <TableCell className="text-center text-muted-foreground">Mencari...</TableCell>
                        </TableRow>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((name) => {
                        const memberId = getMemberId(name);
                        if (!memberId) return null;
                        return (
                          <TableRow key={memberId}>
                            <TableCell className="font-medium">
                              <Link href={`/anggota/${memberId}`} className="block w-full text-left">
                                {name}
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell className="text-center text-muted-foreground">
                          Nama tidak ditemukan.
                        </TableCell>
                      </TableRow>
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