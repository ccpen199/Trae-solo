import {
  Bell,
  Clock,
  Globe2,
  KeyRound,
  Mail,
  MonitorCog,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationItems = [
  { key: 'abnormal', label: '异常订单告警', enabled: true },
  { key: 'compensation', label: '赔付审批提醒', enabled: true },
  { key: 'rider', label: '骑手信用变动', enabled: false },
];

const auditRules = [
  { label: '登录保护', value: '双因子校验已启用', icon: ShieldCheck, status: '正常' },
  { label: 'API 密钥轮换', value: '每 90 天自动提醒', icon: KeyRound, status: '待复核' },
  { label: '操作日志留存', value: '365 天', icon: Clock, status: '正常' },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">个人设置</h1>
          <p className="mt-1 text-sm text-gray-400">管理后台偏好、通知和安全策略。</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-amber-accent-500 px-4 py-2 text-sm font-medium text-space-blue-950 hover:bg-amber-accent-400 transition-colors">
          <Save className="h-4 w-4" />
          保存设置
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-xl border border-space-blue-600 bg-space-blue-800 p-5 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <UserCog className="h-5 w-5 text-amber-accent-400" />
            <h2 className="text-lg font-semibold text-gray-100">账号偏好</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-gray-300">默认工作台</span>
              <select className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-accent-500/70">
                <option>仪表盘</option>
                <option>异常订单</option>
                <option>骑手管理</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-gray-300">语言区域</span>
              <div className="relative">
                <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value="简体中文 / 上海"
                  readOnly
                  className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 py-2 pl-9 pr-3 text-sm text-gray-100 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-gray-300">联系邮箱</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  value="ops-admin@example.com"
                  readOnly
                  className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 py-2 pl-9 pr-3 text-sm text-gray-100 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-gray-300">界面密度</span>
              <select className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-amber-accent-500/70">
                <option>紧凑</option>
                <option>标准</option>
                <option>宽松</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-space-blue-600 bg-space-blue-800 p-5 shadow-card">
          <div className="mb-5 flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-accent-400" />
            <h2 className="text-lg font-semibold text-gray-100">通知订阅</h2>
          </div>
          <div className="space-y-3">
            {notificationItems.map((item) => (
              <div key=*** className="flex items-center justify-between rounded-lg border border-space-blue-600 bg-space-blue-900/70 px-3 py-3">
                <span className="text-sm text-gray-200">{item.label}</span>
                <span
                  className={cn(
                    'inline-flex h-6 w-11 items-center rounded-full p-0.5 transition-colors',
                    item.enabled ? 'bg-success-500/80' : 'bg-space-blue-600'
                  )}
                >
                  <span
                    className={cn(
                      'h-5 w-5 rounded-full bg-white transition-transform',
                      item.enabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-space-blue-600 bg-space-blue-800 p-5 shadow-card">
        <div className="mb-5 flex items-center gap-2">
          <MonitorCog className="h-5 w-5 text-amber-accent-400" />
          <h2 className="text-lg font-semibold text-gray-100">安全与审计</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {auditRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div key=*** className="rounded-lg border border-space-blue-600 bg-space-blue-900/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Icon className="h-5 w-5 text-info-400" />
                  <span className="rounded-full border border-space-blue-500 px-2 py-0.5 text-xs text-gray-300">{rule.status}</span>
                </div>
                <div className="text-sm font-medium text-gray-100">{rule.label}</div>
                <div className="mt-2 text-sm text-gray-400">{rule.value}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-space-blue-600 bg-space-blue-800 p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-amber-accent-400" />
          <h2 className="text-lg font-semibold text-gray-100">运营阈值</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ['异常订单提醒阈值', '5 分钟'],
            ['骑手熔断观察期', '24 小时'],
            ['赔付自动审批上限', '¥50'],
          ].map(([label, value]) => (
            <label key=*** className="space-y-2">
              <span className="text-sm text-gray-300">{label}</span>
              <input
                value={value}
                readOnly
                className="w-full rounded-lg border border-space-blue-600 bg-space-blue-900 px-3 py-2 text-sm text-gray-100 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
