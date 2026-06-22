import { Link } from 'react-router-dom'

const links = [
  { to: '#', label: '关于我们' },
  { to: '#', label: '联系方式' },
  { to: '#', label: '隐私政策' },
  { to: '#', label: '用户协议' },
]

export default function Footer() {
  return (
    <footer className="bg-rock-900 text-white">
      <svg
        className="w-full -mb-1"
        viewBox="0 0 1440 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="M0 80V40C120 10 240 50 360 30C480 10 600 45 720 25C840 5 960 40 1080 20C1200 0 1320 35 1440 15V80H0Z"
          fill="#1A2332"
        />
        <path
          d="M0 80V55C160 25 320 60 480 40C640 20 800 55 960 35C1120 15 1280 50 1440 30V80H0Z"
          fill="#1A2332"
          opacity="0.7"
        />
      </svg>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="font-serif font-bold text-xl text-jade-400">镇雄本地通</span>
            <p className="text-rock-400 text-sm">聚焦镇雄 · 一平台知镇雄</p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-sm text-rock-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-rock-800 text-center text-sm text-rock-500">
          © 2025 镇雄本地通
        </div>
      </div>
    </footer>
  )
}
