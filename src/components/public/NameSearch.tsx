"use client";

import { useState } from 'react';
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
import { User } from 'lucide-react';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
    setInputValue('');
  };

  return (
    <div className="w-full max-w-md">
      <Command shouldFilter={false} className="rounded-lg border shadow-md">
        <div className="relative">
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Cari nama atau NIM..."
            className="h-14 text-lg"
          />
        </div>
        {open && inputValue.length > 0 && (
          <CommandList>
            <CommandEmpty>Tidak ada anggota yang cocok.</CommandEmpty>
            <CommandGroup>
              {members
                .filter(
                  (member) =>
                    member.name.toLowerCase().includes(inputValue.toLowerCase())
                )
                .map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => handleSelect(member.id)}
                    className="flex items-center gap-3 py-3"
                  >
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span>{member.name}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
}
