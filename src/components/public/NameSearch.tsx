"use client";

import { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Member } from '@/lib/types';
import { User } from 'lucide-react';

type NameSearchProps = {
  members: Member[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NameSearch({ members, isOpen, onOpenChange }: NameSearchProps) {
  const router = useRouter();

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Cari Anggota</DialogTitle>
          <DialogDescription>
            Ketik nama atau NIM untuk mencari anggota kelas dan melihat detail keuangan mereka.
          </DialogDescription>
        </DialogHeader>
        <Command>
          <CommandInput placeholder="Cari nama atau NIM..." />
          <CommandList>
            <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
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
      </DialogContent>
    </Dialog>
  );
}
