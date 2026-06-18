import { useState } from "react";
import {
  Shield,
  User,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  LogIn,
  Fingerprint,
  QrCode,
  Building,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store";

type LoginType = "citizen" | "enterprise" | "admin";

export default function Login() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);
  const [loginType, setLoginType] = useState<LoginType>("citizen");
  const [loginMethod, setLoginMethod] = useState<"password" | "sms" | "face" | "qrcode">("password");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [loading, setLoading] = useState(false);

  const loginTypeOptions = [
    { key: "citizen" as LoginType, label: "市民登录", icon: UserCircle },
    { key: "enterprise" as LoginType, label: "企业登录", icon: Building },
    { key: "admin" as LoginType, label: "管理员登录", icon: Shield },
  ];

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      if (loginType === "admin") {
        setUser({
          id: "a001",
          realName: "李主任",
          idCardMasked: "3205**********5678",
          phoneMasked: "139****1234",
          authLevel: "L3",
          userType: "admin",
          departmentId: "d002",
          department: "市数据局",
        });
        navigate("/admin");
      } else {
        setUser({
          id: "u001",
          realName: "张伟",
          idCardMasked: "3205**********1234",
          phoneMasked: "138****5678",
          authLevel: "L3",
          userType: loginType === "enterprise" ? "enterprise" : "citizen",
        });
        navigate("/");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gov-700 via-gov-800 to-gov-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gov-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gov-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-gov-400/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-gov-400/5 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex gap-8 items-center">
        <div className="hidden lg:flex lg:flex-1 flex-col text-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">昆山市政务服务统一工作台</h1>
              <p className="text-sm text-white/60">Kunshan Government Services Platform</p>
            </div>
          </div>
          <p className="text-white/80 text-lg leading-relaxed mb-8">
            面向市民与企业，提供六大服务域、480+项政务服务的统一入口。集成电子证照、全流程在线办理、强身份认证，让数据多跑路，群众少跑腿。
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "486+", label: "服务事项" },
              { value: "407类", label: "电子证照" },
              { value: "10+", label: "协同部门" },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold mb-1">{item.value}</div>
                <div className="text-sm text-white/60">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
              <div className="w-10 h-10 rounded-xl bg-gov-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-gray-900">昆山政务服务</span>
            </div>

            <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
              {loginTypeOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setLoginType(opt.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition ${
                      loginType === opt.key
                        ? "bg-white text-gov-700 shadow"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-center gap-4 mb-6">
              {[
                { key: "password", icon: Lock, label: "密码" },
                { key: "sms", icon: Smartphone, label: "短信" },
                { key: "face", icon: Fingerprint, label: "人脸识别" },
                { key: "qrcode", icon: QrCode, label: "扫码" },
              ].map((m) => {
                const Icon = m.icon;
                const active = loginMethod === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setLoginMethod(m.key as any)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition ${
                      active ? "bg-gov-50 text-gov-700" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4">
              {loginMethod === "password" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">
                      {loginType === "admin" ? "管理员账号" : "身份证号/手机号"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        className="input pl-10"
                        placeholder={loginType === "admin" ? "请输入管理员账号" : "请输入身份证号或手机号"}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">密码</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        className="input pl-10 pr-10"
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {loginMethod === "sms" && (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">手机号</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        className="input pl-10"
                        placeholder="请输入手机号"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">短信验证码</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          className="input pl-10"
                          placeholder="请输入验证码"
                          value={smsCode}
                          onChange={(e) => setSmsCode(e.target.value)}
                        />
                      </div>
                      <button className="btn-secondary whitespace-nowrap">获取验证码</button>
                    </div>
                  </div>
                </>
              )}

              {loginMethod === "face" && (
                <div className="text-center py-8">
                  <div className="w-28 h-28 mx-auto rounded-full bg-gov-50 flex items-center justify-center mb-4 ring-4 ring-gov-100">
                    <Fingerprint className="w-14 h-14 text-gov-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">点击下方按钮开始人脸识别</p>
                  <p className="text-xs text-gray-400">对接公安人口库进行实人核验</p>
                  <button className="btn-primary mt-4">
                    <Fingerprint className="w-5 h-5" />
                    开始人脸识别
                  </button>
                </div>
              )}

              {loginMethod === "qrcode" && (
                <div className="text-center py-6">
                  <div className="w-44 h-44 mx-auto bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <QrCode className="w-32 h-32 text-gray-800" />
                  </div>
                  <p className="text-sm text-gray-600">请使用"苏服办"APP扫码登录</p>
                </div>
              )}

              {(loginMethod === "password" || loginMethod === "sms") && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                    <input type="checkbox" className="rounded text-gov-600" />
                    记住登录状态
                  </label>
                  <a href="#" className="text-gov-600 hover:text-gov-700">
                    忘记密码？
                  </a>
                </div>
              )}

              <button
                className="btn-primary w-full justify-center py-3 text-base"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    登录中...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    安全登录
                  </>
                )}
              </button>

              {loginType !== "admin" && (
                <p className="text-center text-xs text-gray-400">
                  登录即表示同意 <a href="#" className="text-gov-600">《用户服务协议》</a> 和{" "}
                  <a href="#" className="text-gov-600">《隐私政策》</a>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 text-center text-white/60 text-xs">
            公安人口库认证 · 国密算法加密 · 等保三级认证
          </div>
        </div>
      </div>
    </div>
  );
}
