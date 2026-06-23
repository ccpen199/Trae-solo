import { useState } from 'react'
import {
  Home,
  Save,
  Shield,
  Database,
  Key,
  Bell,
  Users,
  FileKey,
  Mail,
  Globe,
  Lock,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { Section } from '../components/ui/Section'
import { Tag } from '../components/ui/Tag'
import { cn } from '../utils'

interface SettingTab {
  key: string
  label: string
  icon: typeof Shield
}

const tabs: SettingTab[] = [
  { key: 'general', label: '通用设置', icon: Globe },
  { key: 'security', label: '安全与权限', icon: Shield },
  { key: 'fund', label: '资金隔离配置', icon: Database },
  { key: 'api', label: 'API与凭证', icon: Key },
  { key: 'notify', label: '通知设置', icon: Bell },
]

export default function Settings() {
  const [active, setActive] = useState('general')

  return (
    <div className="space-y-6">
      <PageHeader
        title="系统设置"
        subtitle="平台全局配置、安全策略与资金隔离参数"
        breadcrumbs={[{ label: '工作台', icon: Home }, { label: '系统设置' }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="panel p-2 h-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active === tab.key
                    ? 'bg-primary-600/15 text-primary-400'
                    : 'text-logistics-muted hover:bg-logistics-border/40 hover:text-logistics-text'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="space-y-6">
          {active === 'general' && (
            <Section title="通用设置" subtitle="平台基础信息与运营参数">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="平台名称" value="运联智链 B2B 物流协同平台" />
                <Field label="平台备案号" value="京ICP备2024000000号-3" />
                <Field label="客服电话" value="400-888-0000" />
                <Field label="客服邮箱" value="support@yunlianzhilian.com" />
                <Field label="默认货币单位" value="人民币 (CNY)" />
                <Field label="时区" value="Asia/Shanghai (GMT+8)" />
              </div>
              <div className="mt-6 flex gap-2">
                <button className="btn-primary flex items-center gap-1.5">
                  <Save className="h-4 w-4" /> 保存设置
                </button>
                <button className="btn-ghost">重置</button>
              </div>
            </Section>
          )}

          {active === 'security' && (
            <Section title="安全与权限" subtitle="角色权限矩阵、登录策略与操作审计">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm font-medium text-logistics-text">角色权限概览</div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {[
                      { role: '货主企业', users: 128, perms: 24, color: 'text-blue-400 bg-blue-500/15' },
                      { role: '承运方', users: 356, perms: 28, color: 'text-cyan-400 bg-cyan-500/15' },
                      { role: '平台运营', users: 18, perms: 64, color: 'text-amber-400 bg-amber-500/15' },
                    ].map((r) => (
                      <div key={r.role} className="rounded-lg border border-logistics-border/60 bg-logistics-bg p-4">
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', r.color)}>
                            <Users className="h-4 w-4" />
                          </div>
                          <span className="font-medium text-logistics-text">{r.role}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-logistics-muted">
                          <span>账号数</span>
                          <span className="font-medium text-logistics-text">{r.users}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-logistics-muted">
                          <span>权限项</span>
                          <span className="font-medium text-logistics-text">{r.perms}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <Field label="登录失败锁定阈值" value="连续5次失败后锁定30分钟" />
                  <Field label="会话超时" value="30 分钟无操作自动登出" />
                  <Field label="双因素认证" value={<Tag variant="success">已启用（TOTP + 短信）</Tag>} />
                  <Field label="操作审计日志" value={<Tag variant="success">全量记录，留存2年</Tag>} />
                </div>
              </div>
            </Section>
          )}

          {active === 'fund' && (
            <Section
              title="资金隔离配置（零负债模型）"
              subtitle="严格遵循物流平台资金监管合规要求，平台账户与用户账户物理隔离"
            >
              <div className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  <span className="font-medium text-emerald-400">零负债模型运行中</span>
                  <Tag variant="success" className="ml-auto">合规</Tag>
                </div>
                <p className="mt-2 text-xs text-logistics-muted">
                  所有运费资金进入第三方监管账户（招商银行上海分行），仅在双方确认完成后按分账规则划转至承运方。
                  平台不得挪用用户资金，监管账户每季度由会计师事务所审计。
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="监管合作银行" value="招商银行上海分行" />
                <Field label="监管账户名" value="运联智链（用户资金监管专户）" />
                <Field label="分账确认模式" value="双方电子确认 + 平台复核" />
                <Field label="自动分账时间窗" value="T+1 工作日 10:00" />
                <Field label="争议资金冻结" value={<Tag variant="warning">自动冻结，仲裁完成后解冻</Tag>} />
                <Field label="审计留痕" value={<Tag variant="success">所有资金操作写入不可篡改日志</Tag>} />
              </div>
            </Section>
          )}

          {active === 'api' && (
            <Section title="API 与凭证" subtitle="对接 GPS、OCR、电子签章、支付、短信等外部服务">
              <div className="space-y-3">
                {[
                  { name: '交通部运政信息核验 API', status: '已启用', key: 'MOT****2025', env: '生产' },
                  { name: 'OCR 证件识别（百度智能云）', status: '已启用', key: 'BAIDU****OCR', env: '生产' },
                  { name: '电子签章服务（e签宝）', status: '已启用', key: 'ESIGN****2024', env: '生产' },
                  { name: '资金监管银行接口（招商银行）', status: '已启用', key: 'CMB****FUND', env: '生产' },
                  { name: '多源 GPS 融合服务', status: '已启用', key: 'GPS****FUSION', env: '生产' },
                  { name: '短信 / IM 通知通道', status: '已启用', key: 'SMS****ALERT', env: '生产' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center gap-4 rounded-lg border border-logistics-border/60 bg-logistics-bg p-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/15 text-primary-400">
                      <FileKey className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-logistics-text">{s.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-logistics-muted">
                        <Mail className="h-3 w-3" />
                        <span className="font-mono">{s.key}</span>
                        <span>·</span>
                        <span>环境：{s.env}</span>
                      </div>
                    </div>
                    <Tag variant="success">{s.status}</Tag>
                    <button className="btn-ghost">重置密钥</button>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {active === 'notify' && (
            <Section title="通知设置" subtitle="告警、审核、结算等关键节点的通知渠道">
              <div className="space-y-3">
                {[
                  { label: '异常停留告警', desc: '车辆异常停留超过阈值', channels: ['站内信', '短信', '邮件'] },
                  { label: '新订单发布提醒', desc: '承运方收到可抢单订单', channels: ['站内信', 'App推送'] },
                  { label: '资质审核结果', desc: '企业提交资质的审核反馈', channels: ['站内信', '邮件'] },
                  { label: '月度对账生成', desc: '每月 1 号生成对账单', channels: ['站内信', '邮件'] },
                  { label: '纠纷仲裁进展', desc: '争议案件状态变更', channels: ['站内信', '短信'] },
                  { label: '资金到账通知', desc: '运费完成分账划转', channels: ['站内信', '短信'] },
                ].map((n) => (
                  <div key={n.label} className="flex items-center gap-4 rounded-lg border border-logistics-border/60 bg-logistics-bg p-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-logistics-text">{n.label}</div>
                      <div className="mt-0.5 text-xs text-logistics-muted">{n.desc}</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {n.channels.map((c) => (
                        <Tag key={c}>{c}</Tag>
                      ))}
                    </div>
                    <Lock className="h-4 w-4 text-logistics-muted" />
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-logistics-muted">{label}</label>
      <div className="mt-1.5 min-h-[36px] rounded-lg border border-logistics-border bg-logistics-bg px-3 py-2 text-sm text-logistics-text">
        {value}
      </div>
    </div>
  )
}
