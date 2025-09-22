"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { Member } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

export default function NameSearch({ members }: { members: Member[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredMembers = useMemo(() => {
    if (!searchTerm) return [];
    return members.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, members]);

  const handleMemberClick = (memberId: string) => {
    router.push(`/anggota/${memberId}`);
  };

  return (
    <div className="w-full max-w-md relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Ketik nama Anda di sini..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-lg h-14"
        />
      </div>
      {searchTerm && (
        <Card className="absolute top-full mt-2 w-full z-10 shadow-lg">
          <CardContent className="p-2">
            <ScrollArea className="h-auto max-h-72">
            {filteredMembers.length > 0 ? (
              <ul>
                {filteredMembers.map(member => (
                  <li key={member.id}>
                    <button
                      onClick={() => handleMemberClick(member.id)}
                      className="flex items-center w-full text-left p-3 rounded-md hover:bg-secondary transition-colors"
                    >
                      <User className="mr-3 h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{member.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-center text-muted-foreground">
                Nama tidak ditemukan.
              </p>
            )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
