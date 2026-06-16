import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-none rounded-[6px] border border-[#c9c9c9] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#2fa7f0] disabled:bg-[#f7f7f7]",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
