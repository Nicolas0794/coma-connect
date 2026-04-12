import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-[38px] w-full min-w-0 rounded-lg border border-input/60 bg-secondary px-3 py-2 text-sm text-foreground outline-none transition-all duration-150 placeholder:text-muted-foreground/60 hover:border-input focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
