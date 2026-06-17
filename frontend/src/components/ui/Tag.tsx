import { HTMLAttributes, ReactNode } from 'react'

type Color = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan' | 'gray' | 'orange'

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  color?: Color
  size?: 'sm' | 'md'
  outlined?: boolean
}

const colorClasses: Record<Color, { solid: string; outlined: string }> = {
  blue: {
    solid: 'bg-blue-100 text-blue-700 border-blue-200',
    outlined: 'bg-transparent text-blue-600 border-blue-300',
  },
  green: {
    solid: 'bg-green-100 text-green-700 border-green-200',
    outlined: 'bg-transparent text-green-600 border-green-300',
  },
  yellow: {
    solid: 'bg-amber-100 text-amber-700 border-amber-200',
    outlined: 'bg-transparent text-amber-600 border-amber-300',
  },
  red: {
    solid: 'bg-red-100 text-red-700 border-red-200',
    outlined: 'bg-transparent text-red-600 border-red-300',
  },
  purple: {
    solid: 'bg-purple-100 text-purple-700 border-purple-200',
    outlined: 'bg-transparent text-purple-600 border-purple-300',
  },
  cyan: {
    solid: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    outlined: 'bg-transparent text-cyan-600 border-cyan-300',
  },
  gray: {
    solid: 'bg-gray-100 text-gray-600 border-gray-200',
    outlined: 'bg-transparent text-gray-500 border-gray-300',
  },
  orange: {
    solid: 'bg-orange-100 text-orange-700 border-orange-200',
    outlined: 'bg-transparent text-orange-600 border-orange-300',
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export default function Tag({
  children,
  color = 'blue',
  size = 'sm',
  outlined = false,
  className = '',
  ...props
}: TagProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center font-medium rounded-md border
        ${sizeClasses[size]}
        ${outlined ? colorClasses[color].outlined : colorClasses[color].solid}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  )
}
