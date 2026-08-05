import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-lg border border-[#b9c7d6] bg-white px-4 text-base text-[#132a43] shadow-sm outline-none transition-[border-color,box-shadow,background-color] placeholder:text-[#66788b] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[#8dcdf4]/55 disabled:cursor-not-allowed disabled:bg-[#eef2f6] disabled:text-[#53657a] sm:text-sm",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
