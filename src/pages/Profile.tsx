import { Link } from 'react-router-dom'
import { UserCircle, ShieldCheck, FileText, Wallet, Bell, LogIn } from 'lucide-react'
import { useStore } from '@/store'

export default function Profile() {
  const { users, chargingOrders, settlementDetails, alertRecords } = useStore()
  const adminUser = users[0]
  const pendingAlerts = alertRecords.filter((item) => item.status === '待处理').length
  const completedOrders = chargingOrders.filter((item) => item.status === '已完成').length
  const settledAmount = settlementDetails.reduce((sum, item) => sum + item.operator_share, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-electric" />
          个人中心
        </h1>
        <span className="badge-success flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          已登录
        </span>
      </div>

      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-electric/20 text-electric flex items-center justify-center text-2xl font-bold">
            管
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">超级管理员</h2>
              <span className="badge-info">运营管理端</span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              账号 admin · 绑定用户 {adminUser?.nickname || '系统管理员'} · 权限：设备管理、订单结算、安全告警
            </p>
          </div>
          <Link to="/users" className="btn-ghost border border-surface-border flex items-center gap-1.5">
            <LogIn className="w-4 h-4" />
            账号设置
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '我的订单', value: chargingOrders.length, sub: `${completedOrders} 笔已完成`, icon: FileText, to: '/orders' },
          { label: '我的结算', value: `¥${settledAmount.toFixed(2)}`, sub: '运营方收益', icon: Wallet, to: '/settlement' },
          { label: '我的告警', value: pendingAlerts, sub: '待处理', icon: Bell, to: '/alerts' },
          { label: '我的信用', value: adminUser?.credit_score || 96, sub: adminUser?.status || '正常', icon: ShieldCheck, to: '/users' },
        ].map((item) => (
          <Link key={item.label} to={item.to} className="card hover:border-electric/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <item.icon className="w-5 h-5 text-electric" />
              <span className="text-xs text-slate-500">查看详情</span>
            </div>
            <div className="text-2xl font-semibold text-white font-mono">{item.value}</div>
            <div className="text-xs text-slate-400 mt-1">{item.label} · {item.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">登录与注册状态</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">认证方式</span>
              <span className="text-slate-200">本地演示登录 / 管理员账号</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">最近登录</span>
              <span className="text-slate-200">2026-06-10 09:20</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">会话状态</span>
              <span className="text-electric">在线</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-3">快捷提交入口</h3>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/orders" className="btn-primary text-center">提交订单复核</Link>
            <Link to="/devices" className="btn-ghost border border-surface-border text-center">查看设备详情</Link>
            <Link to="/billing" className="btn-ghost border border-surface-border text-center">调整计费规则</Link>
            <Link to="/alerts" className="btn-ghost border border-surface-border text-center">处理告警</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
