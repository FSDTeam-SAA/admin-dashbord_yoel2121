import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#53b7f3] focus-visible:ring-offset-2 active:translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        default: "bg-primary text-white shadow-sm hover:bg-primary-dark",
        secondary: "bg-[#d7efff] text-[#0a3157] hover:bg-[#c1e3fb]",
        outline: "border border-[#246ba8] bg-white text-[#174f7f] hover:bg-[#edf6fc]",
        ghost: "bg-transparent text-current hover:bg-black/5",
        destructive: "bg-[#c51c2e] text-white shadow-sm hover:bg-[#a91525]",
        success: "bg-[#08783a] text-white shadow-sm hover:bg-[#05652f]",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-14 px-8 text-base",
        icon: "h-11 w-11 px-0",
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
