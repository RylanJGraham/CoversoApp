
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HamburgerMenu } from './HamburgerMenu';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';

interface UserProfile {
  fullName: string;
  profileImage?: string;
  [key: string]: any;
}

export function DashboardHeader() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getClientAuth();
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                const db = getClientFirestore();
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setUserProfile(userDocSnap.data() as UserProfile);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        const auth = getClientAuth();
        await auth.signOut();
        router.push('/login');
    };

    return (
        <header className="w-full h-16 bg-white shadow-sm">
            <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
                <Link href="/dashboard">
                    <Image src="/Coverso.png" alt="Coverso Logo" width={150} height={40} />
                </Link>
                <nav className="hidden lg:flex items-center gap-4">
                    <Link href="/about" className="text-primary hover:underline">About Us</Link>
                    <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                    <Separator orientation="vertical" className="h-6 bg-primary/50" />
                    {!loading && user && userProfile ? (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 h-10 px-3 hover:bg-primary/10">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={userProfile.profileImage || user.photoURL || undefined} alt={userProfile.fullName} />
                                        <AvatarFallback>
                                            <UserIcon className="h-5 w-5" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-gray-700 hover:text-primary">{userProfile.fullName}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                         <Button onClick={() => router.push('/login')} variant="ghost" className="text-primary hover:bg-primary hover:text-primary-foreground text-lg">
                            Login
                        </Button>
                    )}
                </nav>
                <div className="lg:hidden">
                    <HamburgerMenu />
                </div>
            </div>
        </header>
    );
}
