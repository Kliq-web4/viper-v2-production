import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-bg-4/90 dark:bg-bg-2/90 text-text-primary flex flex-col rounded-xl border border-accent/10 dark:border-accent/20 shadow-lg backdrop-blur-md supports-backdrop:backdrop-blur-md transition-all duration-200 hover:shadow-xl hover:border-accent/20 dark:hover:border-accent/30",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, variant, ...props }: React.ComponentProps<"div"> & { variant?: "minimal"}) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "flex items-start gap-2 py-5 px-5",
        className,
        variant !== "minimal" ? "py-5" : "py-2",
      )}
      {...props}
    />
  )
}

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-text-secondary", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6  py-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
