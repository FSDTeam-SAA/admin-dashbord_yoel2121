"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { forgotPassword, getApiMessage } from "@/lib/api";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
      router.push(`/enter-otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel title="Forgot Password">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
        <p className="-mt-2 text-center text-sm leading-6 text-[#53657a]">
          Enter your admin email and we will send you a verification code.
        </p>
        <label htmlFor="forgot-email" className="block space-y-2">
          <span className="text-sm font-semibold text-[#263e57]">Email address</span>
          <span className="relative block">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" aria-hidden="true" />
            <Input
              id="forgot-email"
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
        <Button type="submit" disabled={loading} aria-busy={loading} className="h-[52px] text-base">
          {loading ? "Sending code..." : "Send verification code"}
        </Button>
        <Link
          href="/login"
          className="mx-auto inline-flex items-center gap-2 rounded text-sm font-semibold text-[#175b91] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </form>
    </AuthPanel>
  );
}
