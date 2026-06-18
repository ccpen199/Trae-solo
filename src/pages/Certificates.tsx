import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  QrCode,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Shield,
  Eye,
  History,
  ChevronRight,
  Lock,
  Unlock,
  Users,
  Globe2,
  ShieldCheck,
  ShieldAlert,
  ScanLine,
  Fingerprint,
  Smartphone,
  Swords,
  UserCheck,
  FileKey,
  Info,
  Layers,
  Gauge,
  ArrowLeftRight,
  Building2,
  UserCircle,
  FileCheck,
  FileText,
} from "lucide-react";
import {
  certificateCategories,
  certificateCatalog,
  mockCertificates,
  mockUser,
} from "@/data/mockData";
import type { Certificate, CertificateStatus, CertCategory, AuthLevel } from "@/types";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  CertificateStatus,
  { text: string; icon: typeof CheckCircle2; className: string; badge: string }
> = {
  valid: {
    text: "有效",
    icon: CheckCircle2,
    className: "text-success-600 bg-success-50",
    badge: "badge-success",
  },
  expiring: {
    text: "即将过期",
    icon: Clock,
    className: "text-warning-600 bg-warning-50",
    badge: "badge-warning",
  },
  expired: {
    text: "已过期",
    icon: XCircle,
    className: "text-gray-500 bg-gray-100",
    badge: "badge-gray",
  },
  revoked: {
    text: "已吊销",
    icon: XCircle,
    className: "text-danger-600 bg-danger-50",
    badge: "badge-danger",
  },
};

