import { Outlet } from 'react-router-dom';
import { Sparkles, Star, Zap, Crown } from 'lucide-react';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

const features = [
  {
    icon: <Star className="w-6 h-6" />,
    title: '专业人才库',
    description: '汇聚行业顶尖艺人、模特、演员资源',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: '智能匹配',
    description: 'AI 驱动的精准匹配，快速找到最合适的人才',
  },
  {
    icon: <Crown className="w-6 h-6" />,
    title: '数字身份认证',
    description: '区块链存证，确保人才信息真实可信',
  },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[800px] h-[800px] bg-sapphire-500/20 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-rose-600/10 rounded-full blur-[200px] animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }} />
      </div>

      <div className="relative min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <span className="font-heading text-2xl font-bold text-white">
                TalentHub
              </span>
            </div>

            <h1 className="font-heading text-5xl font-bold text-white mb-6 leading-tight">
              连接 talent 与
              <br />
              <span className="text-gradient">无限可能</span>
            </h1>

            <p className="text-lg text-midnight-300 mb-12 max-w-md">
              演艺行业人才数字身份基础设施，为艺人、经纪公司、品牌方提供安全、高效、透明的人才服务平台。
            </p>

            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-glass-gradient backdrop-blur-sm border border-white/10 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-primary/20 flex items-center justify-center text-rose-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-midnight-300">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-midnight-800 bg-gradient-to-br from-rose-400 to-sapphire-400"
                    style={{
                      backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('professional portrait headshot')}&image_size=square)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">10,000+ 专业艺人</p>
                <p className="text-sm text-midnight-400">已加入 TalentHub 平台</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-white">
                TalentHub
              </span>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-primary rounded-3xl blur-xl opacity-30 animate-pulse-glow" />
              <div className="relative glass backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10 shadow-glass">
                {children || <Outlet />}
              </div>
            </div>

            <p className="text-center text-sm text-midnight-500 mt-8">
              © 2024 TalentHub. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
