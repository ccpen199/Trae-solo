import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 ease-out-expo focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
    
    const variants: Record<ButtonVariant, string> = {
      primary: "bg-gradient-primary text-white shadow-button hover:shadow-button-hover hover:-translate-y-0.5 focus:ring-rose-500/50",
      secondary: "bg-gradient-secondary text-white shadow-glow-secondary hover:shadow-glow-secondary hover:-translate-y-0.5 focus:ring-sapphire-500/50",
      outline: "border-2 border-rose-500 text-rose-500 bg-transparent hover:bg-rose-500 hover:text-white focus:ring-rose-500/30",
      ghost: "text-rose-400 bg-transparent hover:bg-rose-500/10 focus:ring-rose-500/20",
      danger: "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-red-500/50",
    }

    const sizes: Record<ButtonSize, string> = {
      sm: "text-sm px-3 py-1.5 gap-1.5",
      md: "text-base px-5 py-2.5 gap-2",
      lg: "text-lg px-7 py-3.5 gap-2.5",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {rightIcon}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
