"use client";

import { FormEvent, useState } from "react";
import { Mail } from "lucide-react";
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
      const otp = response.data?.otp ? `&otp=${encodeURIComponent(String(response.data.otp))}` : "";
      router.push(`/enter-otp?email=${encodeURIComponent(email)}${otp}`);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPanel title="Forgot Password">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[496px] flex-col gap-6">
        <label className="relative block">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="h-[53px] pl-12" required />
        </label>
        <Button type="submit" disabled={loading} className="h-[51px]">
          {loading ? "Sending..." : "Send OTP"}
        </Button>
      </form>
    </AuthPanel>
  );
}
