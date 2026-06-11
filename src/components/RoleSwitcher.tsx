import { Building2, User } from 'lucide-react'
import { useStore } from '@/store'

export default function RoleSwitcher() {
  const { currentRole, switchRole } = useStore()
  const isHr = currentRole === 'hr'

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="inline-flex items-center rounded-full bg-navy-700 p-1">
        <button
          onClick={() => switchRole('seeker')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            !isHr
              ? 'bg-navy-500 text-white shadow-md'
              : 'text-navy-300 hover:text-white'
          }`}
        >
          <User className="h-4 w-4" />
          求职者
        </button>
        <button
          onClick={() => switchRole('hr')}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
            isHr
              ? 'bg-amber-400 text-navy-700 shadow-md'
              : 'text-navy-300 hover:text-white'
          }`}
        >
          <Building2 className="h-4 w-4" />
          HR
        </button>
      </div>
      <span className="text-[11px] text-navy-400">
        切换身份将刷新页面视图
      </span>
    </div>
  )
}
