
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { User, Search } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';
import type { Member } from '@/lib/types';
import { suggestSimilarNames } from '@/ai/flows/suggest-similar-names';
import { Button } from '../ui/button';
import { Kbd } from '../ui/kbd';
import { Skeleton } from '../ui/skeleton';


type NameSearchProps = {
  members: Member[];
};

export function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue] = useDebounceValue(inputValue, 500);
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const allMemberNames = members.map(m => m.name);

  useEffect(() => {
    if (debouncedInputValue.length > 1) {
      setIsSearching(true);
      suggestSimilarNames({ query: debouncedInputValue, memberNames: allMemberNames })
        .then(response => {
          const suggestedMembers = members.filter(member => response.similarNames.includes(member.name));
          setSuggestions(suggestedMembers);
        })
        .finally(() => {
          setIsSearching(false);
        });
    } else {
      setSuggestions([]);
    }
  }, [debouncedInputValue, allMemberNames, members]);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
  };

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setInputValue('');
      setSuggestions([]);
    }
  };
  
  const showSuggestions = open && inputValue.length > 1;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative h-12 w-full justify-start rounded-full bg-background text-muted-foreground shadow-sm sm:pr-12">
            <Search className="h-5 w-5 mr-2" />
            <span className="hidden lg:inline-flex">Cari nama anggota...</span>
            <span className="inline-flex lg:hidden">Cari anggota...</span>
            {isClient && (
            <Kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex">
                ⌘K
            </Kbd>
            )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Ketik nama untuk mencari..." 
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isSearching && (
                <div className='p-4 space-y-2'>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-2/3" />
                </div>
            )}
            {!isSearching && debouncedInputValue.length > 1 && (
              <CommandEmpty>Tidak ada anggota yang cocok.</CommandEmpty>
            )}
            {!isSearching && suggestions.length > 0 && (
              <CommandGroup heading="Saran">
                {suggestions.map(member => (
                  <CommandItem key={member.id} value={member.name} onSelect={() => handleSelect(member.id)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{member.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
             {!debouncedInputValue && (
                <CommandGroup heading="Semua Anggota">
                    {members.map(member => (
                        <CommandItem key={member.id} value={member.name} onSelect={() => handleSelect(member.id)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>{member.name}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
             )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

    