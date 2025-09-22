
"use client";

import * as React from "react"
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";


type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile();
  const isDesktop = !isMobile;

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const CommandMenu = (
    <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
      <CommandInput placeholder="Cari nama atau NIM..." />
      <CommandList>
        <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
        <CommandGroup>
          {members.map((member) => (
            <CommandItem
              key={member.id}
              value={`${member.name} ${member.id}`}
              onSelect={() => runCommand(() => router.push(`/anggota/${member.id}`))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{member.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  if (isDesktop) {
    return (
      <>
        <Button onClick={() => setOpen(true)} variant="outline" className="w-full justify-start h-14 text-lg text-muted-foreground">
          Cari nama atau NIM...
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="p-0 gap-0">
             <DialogHeader className="sr-only">
              <DialogTitle>Cari Anggota</DialogTitle>
              <DialogDescription>Cari nama atau NIM untuk melihat detail keuangan.</DialogDescription>
            </DialogHeader>
            {CommandMenu}
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="w-full justify-start h-14 text-lg text-muted-foreground">
          Cari nama atau NIM...
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mt-4 border-t">
          {CommandMenu}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
