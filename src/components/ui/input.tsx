
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-primary-gradient-start to-primary-gradient-end rounded-lg blur opacity-0 group-focus-within:opacity-75 transition duration-200"></div>
        <input
          type={type}
          className={cn(
            "relative flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-base text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
