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
    <Suspense fallback={<AuthPanel title="Login To Your Account"><div className="h-[245px]" /></AuthPanel>}>
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
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Login failed", { description: result.error });
      return;
    }
    toast.success("Logged in successfully");
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <AuthPanel title="Login To Your Account">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[496px] flex-col gap-6">
        <label className="relative block">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-[53px] pl-12" required />
        </label>
        <div>
          <label className="block">
            <PasswordInput
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="h-[53px]"
              leftIcon={<LockKeyhole className="h-5 w-5 text-primary" />}
              required
            />
          </label>
          <Link href="/forgot-password" className="mt-3 block text-right text-sm text-primary">
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" disabled={loading} className="mt-4 h-[51px]">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthPanel>
  );
}
