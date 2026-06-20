import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string
  description?: React.ReactNode
  error?: string
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, label, description, id, ...props }, ref) => {
  const generatedId = React.useId()
  const checkboxId = id || generatedId

  return (
    <div className="flex items-start gap-3">
      <CheckboxPrimitive.Root
        ref={ref}
        id={checkboxId}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-lg border-2 border-midnight-600 bg-midnight-900/50",
          "data-[state=checked]:bg-gradient-primary data-[state=checked]:border-rose-500",
          "focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "transition-all duration-300 ease-out-expo",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-white animate-scale-in")}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label
              htmlFor={checkboxId}
              className="text-sm font-medium text-midnight-100 cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            >
              {label}
            </label>
          )}
          {description && (
            <div className="text-xs text-midnight-400 mt-0.5">{description}</div>
          )}
        </div>
      )}
    </div>
  )
})
Checkbox.displayName = "Checkbox"

export { Checkbox }
