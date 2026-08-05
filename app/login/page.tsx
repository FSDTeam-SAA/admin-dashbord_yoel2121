"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LockKeyhole, Mail } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { toast } from "sonner";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPanel title="Sign in to your account"><div className="h-[245px]" aria-hidden="true" /></AuthPanel>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function getCallbackUrl() {
    const callbackUrl = params.get("callbackUrl");
    if (!callbackUrl) return "/dashboard";

    try {
      const url = new URL(callbackUrl, window.location.origin);
      const isSameHost = url.hostname === window.location.hostname;
      const isLoginPage = url.pathname === "/login";

      if (!isSameHost || isLoginPage) return "/dashboard";
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/dashboard";
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const callbackUrl = getCallbackUrl();
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error("Login failed", { description: result.error });
        return;
      }
      toast.success("Logged in successfully");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      toast.error("Login failed", { description: "The authentication service is unavailable. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel title="Sign in to your account">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
        <label htmlFor="login-email" className="block space-y-2">
          <span className="text-sm font-semibold text-[#263e57]">Email address</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              className="h-[52px] pl-12"
              required
            />
          </span>
        </label>
        <div>
          <label htmlFor="login-password" className="block space-y-2">
            <span className="text-sm font-semibold text-[#263e57]">Password</span>
            <PasswordInput
              id="login-password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-[52px]"
              leftIcon={<LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />}
              required
            />
          </label>
          <Link
            href="/forgot-password"
            className="mt-3 block rounded text-right text-sm font-semibold text-[#175b91] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3]"
          >
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} aria-busy={loading} className="mt-3 h-[52px] text-base">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthPanel>
  );
}
