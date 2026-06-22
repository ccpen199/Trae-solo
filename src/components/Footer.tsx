import { Link } from 'react-router-dom'
import { PawPrint, Shield } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-16">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PawPrint className="w-6 h-6 text-primary" />
              <span className="heading-font text-lg font-bold text-white">宠物生活</span>
            </div>
            <p className="text-sm text-stone-400 max-w-xs">
              宠物全生命周期社区服务平台，让每一个宠物都能享有健康、幸福的生活。
            </p>
          </div>

          <div className="flex flex-wrap gap-8">
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">平台服务</h4>
              <div className="space-y-2 text-sm">
                <Link to="/pets" className="block hover:text-white transition-colors">宠物档案</Link>
                <Link to="/adoptions" className="block hover:text-white transition-colors">领养中心</Link>
                <Link to="/breedings" className="block hover:text-white transition-colors">配种广场</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">支持</h4>
              <div className="space-y-2 text-sm">
                <a href="#" className="block hover:text-white transition-colors">关于我们</a>
                <a href="#" className="block hover:text-white transition-colors">使用条款</a>
                <a href="#" className="block hover:text-white transition-colors">隐私政策</a>
                <a href="#" className="block hover:text-white transition-colors">联系我们</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-stone-500">
            © {new Date().getFullYear()} 宠物生活 版权所有
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-800 rounded-full">
            <Shield className="w-3.5 h-3.5 text-success" />
            <span className="text-xs text-stone-400">已接入地方农业农村部门备案系统</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
