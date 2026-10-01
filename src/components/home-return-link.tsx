"use client";

import Link from "next/link";
import { House } from "lucide-react";
import { usePathname } from "next/navigation";

export function HomeReturnLink() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return <div className="border-b border-line bg-paper">
    <div className="mx-auto flex h-11 max-w-[1440px] items-center px-5 sm:px-8 lg:px-12">
      <Link href="/" aria-label="Go to home page" className="inline-flex items-center gap-2 text-[11px] text-muted transition-colors hover:text-forest">
        <House size={15} strokeWidth={1.7} />
        <span>Home</span>
      </Link>
    </div>
  </div>;
}