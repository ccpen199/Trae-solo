import { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Info,
  Copy,
  Check,
  X,
  Clock,
  FileCheck,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
  Building2,
  Calendar,
  Hash,
} from 'lucide-react'
import type { Authorization } from '@/../shared/types'
import { mockAuthorizations } from '@/mock/data'
import { useStore } from '@/store'
import { formatDate } from '@/utils/helpers'
import Tag from '@/components/ui/Tag'

const scopeLabelMap: Record<string, { label: string; icon: React.ReactNode }> = {
  basic_info: { label: '基本信息', icon: <FileCheck className="h-3.5 w-3.5" /> },
  work_experience: { label: '工作经历核实', icon: <Building2 className="h-3.5 w-3.5" /> },
  certificates: { label: '证书验证', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  contact_info: { label: '联系方式', icon: <FileCheck className="h-3.5 w-3.5" /> },
  education: { label: '学历验证', icon: <GraduationCap className="h-3.5 w-3.5" /> },
  criminal: { label: '犯罪记录调查', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
}

function getScopeLabel(scope: string) {
  return scopeLabelMap[scope]?.label || scope
}

function getScopeIcon(scope: string) {
  return scopeLabelMap[scope]?.icon || <FileCheck className="h-3.5 w-3.5" />
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-600 transition-colors hover:bg-gray-200"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

function AuthorizationCard({
  authorization,
  isActive,
  onRevoke,
}: {
  authorization: Authorization
  isActive: boolean
  onRevoke?: () => void
}) {
  const expiresAt = new Date(authorization.grantedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  return (
    <div className={`glass rounded-2xl p-5 transition-shadow hover:shadow-lg ${!isActive ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400'}`}
          >
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{authorization.employerName}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>授权时间：{formatDate(authorization.grantedAt)}</span>
            </div>
          </div>
        </div>
        {isActive && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
            有效
          </span>
        )}
        {authorization.revokedAt && (
          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
            已撤销
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-gray-500">授权范围</p>
        <div className="flex flex-wrap gap-1.5">
          {authorization.scope.map((s) => (
            <div
              key={s}
              className="flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs text-primary"
            >
              {getScopeIcon(s)}
              {getScopeLabel(s)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-400" />
            <span className="font-mono text-xs text-gray-600">
              {truncateHash(authorization.blockchainHash)}
            </span>
          </div>
          <CopyButton text={authorization.blockchainHash} />
        </div>
      </div>

      {isActive && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3.5 w-3.5" />
          <span>有效期至：{formatDate(expiresAt.toISOString())}</span>
        </div>
      )}

      {authorization.revokedAt && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <X className="h-3.5 w-3.5 text-danger" />
          <span>撤销时间：{formatDate(authorization.revokedAt)}</span>
        </div>
      )}

      {isActive && onRevoke && (
        <button
          onClick={onRevoke}
          className="mt-4 w-full rounded-xl border border-danger py-2.5 text-sm font-medium text-danger transition-all hover:bg-danger/5 active:scale-[0.98]"
        >
          撤销授权
        </button>
      )}
    </div>
  )
}

export default function JobseekerAuthorization() {
  const { authorizations, setAuthorizations, revokeAuthorization } = useStore()

  useEffect(() => {
    setAuthorizations(mockAuthorizations.filter((auth) => auth.userId === 'user-002'))
  }, [setAuthorizations])

  const activeAuthorizations = authorizations.filter((auth) => !auth.revokedAt)
  const historyAuthorizations = authorizations.filter((auth) => auth.revokedAt)

  const handleRevoke = (id: string) => {
    revokeAuthorization(id)
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">背景调查授权管理</h1>
        </div>
        <p className="mt-1 text-sm text-gray-500">管理您的信息授权，保护个人隐私</p>
      </div>

      <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-5">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium text-gray-900">什么是授权链？</p>
            <p className="mt-1 text-sm text-gray-600">
              当您向企业投递简历后，企业可能需要对您的背景信息进行核实。您可以通过授权链管理，
              精确控制哪些企业可以查看您的哪些信息。所有授权操作均记录在区块链上，
              确保透明可追溯，保护您的信息安全。
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">有效授权</h2>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {activeAuthorizations.length} 项
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {activeAuthorizations.map((auth) => (
            <AuthorizationCard
              key={auth.id}
              authorization={auth}
              isActive
              onRevoke={() => handleRevoke(auth.id)}
            />
          ))}
        </div>

        {activeAuthorizations.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">暂无有效授权</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">授权历史</h2>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
            {historyAuthorizations.length} 项
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {historyAuthorizations.map((auth) => (
            <AuthorizationCard key={auth.id} authorization={auth} isActive={false} />
          ))}
        </div>

        {historyAuthorizations.length === 0 && (
          <div className="glass rounded-2xl p-8 text-center">
            <Clock className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">暂无授权历史记录</p>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">区块链透明度</h2>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          所有授权操作（授予、撤销）均会被记录在区块链上，形成不可篡改的审计轨迹，
          确保您的信息使用全程透明可追溯。
        </p>

        <div className="rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{authorizations.length}</p>
              <p className="text-xs text-gray-500">总授权记录</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{activeAuthorizations.length}</p>
              <p className="text-xs text-gray-500">有效授权</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{historyAuthorizations.length}</p>
              <p className="text-xs text-gray-500">已撤销</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-dashed border-gray-200 p-4">
          <div>
            <p className="text-sm font-medium text-gray-700">区块链浏览器</p>
            <p className="text-xs text-gray-500">在区块链上查看所有交易记录</p>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90">
            <ExternalLink className="h-4 w-4" />
            查看
          </button>
        </div>
      </div>
    </div>
  )
}
