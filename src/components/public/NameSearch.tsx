
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
import { User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';


type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
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
  };
  
  const SearchCommand = (
    <Command shouldFilter={true}>
      <CommandInput placeholder="Cari nama atau NIM..." />
      <CommandList>
        <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
        <CommandGroup heading="Anggota Kelas">
          {members.map((member) => (
            <CommandItem
              key={member.id}
              value={member.name}
              onSelect={() => handleSelect(member.id)}
              className="cursor-pointer"
              onClick={() => handleSelect(member.id)}
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
          <Button variant="outline" className="relative h-12 w-full justify-start rounded-full bg-background text-muted-foreground shadow-sm">
            <Search className="h-5 w-5 ml-3 mr-4" />
            <span>Cari anggota...</span>
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <div className="mt-4 border-t">{SearchCommand}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button
            variant="outline"
            className="relative h-12 w-full justify-start rounded-full bg-background text-muted-foreground shadow-sm sm:pr-12"
            >
            <Search className="h-5 w-5 ml-3 mr-4" />
            <span className="hidden lg:inline-flex">Cari nama atau NIM...</span>
            <span className="inline-flex lg:hidden">Cari anggota...</span>
            <kbd className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-sm">⌘</span>K
            </kbd>
            </Button>
      </DialogTrigger>
      <DialogContent className="p-0">
          <DialogHeader className="sr-only">
              <DialogTitle>Cari Anggota</DialogTitle>
              <DialogDescription>Cari anggota kelas berdasarkan nama atau NIM.</DialogDescription>
          </DialogHeader>
          {SearchCommand}
      </DialogContent>
    </Dialog>
  );
}

    