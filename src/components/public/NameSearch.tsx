"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Member } from '@/lib/types';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { User, Search } from 'lucide-react';
import { useDebounceValue } from 'usehooks-ts';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

type NameSearchProps = {
  members: Member[];
};

export default function NameSearch({ members }: NameSearchProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [debouncedInputValue] = useDebounceValue(inputValue, 300);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [isListVisible, setListVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedInputValue) {
      const filtered = members.filter(member =>
        member.name.toLowerCase().includes(debouncedInputValue.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers(members); // Show all members if input is empty
    }
  }, [debouncedInputValue, members]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setListVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
    setListVisible(false);
  };

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative w-full max-w-lg rounded-full bg-background transition-all duration-300",
        isListVisible ? "rounded-b-none rounded-t-3xl shadow-lg" : "shadow-md hover:shadow-lg"
      )}
    >
      <Command shouldFilter={false} className="rounded-full">
        <div className="flex items-center px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
                placeholder="Cari nama anggota..."
                value={inputValue}
                onValueChange={setInputValue}
                onFocus={() => setListVisible(true)}
            />
        </div>
        
        {isListVisible && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-b-3xl shadow-lg overflow-hidden">
             <Separator />
                <CommandList>
                    {filteredMembers.length === 0 && inputValue.length > 0 && (
                        <CommandEmpty>Nama tidak ditemukan.</CommandEmpty>
                    )}
                    <CommandGroup>
                    {filteredMembers.map(member => (
                        <CommandItem
                        key={member.id}
                        value={member.name}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent onBlur from firing before navigation
                          handleSelect(member.id);
                        }}
                        className="flex items-center gap-2 cursor-pointer"
                        >
                        <User className="h-4 w-4" />
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
