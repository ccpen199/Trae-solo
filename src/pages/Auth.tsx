import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LogIn, UserPlus, ShieldCheck, AlertTriangle, Gamepad2 } from "lucide-react"

type Mode = "login" | "register"

const quickAccounts = [
  { label: "运营管理员", username: "admin", password: "admin123" },
  { label: "买家账号", username: "buyer01", password: "buyer123" },
  { label: "卖家账号", username: "seller01", password: "seller123" },
]

export default function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(location.pathname.includes("register") ? "register" : "login")
  const [username, setUsername] = useState(mode === "login" ? "admin" : "")
  const [password, setPassword] = useState(mode === "login" ? "admin123" : "")
  const [displayName, setDisplayName] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage("")
    setLoading(true)
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      })
      const payload = await response.json()
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "认证失败")
      }
      localStorage.setItem("gamevault_token", payload.data.token)
      localStorage.setItem("gamevault_user", JSON.stringify(payload.data.user))
      setMessage(mode === "login" ? "登录成功，正在进入运营后台" : "注册成功，正在进入买卖市场")
      setTimeout(() => navigate(mode === "login" ? "/admin" : "/trade"), 400)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "认证失败")
    } finally {
      setLoading(false)
    }
  }

  const fillQuick = (account: (typeof quickAccounts)[number]) => {
    setMode("login")
    setUsername(account.username)
    setPassword(account.password)
    setDisplayName(account.label)
    setMessage("")
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="glass-panel p-8 flex flex-col justify-between min-h-[420px]">
          <div>
            <div className="w-14 h-14 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center mb-6">
              <Gamepad2 className="w-7 h-7 text-cyber-cyan" />
            </div>
            <h1 className="font-orbitron text-3xl font-bold neon-text mb-3">GameVault 账号中心</h1>
            <p className="text-cyber-muted leading-7 max-w-xl">
              登录注册链路接入 SQLite 本地用户表，支持运营后台、买卖市场和租号流程复验。
              所有认证动作会写入 auth_events，后台可追踪最近登录和注册记录。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8">
            {quickAccounts.map((account) => (
              <button
                key={account.username}
                type="button"
                onClick={() => fillQuick(account)}
                className="text-left glass-panel p-4 border-cyber-border hover:border-cyber-cyan/60 transition-colors"
              >
                <div className="text-sm font-bold text-white/90">{account.label}</div>
                <div className="text-xs text-cyber-muted mt-1">{account.username} / {account.password}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="card-cyber p-6 space-y-5">
          <div className="flex rounded-lg bg-cyber-bg border border-cyber-border p-1">
            {(["login", "register"] as Mode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item)
                  setMessage("")
                }}
                className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                  mode === item ? "bg-cyber-cyan text-cyber-bg" : "text-cyber-muted hover:text-cyber-cyan"
                }`}
              >
                {item === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
                {item === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-cyber-muted mb-2">账号</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyber-cyan"
              placeholder="请输入账号"
              required
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-xs text-cyber-muted mb-2">显示名称</label>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyber-cyan"
                placeholder="例如：游戏账号买家"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-cyber-muted mb-2">密码</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cyber-cyan"
              placeholder="至少 6 位"
              required
            />
          </div>

          {message && (
            <div className={`text-sm flex items-center gap-2 ${message.includes("成功") ? "text-cyber-green" : "text-cyber-red"}`}>
              {message.includes("成功") ? <ShieldCheck size={16} /> : <AlertTriangle size={16} />}
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-cyber w-full py-3 font-bold disabled:opacity-60">
            {loading ? "提交中..." : mode === "login" ? "登录并进入后台" : "注册并进入市场"}
          </button>

          <div className="text-xs text-cyber-muted text-center">
            <Link to="/" className="text-cyber-cyan hover:underline">返回首页大厅</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
