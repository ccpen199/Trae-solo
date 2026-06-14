import { useEffect, useState } from 'react';
import { Shield, Building2 } from 'lucide-react';
import LoginBackground from './components/LoginBackground';
import LoginForm from './components/LoginForm';
import SecurityTips from './components/SecurityTips';

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <LoginBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className={`flex-1 text-center lg:text-left transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
                  智慧监管平台
                </h1>
                <p className="text-sm text-blue-300/80 mt-1">
                  Smart Supervision Platform
                </p>
              </div>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              山东省文旅场所
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                智慧监管服务平台
              </span>
            </h2>
            
            <p className="text-slate-300/80 text-lg md:text-xl mb-8 max-w-lg">
              以科技赋能文旅监管，实现全省文旅场所智能化、精细化、可视化管理
            </p>
            
            <div className="grid grid-cols-2 gap-4 max-w-md">
              {[
                { title: '全域覆盖', desc: '16地市文旅场所' },
                { title: '智能预警', desc: '风险主动发现' },
                { title: '数据互通', desc: '多部门信息共享' },
                { title: '决策支撑', desc: '大数据分析' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-lg font-semibold text-white">{item.title}</div>
                  <div className="text-sm text-slate-400 mt-1">{item.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-slate-400">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">山东省文化和旅游厅 · 版权所有</span>
            </div>
          </div>

          <div className={`w-full max-w-md transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="relative p-8 rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-teal-500/20 blur-xl -z-10" />
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">欢迎登录</h3>
                <p className="text-slate-400 text-sm">请使用您的账号信息登录系统</p>
              </div>

              <LoginForm />
              
              <SecurityTips />
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              <p>版本号：V1.0.0 · 技术支持：山东省文化和旅游厅信息中心</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
