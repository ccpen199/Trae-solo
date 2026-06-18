import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, Clock, ChevronRight } from 'lucide-react'

const todos = [
  {
    id: '1',
    title: '养老待遇资格认证',
    status: 'urgent',
    desc: '剩余7天',
    action: '立即办理',
    icon: AlertCircle,
    color: 'text-danger',
    bg: 'bg-danger/10',
    borderColor: 'border-l-danger',
  },
  {
    id: '2',
    title: '医保个人账户划入',
    status: 'completed',
    desc: '已到账',
    action: '查看详情',
    icon: CheckCircle,
    color: 'text-success',
    bg: 'bg-success/10',
    borderColor: 'border-l-success',
  },
  {
    id: '3',
    title: '失业补贴申领审核中',
    status: 'processing',
    desc: '预计3个工作日',
    action: '查看进度',
    icon: Clock,
    color: 'text-warning',
    bg: 'bg-warning/10',
    borderColor: 'border-l-warning',
  },
]

export default function TodoList() {
  const navigate = useNavigate()

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <h2 className="text-xl font-semibold text-gray-900">我的待办</h2>
        </div>
        <button
          onClick={() => navigate('/personal')}
          className="text-sm text-gray-400 hover:text-primary flex items-center gap-1"
        >
          更多
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {todos.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${item.borderColor}`}
            onClick={() => navigate('/personal')}
          >
            <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <item.icon size={20} className={item.color} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{item.title}</div>
              <div className="text-sm text-gray-500 mt-0.5">{item.desc}</div>
            </div>
            <span className={`text-sm font-medium ${item.color} flex items-center gap-1`}>
              {item.action}
              <ChevronRight size={14} />
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
