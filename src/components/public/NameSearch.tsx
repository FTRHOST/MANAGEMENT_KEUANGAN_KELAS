"use client";

import { useState, useEffect, useRef } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { User, Search } from 'lucide-react';
import { useDebounce } from 'usehooks-ts';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debouncedInputValue) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [debouncedInputValue]);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setOpen(false);
    setInputValue("");
  };
  
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      inputRef.current?.blur();
      setOpen(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto" onKeyDown={handleKeyDown}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <CommandInput
              ref={inputRef}
              as={_CommandInput}
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Cari nama atau NIM..."
              className="h-14 pl-12 rounded-full border shadow-sm text-lg"
              onFocus={() => {
                if (inputValue) setOpen(true);
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 w-[--radix-popover-trigger-width] rounded-xl" 
          side="bottom" 
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()} // Prevents stealing focus
        >
          <Command shouldFilter={true}>
            <CommandList>
              <CommandEmpty>Tidak ada anggota ditemukan.</CommandEmpty>
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={`${member.name} ${member.id}`}
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
        </PopoverContent>
      </Popover>
    </div>
  );
}

// A wrapper component to allow passing a ref to CommandInput
const _CommandInput = (props: any) => {
  const { ref, ...rest } = props;
  return <CommandPrimitive.Input ref={ref} {...rest} />;
};

// We need to re-import CommandPrimitive as it's not exported from our ui component
import { Command as CommandPrimitive } from 'cmdk';