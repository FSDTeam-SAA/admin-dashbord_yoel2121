import Image from "next/image";
import { ReactNode } from "react";

export function AuthPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-5 py-10">
      <section className="flex w-full max-w-[570px] flex-col items-center">
        <Image src="/workyapa-logo.png" alt="Workyapa" width={202} height={43} priority className="mb-[92px] h-auto w-[202px]" />
        <h1 className="mb-10 text-center text-[26px] font-bold leading-tight text-black">{title}</h1>
        <div className="w-full">{children}</div>
      </section>
    </main>
  );
}
