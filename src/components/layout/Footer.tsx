import { Link } from 'react-router-dom';
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Twitter,
  Youtube,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const quickLinks = [
  { label: '首页', path: '/' },
  { label: '产品中心', path: '/products' },
  { label: 'AI处理', path: '/ai-process' },
  { label: '社区广场', path: '/community' },
  { label: '关于我们', path: '/about' },
];

const serviceLinks = [
  { label: '用户协议', path: '/terms' },
  { label: '隐私政策', path: '/privacy' },
  { label: '帮助中心', path: '/help' },
  { label: '联系客服', path: '/contact' },
  { label: '意见反馈', path: '/feedback' },
];

const socialLinks = [
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Youtube, label: 'Youtube', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-gradient-dark text-paper-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-brand-400" />
              <span className="font-display font-semibold text-xl text-white">
                光影印记
              </span>
            </Link>
            <p className="text-sm text-paper-400 leading-relaxed">
              专注胶片摄影与AI影像处理，
              用光影记录生活中的每一个美好瞬间。
              让传统胶片的质感与现代科技完美融合。
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center',
                    'bg-paper-800/50 text-paper-400',
                    'hover:bg-brand-500 hover:text-white',
                    'transition-all duration-300'
                  )}
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">
              快速链接
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-paper-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">
              服务支持
            </h4>
            <ul className="space-y-2.5">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-paper-400 hover:text-brand-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-white mb-4">
              联系我们
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-paper-400">
                  上海市静安区南京西路1788号
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="text-sm text-paper-400">
                  400-888-8888
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="text-sm text-paper-400">
                  hello@guangying.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-paper-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper-500">
              <span>© 2024 光影印记 All Rights Reserved</span>
              <span className="hidden md:inline">|</span>
              <a href="#" className="hover:text-brand-400 transition-colors">
                沪ICP备2024000000号-1
              </a>
              <span className="hidden md:inline">|</span>
              <a href="#" className="hover:text-brand-400 transition-colors">
                沪公网安备31010602000000号
              </a>
            </div>
            <div className="flex items-center gap-1 text-xs text-paper-500">
              <span>用心制作</span>
              <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-500" />
              <span>记录光影</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
