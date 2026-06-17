import { HTMLAttributes, ReactNode } from 'react'

type Color = 'blue' | 'green' | 'yellow' | 'red'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode
  color?: Color
  dot?: boolean
}

const colorClasses: Record<Color, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
}

export default function Badge({
  children,
  color = 'red',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  if (dot) {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${colorClasses[color]} ${className}`}
        {...props}
      />
    )
  }

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-5 h-5 px-1.5 rounded-full
        bg-red-500 text-white text-xs font-semibold
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
