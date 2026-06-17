import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hover?: boolean
}

export default function Card({
  children,
  padded = true,
  hover = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${padded ? 'p-4 sm:p-5' : ''}
        ${hover ? 'hover:shadow-md hover:border-gray-200 transition-all duration-200 cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
