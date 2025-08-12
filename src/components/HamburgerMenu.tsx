
"use client"

import * as React from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "./ui/separator"
import Image from "next/image"

export function HamburgerMenu() {
  const [open, setOpen] = React.useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-xs sm:max-w-sm">
        <nav className="flex flex-col p-4">
           <Link href="/" className="mb-8" onClick={() => setOpen(false)}>
              <Image src="/Coverso.png" alt="Coverso Logo" width={150} height={40} />
            </Link>
          <ul className="flex flex-col gap-4">
            <li>
              <Link
                href="/about"
                className="text-lg font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/faq"
                className="text-lg font-medium text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                FAQ
              </Link>
            </li>
          </ul>
          <Separator className="my-6" />
          <Button asChild variant="default" className="text-lg" onClick={() => setOpen(false)}>
            <Link href="/login">Login</Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
