import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom"
import {
  Shield,
  FileText,
  CreditCard,
  Car,
  MessageCircle,
  Lightbulb,
  User,
  LayoutDashboard,
  Menu,
  X,
  ChevronDown,
  Bell,
  Lock,
  Fingerprint,
  CheckCircle,
  Eye,
  EyeOff,
  ScrollText,
} from "lucide-react"
import { useAppStore } from "@/stores/useAppStore"

interface NavItem {
  path: string
  label: string
  icon: typeof Shield
  hash?: string
}

const citizenNav: NavItem[] = [
  { path: "/", label: "首页", icon: Shield },
  { path: "/service", label: "办事大厅", icon: FileText },
  { path: "/certificate", label: "电子证照", icon: CreditCard },
  { path: "/traffic", label: "交管服务", icon: Car },
  { path: "/consult", label: "智能咨询", icon: MessageCircle },
  { path: "/suggestion", label: "建言献策", icon: Lightbulb },
  { path: "/profile", label: "个人中心", icon: User },
]

const policeNav: NavItem[] = [
  { path: "/admin", label: "后台管理", icon: LayoutDashboard },
  { path: "/admin", label: "事项审核", icon: FileText, hash: "service-review" },
  { path: "/admin", label: "证照审核", icon: CreditCard, hash: "cert-review" },
  { path: "/admin", label: "舆情监控", icon: Bell, hash: "opinion" },
  { path: "/admin", label: "建言办理", icon: Lightbulb, hash: "suggestion-review" },
]

