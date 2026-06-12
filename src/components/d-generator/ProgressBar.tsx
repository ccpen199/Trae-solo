import { useDGeneratorStore, Step } from '@/store/dGeneratorStore';
import { Upload, LayoutList, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps: { num: Step; label: string; desc: string; icon: React.ComponentType<any> }[] = [
  { num: 1, label: '上传户型图', desc: '拖拽或点击上传', icon: Upload },
  { num: 2, label: '房间配置', desc: '调整尺寸与参数', icon: LayoutList },
  { num: 3, label: '风格与预览', desc: '3D实时渲染', icon: Palette },
];

export default function ProgressBar() {
  const { step, setStep, recognitionDone } = useDGeneratorStore();

  const canJumpTo = (target: Step): boolean => {
    if (target === 1) return true;
    if (target === 2) return recognitionDone;
    if (target === 3) return recognitionDone;
    return false;
  };

  return (
    <div className="px-6 py-5 bg-white/85 backdrop-blur-xl border-b border-wood-200 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between relative">
        <div className="absolute top-7 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-0.5 bg-wood-200" />

        <div
          className="absolute top-7 left-[calc(16.67%+24px)] h-0.5 transition-all duration-500 ease-out rounded-full"
          style={{
            width: step >= 3 ? 'calc(66.67% - 48px)' : step >= 2 ? 'calc(33.33% - 24px)' : '0%',
            background: 'linear-gradient(90deg, #C4623A 0%, #CBA356 100%)',
          }}
        />

        {steps.map(({ num, label, desc, icon: Icon }) => {
          const isActive = step === num;
          const isDone = step > num;
          const isClickable = canJumpTo(num);

          return (
            <button
              key={num}
              onClick={() => isClickable && setStep(num)}
              className={cn(
                'relative z-10 flex items-center gap-3 group transition-all duration-300',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              )}
            >
              <div
                className={cn(
                  'relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 border-2',
                  isDone
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-transparent shadow-lg shadow-green-500/30 scale-105'
                    : isActive
                    ? 'bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-transparent shadow-xl shadow-terracotta-500/40 scale-110'
                    : 'bg-white border-wood-200 group-hover:border-wood-300 shadow-sm group-hover:shadow-md'
                )}
              >
                {isDone ? (
                  <Check className="w-6 h-6 text-white" strokeWidth={2.5} />
                ) : (
                  <Icon
                    className={cn(
                      'w-6 h-6 transition-all',
                      isActive ? 'text-white' : 'text-carbon-500 group-hover:text-terracotta-600'
                    )}
                  />
                )}
                <div
                  className={cn(
                    'absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-all',
                    isActive ? 'bg-terracotta-500 scale-100' : 'scale-0'
                  )}
                />
              </div>

              <div className="text-left hidden sm:block">
                <p
                  className={cn(
                    'font-bold transition-colors',
                    isActive ? 'text-terracotta-700' : isDone ? 'text-green-700' : 'text-carbon-600'
                  )}
                >
                  步骤 {num}：{label}
                </p>
                <p className="text-xs text-carbon-400 mt-0.5">{desc}</p>
              </div>

              <div
                className={cn(
                  'absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  isDone || isActive
                    ? 'bg-white text-terracotta-600 shadow-md'
                    : 'bg-ivory-100 text-carbon-400'
                )}
              >
                {num}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
