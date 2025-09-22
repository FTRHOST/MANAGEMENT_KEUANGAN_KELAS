"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { useDebounceCallback } from 'usehooks-ts'

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSelect = (value: string) => {
    const member = members.find(
      (m) => m.name.toLowerCase() === value.toLowerCase()
    );
    if (member) {
      router.push(`/anggota/${member.id}`);
      setOpen(false);
    }
  };
  
  const debounced = useDebounceCallback(setOpen, 300)

  return (
    <div className="w-full max-w-md">
      <Command
        shouldFilter={true}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            (e.target as HTMLInputElement).blur();
            setOpen(false);
          }
        }}
      >
        <div className="relative">
          <CommandInput
            placeholder="Cari nama atau NIM..."
            className="h-12 w-full justify-start rounded-full bg-background text-foreground shadow-sm sm:pr-12"
            onFocus={() => setOpen(true)}
            onBlur={() => debounced(false)}
          />
        </div>
        
        {open && (
            <div className="relative mt-2">
                <CommandList className="absolute z-10 w-full rounded-lg border bg-background shadow-lg">
                  <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
                  <CommandGroup>
                    {members.map((member) => (
                      <CommandItem
                        key={member.id}
                        value={member.name}
                        onSelect={handleSelect}
                        className="cursor-pointer"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{member.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
            </div>
        )}
      </Command>
    </div>
  );
}