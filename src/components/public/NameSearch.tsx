
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty, CommandGroup } from '@/components/ui/command';
import type { Member } from '@/lib/types';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';
import { useDebounce } from 'usehooks-ts';
import { Loader2, Search } from 'lucide-react';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (debouncedQuery.length > 1) {
      setIsLoading(true);
      const lowerQuery = debouncedQuery.toLowerCase();
      
      // Client-side filtering first
      const directMatches = members.filter(member => 
        member.name.toLowerCase().includes(lowerQuery) || 
        (member.nim && member.nim.includes(lowerQuery))
      );

      if (directMatches.length > 0 && directMatches.length <= 5) {
        setSuggestions(directMatches);
        setIsLoading(false);
      } else {
        // Fallback to AI for smarter suggestions
        const allMemberNames = members.map(m => m.name);
        suggestSimilarNames({ query: debouncedQuery, memberNames: allMemberNames })
          .then(result => {
            const suggestedMembers = result.similarNames.map(name => {
              return members.find(m => m.name === name)!;
            }).filter(Boolean); // Filter out any undefined members
            setSuggestions(suggestedMembers);
          })
          .catch(console.error)
          .finally(() => setIsLoading(false));
      }
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  }, [debouncedQuery, members]);

  const handleSelect = (memberId: string) => {
    setQuery('');
    setOpen(false);
    router.push(`/anggota/${memberId}`);
  };

  return (
    <div ref={commandRef} className="relative w-full max-w-md mx-auto">
      <Command shouldFilter={false} className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput
            value={query}
            onValueChange={setQuery}
            onFocus={() => setOpen(true)}
            placeholder="Cari nama atau NIM..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
           {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        </div>
        {open && (
          <div className="absolute top-full z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
            <CommandList>
              <CommandEmpty>{!isLoading && query.length > 1 ? 'Anggota tidak ditemukan.' : 'Ketik untuk mencari...'}</CommandEmpty>
              {suggestions.length > 0 && (
                <CommandGroup heading="Saran">
                  {suggestions.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={`${member.name} ${member.nim || ''}`}
                      onSelect={() => handleSelect(member.id)}
                      className="cursor-pointer"
                    >
                      <div>
                        <p>{member.name}</p>
                        {member.nim && <p className="text-xs text-muted-foreground">{member.nim}</p>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
}
