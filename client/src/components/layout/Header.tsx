import { Bell, Search, Moon, Sun, ChevronDown } from "lucide-react"
import { useAppStore } from "../../store/useAppStore"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/Avatar"
import { Badge } from "../ui/Badge"
import type { UserRole } from "../../types"
import { cn } from "../../lib/utils"
import { useState } from "react"

const roleLabels: Record<UserRole, string> = {
  publisher: "发布方",
  annotator: "标注员",
  reviewer: "审核员",
  admin: "管理员",
}

const roleColors: Record<UserRole, string> = {
  publisher: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  annotator: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  reviewer: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
}

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const currentUser = useAppStore((state) => state.currentUser)
  const currentRole = useAppStore((state) => state.currentRole)
  const setCurrentRole = useAppStore((state) => state.setCurrentRole)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    document.documentElement.classList.toggle("dark", newMode)
  }

  const roles: UserRole[] = ["publisher", "annotator", "reviewer"]

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {title && <h2 className="text-xl font-semibold">{title}</h2>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索任务、标注员..."
            className="w-64 h-9 pl-10 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              roleColors[currentRole]
            )}
          >
            {roleLabels[currentRole]}
            <ChevronDown className="w-3 h-3" />
          </button>

          {showRoleMenu && (
            <div className="absolute top-full right-0 mt-1 w-32 rounded-lg border bg-popover shadow-lg z-50 animate-fade-in">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    setCurrentRole(role)
                    setShowRoleMenu(false)
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-accent first:rounded-t-lg last:rounded-b-lg",
                    currentRole === role && "bg-accent/50 font-medium"
                  )}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-4 border-l">
          <Avatar className="w-9 h-9">
            <AvatarImage src={currentUser?.avatar} alt={currentUser?.name} />
            <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{currentUser?.name}</p>
            <p className="text-xs text-muted-foreground">Lv.{currentUser?.level}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
