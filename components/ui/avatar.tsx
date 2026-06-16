import { getInitials } from "@/lib/utils";

export function Avatar({ name, src, size = 42 }: { name?: string; src?: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || "Avatar"}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[#ffc94d] text-sm font-bold text-[#153a5b]"
      style={{ width: size, height: size }}
    >
      {getInitials(name)}
    </div>
  );
}
