import { Shield, Lock, Server, Cloud, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center text-white shadow-md">
                <span className="font-bold text-lg">厦</span>
              </div>
              <div>
                <h3 className="text-white font-semibold">厦门市民数字服务中枢</h3>
                <p className="text-xs text-gray-400">厦门市人民政府办公厅主办</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              市级政务与民生服务统一入口，对接全市30+委办局系统，为市民和企业提供全生命周期的一站式数字化服务。
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-xs bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20">
                <Shield className="w-3.5 h-3.5" />等保三级认证
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20">
                <Cloud className="w-3.5 h-3.5" />政务云部署
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">政务服务</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a className="hover:text-white transition-colors" href="#">个人办事服务</a></li>
              <li><a className="hover:text-white transition-colors" href="#">企业办事服务</a></li>
              <li><a className="hover:text-white transition-colors" href="#">一件事集成服务</a></li>
              <li><a className="hover:text-white transition-colors" href="#">政策智能匹配</a></li>
              <li><a className="hover:text-white transition-colors" href="#">办事进度查询</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">便民服务</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a className="hover:text-white transition-colors" href="#">公交地铁查询</a></li>
              <li><a className="hover:text-white transition-colors" href="#">医院预约挂号</a></li>
              <li><a className="hover:text-white transition-colors" href="#">文体场馆预约</a></li>
              <li><a className="hover:text-white transition-colors" href="#">市民卡服务</a></li>
              <li><a className="hover:text-white transition-colors" href="#">12345便民热线</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">联系我们</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                <span>厦门市思明区湖滨北路67号市政府大厦</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-500 shrink-0" />
                <span>0592-12345（便民热线）</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <span>service@xiamen.gov.cn</span>
              </li>
            </ul>
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center text-gray-600 text-xs">
                  闽政通二维码
                </div>
                <div>
                  <p className="text-sm text-white">扫码下载</p>
                  <p className="text-xs text-gray-400 mt-1">闽政通 APP</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-xs text-gray-500 space-y-1.5">
              <p>© 2024 厦门市人民政府办公厅 版权所有 | 闽ICP备05005482号-1 | 闽公网安备 35020302030001号</p>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5"><Lock className="w-3 h-3" />数据加密传输</span>
                <span className="inline-flex items-center gap-1.5"><Server className="w-3 h-3" />政务数据不出市云</span>
                <span className="inline-flex items-center gap-1.5"><ExternalLink className="w-3 h-3" />网站无障碍</span>
                <span className="inline-flex items-center gap-1.5">建议使用 Chrome / Edge / Safari 最新版本浏览</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
