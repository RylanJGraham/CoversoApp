
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HamburgerMenu } from './HamburgerMenu';
import { getClientAuth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
    const router = useRouter();
    const handleLogout = async () => {
        const auth = getClientAuth();
        await auth.signOut();
        router.push('/login');
    }
    return (
        <header className="w-full h-16 bg-primary shadow-sm">
            <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
                <Link href="/dashboard">
                    <Image src="/Logo2.png" alt="Coverso Logo" width={150} height={40} />
                </Link>
                <nav className="hidden lg:flex items-center gap-4">
                    <Link href="/about" className="text-primary-foreground hover:underline">About Us</Link>
                    <Link href="/faq" className="text-primary-foreground hover:underline">FAQ</Link>
                    <Separator orientation="vertical" className="h-6 bg-primary-foreground/50" />
                    <Button onClick={handleLogout} variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground text-lg">
                        Logout
                    </Button>
                </nav>
                <div className="lg:hidden">
                    <HamburgerMenu />
                </div>
            </div>
        </header>
    );
}
