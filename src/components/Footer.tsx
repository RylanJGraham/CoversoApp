
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function Footer() {
    const router = useRouter();

    return (
        <footer className="bg-gradient-to-b from-primary-gradient-start to-primary-gradient-end text-primary-foreground mt-auto">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                       <Link href="/">
                         <Image src="/CoversoOrange.png" alt="Coverso Logo" width={200} height={50} />
                       </Link>
                        <p className="text-sm">
                            AI-powered cover letters to accelerate your job search.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold">Navigation</h4>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="/about" className="hover:underline">About Us</Link></li>
                            <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
                            <li><Link href="/pricing" className="hover:underline">Pricing</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold">Legal</h4>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="#" className="hover:underline">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:underline">Privacy Policy</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="text-lg font-semibold">Get Started</h4>
                        <ul className="mt-4 space-y-2 text-sm">
                            <li><Link href="/login" className="hover:underline">Login</Link></li>
                            <li><Link href="/login" className="hover:underline">Sign Up</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 pt-8 border-t border-primary-foreground/20 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} Coverso. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
