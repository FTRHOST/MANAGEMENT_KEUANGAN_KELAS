
"use client";

import { useEffect, useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
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
    setOpen(false);
    router.push(`/anggota/${memberId}`);
  };

  const commandItems = members.map((member) => (
    <CommandItem
      key={member.id}
      value={member.name}
      onSelect={() => handleSelect(member.id)}
      onClick={() => handleSelect(member.id)} // Menambahkan onClick untuk klik mouse
      className="cursor-pointer"
    >
      <User className="mr-2 h-4 w-4" />
      <span>{member.name}</span>
    </CommandItem>
  ));

  if (isMobile) {
    return (
      <>
        <Button onClick={() => setOpen(true)} className="w-full" variant="outline">
          Cari nama atau NIM...
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle className="sr-only">Cari Anggota</DrawerTitle>
              <DrawerDescription className="sr-only">
                Ketik nama atau NIM untuk mencari anggota kelas.
              </DrawerDescription>
            </DrawerHeader>
            <Command className="rounded-lg border-none">
              <CommandInput placeholder="Cari nama atau NIM..." />
              <CommandList>
                <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
                <CommandGroup>{commandItems}</CommandGroup>
              </CommandList>
            </Command>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-md h-14 text-lg justify-start px-4 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <span>Cari nama atau NIM...</span>
        <kbd className="pointer-events-none ml-auto hidden h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium opacity-100 sm:flex">
          <span className="text-lg">⌘</span>K
        </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
           <DialogHeader className="sr-only">
              <DialogTitle>Cari Anggota</DialogTitle>
              <DialogDescription>
                Ketik nama atau NIM untuk mencari anggota kelas.
              </DialogDescription>
            </DialogHeader>
          <Command>
            <CommandInput placeholder="Cari nama atau NIM..." />
            <CommandList>
              <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
              <CommandGroup>{commandItems}</CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
