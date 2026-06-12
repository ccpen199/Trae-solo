import { useState } from 'react';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import {
  Search, Music, ShieldCheck, Code2, ChevronDown,
  Lock, Eye, Database, Wifi, Trash2, Microscope,
  Heart, Cat,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: <Search className="w-8 h-8" />,
    title: '声纹分析',
    desc: '上传或录制猫咪叫声音频，AI 自动识别情绪状态，支持六大猫语情绪分类与置信度评估。',
    color: '#F59E0B',
    emoji: '🔍',
  },
  {
    icon: <Music className="w-8 h-8" />,
    title: '语音合成',
    desc: '输入文字指令，合成拟真猫叫音频，可选择情绪类型和强度，测试猫咪的实际反应。',
    color: '#34D399',
    emoji: '🎵',
  },
  {
    icon: <ShieldCheck className="w-8 h-8" />,
    title: '隐私优先',
    desc: '100% 本地浏览器端处理，零数据上传，所有音频分析结果仅保存在你的设备上。',
    color: '#60A5FA',
    emoji: '🔒',
  },
];

const techStack = [
  { name: 'React', color: '#61DAFB' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'Web Audio API', color: '#F59E0B' },
  { name: 'Canvas', color: '#A78BFA' },
  { name: 'TailwindCSS', color: '#06B6D4' },
  { name: 'Zustand', color: '#34D399' },
  { name: 'React Router', color: '#F87171' },
  { name: 'localStorage', color: '#FCD34D' },
];

const flowSteps = [
  { label: '音频输入', sub: '录音/上传', color: '#F59E0B' },
  { label: '特征提取', sub: 'Web Audio API', color: '#34D399' },
  { label: '情绪分类', sub: '端侧模型', color: '#60A5FA' },
  { label: '结果展示', sub: '可视化', color: '#A78BFA' },
  { label: '本地存储', sub: 'localStorage', color: '#FCD34D' },
];

const privacyItems = [
  { icon: <Lock className="w-5 h-5" />, title: '不存储原始音频', desc: '音频分析完成后立即释放，不会持久化保存原始录音文件。' },
  { icon: <Wifi className="w-5 h-5" />, title: '不联网传输', desc: '所有音频处理均在浏览器端完成，无需联网，不会向任何服务器发送数据。' },
  { icon: <Database className="w-5 h-5" />, title: '本地化存储', desc: '分析日志仅存储于浏览器 localStorage，随时可删除，不会同步至云端。' },
  { icon: <Eye className="w-5 h-5" />, title: '匿名化统计', desc: '统计数据仅用于本地展示，不包含任何个人身份信息或可追踪标识。' },
  { icon: <Trash2 className="w-5 h-5" />, title: '随时可清除', desc: '提供一键清空功能，所有本地数据可随时彻底删除，不留痕迹。' },
];

