
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
  };

  const filteredMembers = inputValue
    ? members.filter((member) =>
        member.name.toLowerCase().includes(inputValue.toLowerCase())
      )
    : [];

  return (
    <div className="w-full max-w-md">
      <Command shouldFilter={false} className="rounded-lg border shadow-md">
        <CommandInput
          placeholder="Cari nama atau NIM..."
          value={inputValue}
          onValueChange={setInputValue}
          onFocus={() => setOpen(true)}
        />
        <CommandList>
          {open && (
            <>
              {filteredMembers.length === 0 && inputValue.length > 2 && (
                <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
              )}
              {filteredMembers.length > 0 && (
                <CommandGroup heading="Anggota Ditemukan">
                  {filteredMembers.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => handleSelect(member.id)}
                      value={member.name}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      <span>{member.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </Command>
    </div>
  );
}
