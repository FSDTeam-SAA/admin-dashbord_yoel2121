import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[6px] border border-[#c9c9c9] bg-white px-4 text-sm outline-none transition focus:border-[#2fa7f0] disabled:bg-[#f7f7f7]",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
