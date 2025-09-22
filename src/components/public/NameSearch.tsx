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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback((memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
  }, [router]);
  
  if (!isMounted) {
    return <Skeleton className="h-14 w-full" />;
  }

  const CommandContent = (
    <Command>
      <CommandInput placeholder="Cari nama atau NIM..." />
      <CommandList>
        <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
        <CommandGroup heading="Anggota">
          {members.map((member) => (
            <CommandItem
              key={member.id}
              value={member.name}
              onSelect={() => handleSelect(member.id)}
              onClick={() => handleSelect(member.id)}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>{member.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-muted-foreground h-14 text-lg">
            Cari nama atau NIM...
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mt-4 border-0">
            {CommandContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
          <Button
            variant="outline"
            className="relative h-14 w-full justify-start text-muted-foreground sm:pr-12 md:text-lg"
          >
            <span className="hidden lg:inline-flex">Cari nama atau NIM...</span>
            <span className="inline-flex lg:hidden">Cari anggota...</span>
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-7 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
              <span className="text-sm">⌘</span>K
            </kbd>
          </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
         <DialogHeader className="sr-only">
          <DialogTitle>Cari Anggota</DialogTitle>
          <DialogDescription>Ketik nama atau NIM untuk mencari anggota kelas.</DialogDescription>
        </DialogHeader>
        {CommandContent}
      </DialogContent>
    </Dialog>
  );
}