import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Phone, Lock, ArrowRight, Home } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = () => {
    if (phone.length === 11 && countdown === 0) {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleLogin = () => {
    if (phone && code) {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        navigate("/admin-dashboard");
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <button
          onClick={() => navigate("/")}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 text-[20px] hover:text-white"
        >
          <Home size={28} />
          返回首页
        </button>

        <div className="text-center mb-12">
          <div className="bg-blue-500 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield size={56} className="text-white" />
          </div>
          <h1 className="text-[40px] font-bold text-white mb-2">
            内容审核后台
          </h1>
          <p className="text-[22px] text-gray-400">
            银发数字生活工作台
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-[28px] font-bold text-gray-900 mb-8 text-center">
            审核员登录
          </h2>

          <div className="space-y-6">
            <div>
              <label className="text-[20px] font-bold text-gray-700 mb-2 block">
                手机号
              </label>
              <div className="relative">
                <Phone
                  size={28}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  maxLength={11}
                  className="w-full pl-14 pr-6 py-5 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[20px] font-bold text-gray-700 mb-2 block">
                验证码
              </label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Lock
                    size={28}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="请输入验证码"
                    maxLength={6}
                    className="w-full pl-14 pr-6 py-5 text-[22px] border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                  className={`px-6 py-5 rounded-xl text-[20px] font-bold whitespace-nowrap ${
                    countdown > 0
                      ? "bg-gray-200 text-gray-500"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                >
                  {countdown > 0 ? `${countdown}s` : "获取验证码"}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={!phone || !code || isLoading}
            className={`w-full mt-8 py-6 rounded-xl text-[26px] font-bold flex items-center justify-center gap-3 transition-all ${
              phone && code && !isLoading
                ? "bg-blue-500 text-white active:scale-98 hover:bg-blue-600"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                登录
                <ArrowRight size={32} />
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-[18px] text-gray-500">
              仅限审核人员使用
            </p>
            <p className="text-[18px] text-gray-400 mt-1">
              测试账号：任意手机号 + 123456
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
