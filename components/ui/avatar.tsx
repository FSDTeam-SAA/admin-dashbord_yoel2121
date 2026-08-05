"use client";

import { useState } from "react";
import { getInitials } from "@/lib/utils";

export function Avatar({ name, src, size = 42, alt = "" }: { name?: string; src?: string; size?: number; alt?: string }) {
  return src ? <AvatarImage key={src} name={name} src={src} size={size} alt={alt} /> : <AvatarFallback name={name} size={size} />;
}

function AvatarImage({ name, src, size, alt }: { name?: string; src: string; size: number; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <AvatarFallback name={name} size={size} />;

  return (
    // The API supplies user-managed Cloudinary URLs, so a native image avoids a brittle hostname allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full border-2 border-white/85 bg-[#dce8f2] object-cover shadow-sm"
      style={{ width: size, height: size }}
    />
  );
}

function AvatarFallback({ name, size }: { name?: string; size: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white/85 bg-[#f4bd3e] text-sm font-bold text-[#153a5b] shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
