import { Building2, Coffee, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectCoverProps {
  name: string
  brand?: string
  industry?: string
  className?: string
}

const palettes = [
  'from-emerald-500 via-teal-500 to-sky-500',
  'from-rose-500 via-orange-400 to-amber-400',
  'from-blue-600 via-indigo-500 to-cyan-500',
  'from-lime-500 via-emerald-500 to-green-600',
]

function paletteFor(text: string) {
  const index = Array.from(text || 'project').reduce((sum, char) => sum + char.charCodeAt(0), 0) % palettes.length
  return palettes[index]
}

export default function ProjectCover({ name, brand, industry, className }: ProjectCoverProps) {
  const Icon = industry?.includes('餐') || industry?.includes('饮') ? Coffee : Store

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-gradient-to-br', paletteFor(name), className)}>
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full border-[18px] border-white" />
        <div className="absolute -right-10 bottom-4 h-40 w-40 rounded-full border-[20px] border-white" />
        <div className="absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2 rotate-45 border-[14px] border-white" />
      </div>
      <div className="absolute inset-0 bg-black/10" />
      <div className="relative flex h-full flex-col justify-between p-5 text-white">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-xs backdrop-blur">
            <Building2 size={12} />
            {brand || '优选品牌'}
          </span>
          <Icon size={28} className="opacity-90" />
        </div>
        <div>
          <p className="text-xs opacity-80">{industry || '招商项目'}</p>
          <h3 className="mt-1 line-clamp-2 text-xl font-semibold leading-tight">{name}</h3>
        </div>
      </div>
    </div>
  )
}
