"use client";

import { FormEvent, Suspense, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getApiMessage, resetPassword } from "@/lib/api";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  clearPasswordResetSession,
  passwordResetStorageKey,
  readPasswordResetSession,
} from "@/lib/password-reset";

const emptySubscribe = () => () => undefined;

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPanel title="Reset Password"><div className="h-[214px]" aria-hidden="true" /></AuthPanel>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const storedReset = useSyncExternalStore(
    emptySubscribe,
    () => window.sessionStorage.getItem(passwordResetStorageKey) || "",
    () => "",
  );
  const resetSession = useMemo(() => readPasswordResetSession(storedReset), [storedReset]);
  const otp = resetSession?.email === email ? resetSession.otp : "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const response = await resetPassword({ email, otp, password });
      clearPasswordResetSession();
      toast.success(response.message);
      router.push("/login");
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel title="Reset Password">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
        {!email || !otp ? (
          <div role="alert" className="rounded-xl border border-[#f0c7cc] bg-[#fff4f5] px-4 py-3 text-sm text-[#8b2430]">
            Your reset link is incomplete or expired. Request a new verification code to continue.
          </div>
        ) : null}
        <label htmlFor="new-password" className="block space-y-2">
          <span className="text-sm font-semibold text-[#263e57]">New password</span>
          <PasswordInput
            id="new-password"
            name="newPassword"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className="h-[52px]"
            leftIcon={<LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />}
            required
          />
        </label>
        <label htmlFor="confirm-password" className="block space-y-2">
          <span className="text-sm font-semibold text-[#263e57]">Confirm new password</span>
          <PasswordInput
            id="confirm-password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your new password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            className="h-[52px]"
            leftIcon={<LockKeyhole className="h-5 w-5 text-primary" aria-hidden="true" />}
            required
          />
        </label>
        <Button type="submit" disabled={loading || !email || !otp} aria-busy={loading} className="mt-2 h-[52px] text-base">
          {loading ? "Resetting..." : "Reset password"}
        </Button>
        <Link
          href="/forgot-password"
          onClick={clearPasswordResetSession}
          className="mx-auto inline-flex items-center gap-2 rounded text-sm font-semibold text-[#175b91] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Request a new code
        </Link>
      </form>
    </AuthPanel>
  );
}
