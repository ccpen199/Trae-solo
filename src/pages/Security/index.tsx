import { ShieldCheck, Fingerprint, CreditCard, AlertTriangle, Shield, Monitor, Smartphone } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { mockAuditLogs } from '@/mock/data'

const deviceIcons = [Monitor, Smartphone, Monitor, Smartphone, Monitor]

export default function Security() {
  const user = useAppStore((s) => s.user)

  const loginLogs = mockAuditLogs
    .filter((log) => log.category === 'system')
    .slice(-5)
    .reverse()

  const hasFailed = loginLogs.some((log) => log.result === 'failure')
  const currentLevel = user?.authLevel ?? 1

  return (
    <div className="min-h-screen bg-surface-primary p-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">安全认证中心</h1>
        <p className="text-sm text-gray-500 mt-1">实名认证与账户安全管理</p>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-5">认证等级</h2>
        <div className="flex items-center gap-8">
          {[1, 2].map((level) => {
            const isActive = currentLevel >= level
            const labels = { 1: '基础认证', 2: '双因子认证' }
            const descs = {
              1: '实名信息核验，支持基础查询与业务办理',
              2: '生物识别+社保卡芯片，支持待遇申领与资金操作',
            }
            return (
              <div
                key={level}
                className={`flex-1 p-5 rounded-xl border-2 transition-all ${
                  isActive
                    ? 'border-gov-gold bg-gov-gold/5 shadow-md'
                    : 'border-gray-200 bg-gray-50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      isActive ? 'bg-gov-gold' : 'bg-gray-300'
                    }`}
                  >
                    {level}
                  </div>
                  <span className="font-semibold text-gov-blue">{labels[level]}</span>
                  {isActive && <ShieldCheck className="w-5 h-5 text-gov-gold ml-auto" />}
                </div>
                <p className="text-xs text-gray-500">{descs[level]}</p>
                {isActive && level === 2 && (
                  <span className="inline-block mt-2 text-xs font-medium text-gov-gold bg-gov-gold/10 px-2 py-0.5 rounded">
                    已认证
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="gov-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gov-blue/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-gov-blue" />
            </div>
            <div>
              <p className="font-semibold text-gov-blue">生物识别</p>
              <p className="text-xs text-gray-400">指纹/人脸</p>
            </div>
            <span className="ml-auto text-xs font-medium text-status-success bg-status-success/10 px-2 py-0.5 rounded">
              已绑定
            </span>
          </div>
          <p className="text-xs text-gray-500">上次使用：2025-06-08 09:15</p>
        </div>

        <div className="gov-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gov-gold/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-gov-gold" />
            </div>
            <div>
              <p className="font-semibold text-gov-blue">社保卡</p>
              <p className="text-xs text-gray-400">芯片读取</p>
            </div>
            <span className="ml-auto text-xs font-medium text-status-success bg-status-success/10 px-2 py-0.5 rounded">
              已绑定
            </span>
          </div>
          <p className="text-xs text-gray-500">芯片读取次数：23次</p>
        </div>
      </div>

      {hasFailed && (
        <div className="gov-card p-4 mb-6 flex items-center gap-3 border-l-4 border-status-danger bg-status-danger/5">
          <AlertTriangle className="w-5 h-5 text-status-danger shrink-0" />
          <p className="text-sm font-medium text-status-danger">检测到异常登录尝试，建议修改密码</p>
        </div>
      )}

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-4">近期登录记录</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">时间</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">IP地址</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">设备</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">结果</th>
            </tr>
          </thead>
          <tbody>
            {loginLogs.map((log, i) => {
              const DeviceIcon = deviceIcons[i % deviceIcons.length]
              return (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-surface-hover transition-colors">
                  <td className="py-3 px-4 text-gray-600">{log.timestamp}</td>
                  <td className="py-3 px-4 text-gray-600">{log.ip}</td>
                  <td className="py-3 px-4">
                    <DeviceIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                    <span className="text-gray-600">{i % 2 === 0 ? '桌面端' : '移动端'}</span>
                  </td>
                  <td className={`py-3 px-4 font-medium ${log.result === 'success' ? 'text-status-success' : 'text-status-danger'}`}>
                    {log.result === 'success' ? '成功' : '失败'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="gov-card p-6 mb-6">
        <h2 className="gov-section-title mb-4">安全建议</h2>
        <div className="space-y-3">
          {[
            '建议定期更换登录密码，确保密码强度为高',
            '开启双因子认证以提升账户安全等级',
            '如发现异常登录记录，请立即修改密码并联系客服',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-gov-gold shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button className="px-6 py-2.5 rounded-lg bg-gov-blue text-white font-medium text-sm hover:bg-gov-blue-dark transition-colors">
          修改密码
        </button>
        <button className="px-6 py-2.5 rounded-lg border-2 border-gov-blue text-gov-blue font-medium text-sm hover:bg-gov-blue/5 transition-colors">
          解绑设备
        </button>
      </div>
    </div>
  )
}
