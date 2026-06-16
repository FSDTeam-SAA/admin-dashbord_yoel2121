import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-[#286aaa]",
        secondary: "bg-[#bfeeff] text-black hover:bg-[#aee6fb]",
        outline: "border border-primary bg-white text-[#2fa7f0] hover:bg-[#eef9ff]",
        ghost: "bg-transparent hover:bg-black/5",
        destructive: "bg-[#d81218] text-white hover:bg-[#bd1015]",
        success: "bg-[#078b34] text-white hover:bg-[#067b2e]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-14 px-8 text-base",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
