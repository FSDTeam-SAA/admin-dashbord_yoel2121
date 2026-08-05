import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-[#b9c7d6] bg-white px-4 py-3 text-base text-[#132a43] shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#66788b] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[#8dcdf4]/55 disabled:cursor-not-allowed disabled:resize-none disabled:bg-[#eef2f6] disabled:text-[#53657a] sm:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
