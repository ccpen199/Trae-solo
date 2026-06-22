import { Loader2 } from 'lucide-react'

interface LoadingProps {
  text?: string
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Loader2 size={36} className="text-brand animate-spin" />
      <p className="mt-4 text-charcoal/50 text-sm">{text}</p>
    </div>
  )
}