function PoliceVerifyModal({ onVerified, onCancel }: { onVerified: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<"password" | "face" | "success">("password")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [faceProgress, setFaceProgress] = useState(0)

  const handlePasswordSubmit = () => {
    if (password.length >= 1) {
      setStep("face")
    }
  }

  useEffect(() => {
    if (step === "face") {
      const interval = setInterval(() => {
        setFaceProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => setStep("success"), 500)
            return 100
          }
          return prev + 2
        })
      }, 40)
      return () => clearInterval(interval)
    }
  }, [step])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
        <div className="bg-primary-800 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gov-gold/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-gov-gold" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-semibold">民警身份验证</h3>
              <p className="text-xs text-primary-200">进入工作台前需完成身份核验</p>
            </div>
          </div>
        </div>

        {step === "password" && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 rounded-lg text-sm text-status-warning">
              <Lock className="w-4 h-4 shrink-0" />
              <span>请输入民警账号密码进行身份验证</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">警员编号</label>
              <input type="text" defaultValue="GZ202601008" className="input-field bg-gray-50" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1.5">登录密码 <span className="text-gov-red">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pr-10"
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-slate hover:text-primary">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="btn-secondary flex-1">取消</button>
              <button onClick={handlePasswordSubmit} disabled={!password} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed">下一步</button>
            </div>
            <div className="border-t border-neutral-border pt-3">
              <div className="flex items-center gap-2 text-xs text-neutral-slate">
                <ScrollText className="w-3.5 h-3.5" />
                <span>本次登录将被记录在操作审计日志中</span>
              </div>
            </div>
          </div>
        )}

        {step === "face" && (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-28 h-28 mx-auto rounded-full border-4 border-gov-blue flex items-center justify-center relative overflow-hidden">
              <Fingerprint className="w-14 h-14 text-gov-blue" />
              <div
                className="absolute inset-0 bg-gov-blue/10"
                style={{ height: `${faceProgress}%`, top: 0 }}
              />
            </div>
            <div>
              <p className="text-primary font-medium">人脸识别验证中</p>
              <p className="text-sm text-neutral-slate mt-1">请保持面部正对摄像头</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gov-blue rounded-full h-2 transition-all duration-100" style={{ width: `${faceProgress}%` }} />
            </div>
            <p className="text-sm text-gov-blue">{faceProgress}%</p>
          </div>
        )}

        {step === "success" && (
          <div className="px-6 py-8 text-center space-y-4">
            <div className="w-20 h-20 bg-status-success/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-status-success" />
            </div>
            <div>
              <p className="text-lg font-serif font-semibold text-primary">身份验证通过</p>
              <p className="text-sm text-neutral-slate mt-1">民警李明，欢迎进入工作台</p>
            </div>
            <div className="bg-primary-50 rounded-lg p-3 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-primary"><Lock className="w-3.5 h-3.5" /><span>验证方式：密码 + 人脸识别</span></div>
              <div className="flex items-center gap-2 text-primary"><ScrollText className="w-3.5 h-3.5" /><span>操作留痕：已记录登录时间和IP</span></div>
              <div className="flex items-center gap-2 text-primary"><Shield className="w-3.5 h-3.5" /><span>权限范围：事项审核/证照签发/建言办理/舆情监控</span></div>
            </div>
            <button onClick={onVerified} className="btn-primary w-full">进入工作台</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentRole, policeVerified, switchRole, verifyPolice, logoutPolice, notifications, clearNotifications, addAuditLog } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const nav = currentRole === "police" && policeVerified ? policeNav : citizenNav
  const unreadNotifs = notifications.filter((n) => !n.read).length
  const getNavTarget = (item: NavItem) => item.hash ? `${item.path}#${item.hash}` : item.path
  const isNavActive = (item: NavItem) => {
    if (location.pathname !== item.path) return false
    return item.hash ? location.hash === `#${item.hash}` : !location.hash
  }

  useEffect(() => {
    if (currentRole === "police" && policeVerified) {
      if (location.pathname !== "/admin" && location.pathname !== "/suggestion") {
        navigate("/admin")
      }
    }
    if (currentRole === "police" && !policeVerified && location.pathname === "/admin") {
      navigate("/")
    }
  }, [currentRole, policeVerified, navigate, location.pathname])

  const handleSwitchToPolice = () => {
    setRoleDropdownOpen(false)
    switchRole()
    setShowVerifyModal(true)
  }

  const handleVerified = () => {
    verifyPolice()
    addAuditLog("登录系统", "民警工作台")
    setShowVerifyModal(false)
    navigate("/admin")
  }

  const handleCancelVerify = () => {
    logoutPolice()
    setShowVerifyModal(false)
  }

  const handleSwitchToCitizen = () => {
    addAuditLog("退出系统", "民警工作台")
    logoutPolice()
    setRoleDropdownOpen(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {showVerifyModal && (
        <PoliceVerifyModal onVerified={handleVerified} onCancel={handleCancelVerify} />
      )}

      <header className="bg-primary-800 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-gov-red rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-serif font-semibold leading-tight">贵州公安</div>
                <div className="text-[10px] text-primary-200 leading-tight">
                  {currentRole === "citizen" ? "互联网+政务服务平台" : "民警工作台"}
                </div>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((item, idx) => {
                const isActive = isNavActive(item)
                const Icon = item.icon
                return (
                  <Link key={idx} to={getNavTarget(item)} className={isActive ? "nav-link-active flex items-center gap-1.5" : "nav-link flex items-center gap-1.5"}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              {currentRole === "citizen" && (
                <div className="relative">
                  <button onClick={() => setNotifDropdownOpen(!notifDropdownOpen)} className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadNotifs > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-gov-red text-white text-[10px] rounded-full flex items-center justify-center">
                        {unreadNotifs > 9 ? "9+" : unreadNotifs}
                      </span>
                    )}
                  </button>
                  {notifDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-neutral-border z-50 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-border">
                        <span className="text-sm font-medium text-primary">进度通知</span>
                        {notifications.length > 0 && (
                          <button onClick={clearNotifications} className="text-xs text-gov-blue hover:text-primary-600">全部已读</button>
                        )}
                      </div>
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-neutral-slate">暂无新通知</div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div key={n.id} className="px-4 py-3 border-b border-neutral-divider hover:bg-primary-50/50">
                            <div className="flex items-center gap-2">
                              {!n.read && <span className="w-1.5 h-1.5 bg-gov-red rounded-full shrink-0" />}
                              <span className="text-sm font-medium text-primary">{n.title}</span>
                            </div>
                            <p className="text-xs text-neutral-slate mt-0.5">{n.content}</p>
                            <p className="text-[10px] text-neutral-slate/60 mt-1">{n.time}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <button onClick={() => setRoleDropdownOpen(!roleDropdownOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors text-sm">
                  <div className={`w-2 h-2 rounded-full ${currentRole === "police" && policeVerified ? "bg-gov-gold" : currentRole === "police" ? "bg-status-warning animate-pulse" : "bg-status-success"}`} />
                  <span className="hidden sm:inline">
                    {currentRole === "police" ? (policeVerified ? "民警端 · 已验证" : "民警端 · 未验证") : "居民端"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-neutral-border py-1 z-50">
                    {currentRole === "citizen" ? (
                      <button onClick={handleSwitchToPolice} className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-primary-50 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gov-gold" />
                        <span>切换民警端</span>
                      </button>
                    ) : (
                      <>
                        {policeVerified ? (
                          <button onClick={handleSwitchToCitizen} className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-primary-50 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-status-success" />
                            <span>返回居民端</span>
                          </button>
                        ) : (
                          <button onClick={() => { setShowVerifyModal(true); setRoleDropdownOpen(false) }} className="w-full px-4 py-2.5 text-left text-sm text-gov-red hover:bg-red-50 flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            <span>完成身份验证</span>
                          </button>
                        )}
                        {policeVerified && (
                          <div className="px-4 py-2 border-t border-neutral-border">
                            <div className="flex items-center gap-2 text-xs text-neutral-slate">
                              <CheckCircle className="w-3.5 h-3.5 text-status-success" />
                              <span>身份已验证：民警李明</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-slate mt-1">
                              <ScrollText className="w-3.5 h-3.5 text-gov-blue" />
                              <span>操作留痕已启用</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {nav.map((item, idx) => {
                const isActive = isNavActive(item)
                const Icon = item.icon
                return (
                  <Link key={idx} to={getNavTarget(item)} onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm ${isActive ? "bg-white/15 text-white" : "text-primary-200 hover:bg-white/10 hover:text-white"}`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {currentRole === "police" && !policeVerified ? (
          <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-10 h-10 text-status-warning" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-primary">身份验证未完成</h3>
              <p className="text-sm text-neutral-slate mt-2">进入民警工作台前需完成身份核验，请点击右上角完成验证</p>
            </div>
            <button onClick={() => setShowVerifyModal(true)} className="btn-primary inline-flex items-center gap-2">
              <Shield className="w-4 h-4" />
              开始身份验证
            </button>
            <div className="border-t border-neutral-border pt-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-slate">
                <ScrollText className="w-3.5 h-3.5" />
                <span>所有民警端操作均记录审计日志</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-slate">
                <Fingerprint className="w-3.5 h-3.5" />
                <span>需通过密码验证 + 人脸识别双重认证</span>
              </div>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="bg-primary-800 text-primary-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-gov-red" />
                <span className="font-serif font-semibold text-white">贵州公安</span>
              </div>
              <p className="text-sm leading-relaxed">贵州省公安厅互联网+公安服务一体化平台，为您提供便捷、高效、安全的在线公安政务服务。</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">快捷服务</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Link to="/service" className="hover:text-white transition-colors">办事大厅</Link>
                <Link to="/certificate" className="hover:text-white transition-colors">电子证照</Link>
                <Link to="/traffic" className="hover:text-white transition-colors">交管服务</Link>
                <Link to="/consult" className="hover:text-white transition-colors">智能咨询</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-medium mb-3">联系我们</h4>
              <div className="text-sm space-y-1.5">
                <p>服务热线：0851-12345</p>
                <p>监督举报：0851-12389</p>
                <p>工作时间：周一至周五 9:00-17:00</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-6 text-center text-xs text-primary-300">
            <p>© 2026 贵州省公安厅 版权所有 | 黔ICP备XXXXXXXX号</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
