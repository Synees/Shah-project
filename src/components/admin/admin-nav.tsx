"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminNavProps {
  adminName?: string | null;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Ringkasan", exact: true },
  { href: "/admin/pesanan", label: "Pesanan", exact: false },
  { href: "/admin/katalog", label: "Katalog", exact: false },
  { href: "/admin/boks", label: "Tipe Boks", exact: false },
];

export function AdminNav({ adminName }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-[#B8926A]/35 bg-[#F2EBE1]/70 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Area Title */}
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="flex items-baseline gap-2.5 group"
            >
              <span className="font-heading text-2xl tracking-wide text-[#4E3626] group-hover:text-[#2B211A] transition-colors">
                Shah Project
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#B8926A] font-sans border-l border-[#B8926A]/40 pl-2.5">
                Admin Panel
              </span>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#B8926A]/25">
              {NAV_ITEMS.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] font-sans transition-colors rounded-[2px] ${
                      isActive
                        ? "text-[#2B211A] font-semibold bg-[#B8926A]/15 border-b-2 border-[#4E3626]"
                        : "text-[#7B5841] hover:text-[#2B211A] hover:bg-[#B8926A]/8 border-b-2 border-transparent"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Section: User & Logout */}
          <div className="flex items-center gap-4">
            {adminName && (
              <span className="hidden sm:inline-block text-xs text-[#7B5841] font-sans">
                {adminName}
              </span>
            )}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[11px] uppercase tracking-[0.16em] text-[#7B5841] hover:text-[#2B211A] border border-[#B8926A]/40 hover:border-[#4E3626] px-3 py-1.5 rounded-[2px] transition-colors font-sans cursor-pointer"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-[#B8926A]/20">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap px-3 py-1 text-[10px] uppercase tracking-[0.16em] font-sans rounded-[2px] ${
                  isActive
                    ? "text-[#2B211A] font-semibold bg-[#B8926A]/20"
                    : "text-[#7B5841] hover:text-[#2B211A]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
