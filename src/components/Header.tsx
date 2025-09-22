"use client";

import Link from 'next/link';
import { useState } from 'react';
import { LayoutDashboard, LogIn, LogOut, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginDialog from '@/components/auth/LoginDialog';
import { logout } from '@/lib/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from 'next/navigation';

export function Header({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block font-headline">
              Class Cashier
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              {isAuthenticated ? (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Admin
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href="/admin">Dashboard</Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                        <Link href="/admin/settings">Pengaturan</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                <Button onClick={() => setLoginOpen(true)} size="sm">
                  <LogIn className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      <LoginDialog isOpen={isLoginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}
