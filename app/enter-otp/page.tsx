"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ClipboardEvent, FormEvent, KeyboardEvent, Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { forgotPassword, getApiMessage, verifyResetOtp } from "@/lib/api";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";
import { savePasswordResetSession } from "@/lib/password-reset";

const OTP_LENGTH = 4;

export default function EnterOtpPage() {
  return (
    <Suspense fallback={<AuthPanel title="Enter OTP"><div className="h-[220px]" aria-hidden="true" /></AuthPanel>}>
      <EnterOtpContent />
    </Suspense>
  );
}

function EnterOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const [values, setValues] = useState<string[]>(() => Array.from({ length: OTP_LENGTH }, () => ""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = useMemo(() => values.join(""), [values]);

  function update(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setValues((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  }

  function onPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH - index);
    if (!digits) return;

    event.preventDefault();
    setValues((current) => {
      const next = [...current];
      digits.split("").forEach((digit, offset) => {
        next[index + offset] = digit;
      });
      return next;
    });
    window.requestAnimationFrame(() => inputs.current[Math.min(index + digits.length, OTP_LENGTH) - 1]?.focus());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      toast.error("Email is missing");
      return;
    }
    if (values.some((value) => !value)) {
      toast.error(`Enter the ${OTP_LENGTH}-digit verification code`);
      return;
    }
    setLoading(true);
    try {
      const response = await verifyResetOtp({ email, otp });
      toast.success(response.message);
      savePasswordResetSession({ email, otp });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return toast.error("Email is missing");
    setResending(true);
    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthPanel title="Enter OTP">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[460px] flex-col items-center">
        <p id="otp-help" className="-mt-2 mb-6 text-center text-sm leading-6 text-[#53657a]">
          Enter the {OTP_LENGTH}-digit code sent to {email ? <strong className="font-semibold text-[#263e57]">{email}</strong> : "your email"}.
        </p>
        <div className="mb-6 flex w-full justify-center gap-3 sm:gap-4" role="group" aria-label={`${OTP_LENGTH}-digit verification code`} aria-describedby="otp-help">
          {values.map((value, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={value}
              onChange={(event) => update(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              onPaste={(event) => onPaste(index, event)}
              aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
              inputMode="numeric"
              pattern="[0-9]*"
              className="h-12 w-12 rounded-xl border border-[#aebdcb] bg-white text-center text-2xl font-bold text-[#102b47] shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[#8dcdf4]/60 sm:h-16 sm:w-16 sm:text-[30px]"
              maxLength={1}
              required
            />
          ))}
        </div>
        <p className="mb-6 text-center text-sm text-[#53657a]">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={resend}
            disabled={resending}
            aria-busy={resending}
            className="rounded font-semibold text-[#175b91] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Sending..." : "Resend code"}
          </button>
        </p>
        <Button type="submit" disabled={loading || !email} aria-busy={loading} className="h-[52px] w-full text-base">
          {loading ? "Verifying..." : "Verify code"}
        </Button>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex items-center gap-2 rounded text-sm font-semibold text-[#175b91] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Use a different email
        </Link>
      </form>
    </AuthPanel>
  );
}
