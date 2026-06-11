import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-primary-900 text-white">
        <div className="container mx-auto py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-8 h-8 text-accent-verified" />
                <span className="text-xl font-bold font-serif">安居智联</span>
              </div>
              <p className="text-primary-100 text-sm leading-relaxed">
                房产全周期价格治理平台，依托区块链存证与AI价格预警，构建透明、可信的房产交易环境。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">快速链接</h3>
              <ul className="space-y-2 text-sm text-primary-100">
                <li><a href="/properties" className="hover:text-accent-verified transition-colors">房源列表</a></li>
                <li><a href="/price-analysis" className="hover:text-accent-verified transition-colors">价格分析</a></li>
                <li><a href="/time-machine" className="hover:text-accent-verified transition-colors">房价时光机</a></li>
                <li><a href="/report" className="hover:text-accent-verified transition-colors">举报中心</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">关于我们</h3>
              <ul className="space-y-2 text-sm text-primary-100">
                <li><a href="#" className="hover:text-accent-verified transition-colors">公司简介</a></li>
                <li><a href="#" className="hover:text-accent-verified transition-colors">服务条款</a></li>
                <li><a href="#" className="hover:text-accent-verified transition-colors">隐私政策</a></li>
                <li><a href="#" className="hover:text-accent-verified transition-colors">帮助中心</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">联系我们</h3>
              <ul className="space-y-3 text-sm text-primary-100">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-accent-verified" />
                  <span>400-888-8888</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-verified" />
                  <span>contact@anju.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-accent-verified mt-0.5" />
                  <span>北京市朝阳区建国路88号</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-700 mt-8 pt-8 text-center text-sm text-primary-200">
            <p>© 2024 安居智联 版权所有 | 京ICP备12345678号</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
