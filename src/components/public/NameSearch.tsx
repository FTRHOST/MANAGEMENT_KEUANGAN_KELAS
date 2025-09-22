
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
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { User, Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';

type NameSearchProps = {
  members: Member[];
};

function CommandContent({ members, onSelect }: { members: Member[], onSelect: (id: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Cari nama atau NIM..." className="h-14 text-lg" />
      <CommandList>
        <CommandEmpty>Anggota tidak ditemukan.</CommandEmpty>
        <CommandGroup heading="Anggota Kelas">
          {members.map(member => (
            <CommandItem
              key={member.id}
              value={member.name}
              onSelect={() => onSelect(member.id)}
              className="py-3"
            >
              <User className="mr-2 h-4 w-4" />
              <span>{member.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (id: string) => {
    setOpen(false);
    router.push(`/anggota/${id}`);
  };

  if (isMobile) {
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="outline" className="w-full text-lg h-14 justify-start px-4 text-muted-foreground">
          <Search className="mr-2 h-5 w-5" />
          Cari nama atau NIM...
        </Button>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <div className="mt-4 border-t">
              <CommandContent members={members} onSelect={runCommand} />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="w-full max-w-md text-lg h-14 justify-start px-4 text-muted-foreground">
          <Search className="mr-2 h-5 w-5" />
          Cari nama atau NIM...
          <kbd className="pointer-events-none absolute right-4 hidden h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium opacity-100 sm:flex">
              <span className="text-base">⌘</span>K
          </kbd>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-lg">
          <CommandContent members={members} onSelect={runCommand} />
        </DialogContent>
      </Dialog>
    </>
  );
}
