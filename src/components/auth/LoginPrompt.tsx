"use client";

import { useEffect, useState } from 'react';
import NameSearch from '@/components/public/NameSearch';
import LoginDialog from './LoginDialog';
import { Skeleton } from '../ui/skeleton';

export default function LoginPrompt() {
    const [isLoginOpen, setLoginOpen] = useState(false);
    
    // Open the dialog once the component is mounted on the client
    useEffect(() => {
        setLoginOpen(true);
    }, []);
    
    // This component does not fetch members, so it will show a loading/simplified state
    // of the homepage while prompting for login.
    return (
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline">
                    Akses Ditolak
                </h1>
                <p className="max-w-[700px] text-muted-foreground md:text-xl">
                    Silakan login untuk mengakses panel admin.
                </p>
            </div>
            <div className="w-full max-w-md">
                <Skeleton className="h-14 w-full" />
            </div>
            <LoginDialog isOpen={isLoginOpen} onOpenChange={setLoginOpen} />
        </div>
    );
}
