import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium transition-colors duration-150 border",
  {
    variants: {
      variant: {
        default:
          "border-border bg-surface text-foreground",
        secondary:
          "border-border bg-surface-deep text-muted-foreground",
        accent:
          "border-primary/40 bg-primary/10 text-primary",
        cool:
          "border-cool/40 bg-cool/10 text-cool",
        ok:
          "border-ok/40 bg-ok/10 text-ok",
        warning:
          "border-warning/40 bg-warning/10 text-warning",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive",
        outline:
          "border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
