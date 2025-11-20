import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-purple-900/40 text-purple-50 flex flex-col rounded-lg border border-purple-800/60 shadow-xl shadow-purple-950/50 backdrop-blur-xl supports-backdrop:backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/30 hover:border-purple-700/80 hover:-translate-y-1",
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
    className={cn("font-mono font-light leading-none tracking-tight text-purple-50", className)}
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
    className={cn("text-sm font-mono text-purple-300", className)}
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
