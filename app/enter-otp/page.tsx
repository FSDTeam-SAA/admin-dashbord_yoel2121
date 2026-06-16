"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, KeyboardEvent, Suspense, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { forgotPassword, getApiMessage, verifyResetOtp } from "@/lib/api";
import { AuthPanel } from "@/components/dashboard/auth-panel";
import { Button } from "@/components/ui/button";

export default function EnterOtpPage() {
  return (
    <Suspense fallback={<AuthPanel title="Enter OTP"><div className="h-[220px]" /></AuthPanel>}>
      <EnterOtpContent />
    </Suspense>
  );
}

function EnterOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const initialOtp = (params.get("otp") || "").slice(0, 6);
  const [values, setValues] = useState<string[]>(() => Array.from({ length: 6 }, (_, index) => initialOtp[index] || ""));
  const [loading, setLoading] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const otp = useMemo(() => values.join(""), [values]);

  function update(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    setValues((current) => current.map((item, itemIndex) => (itemIndex === index ? digit : item)));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !values[index] && index > 0) inputs.current[index - 1]?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email) {
      toast.error("Email is missing");
      return;
    }
    if (otp.length !== 6 && otp.length !== 4) {
      toast.error("Enter the OTP code");
      return;
    }
    setLoading(true);
    try {
      const response = await verifyResetOtp({ email, otp });
      toast.success(response.message);
      router.push(`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
    } catch (error) {
      toast.error(getApiMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (!email) return toast.error("Email is missing");
    try {
      const response = await forgotPassword(email);
      toast.success(response.message);
    } catch (error) {
      toast.error(getApiMessage(error));
    }
  }

  return (
    <AuthPanel title="Enter OTP">
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-[570px] flex-col items-center">
        <div className="mb-7 flex w-full justify-center gap-7 max-sm:gap-3">
          {values.map((value, index) => (
            <input
              key={index}
              ref={(node) => {
                inputs.current[index] = node;
              }}
              value={value}
              onChange={(event) => update(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              inputMode="numeric"
              className="h-[70px] w-[70px] rounded-[6px] border border-black text-center text-[34px] font-bold outline-none focus:border-primary max-sm:h-12 max-sm:w-12 max-sm:text-xl"
              maxLength={1}
            />
          ))}
        </div>
        <p className="mb-6 text-center text-[22px] max-sm:text-base">
          Didn&apos;t Receive OTP?{" "}
          <button type="button" onClick={resend} className="text-primary">
            RESEND OTP
          </button>
        </p>
        <Button type="submit" disabled={loading} className="h-[51px] w-full max-w-[570px]">
          {loading ? "Verifying..." : "Verify"}
        </Button>
      </form>
    </AuthPanel>
  );
}
