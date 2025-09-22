"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { User, Search } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';
import type { Member } from '@/lib/types';
import { Separator } from '../ui/separator';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue] = useDebounceValue(inputValue, 300);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedInputValue) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(debouncedInputValue.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [debouncedInputValue, members]);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setIsOpen(false);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={commandRef} className="relative w-full max-w-lg mx-auto">
      <Command className="rounded-lg border shadow-md">
         <div className="flex items-center px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
                placeholder="Cari nama anggota..."
                value={inputValue}
                onValueChange={setInputValue}
                onFocus={() => setIsOpen(true)}
            />
        </div>
        {isOpen && (
          <>
            <Separator />
            <CommandList>
              {filteredMembers.length === 0 && debouncedInputValue.length > 0 ? (
                <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
              ) : null}
              {filteredMembers.map(member => (
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
            </CommandList>
          </>
        )}
      </Command>
    </div>
  );
}