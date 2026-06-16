"use client";

import { FormEvent, Suspense, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getApiMessage, resetPassword } from "@/lib/api";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthPanel title="Reset Password"><div className="h-[214px]" /></AuthPanel>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const otp = params.get("otp") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    setLoading(true);
    try {
      const response = await resetPassword({ email, otp, password });
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
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[570px] flex-col gap-6">
        <label className="block">
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New Password"
            className="h-[53px]"
            leftIcon={<LockKeyhole className="h-5 w-5 text-primary" />}
            required
          />
        </label>
        <label className="block">
          <PasswordInput
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm Password"
            className="h-[53px]"
            leftIcon={<LockKeyhole className="h-5 w-5 text-primary" />}
            required
          />
        </label>
        <Button type="submit" disabled={loading || !email || !otp} className="mt-4 h-[51px]">
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
    </AuthPanel>
  );
}