const scopeStyle: Record<string, { label: string; icon: typeof Lock; color: string }> = {
  private: { label: "私有", icon: Lock, color: "text-rose-600 bg-rose-50 border-rose-200" },
  government: { label: "政务授权", icon: ShieldCheck, color: "text-gov-600 bg-gov-50 border-gov-200" },
  public: { label: "公开信息", icon: Globe2, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
};

const authIcon: Record<string, typeof Fingerprint> = {
  face: Fingerprint,
  sms: Smartphone,
  sso: ArrowLeftRight,
  password: FileKey,
};

type Tab = "mine" | "catalog";

export default function Certificates() {
  const user = useAppStore((s) => s.user) || mockUser;
  const [tab, setTab] = useState<Tab>("mine");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CertCategory["code"] | "all">("all");
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [selectedCatalog, setSelectedCatalog] = useState<
    (typeof certificateCatalog)[number] | null
  >(null);

  const totalCatalogCount = useMemo(
    () => certificateCategories.reduce((sum, c) => sum + c.count, 0),
    []
  );

  const stats = {
    total: mockCertificates.length,
    valid: mockCertificates.filter((c) => c.status === "valid").length,
    expiring: mockCertificates.filter((c) => c.status === "expiring").length,
    revoked: mockCertificates.filter((c) => c.status === "revoked").length,
    totalVerifications: mockCertificates.reduce(
      (sum, c) => sum + (c.verificationCount || 0),
      0
    ),
    delegated: mockCertificates.reduce((sum, c) => sum + (c.delegateCount || 0), 0),
  };

  const filteredCerts = mockCertificates.filter((c) => {
    const matchSearch =
      c.type.includes(searchText) ||
      c.certNo.includes(searchText) ||
      c.holderName.includes(searchText);
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchCategory = categoryFilter === "all" || c.categoryCode === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const filteredCatalog = certificateCatalog.filter((c) => {
    const matchSearch = c.typeName.includes(searchText);
    const matchCategory = categoryFilter === "all" || c.categoryCode === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gov-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">电子证照库</h1>
                <span className="badge-primary flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  407 类目录 · 全量接入
                </span>
                <span className="badge-success flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  公安库权威核验
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                集成407类电子证照 · 扫码亮证 · 在线核验 · 权限边界追溯 · 接入国密SM4加密
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gov-50 border border-gov-100">
                <div className="w-8 h-8 rounded-full bg-gov-100 flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-gov-700" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{user.realName}</div>
                  <div className="flex items-center gap-1 text-gov-700">
                    <Shield className="w-3 h-3" />
                    强认证 L{user.authLevel === "L1" ? "1" : user.authLevel === "L2" ? "2" : "3"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm inline-flex">
            <button
              onClick={() => setTab("mine")}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                tab === "mine"
                  ? "bg-gov-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <CreditCard className="w-4 h-4" />
              我的证照
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  tab === "mine" ? "bg-white/20" : "bg-gray-100 text-gray-500"
                )}
              >
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setTab("catalog")}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2",
                tab === "catalog"
                  ? "bg-gov-600 text-white shadow"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Layers className="w-4 h-4" />
              证照目录中心
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  tab === "catalog" ? "bg-white/20" : "bg-gray-100 text-gray-500"
                )}
              >
                {totalCatalogCount}
              </span>
            </button>
          </div>
        </div>

        {tab === "mine" && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <CreditCard className="w-3.5 h-3.5" /> 我的证照
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success-500" /> 有效证件
                </div>
                <div className="text-2xl font-bold text-success-600">{stats.valid}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Clock className="w-3.5 h-3.5 text-warning-500" /> 即将过期
                </div>
                <div className="text-2xl font-bold text-warning-600">{stats.expiring}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Gauge className="w-3.5 h-3.5 text-gov-500" /> 累计调用
                </div>
                <div className="text-2xl font-bold text-gov-700">
                  {stats.totalVerifications.toLocaleString()}
                </div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Users className="w-3.5 h-3.5 text-violet-500" /> 授权委托
                </div>
                <div className="text-2xl font-bold text-violet-600">{stats.delegated}</div>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-danger-500" /> 吊销/异常
                </div>
                <div className="text-2xl font-bold text-danger-600">{stats.revoked}</div>
              </div>
            </div>
          </>
        )}

        <div className="card p-4 mb-5">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={
                  tab === "mine"
                    ? "搜索我的证照名称、编号、持有人..."
                    : "搜索407类证照名称、办事场景..."
                }
                className="input pl-10"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  className="input w-auto"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(e.target.value as CertCategory["code"] | "all")
                  }
                >
                  <option value="all">全部分类</option>
                  {certificateCategories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}（{c.count}类）
                    </option>
                  ))}
                </select>
              </div>
              {tab === "mine" && (
                <select
                  className="input w-auto"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as CertificateStatus | "all")
                  }
                >
                  <option value="all">全部状态</option>
                  <option value="valid">有效</option>
                  <option value="expiring">即将过期</option>
                  <option value="expired">已过期</option>
                  <option value="revoked">已吊销</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {tab === "mine" ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5 mb-10">
              {filteredCerts.map((cert) => {
                const StatusIcon = statusConfig[cert.status].icon;
                const cat = certificateCategories.find((c) => c.code === cert.categoryCode);
                const scopeStyleConf = cert.permission
                  ? scopeStyle[cert.permission.scope]
                  : null;
                return (
                  <div
                    key={cert.id}
                    className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer group"
                    onClick={() => setSelectedCert(cert)}
                  >
                    <div
                      className={`bg-gradient-to-r ${cert.color} p-6 text-white relative`}
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {scopeStyleConf && (
                          <span
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${scopeStyleConf.color}`}
                          >
                            <scopeStyleConf.icon className="w-3 h-3" />
                            {scopeStyleConf.label}
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/20 backdrop-blur">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[cert.status].text}
                        </span>
                      </div>
                      <div className="flex items-start justify-between mb-4 mt-4">
                        <div>
                          <div className="text-lg font-semibold flex items-center gap-2">
                            {cert.type}
                            {cert.authLevel && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/15 backdrop-blur">
                                🔐 {cert.authLevel}
                              </span>
                            )}
                          </div>
                          <div className="text-xs opacity-75 mt-0.5 flex items-center gap-2">
                            <Building2 className="w-3 h-3" />
                            {cert.issueAuthority}
                            {cat && (
                              <>
                                <span>·</span>
                                <span>{cat.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Shield className="w-8 h-8 opacity-25" />
                      </div>
                      <div className="font-mono text-lg tracking-wider mb-3 opacity-95">
                        {cert.certNo}
                      </div>
                      <div className="text-sm opacity-85">持有人：{cert.holderName}</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="grid grid-cols-3 gap-3 mb-4 text-center text-xs">
                        <div className="bg-gray-50 rounded-lg py-2 px-1">
                          <div className="text-gray-400 mb-0.5">累计核验</div>
                          <div className="font-bold text-gov-700 text-base">
                            {(cert.verificationCount || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-2 px-1">
                          <div className="text-gray-400 mb-0.5">最近核验</div>
                          <div className="font-bold text-gray-800 text-[11px] leading-tight pt-0.5">
                            {cert.lastVerifiedAt?.slice(5, 16) || "—"}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg py-2 px-1">
                          <div className="text-gray-400 mb-0.5">授权委托</div>
                          <div className="font-bold text-violet-600 text-base">
                            {cert.delegateCount || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {cert.issueDate} 至 {cert.expireDate}
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            证照详情
                          </button>
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            扫码亮证
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="section-title !mb-0">
                  <div className="w-1 h-6 bg-violet-500 rounded-full" />
                  公安强认证 & 跨系统单点登录 · 身份安全总览
                </h2>
                <button className="btn-secondary text-xs flex items-center gap-1">
                  <History className="w-4 h-4" />
                  完整审计日志
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mb-5">
                <div className="rounded-xl border border-gov-100 bg-gov-50/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-lg bg-gov-600 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">公安人口库强认证</div>
                      <div className="text-xs text-gray-500">对接江苏省公安厅常住人口管理系统</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">认证等级</span>
                      <span className="badge-success flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> L3 实人级认证
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">人脸比对</span>
                      <span className="text-gray-900 font-medium">相似度 99.6%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">最后人脸核验</span>
                      <span className="text-gray-900">2024-06-18 08:22</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">加密算法</span>
                      <span className="font-mono text-gov-700">SM2+SM4 国密</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-lg bg-emerald-600 flex items-center justify-center">
                      <ArrowLeftRight className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">跨系统单点登录</div>
                      <div className="text-xs text-gray-500">CAS/OAuth 2.0 统一身份认证</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">本次登录方式</span>
                      <span className="badge-primary">密码 + 人脸</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">已接入系统</span>
                      <span className="text-gray-900 font-medium">江苏省政务网 · 苏服办 · 3 个委办局业务</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">SSO会话</span>
                      <span className="text-gray-900">已签发 2 个子系统令牌</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">会话有效期</span>
                      <span className="text-gray-900">剩余 03:18:42</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-lg bg-amber-500 flex items-center justify-center">
                      <History className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">访问审计 · 30 天</div>
                      <div className="text-xs text-gray-500">等保三级 · 全链路可追溯</div>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">总登录次数</span>
                      <span className="text-gray-900 font-medium">62 次</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">证照调用</span>
                      <span className="text-gray-900 font-medium">{stats.totalVerifications} 次</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">异常访问拦截</span>
                      <span className="badge-danger flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> 1 次
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">常用IP</span>
                      <span className="font-mono text-gray-900">114.221.*.*</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between border-b border-gray-200">
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-500" />
                    证照与认证审计明细
                  </div>
                  <div className="text-xs text-gray-500">最近 20 条 · 完整日志可导出</div>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50/70 text-gray-500">
                    <tr>
                      <th className="text-left px-4 py-2">时间</th>
                      <th className="text-left px-4 py-2">证照</th>
                      <th className="text-left px-4 py-2">核验方 / 部门</th>
                      <th className="text-left px-4 py-2">用途</th>
                      <th className="text-left px-4 py-2">认证方式</th>
                      <th className="text-left px-4 py-2">操作范围</th>
                      <th className="text-left px-4 py-2">IP地址</th>
                      <th className="text-left px-4 py-2">结果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockCertificates.flatMap((c) =>
                      c.usageHistory.slice(0, 3).map((h) => {
                        const AuthIcon = h.authMethod ? authIcon[h.authMethod] : UserCheck;
                        return (
                          <tr key={h.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-mono text-gray-500 whitespace-nowrap">
                              {h.time}
                            </td>
                            <td className="px-4 py-2">
                              <span className="badge-primary">{c.type}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="font-medium text-gray-900">{h.verifier}</div>
                              <div className="text-gray-500">{h.verifierDept}</div>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{h.purpose}</td>
                            <td className="px-4 py-2">
                              {AuthIcon ? (
                                <span className="inline-flex items-center gap-1 text-gray-700">
                                  <AuthIcon className="w-3.5 h-3.5" />
                                  {h.authMethod === "face"
                                    ? "人脸"
                                    : h.authMethod === "sms"
                                      ? "短信"
                                      : h.authMethod === "sso"
                                        ? "单点"
                                        : h.authMethod}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full border text-[11px]",
                                  h.scope === "verify"
                                    ? "border-gov-200 bg-gov-50 text-gov-700"
                                    : h.scope === "download"
                                      ? "border-violet-200 bg-violet-50 text-violet-700"
                                      : "border-gray-200 bg-gray-50 text-gray-700"
                                )}
                              >
                                {h.scope === "verify"
                                  ? "核验"
                                  : h.scope === "download"
                                    ? "下载"
                                    : "读取"}
                              </span>
                            </td>
                            <td className="px-4 py-2 font-mono text-gray-600">{h.ip || "—"}</td>
                            <td className="px-4 py-2">
                              {h.result === "success" ? (
                                <span className="badge-success inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> 成功
                                </span>
                              ) : h.result === "denied" ? (
                                <span className="badge-danger inline-flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" /> 拦截
                                </span>
                              ) : (
                                <span className="badge-danger inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> 失败
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gov-600" />
                  407 类电子证照分类目录
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  已全部接入市证照数据共享交换平台，数据权威来源：各签发单位
                </p>
              </div>
              <div className="text-xs text-gray-500">
                目录版本：V2024.05 · 最近更新：2024-05-20
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
              <aside className="lg:col-span-1 border-r border-gray-100 p-2 max-h-[700px] overflow-y-auto">
                {certificateCategories.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCategoryFilter(c.code)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg mb-1 transition",
                      categoryFilter === c.code
                        ? "bg-gov-50 border border-gov-200"
                        : "hover:bg-gray-50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">{c.name}</span>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          categoryFilter === c.code
                            ? "bg-gov-600 text-white"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {c.count}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="text-gray-400">需</span>
                      <span className="badge-primary">L{c.requiredAuthLevel === "L3" ? "3" : "2"}</span>
                      {c.canDelegate && <span className="text-violet-600">可授权</span>}
                    </div>
                  </button>
                ))}
              </aside>
              <div className="lg:col-span-3 p-4 max-h-[700px] overflow-y-auto">
                {filteredCatalog.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCatalog.map((c) => {
                      const owned = mockCertificates.find((x) => x.typeCode === c.typeCode);
                      const cat = certificateCategories.find((x) => x.code === c.categoryCode);
                      return (
                        <div
                          key={c.typeCode}
                          className="rounded-xl border border-gray-200 p-4 hover:border-gov-300 hover:shadow-sm transition cursor-pointer"
                          onClick={() => setSelectedCatalog(c)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-900">{c.typeName}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                代码：{c.typeCode}
                              </div>
                            </div>
                            {owned ? (
                              <span className="badge-success inline-flex items-center gap-1 shrink-0">
                                <UserCheck className="w-3 h-3" /> 已持有
                              </span>
                            ) : (
                              <span className="badge-gray inline-flex items-center gap-1 shrink-0">
                                <Unlock className="w-3 h-3" /> 未申请
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2 text-[11px]">
                            <span className="badge-primary">{cat?.name}</span>
                            <span className="text-gray-500 flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {c.issueAuthority.slice(0, 8)}
                              {c.issueAuthority.length > 8 && "…"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Shield className="w-3 h-3" /> L{cat?.requiredAuthLevel === "L3" ? "3" : "2"}+
                            </span>
                            <button
                              className={cn(
                                "text-xs font-medium flex items-center gap-1",
                                owned ? "text-gov-600 hover:text-gov-700" : "text-violet-600"
                              )}
                            >
                              {owned ? "查看证照" : "申请/关联"}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <Layers className="w-12 h-12 mx-auto mb-3" />
                    暂无匹配的证照类别
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedCert && (
        <CertificateDetailModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
      )}

      {selectedCatalog && (
        <CatalogApplyModal
          item={selectedCatalog}
          onClose={() => setSelectedCatalog(null)}
        />
      )}
    </div>
  );
}

function CatalogApplyModal({
  item,
  onClose,
}: {
  item: (typeof certificateCatalog)[number];
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const owned = mockCertificates.find((x) => x.typeCode === item.typeCode);
  const cat = certificateCategories.find((x) => x.code === item.categoryCode);
  const relatedServices = [
    { id: "srv_newapply", name: `${item.typeName}新办/首次申领`, dept: item.issueAuthority, hot: true },
    { id: "srv_renew", name: `${item.typeName}到期换领`, dept: item.issueAuthority },
    { id: "srv_change", name: `${item.typeName}信息变更`, dept: item.issueAuthority },
    { id: "srv_lost", name: `${item.typeName}遗失补办`, dept: item.issueAuthority },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-gov-500 to-gov-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
          >
            <XCircle className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-xl font-bold">{item.typeName}</h2>
                {owned ? (
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur px-2 py-0.5 rounded-full text-xs">
                    <UserCheck className="w-3 h-3" /> 已持有
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-warning-400/30 backdrop-blur px-2 py-0.5 rounded-full text-xs">
                    <Unlock className="w-3 h-3" /> 未申领
                  </span>
                )}
                <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-0.5 rounded-full text-xs">
                  <Shield className="w-3 h-3" /> L{cat?.requiredAuthLevel === "L3" ? "3实人" : "2实名"}+
                </span>
              </div>
              <p className="text-sm opacity-85 mb-1">
                代码：{item.typeCode} · {cat?.name}
              </p>
              <p className="text-xs opacity-75 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> 签发机关：{item.issueAuthority}
                <span className="mx-1.5 opacity-50">·</span>
                <Info className="w-3 h-3" /> 法定办结：{item.handlingTime || "5个工作日"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gov-50 border border-gov-100 p-3">
              <div className="text-xs text-gov-600 mb-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 认证要求
              </div>
              <div className="font-semibold text-gov-800 text-sm">
                {cat?.requiredAuthLevel === "L3"
                  ? "L3 公安人脸实人认证"
                  : "L2 身份证实名认证"}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <div className="text-xs text-emerald-600 mb-0.5 flex items-center gap-1">
                <ArrowLeftRight className="w-3.5 h-3.5" /> 权限等级
              </div>
              <div className="font-semibold text-emerald-800 text-sm">
                {item.permissionScope === "private"
                  ? "私有·本人可用"
                  : item.permissionScope === "government"
                    ? "政务·部门授权调用"
                    : "公开·社会核验"}
              </div>
            </div>
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-3">
              <div className="text-xs text-violet-600 mb-0.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> 委托代办
              </div>
              <div className="font-semibold text-violet-800 text-sm">
                {cat?.canDelegate ? "支持授权委托" : "仅限本人办理"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-gov-600" />
                可办理事项入口
                <span className="text-xs text-gray-400 font-normal">（点击跳转到申办流程）</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {relatedServices.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 hover:bg-gov-50/40 transition flex items-center justify-between cursor-pointer group"
                  onClick={() => {
                    onClose();
                    navigate("/services");
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gov-100 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-gov-600 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4 text-gov-700 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-gray-900 text-sm">{s.name}</span>
                        {s.hot && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-danger-100 text-danger-700 rounded">热门</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{s.dept}</p>
                    </div>
                  </div>
                  <button
                    className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      navigate("/services");
                    }}
                  >
                    立即申办
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            {owned && (
              <button className="btn-secondary flex-1 justify-center">
                <Eye className="w-4 h-4" /> 查看我的证照
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                navigate("/services");
              }}
              className="btn-primary flex-1 justify-center"
            >
              <FileCheck className="w-4 h-4" /> 进入服务大厅申办
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CertificateDetailModal({
  cert,
  onClose,
}: {
  cert: Certificate;
  onClose: () => void;
}) {
  const [showQR, setShowQR] = useState<"verify" | "show" | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const StatusIcon = statusConfig[cert.status].icon;

  const generateQR = async (mode: "verify" | "show") => {
    if (cert.permission?.requireConsent && !consentChecked) {
      alert("请先阅读并同意本次授权使用声明");
      return;
    }
    const QRCode = (await import("qrcode")).default;
    const data = JSON.stringify({
      certId: cert.id,
      typeCode: cert.typeCode,
      certNo: cert.certNo,
      holder: cert.holderName,
      mode,
      authLevel: cert.authLevel,
      timestamp: Date.now(),
      sign: "GOV_SM4_SIGNED_" + Math.random().toString(36).slice(2, 14).toUpperCase(),
    });
    const url = await QRCode.toDataURL(data, { width: 280, margin: 2 });
    setQrDataUrl(url);
    setShowQR(mode);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {showQR ? (
          <div className="p-8 text-center">
            <button
              onClick={() => setShowQR(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
            >
              <XCircle className="w-5 h-5 text-gray-500" />
            </button>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gov-500 to-gov-800 flex items-center justify-center mx-auto mb-4">
              {showQR === "verify" ? (
                <ScanLine className="w-8 h-8 text-white" />
              ) : (
                <QrCode className="w-8 h-8 text-white" />
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {showQR === "verify" ? "在线证照核验" : "证照亮证"}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {showQR === "verify"
                ? "请工作人员扫码核验证照真实有效性"
                : "请窗口工作人员扫描完成凭证关联"}
            </p>
            <div className="bg-white p-4 rounded-2xl shadow-lg inline-block mb-5 ring-4 ring-gov-100">
              {qrDataUrl && <img src={qrDataUrl} alt="证照二维码" className="w-64 h-64" />}
            </div>
            <div className="bg-gov-50 rounded-xl p-4 mb-5 text-left max-w-sm mx-auto border border-gov-100">
              <div className="text-sm text-gov-800 space-y-1">
                <div className="font-semibold text-gov-900">{cert.type}</div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">持有人</span>
                  <span className="font-medium">{cert.holderName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">证照编号</span>
                  <span className="font-mono text-xs">{cert.certNo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">签发机关</span>
                  <span className="text-xs">{cert.issueAuthority}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gov-200 mt-2">
                  <span className="opacity-75">授权模式</span>
                  <span className="badge-primary">{showQR === "verify" ? "一次性核验" : "出示凭证"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-75">有效期</span>
                  <span className="text-danger-600 font-medium text-xs">
                    {cert.permission?.expireHours || 2} 小时
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <Shield className="w-4 h-4" />
              二维码已国密签名 · 超时自动失效 · 全程留痕审计
            </div>
          </div>
        ) : (
          <>
            <div className={`bg-gradient-to-r ${cert.color} p-8 text-white relative`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 bg-white/20 backdrop-blur`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig[cert.status].text}
                </span>
                {cert.authLevel && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/15 backdrop-blur flex items-center gap-1">
                    <Shield className="w-3 h-3" /> L{cert.authLevel === "L1" ? "1" : cert.authLevel === "L2" ? "2" : "3"}认证
                  </span>
                )}
                {cert.permission && scopeStyle[cert.permission.scope] && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border ${scopeStyle[cert.permission.scope].color}`}
                  >
                    {scopeStyle[cert.permission.scope].label}
                  </span>
                )}
              </div>
              <div className="text-center mt-6">
                <Shield className="w-14 h-14 mx-auto mb-2 opacity-50" />
                <h2 className="text-2xl font-bold">{cert.type}</h2>
                <p className="opacity-80 mt-1">{cert.issueAuthority}</p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gov-500" />
                    证照信息
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-y-3 gap-x-4">
                    {Object.entries(cert.fields).map(([k, v]) => (
                      <div key={k}>
                        <div className="text-[11px] text-gray-500 mb-0.5">{k}</div>
                        <div className="text-sm font-medium text-gray-900 break-words">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gov-50 rounded-xl p-4 border border-gov-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gov-600" />
                      权限边界 & 授权范围
                    </h3>
                    {cert.permission ? (
                      <div className="space-y-2 text-xs text-gray-700">
                        <p className="leading-relaxed">{cert.permission.description}</p>
                        <div className="pt-2 border-t border-gov-200">
                          <div className="text-gray-500 mb-1">允许核验部门</div>
                          <div className="flex flex-wrap gap-1">
                            {cert.permission.allowedDepts.map((d) => (
                              <span key={d} className="badge-primary text-xs">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gov-200">
                          <span className="text-gray-500">需用户授权</span>
                          {cert.permission.requireConsent ? (
                            <span className="text-gov-700 font-medium">是 · 每次确认</span>
                          ) : (
                            <span className="text-gray-700">否 · 自动</span>
                          )}
                        </div>
                        {cert.permission.expireHours && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">亮证时效</span>
                            <span className="text-danger-600 font-medium">
                              {cert.permission.expireHours} 小时
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">暂无权限边界数据</p>
                    )}
                  </div>

                  <label className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                    />
                    <div className="text-xs text-amber-900 leading-relaxed">
                      <div className="font-semibold mb-0.5">📜 本次授权使用声明</div>
                      本人同意在「{cert.permission?.expireHours || 2}小时」有效期内，将本{cert.type}
                      摘要信息提供给核验方用于「政务事项/业务办理」核验，使用记录将同步至市数据局审计平台。
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-violet-500" />
                  使用记录（共 {cert.usageHistory.length} 条）
                </h3>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                  {cert.usageHistory.map((h) => {
                    const AuthIcon = h.authMethod ? authIcon[h.authMethod] : UserCheck;
                    return (
                      <div key={h.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            h.result === "denied"
                              ? "bg-danger-50 text-danger-600"
                              : h.result === "success"
                                ? "bg-gov-50 text-gov-600"
                                : "bg-danger-50 text-danger-600"
                          )}
                        >
                          {AuthIcon ? <AuthIcon className="w-4 h-4" /> : <History className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {h.purpose}
                            </span>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{h.time}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>
                              <span className="font-medium">{h.verifier}</span> · {h.verifierDept}
                            </span>
                            <span className="font-mono text-gray-400">{h.ip}</span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded-full border text-[10px]",
                                h.scope === "verify"
                                  ? "border-gov-200 bg-gov-50 text-gov-700"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                              )}
                            >
                              {h.scope}
                            </span>
                            {h.result === "success" ? (
                              <span className="badge-success text-[10px] inline-flex">成功</span>
                            ) : h.result === "denied" ? (
                              <span className="badge-danger text-[10px] inline-flex items-center gap-1">
                                <ShieldAlert className="w-2.5 h-2.5" /> 拦截
                              </span>
                            ) : (
                              <span className="badge-danger text-[10px]">失败</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-3">
                <button className="btn-secondary flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  下载PDF
                </button>
                <button className="btn-secondary flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  委托授权
                </button>
                <button
                  className="btn-secondary flex items-center justify-center gap-2"
                  onClick={() => generateQR("verify")}
                >
                  <ScanLine className="w-4 h-4" />
                  核验码
                </button>
                <button
                  className="btn-primary flex items-center justify-center gap-2"
                  onClick={() => generateQR("show")}
                >
                  <QrCode className="w-4 h-4" />
                  扫码亮证
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3" /> 证照数据来源：{cert.issueAuthority}
                </span>
                <span className="flex items-center gap-1">
                  <FileKey className="w-3 h-3" /> 国密SM4加密
                </span>
                <span className="flex items-center gap-1">
                  <Swords className="w-3 h-3" /> 等保三级
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
