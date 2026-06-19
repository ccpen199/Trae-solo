import type { ReactNode } from 'react'

interface Props {
  title: string
  description?: string
  icon?: ReactNode
}

export default function PlaceholderPage({ title, description, icon }: Props) {
  return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl text-slate-400 mb-6">
          {icon || '🚧'}
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        {description && (
          <p className="mt-3 text-slate-500 leading-relaxed">{description}</p>
        )}
        <p className="mt-6 text-sm text-slate-400">模块建设中，敬请期待...</p>
      </div>
    </div>
  )
}
