
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Member } from '@/lib/types';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import { Dialog, DialogContent } from "@/components/ui/dialog";

type NameSearchProps = {
  members: Member[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function NameSearch({ members, isOpen, onOpenChange }: NameSearchProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!isOpen);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onOpenChange]);

  const runCommand = useCallback((command: () => unknown) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);


  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="p-0 gap-0">
          <Command>
            <CommandInput placeholder="Cari nama atau NIM..." />
            <CommandList>
              <CommandEmpty>Tidak ada hasil yang ditemukan.</CommandEmpty>
              <CommandGroup heading="Anggota Kelas">
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => {
                        runCommand(() => router.push(`/anggota/${member.id}`))
                    }}
                  >
                    {member.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
    </Dialog>
  );
}
