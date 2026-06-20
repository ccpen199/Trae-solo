import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Building2,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';

interface HealthIndicator {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'high' | 'low';
}

interface ReportSection {
  title: string;
  indicators: HealthIndicator[];
}

interface ReportData {
  id: string;
  title: string;
  date: string;
  hospital: string;
  department: string;
  doctor: string;
  summary: string;
  advice: string[];
  sections: ReportSection[];
}

const mockReport: ReportData = {
  id: 'report_001',
  title: '年度体检报告',
  date: '2024-05-15',
  hospital: '市第一人民医院',
  department: '体检中心',
  doctor: '王医生',
  summary: '整体健康状况良好，血压略偏高，建议注意饮食和运动。',
  advice: [
    '建议低盐低脂饮食，每日食盐摄入量不超过6克',
    '每周进行至少150分钟中等强度有氧运动',
    '保持规律作息，避免熬夜',
    '建议每半年复查血压，关注血压变化',
  ],
  sections: [
    {
      title: '一般检查',
      indicators: [
        { id: '1', name: '身高', value: '175', unit: 'cm', referenceRange: '-', status: 'normal' },
        { id: '2', name: '体重', value: '68', unit: 'kg', referenceRange: '-', status: 'normal' },
        { id: '3', name: 'BMI指数', value: '22.2', unit: '', referenceRange: '18.5-23.9', status: 'normal' },
        { id: '4', name: '血压', value: '135/85', unit: 'mmHg', referenceRange: '90-140/60-90', status: 'high' },
      ],
    },
    {
      title: '血常规',
      indicators: [
        { id: '5', name: '白细胞计数', value: '6.8', unit: '×10⁹/L', referenceRange: '4.0-10.0', status: 'normal' },
        { id: '6', name: '红细胞计数', value: '5.2', unit: '×10¹²/L', referenceRange: '4.0-5.5', status: 'normal' },
        { id: '7', name: '血红蛋白', value: '145', unit: 'g/L', referenceRange: '120-160', status: 'normal' },
        { id: '8', name: '血小板计数', value: '220', unit: '×10⁹/L', referenceRange: '100-300', status: 'normal' },
      ],
    },
    {
      title: '血脂',
      indicators: [
        { id: '9', name: '总胆固醇', value: '5.8', unit: 'mmol/L', referenceRange: '<5.2', status: 'high' },
        { id: '10', name: '甘油三酯', value: '1.5', unit: 'mmol/L', referenceRange: '<1.7', status: 'normal' },
        { id: '11', name: '高密度脂蛋白', value: '1.2', unit: 'mmol/L', referenceRange: '>1.0', status: 'normal' },
        { id: '12', name: '低密度脂蛋白', value: '3.5', unit: 'mmol/L', referenceRange: '<3.4', status: 'high' },
      ],
    },
    {
      title: '肝功能',
      indicators: [
        { id: '13', name: '谷丙转氨酶', value: '35', unit: 'U/L', referenceRange: '0-40', status: 'normal' },
        { id: '14', name: '谷草转氨酶', value: '28', unit: 'U/L', referenceRange: '0-40', status: 'normal' },
        { id: '15', name: '总胆红素', value: '15', unit: 'μmol/L', referenceRange: '3.4-17.1', status: 'normal' },
      ],
    },
    {
      title: '肾功能',
      indicators: [
        { id: '16', name: '肌酐', value: '85', unit: 'μmol/L', referenceRange: '44-133', status: 'normal' },
        { id: '17', name: '尿素氮', value: '5.5', unit: 'mmol/L', referenceRange: '2.9-8.2', status: 'normal' },
        { id: '18', name: '尿酸', value: '380', unit: 'μmol/L', referenceRange: '150-420', status: 'normal' },
      ],
    },
    {
      title: '血糖',
      indicators: [
        { id: '19', name: '空腹血糖', value: '5.2', unit: 'mmol/L', referenceRange: '3.9-6.1', status: 'normal' },
      ],
    },
  ],
};

