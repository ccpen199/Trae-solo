import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Home, Users, Building2, Package, Car,
  Wrench, GraduationCap, Heart, HeartHandshake,
  TrendingUp, MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORIES } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = {
  Briefcase, Home, Users, Building2, Package, Car,
  Wrench, GraduationCap, Heart, HeartHandshake,
  TrendingUp, MoreHorizontal,
}

export default function CategoryNav() {
  const navigate = useNavigate()

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3 animate-stagger">
      {CATEGORIES.map((cat) => {
        const Icon = ICON_MAP[cat.icon] || MoreHorizontal
        return (
          <button
            key={cat.key}
            onClick={() => navigate(`/list?category=${cat.key}`)}
            className={cn(
              'card flex flex-col items-center justify-center gap-2 p-4',
              'hover:scale-105 hover:shadow-lg transition-all duration-200 cursor-pointer',
              'border-2 border-transparent hover:border-current',
              'group'
            )}
            style={{
              ['--tw-border-opacity' as string]: '1',
              borderColor: 'transparent',
              ['--hover-color' as string]: cat.color,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = cat.color
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
              style={{ backgroundColor: `${cat.color}15` }}
            >
              <Icon
                className="w-6 h-6 transition-colors"
                style={{ color: cat.color }}
              />
            </div>
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
