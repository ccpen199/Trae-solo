import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Activity,
  Percent,
  AlertTriangle,
  Briefcase,
  Clock,
  Calculator,
  Sparkles,
  FileText,
  MessageSquare,
  Download,
  ArrowRight,
  Bot,
  Wrench,
  ShieldQuestion,
  Gavel,
  FileSignature,
  Landmark,
} from 'lucide-react';
import { Card, Tag, Button } from 'antd';
import { CALCULATOR_META, ROUTES } from '@/constants';
import { CalculatorType } from '@/types';
import { formatMoney } from '@/utils/format';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  Percent: <Percent className="w-6 h-6" />,
  AlertTriangle: <AlertTriangle className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Clock: <Clock className="w-6 h-6" />,
  Calculator: <Calculator className="w-6 h-6" />,
};

const toolCategories = [
  { key: 'calculator', name: '法律计算器', icon: <Calculator className="w-5 h-5" />, count: 7, color: 'primary' },
  { key: 'ai', name: 'AI 智能助手', icon: <Bot className="w-5 h-5" />, count: 1, color: 'gold' },
  { key: 'templates', name: '文书模板', icon: <FileText className="w-5 h-5" />, count: 120, color: 'success' },
  { key: 'tools', name: '实用工具', icon: <Wrench className="w-5 h-5" />, count: 15, color: 'warning' },
];

const sampleQuestions = [
  '劳动合同到期不续签，公司需要支付多少经济补偿？',
  '民间借贷年利率24%是否受法律保护？',
  '交通事故十级伤残能获得多少赔偿？',
  '开发商逾期交房，违约金如何计算？',
];

const popularTemplates = [
  { id: 1, name: '民事起诉状（合同纠纷）', category: '诉讼文书', downloads: 15680, icon: <FileSignature className="w-5 h-5" /> },
  { id: 2, name: '劳动合同模板', category: '合同范本', downloads: 12450, icon: <FileSignature className="w-5 h-5" /> },
  { id: 3, name: '离婚协议书', category: '婚姻家庭', downloads: 9870, icon: <FileSignature className="w-5 h-5" /> },
  { id: 4, name: '律师函模板', category: '法律文书', downloads: 8560, icon: <Gavel className="w-5 h-5" /> },
  { id: 5, name: '答辩状（民间借贷）', category: '诉讼文书', downloads: 7230, icon: <Landmark className="w-5 h-5" /> },
];

const categoryColorClass: Record<string, string> = {
  primary: 'from-primary-900 to-primary-700',
  gold: 'from-accent-gold-dark to-accent-gold',
  success: 'from-green-600 to-green-500',
  warning: 'from-yellow-600 to-yellow-500',
};

