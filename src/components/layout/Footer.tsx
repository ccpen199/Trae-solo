import * as React from 'react'
import { Link } from 'react-router-dom'

const footerLinks = {
  product: [
    { label: '智能起名', href: '/naming' },
    { label: '案例赏析', href: '/cases' },
    { label: '命名师团队', href: '/masters' },
    { label: '五行查询', href: '/wuxing' },
  ],
  about: [
    { label: '关于我们', href: '/about' },
    { label: '文化传承', href: '/culture' },
    { label: '联系我们', href: '/contact' },
    { label: '加入我们', href: '/join' },
  ],
  support: [
    { label: '帮助中心', href: '/help' },
    { label: '隐私政策', href: '/privacy' },
    { label: '用户协议', href: '/terms' },
    { label: '意见反馈', href: '/feedback' },
  ],
}

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-ink-200 bg-ink-50/80">
      <div className="w-full py-3 flex items-center justify-center bg-ink-100/50">
        <svg viewBox="0 0 1200 20" className="w-full max-w-4xl h-5 text-ink-400">
          <path
            d="M0 10 L30 10 L35 5 L40 15 L45 5 L50 15 L55 10 L1145 10 L1150 15 L1155 5 L1160 15 L1165 5 L1170 10 L1200 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          />
          <circle cx="600" cy="10" r="3" fill="#b8860b" />
        </svg>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="seal-stamp w-10 h-10 -rotate-3">
                <span className="font-serif text-sm font-bold">雅</span>
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider ink-text-gradient">
                雅名轩
              </span>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed max-w-sm">
              承千年文脉，循五行之道。我们以传统文化为根基，结合现代审美，
              为每一位有缘人献上寓意深远、音韵和谐的佳名。
            </p>
            <div className="flex items-center gap-2 text-xs text-ink-400">
              <span>传承·匠心·雅致</span>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-base font-semibold text-ink-800 mb-4">产品服务</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-ink-500 hover:text-cinnabar-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-base font-semibold text-ink-800 mb-4">关于雅名轩</h4>
            <ul className="space-y-2">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-ink-500 hover:text-cinnabar-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-base font-semibold text-ink-800 mb-4">帮助支持</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-ink-500 hover:text-cinnabar-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs text-ink-400 space-x-4">
              <span>© 2024 雅名轩 YanMingXuan. All rights reserved.</span>
              <a href="#" className="hover:text-cinnabar-600 transition-colors">
                京ICP备XXXXXXXX号-1
              </a>
              <a href="#" className="hover:text-cinnabar-600 transition-colors">
                京公网安备XXXXXXXXXXXX号
              </a>
            </div>
            <div className="text-xs text-ink-400">
              匠心传承 · 雅致之名
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
Footer.displayName = 'Footer'
