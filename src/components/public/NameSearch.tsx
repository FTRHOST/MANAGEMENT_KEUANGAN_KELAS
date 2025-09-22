"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Member } from '@/lib/types';
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
} from "@/components/ui/popover"
import { User, Search } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue] = useDebounceValue(inputValue, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
  };

  const filteredMembers = debouncedValue
    ? members.filter(member =>
        member.name.toLowerCase().includes(debouncedValue.toLowerCase())
      )
    : [];

  useEffect(() => {
    if (debouncedValue && filteredMembers.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [debouncedValue, filteredMembers.length]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="w-full max-w-md">
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Command>
                     <CommandInput
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        placeholder="Cari nama atau NIM..."
                        className="h-12 pl-12 rounded-full shadow-sm"
                     />
                </Command>
                <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium text-muted-foreground opacity-100 sm:flex">
                  <span className="text-sm">⌘</span>K
                </kbd>
            </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
            <Command>
              <CommandList>
                {filteredMembers.length === 0 && debouncedValue ? (
                  <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
                ) : null}
                <CommandGroup>
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      value={member.name}
                      onSelect={() => handleSelect(member.id)}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>{member.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}