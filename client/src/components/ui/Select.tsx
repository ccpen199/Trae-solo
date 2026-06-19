import * as React from "react"
import { cn } from "../../lib/utils"
import { Check } from "lucide-react"

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  children: React.ReactNode
  disabled?: boolean
}

const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  placeholder = "请选择",
  className,
  children,
  disabled,
}) => {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const currentValue = value ?? internalValue
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  const selectedLabel = React.Children.toArray(children)
    .filter(
      (child) =>
        React.isValidElement(child) && (child as React.ReactElement<any>).props.value === currentValue
    )
    .map((child) => (child as React.ReactElement<any>).props.children)[0]

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          open && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(!currentValue && "text-muted-foreground")}>
          {selectedLabel || placeholder}
        </span>
        <svg
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md scrollbar-thin animate-fade-in">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<any>, {
                  onSelect: handleSelect,
                  isSelected: currentValue === (child as React.ReactElement<any>).props.value,
                })
              : child
          )}
        </div>
      )}
    </div>
  )
}

interface SelectItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  value: string
  onSelect?: (value: string) => void
  isSelected?: boolean
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, onSelect, isSelected, children, ...props }, ref) => (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={() => onSelect?.(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent/50",
        className
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4" />}
    </div>
  )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectItem }
