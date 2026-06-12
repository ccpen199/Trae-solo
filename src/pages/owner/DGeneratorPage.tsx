import { useEffect } from 'react';
import { useDGeneratorStore } from '@/store/dGeneratorStore';
import ProgressBar from '@/components/d-generator/ProgressBar';
import LeftPanel from '@/components/d-generator/LeftPanel';
import Step1Upload from '@/components/d-generator/Step1Upload';
import Step2RoomConfig from '@/components/d-generator/Step2RoomConfig';
import Step3Preview from '@/components/d-generator/Step3Preview';
import { Home, Sparkles } from 'lucide-react';

export default function DGeneratorPage() {
  const { step, panelCollapsed } = useDGeneratorStore();

  useEffect(() => {
    document.title = '3D效果图生成器 · D-Generator';
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-ivory-100 via-wood-50/30 to-haze-50/50 overflow-hidden">
      <header className="flex-shrink-0 px-6 py-3 bg-white/70 backdrop-blur-xl border-b border-wood-200/60 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-terracotta-500 via-terracotta-600 to-wood-600 flex items-center justify-center shadow-lg shadow-terracotta-500/25">
                <Sparkles className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-wood-400 border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-bold text-white">3D</span>
              </div>
            </div>
            <div>
              <h1 className="font-bold text-carbon-800 text-lg tracking-tight leading-tight">
                D-Generator
              </h1>
              <p className="text-[11px] text-carbon-500 leading-tight">AI 智能3D效果图生成器</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-wood-200">
            {['AI户型识别', '参数化配置', '实时渲染', '多风格切换'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-ivory-100 text-carbon-600 border border-wood-200/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm text-carbon-600 hover:bg-wood-50 border border-transparent hover:border-wood-200 transition-all">
            <Home className="w-4 h-4" />
            <span>返回首页</span>
          </button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-haze-400 to-haze-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            D
          </div>
        </div>
      </header>

      <ProgressBar />

      <div className="flex-1 relative overflow-hidden">
        <LeftPanel />

        <main
          className="absolute inset-0 transition-all duration-500 ease-out overflow-hidden"
          style={{ left: panelCollapsed ? 0 : 280 }}
        >
          <div className="h-full w-full">
            {step === 1 && <Step1Upload />}
            {step === 2 && <Step2RoomConfig />}
            {step === 3 && <Step3Preview />}
          </div>
        </main>
      </div>
    </div>
  );
}
