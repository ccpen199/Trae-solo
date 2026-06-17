import { Shield } from 'lucide-react'

export default function InsuranceManage() {
  return (
    <div className="p-6 min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
          <Shield className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">保险理赔管理</h1>
        <p className="text-slate-400">调度端保险管理模块</p>
      </div>
    </div>
  )
}
