import { useNavigate } from 'react-router-dom';
import { Shield, Briefcase, GraduationCap, FileText, Bell, Clock, BarChart3, Users, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import StatCard from '@/components/StatCard';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Todo {
  id: number;
  title: string;
  deadline: string;
}

interface Notification {
  id: number;
  content: string;
  time: string;
}

const businessCards = [
  {
    path: '/social-security',
    label: '社保服务',
    desc: '参保查询、缴费记录、待遇申领',
    icon: Shield,
    accent: 'bg-primary-100 text-primary-700',
    border: 'border-primary-200',
  },
  {
    path: '/employment',
    label: '就业服务',
    desc: '失业登记、失业金申领、就业帮扶',
    icon: Briefcase,
    accent: 'bg-accent-100 text-accent-600',
    border: 'border-accent-200',
  },
  {
    path: '/talent',
    label: '人才服务',
    desc: '职称申报、人才认定、技能鉴定',
    icon: GraduationCap,
    accent: 'bg-success-100 text-success-600',
    border: 'border-success-200',
  },
  {
    path: '/labor',
    label: '劳动关系',
    desc: '合同签署、劳动维权、纠纷调解',
    icon: FileText,
    accent: 'bg-neutral-200 text-neutral-600',
    border: 'border-neutral-300',
  },
];

const monitorCards = [
  { path: '/monitor/dashboard', label: '效能总览', icon: BarChart3, value: '12,847', desc: '总办理量' },
  { path: '/monitor/timeout', label: '超时预警', icon: AlertTriangle, value: '23', desc: '待处理' },
  { path: '/monitor/rejection', label: '退回分析', icon: FileText, value: '8.3%', desc: '退回率' },
  { path: '/monitor/hotspot', label: '热点聚类', icon: Users, value: '156', desc: '热点问题' },
];

export default function Home() {
  const { user, mode, setMode } = useAppStore();
  const navigate = useNavigate();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    apiFetch<Todo[]>('/api/home/todos').catch(() => [
      { id: 1, title: '养老保险续缴待确认', deadline: '2026-06-20' },
      { id: 2, title: '失业金申领材料补交', deadline: '2026-06-25' },
    ]).then(setTodos);

    apiFetch<Notification[]>('/api/home/notifications').catch(() => [
      { id: 1, content: '您的社保缴费基数已调整', time: '10分钟前' },
      { id: 2, content: '失业金申领已审核通过', time: '1小时前' },
      { id: 3, content: '新政策：灵活就业人员社保补贴', time: '3小时前' },
    ]).then(setNotifications);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-800">
            欢迎回来，{user?.name}
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            {isAdmin ? '监管模式 · 效能监测与数据分析' : mode === 'personal' ? '个人模式 · 为您提供便捷的人社服务' : '企业模式 · 为企业提供一站式人社服务'}
          </p>
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg p-1">
            <button
              onClick={() => setMode('personal')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'personal'
                  ? 'bg-primary-700 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              个人
            </button>
            <button
              onClick={() => setMode('enterprise')}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'enterprise'
                  ? 'bg-accent-500 text-white'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              企业
            </button>
          </div>
        )}
      </div>

      {isAdmin ? (
        <div className="grid grid-cols-4 gap-4">
          {monitorCards.map((card) => (
            <div
              key={card.path}
              onClick={() => navigate(card.path)}
              className="bg-white border border-neutral-200 rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <card.icon className="w-5 h-5 text-primary-700" />
                <span className="text-sm text-neutral-600">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-neutral-800">{card.value}</div>
              <div className="text-xs text-neutral-400 mt-1">{card.desc}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {businessCards.map((card) => (
              <div
                key={card.path}
                onClick={() => navigate(card.path)}
                className={`bg-white border ${card.border} rounded-lg p-6 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all`}
              >
                <div className={`w-10 h-10 rounded-lg ${card.accent} flex items-center justify-center mb-4`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-neutral-800 mb-1">
                  {card.label}
                </h3>
                <p className="text-sm text-neutral-500">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-accent-500" />
                <h3 className="text-sm font-semibold text-neutral-700">待办提醒</h3>
              </div>
              <div className="space-y-3">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm text-neutral-600">{todo.title}</span>
                    <span className="text-xs text-neutral-400">{todo.deadline}</span>
                  </div>
                ))}
                {todos.length === 0 && (
                  <p className="text-sm text-neutral-400">暂无待办</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-semibold text-neutral-700">通知公告</h3>
              </div>
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2 py-2 border-b border-neutral-100 last:border-0"
                  >
                    <span className="text-sm text-neutral-600 flex-1">{n.content}</span>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
