
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HamburgerMenu } from './HamburgerMenu';

export function Header() {
    return (
        <header className="w-full h-16 bg-white shadow-sm">
            <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
                <Link href="/">
                    <Image src="/Coverso.png" alt="Coverso Logo" width={150} height={40} />
                </Link>
                <nav className="hidden lg:flex items-center gap-4">
                    <Link href="/about" className="text-primary hover:underline">About Us</Link>
                    <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                    <Separator orientation="vertical" className="h-6 bg-primary" />
                    <Button asChild variant="ghost" className="text-primary hover:bg-primary hover:text-primary-foreground text-lg">
                        <Link href="/login">Login</Link>
                    </Button>
                </nav>
                <div className="lg:hidden">
                    <HamburgerMenu />
                </div>
            </div>
        </header>
    );
}
