import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: '关于我们', href: '/about' },
    { label: '联系我们', href: '/contact' },
    { label: '加入我们', href: '/careers' },
    { label: '隐私政策', href: '/privacy' },
  ];

  return (
    <footer className="bg-cinema-midnightDark border-t border-white/5 mt-auto">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-5">
            <Link to="/" className="inline-block">
              <h2 className="font-display text-2xl text-gradient-gold tracking-wider">
                PACONNIE CINEMAS
              </h2>
            </Link>
            <p className="text-cinema-muted text-sm leading-relaxed">
              尊享观影体验，尽在 PACONNIE CINEMAS。
              我们致力于为您提供最优质的观影服务和难忘的娱乐时光。
            </p>
            <div className="flex items-center gap-2 text-cinema-muted text-sm">
              <MapPin className="w-4 h-4 text-cinema-gold" />
              <span>全国 50+ 城市</span>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-white font-semibold text-base">快速链接</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-cinema-muted text-sm hover:text-cinema-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <h3 className="text-white font-semibold text-base">客户服务</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-cinema-muted text-sm">
                <Phone className="w-4 h-4 text-cinema-gold" />
                <span>客服热线</span>
              </div>
              <a
                href="tel:400-888-8888"
                className="block font-display text-2xl text-gradient-gold hover:opacity-80 transition-opacity"
              >
                400-888-8888
              </a>
              <div className="flex items-center gap-3 text-cinema-muted text-sm">
                <Mail className="w-4 h-4 text-cinema-gold" />
                <span>service@paconnie.com</span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="text-white font-semibold text-base">营业时间</h3>
            <div className="space-y-2 text-cinema-muted text-sm">
              <p>周一至周五：09:00 - 24:00</p>
              <p>周六至周日：08:00 - 次日01:00</p>
              <p>节假日：08:00 - 次日01:00</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-cinema-muted text-sm">
              © {currentYear} PACONNIE CINEMAS. All Rights Reserved.
            </p>
            <div className="flex items-center gap-6 text-cinema-muted text-sm">
              <Link to="/terms" className="hover:text-cinema-gold transition-colors">
                用户协议
              </Link>
              <Link to="/privacy" className="hover:text-cinema-gold transition-colors">
                隐私政策
              </Link>
              <span>京ICP备XXXXXXXX号</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
