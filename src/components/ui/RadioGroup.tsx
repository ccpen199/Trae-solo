import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-3", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  label?: React.ReactNode
  description?: string
  icon?: React.ReactNode
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, label, description, icon, id, ...props }, ref) => {
  const generatedId = React.useId()
  const itemId = id || generatedId

  return (
    <label htmlFor={itemId} className="cursor-pointer">
      <div
        className={cn(
          "group relative flex items-start gap-4 p-4 rounded-xl border-2 border-midnight-700",
          "bg-midnight-900/30 transition-all duration-300 ease-out-expo",
          "hover:border-rose-500/50 hover:bg-midnight-800/50",
          "has-[[data-state=checked]]:border-rose-500 has-[[data-state=checked]]:bg-rose-500/10",
          "has-[[data-state=checked]]:shadow-glow/30",
          className
        )}
      >
        <div className="shrink-0">
          <RadioGroupPrimitive.Item
            ref={ref}
            id={itemId}
            className={cn(
              "aspect-square h-5 w-5 rounded-full border-2 border-midnight-600",
              "bg-midnight-900/50 text-white",
              "focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-midnight-800",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-300 ease-out-expo",
              "data-[state=checked]:border-rose-500 data-[state=checked]:bg-gradient-primary"
            )}
            {...props}
          >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
              <Check className="h-3 w-3" strokeWidth={3} />
            </RadioGroupPrimitive.Indicator>
          </RadioGroupPrimitive.Item>
        </div>

        {icon && (
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-midnight-800 text-midnight-400",
              "transition-all duration-300 ease-out-expo",
              "group-has-[[data-state=checked]]:bg-gradient-primary group-has-[[data-state=checked]]:text-white",
              "group-hover:text-rose-400"
            )}
          >
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {label && (
            <div
              className={cn(
                "font-medium text-white transition-colors duration-300",
                "group-has-[[data-state=checked]]:text-rose-400"
              )}
            >
              {label}
            </div>
          )}
          {description && (
            <p className="text-sm text-midnight-400 mt-1">{description}</p>
          )}
        </div>
      </div>
    </label>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
