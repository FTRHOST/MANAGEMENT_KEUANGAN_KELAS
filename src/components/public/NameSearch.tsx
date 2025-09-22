
"use client";

import { useState, useEffect } from 'react';
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { User, Search as SearchIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const isMobile = useIsMobile();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
    setInputValue('');
  };

  const filteredMembers =
    inputValue === ''
      ? members.slice(0, 10) // Show first 10 by default
      : members.filter((member) =>
          member.name.toLowerCase().includes(inputValue.toLowerCase())
        );

  const commandComponent = (
    <Command shouldFilter={false} className="h-auto">
      <CommandInput
        value={inputValue}
        onValueChange={setInputValue}
        placeholder="Cari nama atau NIM..."
        className="h-14 text-lg"
      />
      <CommandList>
        <CommandEmpty>{inputValue.length > 2 ? "Nama tidak ditemukan." : "Ketik untuk mencari..."}</CommandEmpty>
        {filteredMembers.length > 0 && (
          <CommandGroup heading="Anggota Kelas">
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
        )}
      </CommandList>
    </Command>
  )

  if (isMobile) {
    return (
        <div className="w-full max-w-md">
            {commandComponent}
        </div>
    )
  }
  
  return (
    <>
      <div className="w-full max-w-md">
        <Button
            variant="outline"
            className="relative h-14 w-full justify-start text-lg text-muted-foreground"
            onClick={() => setOpen(true)}
        >
            <SearchIcon className="mr-4 h-5 w-5"/>
            Cari nama atau NIM...
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-8 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium opacity-100 sm:flex">
                <span className="text-xl">⌘</span>K
            </kbd>
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg top-1/4">
            {commandComponent}
        </DialogContent>
      </Dialog>
    </>
  );
}
