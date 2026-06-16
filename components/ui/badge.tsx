import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  approved: "bg-green-50 text-green-700 ring-green-200",
  pending: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  rejected: "bg-red-50 text-red-700 ring-red-200",
  suspended: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export function Badge({ children, tone, className }: { children: React.ReactNode; tone?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[6px] px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        styles[tone || ""] || "bg-blue-50 text-blue-700 ring-blue-200",
        className,
      )}
    >
      {children}
    </span>
  );
}
