import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-accent/20 bg-gradient-to-b from-accent/90 to-accent text-white [a&]:hover:shadow-md [a&]:hover:scale-105",
        secondary:
          "border-border-primary bg-bg-2/80 backdrop-blur-sm text-text-secondary [a&]:hover:bg-bg-2 [a&]:hover:shadow-md",
        destructive:
          "border-destructive/20 bg-gradient-to-b from-destructive/90 to-destructive text-white [a&]:hover:shadow-md [a&]:hover:scale-105 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-accent/30 bg-bg-3/50 dark:bg-bg-2/50 backdrop-blur-sm text-text-primary [a&]:hover:bg-accent/10 [a&]:hover:border-accent/50 [a&]:hover:text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
