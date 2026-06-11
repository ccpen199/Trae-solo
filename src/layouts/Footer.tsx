import React from 'react';
import { Shield, Phone, Mail, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-700 text-neutral-300 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold">省人社一体化平台</h3>
                <p className="text-xs text-neutral-400">Provincial HRSS Platform</p>
              </div>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              全省统一的人力资源社会保障政务服务平台，为您提供便捷、高效、优质的人社服务。
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">个人服务</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="transition-colors">社保查询</span></li>
              <li><span className="transition-colors">医保服务</span></li>
              <li><span className="transition-colors">公积金查询</span></li>
              <li><span className="transition-colors">人事考试</span></li>
              <li><span className="transition-colors">电子社保卡</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">企业服务</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="transition-colors">参保管理</span></li>
              <li><span className="transition-colors">增减员申报</span></li>
              <li><span className="transition-colors">失业金预审</span></li>
              <li><span className="transition-colors">劳动关系</span></li>
              <li><span className="transition-colors">法人认证</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">联系我们</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>12333 服务热线</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>service@hrss.gov.cn</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>省人力资源和社会保障厅</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-600 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-500">
            © 2025 省人力资源和社会保障厅 版权所有
          </p>
          <div className="flex gap-6 text-xs text-neutral-500">
            <a href="#" className="hover:text-neutral-300">网站地图</a>
            <a href="#" className="hover:text-neutral-300">隐私政策</a>
            <a href="#" className="hover:text-neutral-300">使用条款</a>
            <a href="#" className="hover:text-neutral-300">无障碍浏览</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
