import { Link } from 'react-router-dom'

const FOOTER_LINKS = [
  { label: '关于我们', to: '/about' },
  { label: '服务条款', to: '/terms' },
  { label: '隐私政策', to: '/privacy' },
  { label: '联系我们', to: '/contact' },
]

export default function Footer() {
  return (
    <footer className="bg-sand-900 text-sand-200">
      <div className="mx-auto max-w-8xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl font-bold text-sand-100">筑居</h3>
            <p className="mt-2 text-sm text-sand-200/70">专业家装灵感与决策支持平台</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-sand-200/70 transition-colors hover:text-sand-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 border-t border-sand-200/10 pt-6 text-center text-xs text-sand-200/50">
          © {new Date().getFullYear()} 筑居. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
