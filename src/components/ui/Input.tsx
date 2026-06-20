import * as React from "react"
import { cn } from "@/lib/utils"

export type InputVariant = "default" | "filled" | "outline"
export type InputSize = "sm" | "md" | "lg"

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: InputVariant
  size?: InputSize
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  floatingLabel?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = "default", size = "md", label, error, leftIcon, rightIcon, floatingLabel = false, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const generatedId = React.useId()
    const inputId = id || generatedId

    const baseWrapperStyles = "relative w-full"

    const variants: Record<InputVariant, string> = {
      default: "bg-midnight-900/50 border-2 border-midnight-700 focus-within:border-rose-500",
      filled: "bg-midnight-700 border-2 border-transparent focus-within:border-rose-500",
      outline: "bg-transparent border-2 border-midnight-600 focus-within:border-rose-500",
    }

    const sizes: Record<InputSize, string> = {
      sm: "h-9 text-sm rounded-lg",
      md: "h-11 text-base rounded-xl",
      lg: "h-14 text-lg rounded-xl",
    }

    const inputPadding = {
      sm: leftIcon ? "pl-9 pr-3" : rightIcon ? "pl-3 pr-9" : "px-3",
      md: leftIcon ? "pl-11 pr-4" : rightIcon ? "pl-4 pr-11" : "px-4",
      lg: leftIcon ? "pl-14 pr-5" : rightIcon ? "pl-5 pr-14" : "px-5",
    }

    const floatingLabelPadding = floatingLabel ? {
      sm: "pt-5 pb-1",
      md: "pt-6 pb-2",
      lg: "pt-7 pb-3",
    }[size] : ""

    const iconSizes = {
      sm: "w-4 h-4 left-2.5",
      md: "w-5 h-5 left-3",
      lg: "w-5 h-5 left-4",
    }

    const rightIconSizes = {
      sm: "w-4 h-4 right-2.5",
      md: "w-5 h-5 right-3",
      lg: "w-5 h-5 right-4",
    }

    const hasValue = props.value !== undefined && props.value !== null && props.value !== ""

    return (
      <div className={cn(baseWrapperStyles, className)}>
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-midnight-200 mb-2"
          >
            {label}
          </label>
        )}
        <div
          className={cn(
            "flex items-center transition-all duration-300 ease-out-expo rounded-xl",
            variants[variant],
            sizes[size],
            error && "border-red-500 focus-within:border-red-500"
          )}
        >
          {leftIcon && (
            <span className={cn("absolute text-midnight-400 pointer-events-none", iconSizes[size])}>
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full bg-transparent text-white placeholder-midnight-500 focus:outline-none transition-all duration-300",
              inputPadding[size],
              floatingLabelPadding
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
          {floatingLabel && label && (
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-4 transition-all duration-300 ease-out-expo pointer-events-none",
                (isFocused || hasValue)
                  ? "top-2 text-xs text-rose-400"
                  : "top-1/2 -translate-y-1/2 text-midnight-400",
                size === "sm" && (isFocused || hasValue) ? "text-xs left-3 top-1.5" : "",
                size === "lg" && (isFocused || hasValue) ? "left-5 top-3" : ""
              )}
            >
              {label}
            </label>
          )}
          {rightIcon && (
            <span className={cn("absolute text-midnight-400 pointer-events-none", rightIconSizes[size])}>
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400 animate-fade-in">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
