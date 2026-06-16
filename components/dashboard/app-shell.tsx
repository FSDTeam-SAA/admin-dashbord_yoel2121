"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Grid2X2,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { href: "/users", label: "User List", icon: Users },
  { href: "/tradespeople", label: "Tradesperson List", icon: Users },
  { href: "/category", label: "Category", icon: WalletCards },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const user = session?.user;
  const name = user?.name || "Brooklyn Simmons";
  const avatar = user?.profileImage?.url;

  const activeHref = useMemo(
    () => nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href,
    [pathname],
  );

  function onSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = search.trim();
    if (query) router.push(`${pathname.split("/")[1] === "tradespeople" ? "/tradespeople" : "/users"}?q=${encodeURIComponent(query)}`);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    signOut({ callbackUrl: "/login" });
  }

  const sidebar = (
    <aside className="sidebar-gradient flex h-full w-[312px] shrink-0 flex-col overflow-y-auto px-6 py-9 text-white max-lg:w-[280px]">
      <div className="mb-11 flex justify-center">
        <Image src="/zentrofix-logo.png" alt="Zentrofix" width={114} height={112} priority className="h-[112px] w-[114px] object-contain" />
      </div>
      <nav className="flex flex-col gap-5">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex h-[52px] items-center gap-3 rounded-[6px] px-3 text-[17px] font-medium transition",
                active ? "bg-[#2e73b8] font-bold text-white" : "text-white hover:bg-white/10",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="mt-1 flex h-[52px] items-center gap-3 rounded-[6px] px-3 text-left text-[17px] font-medium text-white transition hover:bg-white/10"
        >
          <LogOut className="h-5 w-5" />
          Log Out
        </button>
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="relative h-full">
            {sidebar}
            <Button type="button" size="icon" variant="ghost" className="absolute right-4 top-4 text-white" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-[420px] rounded-[8px] bg-white p-6 shadow-2xl">
            <h2 className="text-[24px] font-bold text-black">Log out?</h2>
            <p className="mt-3 text-base text-[#555]">Are you sure you want to log out from the admin dashboard?</p>
            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="outline" className="w-[96px]" onClick={() => setLogoutOpen(false)}>
                No
              </Button>
              <Button type="button" className="w-[96px]" onClick={confirmLogout}>
                Yes
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="min-w-0 lg:ml-[312px]">
        <header className="topbar-gradient sticky top-0 z-20 flex h-[100px] items-center justify-between gap-4 px-5 md:px-10">
          <div className="flex items-center gap-3">
            <Button type="button" size="icon" variant="ghost" className="text-white lg:hidden" onClick={() => setOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <form onSubmit={onSearch} className="flex h-11 w-[358px] max-w-[60vw] overflow-hidden rounded-[6px] border border-[#2e73b8] md:w-[392px]">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                className="h-full rounded-none border-0 bg-transparent text-white placeholder:text-white/90 focus:border-0"
              />
              <button type="submit" className="flex w-[60px] items-center justify-center bg-[#2e73b8] text-white" aria-label="Search">
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
          <div className="flex items-center gap-3 text-white">
            <Avatar name={name} src={avatar} size={41} />
            <span className="hidden text-[17px] md:block">{name}</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-100px)] overflow-x-hidden px-5 py-7 md:px-10 md:py-12">{children}</main>
      </div>
    </div>
  );
}
