import { Scale, Phone, Mail, MapPin } from 'lucide-react';

const friendlyLinks = [
  { label: '中国法律服务网', href: '#' },
  { label: '司法部', href: '#' },
  { label: '全国人大', href: '#' },
  { label: '最高人民法院', href: '#' },
];

const quickLinks = [
  { label: '首页', href: '/' },
  { label: '提交咨询', href: '/consultations/new' },
  { label: '我的咨询', href: '/consultations' },
  { label: '律师入驻', href: '/lawyer/register' },
  { label: '关于我们', href: '/about' },
];

export function Footer() {
  return (
    <footer className="bg-primary-800 border-t border-primary-700">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gold/20">
                <Scale className="h-5 w-5 text-accent-gold" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-accent-gold font-serif tracking-wide">
                法援在线
              </span>
            </div>
            <p className="text-sm text-primary-200 mb-4 leading-relaxed">
              公益法律服务平台，为有需要的群众提供专业、便捷、免费的法律咨询服务，
              让公平正义触手可及。
            </p>
            <div className="flex flex-col gap-2 text-sm text-primary-200">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span>400-888-9999</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span>contact@fayuan-online.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent-gold flex-shrink-0" />
                <span>北京市朝阳区</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-accent-gold font-serif font-semibold mb-4 text-base">快速链接</h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-200 hover:text-accent-gold transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-400 group-hover:bg-accent-gold transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-accent-gold font-serif font-semibold mb-4 text-base">友情链接</h4>
            <ul className="space-y-2.5">
              {friendlyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-200 hover:text-accent-gold transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-400 group-hover:bg-accent-gold transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-accent-gold font-serif font-semibold mb-4 text-base">工作时间</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-primary-300 mb-1">咨询服务</p>
                <p className="text-primary-100">周一至周日 9:00 - 21:00</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">律师审核</p>
                <p className="text-primary-100">周一至周五 9:00 - 18:00</p>
              </div>
              <div>
                <p className="text-primary-300 mb-1">投诉处理</p>
                <p className="text-primary-100">周一至周五 9:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-700/60 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-primary-400">
            © 2025 法援在线 Fayuan Online. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-primary-400">
            <a href="#" className="hover:text-accent-gold transition-colors">
              服务协议
            </a>
            <a href="#" className="hover:text-accent-gold transition-colors">
              隐私政策
            </a>
            <a href="#" className="hover:text-accent-gold transition-colors">
              京ICP备XXXXXXXX号
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
