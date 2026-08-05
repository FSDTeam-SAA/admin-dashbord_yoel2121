"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Grid2X2,
  Images,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { href: "/users", label: "Customers", icon: Users },
  { href: "/tradespeople", label: "Tradespeople", icon: Users },
  { href: "/category", label: "Categories", icon: WalletCards },
  { href: "/carousels", label: "Carousels", icon: Images },
  { href: "/terms-of-service", label: "Terms of Service", icon: FileText },
  { href: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function keepFocusInside(event: ReactKeyboardEvent<HTMLElement>) {
  if (event.key !== "Tab") return;

  const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
  const first = focusable[0];
  const last = focusable.at(-1);

  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [search, setSearch] = useState("");
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const desktopLogoutButtonRef = useRef<HTMLButtonElement>(null);
  const logoutCancelRef = useRef<HTMLButtonElement>(null);
  const user = session?.user;
  const name = user?.name?.trim() || "Admin";
  const avatar = user?.profileImage?.url;

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      void signOut({ callbackUrl: "/login" });
    }
  }, [session?.error]);

  const activeHref = useMemo(
    () => nav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href,
    [pathname],
  );

  useEffect(() => {
    if (!open && !logoutOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      if (logoutOpen) {
        setLogoutOpen(false);
        window.requestAnimationFrame(() => {
          const desktopTrigger = desktopLogoutButtonRef.current;
          if (desktopTrigger && desktopTrigger.offsetParent !== null) desktopTrigger.focus();
          else menuButtonRef.current?.focus();
        });
      } else if (open) {
        setOpen(false);
        window.requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    }

    document.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [logoutOpen, open]);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function closeDrawerOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }

    desktopQuery.addEventListener("change", closeDrawerOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeDrawerOnDesktop);
  }, []);

  useEffect(() => {
    if (logoutOpen) {
      const frame = window.requestAnimationFrame(() => logoutCancelRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }

    if (open) {
      const frame = window.requestAnimationFrame(() => drawerCloseRef.current?.focus());
      return () => window.cancelAnimationFrame(frame);
    }
  }, [logoutOpen, open]);

  function closeMenu() {
    setOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  function openLogout() {
    setOpen(false);
    setLogoutOpen(true);
  }

  function closeLogout() {
    setLogoutOpen(false);
    window.requestAnimationFrame(() => {
      const desktopTrigger = desktopLogoutButtonRef.current;
      if (desktopTrigger && desktopTrigger.offsetParent !== null) desktopTrigger.focus();
      else menuButtonRef.current?.focus();
    });
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    const query = search.trim();
    if (query) {
      router.push(`${pathname.split("/")[1] === "tradespeople" ? "/tradespeople" : "/users"}?q=${encodeURIComponent(query)}`);
    }
  }

  async function confirmLogout() {
    setLogoutPending(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } finally {
      setLogoutPending(false);
    }
  }

  function renderSidebar(mobile = false) {
    return (
      <aside className="sidebar-gradient flex h-full w-full flex-col overflow-y-auto px-5 pb-7 pt-8 text-white">
        <div className="mb-7 flex justify-center">
          <Link
            href="/dashboard"
            onClick={() => mobile && setOpen(false)}
            className="rounded-2xl bg-white/95 p-1.5 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a2444]"
            aria-label="Go to Zentrofix dashboard"
          >
            <Image
              src="/zentrofix-logo.png"
              alt=""
              width={176}
              height={176}
              priority
              className="h-[124px] w-[124px] object-contain"
            />
          </Link>
        </div>
        <nav className="flex flex-col gap-2" aria-label="Admin navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => mobile && setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg px-3.5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2444]",
                  active
                    ? "bg-white font-bold text-[#0b3157] shadow-md"
                    : "text-[#f2f7fb] hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <button
            ref={mobile ? undefined : desktopLogoutButtonRef}
            type="button"
            onClick={openLogout}
            className="mt-2 flex min-h-12 items-center gap-3 rounded-lg px-3.5 text-left text-[15px] font-medium text-[#f2f7fb] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2444]"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Log out
          </button>
        </nav>
      </aside>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <a href="#admin-main" className="skip-link">
        Skip to dashboard content
      </a>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-[288px]">
        {renderSidebar()}
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation menu">
          <button
            type="button"
            className="absolute inset-0 bg-[#061426]/65 backdrop-blur-[2px]"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />
          <div
            id="mobile-admin-navigation"
            className="relative h-full w-[min(86vw,288px)] shadow-2xl"
            onKeyDown={keepFocusInside}
          >
            {renderSidebar(true)}
            <Button
              ref={drawerCloseRef}
              type="button"
              size="icon"
              variant="ghost"
              className="absolute right-3 top-3 text-white hover:bg-white/10"
              onClick={closeMenu}
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#061426]/70 px-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            aria-describedby="logout-description"
            onKeyDown={keepFocusInside}
            className="w-full max-w-[430px] rounded-2xl border border-white/50 bg-white p-6 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#fde8eb] text-[#b31b2b]">
              <LogOut className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 id="logout-title" className="text-2xl font-bold text-[#0f1f33]">
              Log out of Zentrofix?
            </h2>
            <p id="logout-description" className="mt-3 text-base text-[#53657a]">
              You will need to sign in again to access the admin dashboard.
            </p>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button ref={logoutCancelRef} type="button" variant="outline" className="sm:w-[112px]" onClick={closeLogout}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="sm:w-[112px]"
                onClick={confirmLogout}
                disabled={logoutPending}
                aria-busy={logoutPending}
              >
                {logoutPending ? "Logging out…" : "Log out"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0 lg:ml-[288px]">
        <header className="topbar-gradient sticky top-0 z-20 flex h-[76px] items-center gap-3 px-3 sm:px-5 md:h-[88px] md:px-8">
          <Button
            ref={menuButtonRef}
            type="button"
            size="icon"
            variant="ghost"
            className="shrink-0 text-white hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-controls="mobile-admin-navigation"
            aria-expanded={open}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </Button>

          <form onSubmit={onSearch} role="search" className="flex h-11 min-w-0 max-w-[430px] flex-1 overflow-hidden rounded-lg bg-white shadow-sm">
            <label htmlFor="admin-search" className="sr-only">
              Search users or tradespeople
            </label>
            <Input
              id="admin-search"
              name="q"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people"
              autoComplete="off"
              className="h-full min-w-0 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <button
              type="submit"
              className="flex w-12 shrink-0 items-center justify-center bg-[#1769aa] text-white transition-colors hover:bg-[#0d4778] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8fd5ff] sm:w-14"
              aria-label="Submit search"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>

          <div className="ml-auto hidden shrink-0 items-center gap-3 text-white sm:flex">
            <Avatar name={name} src={avatar} size={42} />
            <span className="hidden max-w-[190px] truncate text-[15px] font-medium md:block">{name}</span>
          </div>
        </header>

        <main id="admin-main" tabIndex={-1} className="min-h-[calc(100dvh-76px)] bg-background px-4 py-6 sm:px-5 md:min-h-[calc(100dvh-88px)] md:px-8 md:py-9">
          {children}
        </main>
      </div>
    </div>
  );
}
