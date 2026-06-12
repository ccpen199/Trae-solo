import { useDGeneratorStore } from '@/store/dGeneratorStore';
import { Save, RotateCcw, Share2, Image } from 'lucide-react';

export default function BottomBar() {
  const { triggerAutoArrange, setStep } = useDGeneratorStore();

  const actions = [
    {
      icon: Save,
      label: '保存方案',
      sub: '云端存储',
      onClick: () => alert('方案已保存到云端！'),
      variant: 'primary' as const,
    },
    {
      icon: RotateCcw,
      label: '重置',
      sub: '恢复初始',
      onClick: () => {
        triggerAutoArrange();
      },
      variant: 'default' as const,
    },
    {
      icon: Share2,
      label: '分享链接',
      sub: '生成链接',
      onClick: () => {
        const link = `${window.location.origin}/design/share/abc123`;
        navigator.clipboard?.writeText(link);
        alert('分享链接已复制到剪贴板！');
      },
      variant: 'default' as const,
    },
    {
      icon: Image,
      label: '导出图片',
      sub: '高清渲染',
      onClick: () => alert('正在渲染高清效果图...'),
      variant: 'default' as const,
    },
  ];

  return (
    <div className="px-6 py-4 bg-white/85 backdrop-blur-xl border-t border-wood-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(2)}
            className="px-5 py-2.5 rounded-xl border border-wood-300 text-carbon-600 hover:bg-wood-50 hover:text-carbon-800 transition-all font-medium text-sm flex items-center gap-2"
          >
            ← 上一步
          </button>
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-ivory-100 rounded-lg">
            <span className="text-xs text-carbon-500">提示：</span>
            <span className="text-xs text-carbon-600">点击场景中的家具可选中，切换风格实时预览</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions.map(({ icon: Icon, label, sub, onClick, variant }) => (
            <button
              key={label}
              onClick={onClick}
              className={`
                group relative flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200
                ${variant === 'primary'
                  ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white shadow-lg shadow-terracotta-500/25 hover:from-terracotta-600 hover:to-terracotta-700 hover:shadow-xl hover:shadow-terracotta-500/30 hover:scale-[1.02]'
                  : 'bg-white border border-wood-200 text-carbon-700 hover:bg-ivory-50 hover:border-wood-300 hover:shadow-md'
                }
              `}
            >
              <Icon className={`w-4.5 h-4.5 ${variant === 'primary' ? 'text-white' : 'text-terracotta-600'} transition-transform group-hover:scale-110`} />
              <div className="hidden sm:block text-left leading-tight">
                <div className="font-medium">{label}</div>
                <div className={`text-[10px] opacity-80 ${variant === 'primary' ? 'text-white/80' : 'text-carbon-500'}`}>{sub}</div>
              </div>
              <span className="sm:hidden">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
