"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type PasswordInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  leftIcon?: React.ReactNode;
};

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, leftIcon, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const Icon = visible ? EyeOff : Eye;

    return (
      <div className="relative">
        {leftIcon ? <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">{leftIcon}</div> : null}
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn(leftIcon ? "pl-12" : "", "pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[6px] text-[#555] transition hover:bg-black/5 hover:text-primary"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <Icon className="h-5 w-5" />
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
