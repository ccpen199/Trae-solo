import { Shield, Lock, Eye, FileCheck, AlertTriangle } from 'lucide-react';

export default function SecurityTips() {
  const tips = [
    {
      icon: Shield,
      title: '等保三级认证',
      description: '系统已通过网络安全等级保护三级认证',
    },
    {
      icon: Lock,
      title: '数据加密传输',
      description: '采用SSL/TLS加密技术，保障数据传输安全',
    },
    {
      icon: Eye,
      title: '全程操作审计',
      description: '所有操作均有日志记录，可追溯可审计',
    },
    {
      icon: FileCheck,
      title: '双因素认证',
      description: '密码+短信验证码双重验证，确保账号安全',
    },
  ];

  return (
    <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-medium text-blue-200">安全提示</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all duration-300"
          >
            <tip.icon className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs font-medium text-blue-300">{tip.title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{tip.description}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-500/20">
        <p className="text-xs text-slate-500 text-center">
          本系统仅限山东省文化和旅游厅授权人员使用，未经授权禁止访问
        </p>
      </div>
    </div>
  );
}
