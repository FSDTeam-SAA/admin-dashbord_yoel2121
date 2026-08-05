import Image from "next/image";
import { ReactNode } from "react";

export function AuthPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-x-hidden bg-[#edf5fb] px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="absolute -left-28 -top-28 -z-10 h-80 w-80 rounded-full bg-[#77c8f4]/25 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-24 -z-10 h-96 w-96 rounded-full bg-[#1769aa]/18 blur-3xl" />
      <section
        aria-labelledby="auth-title"
        className="flex w-full max-w-[540px] flex-col items-center rounded-3xl border border-white/80 bg-white/95 px-5 py-7 shadow-[0_24px_70px_rgba(11,49,87,0.14)] backdrop-blur sm:px-9 sm:py-9"
      >
        <Image
          src="/zentrofix-logo.png"
          alt="Zentrofix"
          width={176}
          height={176}
          priority
          className="h-[132px] w-[132px] object-contain sm:h-[144px] sm:w-[144px]"
        />
        <h1 id="auth-title" className="mb-8 mt-2 text-center text-[26px] font-bold leading-tight tracking-[-0.02em] text-[#0f1f33] sm:text-[30px]">
          {title}
        </h1>
        <div className="w-full">{children}</div>
      </section>
    </main>
  );
}
