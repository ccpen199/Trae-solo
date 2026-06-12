import { useState } from 'react';
import {
  Sparkles,
  Upload,
  FileText,
  Import,
  Loader2,
  ArrowRightLeft,
  FileDown,
  CheckCircle2,
  Lightbulb,
  Target,
  Zap,
  AlertCircle,
  Award,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const suggestions = [
  { id: 1, type: 'highlight', title: '量化成果', desc: '项目描述中加入了具体数字（提升40%、日活500+），使成果更具说服力。' },
  { id: 2, type: 'keyword', title: '关键词匹配', desc: '补充了React/TypeScript/性能优化等JD高频词，ATS通过率+35%。' },
  { id: 3, type: 'structure', title: '结构优化', desc: '按STAR法则重写项目经历，突出"行动-结果"逻辑链。' },
  { id: 4, type: 'language', title: '语言升级', desc: '将"负责"改为"主导/设计/优化"等强动词，专业度提升。' },
  { id: 5, type: 'format', title: '排版建议', desc: '建议控制在1页内，字号10.5pt，留白均衡更易阅读。' },
];

const originalResume = `李思远
浙江大学 计算机科学与技术 | GPA 3.8/4.0
电话：138****8888 | 邮箱：lsy@email.com

【实习经历】
1. 某科技公司 前端实习生
负责公司后台系统开发，做了很多页面，完成了领导交代的任务，大家评价不错。

2. 某创业公司 全栈实习生
做了一个小程序项目，用了React和Node，功能包括发布、搜索、聊天等。

【项目经历】
1. 电商平台
负责后台管理系统，用了React和Ant Design，效果还可以。

【技能】
会React、Vue、JavaScript、TypeScript，了解一些后端知识。`;

const optimizedResume = `李思远
浙江大学 计算机科学与技术（2022级） | GPA 3.8/4.0 一等奖学金×2
📍 杭州/上海/深圳 | 📞 138****8888 | ✉️ lsy@email.com | GitHub: github.com/lsy-dev

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 求职意向：前端开发 / 全栈开发 / AI应用开发
期望薪资：15K-25K/月 | 可入职：2025年7月

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 实习经历
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【字节跳动】前端开发实习生（抖音电商）| 2024.07-2024.09
• 主导商品管理与订单中心2大核心模块前端架构设计，日均支撑10万+运营请求
• 采用React.lazy+虚拟滚动优化首屏加载，FCP从3.2s降至1.9s，性能提升40%
• 搭建组件库12个通用组件，团队复用率85%，节省开发工时约60人天

【创业公司A】全栈开发实习生 | 2024.03-2024.06
• 从零搭建校园二手交易小程序，服务本校5000+学生，日活峰值520+
• 技术栈：Taro + Node.js + MongoDB + Redis，设计RESTful API共48个
• 获校级创新创业大赛银奖，团队规模4人担任队长

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 项目经历
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【电商平台后台管理系统】| 2024.07-2024.09 | React + TypeScript + AntD + Redux
• 负责商品/订单/权限3大模块，代码量1.2万行，代码评审得分Top10%
• 设计权限路由体系，支持RBAC多级权限管控，安全性显著提升
• AB实验优化表单提交流程，操作成功率从82%提升至94%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠 技术栈
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
前端：React / Vue3 / TypeScript / Next.js / Tailwind CSS / Webpack
后端：Node.js / Express / MySQL / MongoDB / Redis
工具：Git / Docker / Jest / Figma / Linux
方向：性能优化 · 工程化 · 组件库设计 · AI应用开发`;

export default function ResumeToolPage() {
  const [jdText, setJdText] = useState(`【字节跳动-抖音电商-前端开发实习生】
岗位职责：
1. 负责电商业务线后台管理系统的前端开发与维护
2. 参与前端工程化建设，优化开发流程与性能
3. 与产品、设计、后端紧密协作，推动业务落地

任职要求：
1. 本科及以上学历，计算机相关专业
2. 精通React/TypeScript，熟悉主流前端框架
3. 有实际项目经验，性能优化经验者优先
4. 良好的沟通能力和团队协作精神
5. 每周实习4天以上，持续3个月+`);

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const startOptimize = () => {
    setIsOptimizing(true);
    setProgress(0);
    setShowResult(false);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setIsOptimizing(false);
          setShowResult(true);
          return 100;
        }
        return p + 3.3;
      });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl space-y-6">
        <div className="animate-fade-in-up flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-amber-400 text-white flex items-center justify-center shadow-float">
            <Sparkles size={26} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink-900">AI简历智能优化</h1>
            <p className="text-sm text-ink-500">基于岗位JD精准匹配关键词，全方位提升简历竞争力</p>
          </div>
          <Button variant="outline" size="md">
            <FileDown size={16} />
            历史记录
          </Button>
        </div>

        <div className="grid md:grid-cols-5 gap-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base">
                  <Target className="text-brand-500" size={20} />
                  目标岗位 JD
                </span>
                <span className="text-xs font-normal text-ink-400">{jdText.length}/2000 字</span>
              </CardTitle>
              <p className="text-xs text-ink-500">粘贴完整JD效果更佳，建议包含岗位职责与任职要求</p>
            </CardHeader>
            <CardContent className="pt-0">
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="请粘贴目标岗位的完整JD描述，包括岗位职责、任职要求等..."
                className="w-full min-h-[280px] p-4 rounded-xl2 bg-cream-50 border border-ink-200 text-sm text-ink-800 placeholder:text-ink-300 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 transition-all resize-y leading-relaxed"
              />
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Import size={14} />
                  一键导入我的实习档案
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="text-teal-500" size={20} />
                我的简历
              </CardTitle>
              <p className="text-xs text-ink-500">上传或从实习档案提取</p>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="border-2 border-dashed border-ink-200 rounded-xl2 p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all min-h-[140px]">
                <Upload size={28} className="text-ink-400" />
                <p className="text-sm text-ink-600 font-medium text-center">
                  拖拽简历文件到此处<br />或点击上传
                </p>
                <p className="text-xs text-ink-400">支持 PDF / Word，≤20MB</p>
              </div>
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-ink-100" />
                <span className="text-xs text-ink-400 px-2">或</span>
                <div className="flex-1 h-px bg-ink-100" />
              </div>
              <Button variant="secondary" size="md" className="w-full">
                <Import size={15} />
                从实习档案提取
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="animate-fade-in-up flex flex-col items-center" style={{ animationDelay: '0.15s' }}>
          <Button
            variant="primary"
            size="lg"
            loading={isOptimizing}
            onClick={startOptimize}
            disabled={isOptimizing}
            className="min-w-[240px] text-lg h-14"
          >
            {isOptimizing ? (
              'AI 优化中...'
            ) : (
              <>
                <Sparkles size={20} />
                一键智能优化
              </>
            )}
          </Button>

          {isOptimizing && (
            <div className="mt-5 w-full max-w-lg animate-fade-in">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-ink-600 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-brand-500" />
                  AI 正在深度分析简历与 JD 匹配度...
                </span>
                <span className="font-bold text-brand-600 font-num">{Math.min(100, Math.round(progress))}%</span>
              </div>
              <div className="h-3 bg-ink-100 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 via-amber-400 to-teal-400 rounded-full transition-all duration-100 relative overflow-hidden"
                  style={{ width: `${Math.min(100, progress)}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <div className="mt-3 flex justify-between text-[10px] text-ink-400">
                <span>解析JD</span>
                <span>关键词匹配</span>
                <span>内容优化</span>
                <span>生成报告</span>
              </div>
            </div>
          )}
        </div>

        {showResult && (
          <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.2s' }}>
            <div className="grid md:grid-cols-4 gap-3">
              <ResultStat label="匹配度提升" value="+38%" hint="从54% → 92%" color="brand" icon={<Target size={16} />} />
              <ResultStat label="关键词覆盖" value="+47个" hint="ATS通过率↑" color="teal" icon={<Zap size={16} />} />
              <ResultStat label="可读性评分" value="A+" hint="结构清晰专业" color="sky" icon={<Award size={16} />} />
              <ResultStat label="预计通过率" value="×2.4倍" hint="对比优化前" color="amber" icon={<Trend />} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="text-brand-500" size={20} />
                  优化前后对比
                </CardTitle>
                <p className="text-sm text-ink-500">绿色高亮为新增/优化内容</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">原始版本</Badge>
                      <span className="text-xs text-ink-400">匹配度 54%</span>
                    </div>
                    <div className="h-[420px] overflow-y-auto rounded-xl border border-ink-100 bg-white p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap text-ink-600">
                      {originalResume}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="verified">AI 优化版本</Badge>
                      <span className="text-xs text-teal-600 font-semibold">匹配度 92%</span>
                    </div>
                    <div className="h-[420px] overflow-y-auto rounded-xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/30 p-4 text-xs leading-relaxed font-mono whitespace-pre-wrap text-ink-800">
                      {optimizedResume.split('\n').map((line, i) => (
                        <div
                          key={i}
                          className={
                            /^(【|•|📍|🎯|💼|🚀|🛠|━━━|📞|✉️)/.test(line)
                              ? 'bg-teal-100/60 text-teal-800 -mx-1 px-1 rounded'
                              : line.includes('%') || line.includes('+') || /\d/.test(line)
                              ? 'bg-amber-100/40 text-amber-800 -mx-1 px-1 rounded'
                              : ''
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="text-amber-500" size={20} />
                  AI 优化建议（5条）
                </CardTitle>
                <p className="text-sm text-ink-500">针对性建议，持续提升简历质量</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-cream-50 to-white border border-ink-100 hover:border-brand-200 transition-all animate-fade-in-up"
                      style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                    >
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-brand-400 to-amber-400 text-white flex items-center justify-center font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-ink-900">{s.title}</h4>
                          <Badge variant={s.type === 'highlight' ? 'verified' : s.type === 'keyword' ? 'brand' : 'info'} size="xs">
                            {s.type === 'highlight' ? '重要' : s.type === 'keyword' ? '核心' : '建议'}
                          </Badge>
                        </div>
                        <p className="text-sm text-ink-600 leading-relaxed">{s.desc}</p>
                      </div>
                      <CheckCircle2 size={20} className="text-teal-500 shrink-0 mt-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 pb-6">
              <Button variant="outline" size="lg">
                <AlertCircle size={18} />
                继续优化
              </Button>
              <Button variant="primary" size="lg" className="min-w-[200px] h-14 text-base">
                <FileDown size={18} />
                导出 PDF 简历
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Trend() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function ResultStat({ label, value, hint, color, icon }: { label: string; value: string; hint: string; color: string; icon: any }) {
  const colorMap: Record<string, string> = {
    brand: 'from-brand-400 to-amber-400 text-brand-600 bg-brand-50',
    teal: 'from-teal-400 to-sky-400 text-teal-600 bg-teal-50',
    sky: 'from-sky-400 to-blue-400 text-sky-600 bg-sky-50',
    amber: 'from-amber-400 to-orange-400 text-amber-600 bg-amber-50',
  };
  const [grad, text, bg] = colorMap[color].split(' ');
  return (
    <Card hoverable>
      <CardContent className="p-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} text-white flex items-center justify-center mb-3 shadow`}>
          {icon}
        </div>
        <p className="text-xs text-ink-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold font-num ${text}`}>{value}</p>
        <p className="text-[10px] text-ink-400 mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}
