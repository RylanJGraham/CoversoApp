
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function Header() {
    return (
        <header className="w-full h-16 bg-white">
            <div className="h-full flex items-center justify-end px-4 sm:px-6 lg:px-8">
                <nav className="flex items-center gap-4">
                    <Link href="/about" className="text-primary hover:underline">About Us</Link>
                    <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
                    <Separator orientation="vertical" className="h-6 bg-primary" />
                    <Button asChild variant="ghost" className="text-primary hover:bg-primary hover:text-primary-foreground text-lg">
                        <Link href="/login">Login</Link>
                    </Button>
                </nav>
            </div>
        </header>
    );
}
