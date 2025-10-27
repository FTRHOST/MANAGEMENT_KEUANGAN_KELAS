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
import Image from 'next/image';
import type { Settings } from '@/lib/types';

type HeaderClientProps = {
  isAuthenticated: boolean;
  settings: Settings;
};

/**
 * A client component that renders the header of the application.
 * It handles the display of the login/logout buttons and the admin dropdown menu.
 * @param {object} props - The props for the component.
 * @param {boolean} props.isAuthenticated - Whether the user is authenticated.
 * @param {Settings} props.settings - The application settings.
 * @returns {JSX.Element} The header component.
 */
export default function HeaderClient({ isAuthenticated, settings }: HeaderClientProps) {
  const [isLoginOpen, setLoginOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  const { appName, logoUrl } = settings;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {logoUrl ? (
              <Image src={logoUrl} alt={`${appName} logo`} width={24} height={24} className="h-6 w-6" />
            ) : (
              <Wallet className="h-6 w-6 text-primary" />
            )}
            <span className="font-bold sm:inline-block font-headline">
              {appName}
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
