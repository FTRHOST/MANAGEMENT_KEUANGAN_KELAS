"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { User, Search } from 'lucide-react';
import type { Member, Settings } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';

type HomePageProps = {
  members: Member[];
  settings: Settings;
};

export default function HomePage({ members, settings }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAi, setLoadingAi] = useState(false);
  const router = useRouter();

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return [];
    const lowercasedQuery = searchQuery.toLowerCase();
    
    const directMatches = members.filter(member =>
      member.name.toLowerCase().includes(lowercasedQuery) ||
      (member.nim && member.nim.toLowerCase().includes(lowercasedQuery))
    );

    // If we have AI suggestions, filter members based on those names
    if (aiSuggestions.length > 0) {
        const suggestionSet = new Set(aiSuggestions.map(s => s.toLowerCase()));
        return members.filter(member => suggestionSet.has(member.name.toLowerCase()));
    }
    
    return directMatches;
  }, [searchQuery, members, aiSuggestions]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setAiSuggestions([]); // Clear previous AI suggestions

    if (query.length > 2) {
      const lowercasedQuery = query.toLowerCase();
      const directMatches = members.filter(member =>
        member.name.toLowerCase().includes(lowercasedQuery) ||
        (member.nim && member.nim.toLowerCase().includes(lowercasedQuery))
      );

      // If there are no immediate direct matches, query the AI for suggestions
      if (directMatches.length === 0) {
        setLoadingAi(true);
        try {
          const memberNames = members.map(m => m.name);
          const result = await suggestSimilarNames({ query, memberNames });
          setAiSuggestions(result.similarNames || []);
        } catch (error) {
          console.error("Error fetching AI suggestions:", error);
          setAiSuggestions([]);
        } finally {
          setLoadingAi(false);
        }
      }
    } else {
      setAiSuggestions([]);
    }
  };

  const handleSelectMember = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
  };
  
  const { heroTitle, heroDescription, logoUrl, appName } = settings;

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-4">
         {logoUrl && <img src={logoUrl} alt={appName} className="mx-auto h-24 w-24 object-contain" />}
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
          {heroTitle}
        </h1>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          {heroDescription}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-gray-500" />
          </div>
          <Input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Cari nama atau NIM anggota..."
            className="block w-full p-4 pl-10 text-base"
          />
        </div>

        {searchQuery && (
          <Card className="mt-2 text-left">
             <ScrollArea className="h-72">
              <CardContent className="p-2">
                {isLoadingAi && filteredMembers.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">Mencari saran nama...</div>
                )}
                {!isLoadingAi && filteredMembers.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">Anggota tidak ditemukan.</div>
                )}
                {filteredMembers.map(member => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member.id)}
                    className="flex items-center p-3 rounded-lg hover:bg-muted cursor-pointer"
                  >
                    <User className="mr-3 h-5 w-5 text-muted-foreground" />
                    <div className="flex flex-col">
                        <span className="font-medium">{member.name}</span>
                        {member.nim && <span className="text-xs text-muted-foreground">{member.nim}</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}
