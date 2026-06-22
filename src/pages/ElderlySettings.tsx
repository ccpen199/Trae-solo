import { Link } from 'react-router-dom';
import {
  Sparkles,
  ChevronRight,
  Eye,
  Sun,
  Volume2,
  MousePointerClick,
  MessageSquare,
  CheckCircle2,
  Smartphone,
  Heart,
  ShieldCheck,
  Bell,
  Search,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const fontSizeOptions = [
  { key: 'normal', label: '标准', desc: '适合大多数用户', size: 'text-base' },
  { key: 'large', label: '大号', desc: '字体增大20%', size: 'text-lg' },
  { key: 'xlarge', label: '特大号', desc: '字体增大40%', size: 'text-xl' },
];

export default function ElderlySettings() {
  const { elderlyMode, highContrast, toggleElderlyMode, toggleHighContrast } = useAppStore();
  const [voiceMode, setVoiceMode] = useState(false);
  const [simplifyUI, setSimplifyUI] = useState(false);
  const [autoAnswer, setAutoAnswer] = useState(true);
  const [emergencyContact, setEmergencyContact] = useState('138****1234');
  const [fontSize, setFontSize] = useState('normal');

  const features = [
    {
      id: 'elderly',
      title: '适老模式',
      desc: '整体布局更简洁，字体更大，操作按钮更醒目',
      icon: Sparkles,
      color: 'from-warm-500 to-warm-600',
      active: elderlyMode,
      onToggle: toggleElderlyMode,
    },
    {
      id: 'contrast',
      title: '高对比度模式',
      desc: '增强文字与背景对比度，更易阅读',
      icon: Eye,
      color: 'from-gov-500 to-gov-600',
      active: highContrast,
      onToggle: toggleHighContrast,
    },
    {
      id: 'voice',
      title: '语音播报',
      desc: '点击文字时自动朗读，方便视力不佳用户',
      icon: Volume2,
      color: 'from-blue-500 to-blue-600',
      active: voiceMode,
      onToggle: () => setVoiceMode(!voiceMode),
    },
    {
      id: 'simplify',
      title: '界面简化',
      desc: '隐藏复杂功能，只保留核心服务入口',
      icon: MousePointerClick,
      color: 'from-green-500 to-green-600',
      active: simplifyUI,
      onToggle: () => setSimplifyUI(!simplifyUI),
    },
    {
      id: 'auto',
      title: '智能问答助手',
      desc: '自动回复常见问题，7x24小时在线服务',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      active: autoAnswer,
      onToggle: () => setAutoAnswer(!autoAnswer),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gov-600 transition-colors">首页</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-800 font-medium">适老设置</span>
      </nav>

      <div className="mb-8">
        <h1 className="section-title flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-warm-500" />
          适老设置
        </h1>
        <p className="section-subtitle">为老年用户量身定制的无障碍使用体验</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 md:p-8 bg-gradient-to-br from-warm-50 to-white border-warm-100">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-gray-900">关爱模式总览</h2>
                <p className="text-sm text-gray-500 mt-1">已开启 {features.filter((f) => f.active).length} 项适老功能</p>
              </div>
            </div>
            <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-warm-400 to-warm-500 rounded-full transition-all duration-500"
                style={{ width: `${(features.filter((f) => f.active).length / features.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>0%</span>
              <span>已开启 {(features.filter((f) => f.active).length / features.length * 100).toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="card p-6 md:p-8">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-6">无障碍功能</h3>
            <div className="space-y-2">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      f.active ? 'bg-gov-50/60 border-gov-200' : 'bg-white border-gray-100 hover:bg-gray-50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br', f.color, 'flex items-center justify-center shadow-sm flex-shrink-0')}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800">{f.title}</h4>
                            {f.active && (
                              <span className="chip bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 已开启
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{f.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={f.onToggle}
                        className={cn(
                          'relative w-14 h-8 rounded-full transition-colors flex-shrink-0',
                          f.active ? 'bg-gov-500' : 'bg-gray-200',
                        )}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 w-7 h-7 rounded-full bg-white shadow-md transition-all flex items-center justify-center',
                            f.active ? 'left-[26px]' : 'left-0.5',
                          )}
                        >
                          {f.active && <CheckCircle2 className="w-4 h-4 text-gov-500" />}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6 md:p-8">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-gov-600" />
              字体大小
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {fontSizeOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setFontSize(opt.key)}
                  className={cn(
                    'p-5 rounded-xl border-2 text-left transition-all',
                    fontSize === opt.key ? 'bg-gov-50 border-gov-400 ring-2 ring-gov-100' : 'bg-white border-gray-100 hover:border-gray-200',
                  )}
                >
                  <p className={cn('font-bold text-gray-900 mb-1', opt.size)}>{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              紧急联系人
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-xs text-red-600 mb-1">紧急联系人</p>
                <p className="text-2xl font-bold text-red-700">{emergencyContact}</p>
                <p className="text-xs text-red-500 mt-1">紧急情况将自动拨打</p>
              </div>
              <button className="w-full btn-secondary !py-3 text-sm">
                修改紧急联系人
              </button>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-gov-500 to-gov-700 text-white border-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">一键服务热线</h3>
                <p className="text-xs text-white/70">语音客服全天在线</p>
              </div>
            </div>
            <div className="space-y-2">
              <a
                href="tel:12345"
                className="flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">政务服务热线</span>
                <span className="text-2xl font-bold text-warm-300">12345</span>
              </a>
              <a
                href="tel:120"
                className="flex items-center justify-between p-3 rounded-xl bg-red-500/30 hover:bg-red-500/50 transition-colors"
              >
                <span className="text-sm">医疗急救</span>
                <span className="text-2xl font-bold">120</span>
              </a>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-gov-600" />
              消息通知
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">预警信息推送</span>
                <button
                  onClick={() => {}}
                  className="relative w-12 h-7 rounded-full bg-gov-500 transition-colors"
                >
                  <span className="absolute top-0.5 left-[22px] w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">工单进度提醒</span>
                <button
                  onClick={() => {}}
                  className="relative w-12 h-7 rounded-full bg-gov-500 transition-colors"
                >
                  <span className="absolute top-0.5 left-[22px] w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">政策更新通知</span>
                <button
                  onClick={() => {}}
                  className="relative w-12 h-7 rounded-full bg-gray-200 transition-colors"
                >
                  <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sun className="w-5 h-5 text-warm-500" />
              快速提示
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {[
                '点击右下角SOS按钮可快速发起紧急求助',
                '所有服务均支持语音朗读操作',
                '可联系家人协助完成复杂操作',
                '拨打12345可获得人工客服帮助',
              ].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
