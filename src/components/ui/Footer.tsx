import * as React from 'react';
import { Link } from 'react-router-dom';
import { Recycle, Phone, Mail, MapPin, Shield, Award, Truck, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';

const Footer: React.FC = () => {
  const services = [
    { icon: Shield, title: '正品保障', desc: '100% 正品溯源' },
    { icon: Award, title: '专业检测', desc: '持证检测师认证' },
    { icon: Truck, title: '免费上门', desc: '全国200+城市' },
    { icon: Headphones, title: '全程服务', desc: '7×24小时客服' },
  ];

  const quickLinks = [
    { label: '首页', href: '/' },
    { label: '智能估价', href: '/evaluate' },
    { label: '商品库', href: '/products' },
    { label: '检测师', href: '/inspectors' },
  ];

  const supportLinks = [
    { label: '帮助中心', href: '/help' },
    { label: '服务条款', href: '/terms' },
    { label: '隐私政策', href: '/privacy' },
    { label: '关于我们', href: '/about' },
  ];

  return (
    <footer className="relative overflow-hidden mt-24 border-t border-white/[0.06]">
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'linear-gradient(180deg, #0A382C 0%, #06261D 50%, #05050A 100%)',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(45,161,121,0.12),transparent_60%)]" />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
                <Recycle className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-xl font-bold tracking-tight gold-text">
                  臻回收
                </span>
                <span className="text-[10px] text-forest-200/60 tracking-[0.2em] uppercase">
                  Luxury Recycle
                </span>
              </div>
            </Link>

            <div className="space-y-2">
              <p className="text-forest-100 font-display text-xl leading-snug text-balance">
                让每一件奢侈品，遇见更高价值
              </p>
              <p className="text-forest-200/60 text-sm leading-relaxed max-w-sm">
                专业奢侈品回收平台，以AI智能检测 + 持证专家双重保障，为您提供透明、公正、高价的回收服务体验。
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-forest-100/80">
                <Phone className="w-4 h-4 text-gold-400" />
                <span>400-888-8888</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-forest-100/80">
                <Mail className="w-4 h-4 text-gold-400" />
                <span>service@zhenhuishou.com</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-forest-100/80">
                <MapPin className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
                <span>上海市浦东新区陆家嘴环路1000号</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-ink-50 font-semibold text-sm uppercase tracking-wider">
              快速导航
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-forest-100/70 text-sm hover:text-gold-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-ink-50 font-semibold text-sm uppercase tracking-wider">
              帮助支持
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-forest-100/70 text-sm hover:text-gold-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-ink-50 font-semibold text-sm uppercase tracking-wider">
              四大服务
            </h4>
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-gold-500/20 transition-colors duration-300"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold-soft flex items-center justify-center shrink-0">
                    <s.icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-medium text-ink-50 truncate">{s.title}</p>
                    <p className="text-xs text-forest-200/60">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-gold my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-forest-200/50">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>© 2025 臻回收 ZhenHuiShou. All rights reserved.</span>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-gold-400 transition-colors">
              沪ICP备2025000000号-1
            </a>
            <span className="hidden sm:inline">|</span>
            <a href="#" className="hover:text-gold-400 transition-colors">
              沪公网安备 31010000000000号
            </a>
          </div>
          <div className="flex items-center gap-4">
            <span>市场主体信用公示</span>
            <span>•</span>
            <span>网络安全等级保护三级</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
