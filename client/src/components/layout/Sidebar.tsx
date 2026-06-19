import { cn } from "../../lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Edit3,
  CheckSquare,
  DollarSign,
  BarChart3,
  Settings,
  Users,
  FileText,
  Zap,
} from "lucide-react"
import { useAppStore } from "../../store/useAppStore"
import type { UserRole } from "../../types"

interface SidebarProps {
  className?: string
  activeTab: string
  onTabChange: (tab: string) => void
}

const roleNavItems: Record<UserRole, { id: string; label: string; icon: React.ReactNode }[]> = {
  publisher: [
    { id: "dashboard", label: "总览", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "tasks", label: "项目管理", icon: <FolderKanban className="w-5 h-5" /> },
    { id: "quality", label: "质量控制", icon: <CheckSquare className="w-5 h-5" /> },
    { id: "settlement", label: "结算中心", icon: <DollarSign className="w-5 h-5" /> },
    { id: "analytics", label: "数据分析", icon: <BarChart3 className="w-5 h-5" /> },
    { id: "annotators", label: "标注员管理", icon: <Users className="w-5 h-5" /> },
  ],
  annotator: [
    { id: "dashboard", label: "工作台", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "tasks", label: "任务大厅", icon: <FolderKanban className="w-5 h-5" /> },
    { id: "my-tasks", label: "我的任务", icon: <FileText className="w-5 h-5" /> },
    { id: "skills", label: "技能认证", icon: <Zap className="w-5 h-5" /> },
    { id: "settlement", label: "我的收入", icon: <DollarSign className="w-5 h-5" /> },
  ],
  reviewer: [
    { id: "dashboard", label: "审核台", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "review-tasks", label: "待审核", icon: <CheckSquare className="w-5 h-5" /> },
    { id: "disputes", label: "争议仲裁", icon: <FileText className="w-5 h-5" /> },
    { id: "analytics", label: "质检统计", icon: <BarChart3 className="w-5 h-5" /> },
  ],
  admin: [
    { id: "dashboard", label: "管理面板", icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "users", label: "用户管理", icon: <Users className="w-5 h-5" /> },
    { id: "tasks", label: "任务管理", icon: <FolderKanban className="w-5 h-5" /> },
    { id: "settings", label: "系统设置", icon: <Settings className="w-5 h-5" /> },
  ],
}

export function Sidebar({ className, activeTab, onTabChange }: SidebarProps) {
  const currentRole = useAppStore((state) => state.currentRole)
  const navItems = roleNavItems[currentRole] || roleNavItems.publisher

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-full border-r bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/30">
          A
        </div>
        <div>
          <h1 className="font-bold text-lg text-foreground">AI 标注平台</h1>
          <p className="text-xs text-muted-foreground">众包协作系统</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t">
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">效率提示</span>
          </div>
          <p className="text-xs text-muted-foreground">
            完成技能认证可解锁更多高价值任务
          </p>
        </div>
      </div>
    </aside>
  )
}