const ToolsCenter: React.FC = () => {
  const navigate = useNavigate();
  const calculators = Object.values(CALCULATOR_META);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-2xl primary-gradient p-8 lg:p-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-gold/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-gold/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            <span className="text-accent-gold text-sm font-medium">法律工具中心</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-4">
            专业法律工具，助您高效办案
          </h1>
          <p className="text-white/70 text-base mb-8 leading-relaxed">
            集成诉讼费计算、赔偿测算、AI法律咨询、海量文书模板等实用工具，一站式解决法律实务中的各类计算与文书需求
          </p>
          <div className="flex flex-wrap gap-4">
            {toolCategories.map((cat) => (
              <div
                key={cat.key}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3 hover:bg-white/15 transition-colors cursor-pointer"
                onClick={() => {
                  if (cat.key === 'calculator') navigate(ROUTES.TOOLS_CALCULATOR);
                  if (cat.key === 'ai') navigate(ROUTES.TOOLS_AI);
                  if (cat.key === 'templates') navigate(ROUTES.TOOLS_TEMPLATES);
                }}
              >
                <div className={cn(
                  'p-2 rounded-lg bg-gradient-to-br text-white',
                  categoryColorClass[cat.color]
                )}>
                  {cat.icon}
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{cat.name}</div>
                  <div className="text-white/50 text-xs">{cat.count} 项工具</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="lc-section-title !mb-0">
            <Calculator className="w-5 h-5 text-accent-gold" />
            <span>法律计算器</span>
          </div>
          <span
            className="text-sm text-primary-500 cursor-pointer hover:underline flex items-center gap-1"
            onClick={() => navigate(ROUTES.TOOLS_CALCULATOR)}
          >
            查看全部 <ArrowRight className="w-4 h-4" />
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {calculators.map((calc) => (
            <Card
              key={calc.type}
              className="lc-card border-0 hover:-translate-y-1 cursor-pointer transition-all duration-200 group"
              onClick={() => navigate(`${ROUTES.TOOLS_CALCULATOR}?type=${calc.type as CalculatorType}`)}
            >
              <div className="p-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 text-white group-hover:shadow-lg group-hover:shadow-primary-900/20 transition-shadow">
                    {iconMap[calc.icon]}
                  </div>
                  <Tag color="blue" className="!m-0 !text-xs">
                    {calc.legalBasis.length} 部法规
                  </Tag>
                </div>
                <h3 className="font-serif font-semibold text-base text-neutral-ink-900 mb-2 group-hover:text-primary-500 transition-colors">
                  {calc.name}
                </h3>
                <p className="text-sm text-neutral-ink-500 line-clamp-2 mb-4 min-h-[40px]">
                  {calc.description}
                </p>
                <Button
                  type="primary"
                  size="small"
                  className="!bg-primary-900 hover:!bg-primary-700"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  立即使用
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lc-card border-0 overflow-hidden">
          <div className="p-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-br from-accent-gold-dark to-accent-gold text-primary-900">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-semibold text-lg text-neutral-ink-900">AI 智能法律咨询</h3>
                <p className="text-sm text-neutral-ink-500">24小时在线，即时解答法律问题</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-neutral-ink-600 mb-2">试试这些问题：</p>
              {sampleQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-neutral-ink-50 hover:bg-primary-50/50 cursor-pointer transition-colors group"
                  onClick={() => navigate(ROUTES.TOOLS_AI)}
                >
                  <MessageSquare className="w-4 h-4 text-neutral-ink-400 mt-0.5 flex-shrink-0 group-hover:text-primary-500 transition-colors" />
                  <span className="text-sm text-neutral-ink-700 line-clamp-1 group-hover:text-primary-900 transition-colors">
                    {q}
                  </span>
                </div>
              ))}
            </div>

            <Button
              type="primary"
              size="large"
              block
              className="!bg-primary-900 hover:!bg-primary-700 !h-11"
              icon={<Sparkles className="w-4 h-4" />}
              onClick={() => navigate(ROUTES.TOOLS_AI)}
            >
              进入 AI 对话
            </Button>
          </div>
        </Card>

        <Card className="lc-card border-0 overflow-hidden">
          <div className="p-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-green-500 text-white">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-lg text-neutral-ink-900">热门文书模板</h3>
                  <p className="text-sm text-neutral-ink-500">累计下载超 50 万次</p>
                </div>
              </div>
              <span
                className="text-sm text-primary-500 cursor-pointer hover:underline flex items-center gap-1"
                onClick={() => navigate(ROUTES.TOOLS_TEMPLATES)}
              >
                更多 <ArrowRight className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1">
              {popularTemplates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-ink-50 cursor-pointer transition-colors group"
                  onClick={() => navigate(ROUTES.TOOLS_TEMPLATES)}
                >
                  <span className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    idx === 0 ? 'bg-accent-gold text-primary-900' :
                    idx === 1 ? 'bg-neutral-ink-300 text-neutral-ink-700' :
                    idx === 2 ? 'bg-yellow-700/20 text-yellow-700' :
                    'bg-neutral-ink-100 text-neutral-ink-500'
                  )}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-neutral-ink-900 truncate group-hover:text-primary-500 transition-colors">
                        {tpl.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="!m-0 !text-xs !py-0">{tpl.category}</Tag>
                      <span className="text-xs text-neutral-ink-400 flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {formatMoney(tpl.downloads, 0)}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-ink-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="lc-card border-0">
        <div className="p-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-500 text-white">
              <ShieldQuestion className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-lg text-neutral-ink-900">更多实用工具</h3>
              <p className="text-sm text-neutral-ink-500">法律实务辅助工具，持续更新中</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { name: '诉讼时效计算', icon: <Clock className="w-5 h-5" /> },
              { name: '证据清单生成', icon: <FileText className="w-5 h-5" /> },
              { name: '法条检索', icon: <Landmark className="w-5 h-5" /> },
              { name: '案例检索', icon: <Gavel className="w-5 h-5" /> },
              { name: '合同审查', icon: <FileSignature className="w-5 h-5" /> },
              { name: '刑期预测', icon: <Scale className="w-5 h-5" /> },
            ].map((tool, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-neutral-ink-100 hover:border-primary-200 hover:bg-primary-50/30 cursor-pointer transition-all group"
              >
                <div className="p-2.5 rounded-lg bg-neutral-ink-50 text-neutral-ink-500 group-hover:bg-primary-900 group-hover:text-white transition-colors">
                  {tool.icon}
                </div>
                <span className="text-sm font-medium text-neutral-ink-700 group-hover:text-primary-900 transition-colors text-center">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ToolsCenter;