function IndicatorRow({ indicator }: { indicator: HealthIndicator }) {
  const statusConfig = {
    normal: {
      icon: CheckCircle2,
      color: 'text-success-400',
      bg: 'bg-success-500/10',
      label: '正常',
    },
    high: {
      icon: ArrowUp,
      color: 'text-danger-400',
      bg: 'bg-danger-500/10',
      label: '偏高',
    },
    low: {
      icon: ArrowDown,
      color: 'text-warning-400',
      bg: 'bg-warning-500/10',
      label: '偏低',
    },
  };

  const config = statusConfig[indicator.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors px-2 -mx-2 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>
        <span className="text-sm text-white">{indicator.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={cn('text-sm font-medium', indicator.status !== 'normal' ? config.color : 'text-white')}>
            {indicator.value}
            <span className="text-xs text-neutral-500 ml-1">{indicator.unit}</span>
          </p>
          <p className="text-xs text-neutral-500">参考范围：{indicator.referenceRange}</p>
        </div>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          config.bg,
          config.color
        )}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}

function SectionCard({ section }: { section: ReportSection }) {
  const [expanded, setExpanded] = useState(true);

  const abnormalCount = section.indicators.filter((i) => i.status !== 'normal').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-400" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-medium text-white">{section.title}</h3>
            <p className="text-xs text-neutral-500">
              共 {section.indicators.length} 项指标
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {abnormalCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning-500/10 text-warning-400">
            {abnormalCount} 项异常
          </span>
        )}
        <ArrowDown
          className={cn(
            'w-5 h-5 text-neutral-400 transition-transform duration-200',
            expanded && 'rotate-180'
          )}
        />
      </div>
      </button>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/5 px-4 py-2"
        >
          {section.indicators.map((indicator) => (
            <IndicatorRow key={indicator.id} indicator={indicator} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function HealthDetail() {
  const [report] = useState(mockReport);

  const handleBack = () => {
      console.log('返回');
    };

  const handleDownload = () => {
      console.log('下载报告');
    };

  const totalIndicators = report.sections.reduce((sum, s) => sum + s.indicators.length, 0);
  const abnormalIndicators = report.sections.reduce(
    (sum, s) => sum + s.indicators.filter((i) => i.status !== 'normal').length,
    0
  );

  return (
    <div className="p-6">
      <PageHeader
        title="体检报告详情"
        subtitle={report.title}
        breadcrumb={[{ title: '首页' }, { title: '健康档案' }, { title: '体检报告详情' }]}
        showBack
        onBack={handleBack}
        extra={
          <button
            onClick={handleDownload}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            下载PDF
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/20 to-success-500/20 flex items-center justify-center border border-primary-500/30">
                <FileText className="w-8 h-8 text-primary-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-1">{report.title}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {report.hospital}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {report.date}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.03]">
              <div className="text-center">
                <p className="text-2xl font-bold text-white mb-1">{totalIndicators}</p>
                <p className="text-xs text-neutral-500">总检测项</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success-400 mb-1">
                  {totalIndicators - abnormalIndicators}
                </p>
                <p className="text-xs text-neutral-500">正常项</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning-400 mb-1">{abnormalIndicators}</p>
                <p className="text-xs text-neutral-500">异常项</p>
              </div>
            </div>
          </motion.div>

          {report.sections.map((section) => (
            <SectionCard key={section.title} section={section} />
          ))}
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              医生诊断总结
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              {report.summary}
            </p>
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-neutral-500">
                体检医生：{report.doctor}
              </p>
              <p className="text-xs text-neutral-500">
                科室：{report.department}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-400" />
              健康建议
            </h3>
            <div className="space-y-3">
              {report.advice.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.03]"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-primary-400">{index + 1}</span>
                  </div>
                  <p className="text-sm text-neutral-300">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="glass-card p-6"
          >
            <h3 className="text-lg font-medium text-white mb-4">报告下载</h3>
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-primary-500/10 border border-primary-500/30 hover:bg-primary-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-white">完整体检报告</p>
                  <p className="text-xs text-neutral-500">PDF格式 · 2.5MB</p>
                </div>
                <Download className="w-5 h-5 text-primary-400" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
