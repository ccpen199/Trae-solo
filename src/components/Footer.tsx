import { Link } from 'react-router-dom'
import { Home, Video, Building2, Hammer, BookOpen, Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  const quickLinks = [
    { to: '/', label: '首页', icon: Home },
    { to: '/live', label: '直播', icon: Video },
    { to: '/properties', label: '房源', icon: Building2 },
    { to: '/renovation', label: '装修', icon: Hammer },
    { to: '/content', label: '内容', icon: BookOpen },
  ]

  return (
    <footer className="bg-slate-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">居</span>
              </div>
              <span className="text-xl font-bold">居界</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-md">
              居界是融合直播、社交与装修服务的房产垂直平台，为购房者、装修需求者提供从选房到入住的一站式服务。通过专业直播互动、VR样板间体验和装修服务闭环，降低信息差，提升决策效率。
            </p>
            <div className="flex gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-teal-600 transition-colors cursor-pointer">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-amber-400">快速链接</h3>
            <ul className="space-y-2">
              {quickLinks.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm"
                  >
                    <Icon size={14} strokeWidth={1.5} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4 text-amber-400">联系我们</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <Phone size={14} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>400-888-9058</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <Mail size={14} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>support@jujie.com</span>
              </li>
              <li className="flex items-start gap-2 text-slate-400 text-sm">
                <MapPin size={14} className="mt-0.5 shrink-0" strokeWidth={1.5} />
                <span>北京市朝阳区科技园区A座18层</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2024 居界. 保留所有权利. 京ICP备12345678号
            </p>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-teal-400 transition-colors">用户协议</a>
              <a href="#" className="hover:text-teal-400 transition-colors">隐私政策</a>
              <a href="#" className="hover:text-teal-400 transition-colors">关于我们</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