const faqItems = [
  {
    q: '如何录制猫咪叫声？',
    a: '进入「声纹分析」页面，点击「开始录音」按钮后，将手机或电脑麦克风靠近猫咪，录制 3~10 秒的叫声即可。也可以上传已有的音频文件（支持 .mp3 和 .wav 格式）。建议在安静的环境中录制，效果更佳。',
  },
  {
    q: '情绪识别的准确度如何？',
    a: '本平台基于猫咪声纹的频率、时长、频谱等声学特征进行分类，能较好地区分呼噜、喵叫、嘶叫、哀鸣、低吼和满足六大类情绪。但猫咪的叫声含义受上下文影响较大，识别结果仅供参考，建议结合猫咪的身体语言综合判断。',
  },
  {
    q: '合成音频真的对猫有效吗？',
    a: '合成音频基于猫咪不同情绪的典型声学参数（基频、谐波结构、时长）生成，部分猫咪会对合成声产生回应，但效果因个体差异而异。建议从低音量开始播放，观察猫咪反应，如果猫咪表现出不安请立即停止。',
  },
  {
    q: '数据存储在哪里？',
    a: '所有数据完全存储在你当前使用的浏览器本地（localStorage），不会上传到任何服务器。清除浏览器数据或使用「清空全部」功能即可删除所有记录。不同设备/浏览器之间的数据不会同步。',
  },
  {
    q: '可以导出日志吗？',
    a: '目前暂不支持一键导出功能，后续版本将提供 JSON/CSV 格式的日志导出。你可以通过浏览器的开发者工具查看 localStorage 中的数据，键名为 cat-language-lab-journal。',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-deep-sea-light/20 transition-colors"
      >
        <span className="font-medium text-white pr-4">{q}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300', open && 'rotate-180')}
        />
      </button>
      <div className={cn('overflow-hidden transition-all duration-300', open ? 'max-h-96' : 'max-h-0')}>
        <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
      <div className="max-w-5xl mx-auto space-y-12 animate-[fadeIn_0.5s_ease-out]">
        <section className="text-center py-12 space-y-5">
          <div className="text-6xl mb-4 animate-float">🐱</div>
          <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-amber-orange-light via-mood-mint to-mood-sky bg-clip-text text-transparent">
            猫语翻译实验室
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            运用声纹分析与语音合成技术，解读猫咪的叫声密码，搭建人与猫咪之间的沟通桥梁。
          </p>
          <p className="text-sm text-slate-500">
            基于纯前端技术构建，所有计算在浏览器端完成，守护你和猫咪的每一份隐私。
          </p>
          <Badge variant="amber" size="md">v1.0.0</Badge>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">功能特性</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <GlassCard key={f.title} padding="lg" hoverable className="text-center">
                <div className="text-4xl mb-4">{f.emoji}</div>
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: `${f.color}20`, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="text-lg font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </GlassCard>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold text-white mb-6 text-center">技术架构</h2>
          <GlassCard padding="lg">
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-amber-orange" />纯前端架构
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  本平台采用纯前端架构，无需后端服务器支持。音频采集、特征提取、情绪分类、语音合成、数据存储等所有功能均在浏览器端完成。利用 Web Audio API 进行实时音频处理，Canvas 进行波形与频谱可视化，确保响应速度与用户隐私。
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200 mb-3">技术栈</h3>
                <div className="flex flex-wrap gap-2">
                  {techStack.map((t) => (
                    <span
                      key={t.name}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:scale-105"
                      style={{
                        color: t.color,
                        backgroundColor: `${t.color}15`,
                        borderColor: `${t.color}30`,
                      }}
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-mood-mint" />端侧处理流程
                </h3>
                <div className="flex items-center justify-center overflow-x-auto py-4">
                  <div className="flex items-center gap-0 min-w-max">
                    {flowSteps.map((step, i) => (
                      <div key={i} className="flex items-center">
                        <div className="flex flex-col items-center gap-2">
                          <div
                            className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all hover:scale-105"
                            style={{
                              backgroundColor: `${step.color}15`,
                              borderColor: `${step.color}40`,
                            }}
                          >
                            <span className="text-sm font-semibold" style={{ color: step.color }}>{step.label}</span>
                            <span className="text-xs text-slate-500">{step.sub}</span>
                          </div>
                        </div>
                        {i < flowSteps.length - 1 && (
                          <div className="w-8 flex items-center justify-center mx-1">
                            <div className="w-full h-0.5 bg-deep-sea-light/50" />
                            <div className="absolute" style={{ marginLeft: '20px' }}>›</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-6 h-6 text-mood-sky" />隐私声明
          </h2>
          <GlassCard padding="lg">
            <div className="space-y-4">
              {privacyItems.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-deep-sea-dark/30 transition-all hover:bg-deep-sea-dark/50">
                  <div className="p-2.5 rounded-xl bg-mood-sky/10 text-mood-sky flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section>
          <h2 className="text-2xl font-display font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <Cat className="w-6 h-6 text-amber-orange" />使用说明
          </h2>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <FAQItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

        <footer className="text-center py-12 space-y-4 border-t border-deep-sea-light/20">
          <p className="text-lg text-slate-300 font-display">
            <Heart className="w-4 h-4 inline-block text-mood-coral mr-1" />
            以科学之名，倾听猫咪的心声
          </p>
          <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
            免责声明：本平台为科普与娱乐工具，情绪识别结果仅供参考，不构成任何专业判断。猫咪的行为和健康状况请咨询专业兽医，本平台不替代专业兽医建议。
          </p>
        </footer>
      </div>
  );
}
