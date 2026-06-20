import { useState, useEffect, useCallback } from 'react';
import { PageLayout } from '@/components/layout';
import { Card, Button, SkillRadarChart, Badge, Modal } from '@/components/ui';
import { usePost } from '@/hooks/useApi';
import {
  Wand2,
  Target,
  MapPin,
  DollarSign,
  Clock,
  FileText,
  Send,
  Save,
  Plus,
  X,
  Building2,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { generateJobFromPainPoint, mockCompanies } from '@shared/mock/data';
import type { JobDescription, SkillRadar, IndustryType, ScheduleType, SalaryStructure } from '@shared/types';
import { INDUSTRY_LIST, SCHEDULE_OPTIONS, SKILL_DIMENSIONS } from '@shared/types';
import { cn } from '@/lib/utils';

interface FormData {
  title: string;
  industry: IndustryType;
  description: string;
  skillRadar: SkillRadar;
  scheduleFlexibility: ScheduleType;
  salary: SalaryStructure;
  location: string;
  requirements: string[];
  benefits: string[];
}

const initialFormData: FormData = {
  title: '',
  industry: 'hotel',
  description: '',
  skillRadar: {
    professional: 70,
    communication: 70,
    service: 70,
    teamwork: 70,
    stress: 70,
    learning: 70,
  },
  scheduleFlexibility: 'fixed',
  salary: {
    base: 5000,
    performance: 1000,
    commission: 500,
    benefits: ['五险一金', '节日福利'],
    currency: 'CNY',
  },
  location: '',
  requirements: [],
  benefits: [],
};

const useTypewriter = (text: string, speed: number = 30) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      setIsComplete(false);
      return;
    }

    setDisplayText('');
    setIsComplete(false);
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayText, isComplete };
};

const Label = ({ children, required = false }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-primary-700 mb-2">
    {children}
    {required && <span className="text-accent-500 ml-1">*</span>}
  </label>
);

const Input = ({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={cn(
      'w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200 text-neutral-700 placeholder-neutral-400',
      className
    )}
  />
);

const Textarea = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    className={cn(
      'w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200 text-neutral-700 placeholder-neutral-400 resize-none',
      className
    )}
  />
);

const ListEditor = ({
  items,
  onChange,
  placeholder,
  icon,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  icon: React.ReactNode;
}) => {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    if (inputValue.trim()) {
      onChange([...items, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {icon}
          </span>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="pl-10 pr-12"
          />
        </div>
        <Button onClick={addItem} variant="secondary" size="md">
          <Plus size={18} />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm group hover:bg-primary-100 transition-colors"
          >
            {item}
            <button
              onClick={() => removeItem(idx)}
              className="text-primary-400 hover:text-accent-500 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

const SkillSlider = ({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: string;
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-neutral-600">{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {value}
      </span>
    </div>
    <input
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-current"
      style={{ accentColor: color }}
    />
  </div>
);

const BenefitCheckbox = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-center gap-2.5 cursor-pointer group">
    <div
      className={cn(
        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
        checked
          ? 'bg-primary-500 border-primary-500'
          : 'border-neutral-300 group-hover:border-primary-400'
      )}
    >
      {checked && <CheckCircle2 size={14} className="text-white" />}
    </div>
    <span className="text-sm text-neutral-700">{label}</span>
  </label>
);

export default function JdCreator() {
  const [painPoint, setPainPoint] = useState('');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isGenerated, setIsGenerated] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successAction, setSuccessAction] = useState<'publish' | 'draft'>('publish');
  const [aiTypingText, setAiTypingText] = useState('');

  const { displayText, isComplete } = useTypewriter(aiTypingText, 25);

  const { mutate: generateJd, loading: isGenerating } = usePost<JobDescription, { painPoint: string }>(
    '/api/job/generate-jd'
  );

  const { mutate: publishJob, loading: isPublishing } = usePost<JobDescription, Partial<JobDescription>>(
    '/api/job/publish'
  );

  const { mutate: saveDraft, loading: isSaving } = usePost<JobDescription, Partial<JobDescription>>(
    '/api/job/draft'
  );

  const currentCompany = mockCompanies[0];

  const handleGenerate = useCallback(async () => {
    if (!painPoint.trim()) return;

    const generated = generateJobFromPainPoint(painPoint);

    setAiTypingText(
      `正在为您分析用人需求...\n\n行业：${INDUSTRY_LIST.find((i) => i.key === generated.industry)?.label}\n岗位：${generated.title}\n\n正在生成职位描述和技能要求...`
    );

    setTimeout(() => {
      setFormData({
        title: generated.title || '',
        industry: generated.industry || 'hotel',
        description: generated.description || '',
        skillRadar: generated.skillRadar || initialFormData.skillRadar,
        scheduleFlexibility: generated.scheduleFlexibility || 'fixed',
        salary: generated.salary || initialFormData.salary,
        location: currentCompany.address,
        requirements: generated.requirements || [],
        benefits: generated.benefits || [],
      });
      setIsGenerated(true);
      setAiTypingText('');
    }, 2000);
  }, [painPoint, currentCompany.address]);

  const handlePublish = async () => {
    setSuccessAction('publish');
    setShowSuccessModal(true);
  };

  const handleSaveDraft = async () => {
    setSuccessAction('draft');
    setShowSuccessModal(true);
  };

  const updateFormData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSkillRadar = (key: keyof SkillRadar, value: number) => {
    setFormData((prev) => ({
      ...prev,
      skillRadar: { ...prev.skillRadar, [key]: value },
    }));
  };

  const updateSalary = (key: keyof SalaryStructure, value: number | string[]) => {
    setFormData((prev) => ({
      ...prev,
      salary: { ...prev.salary, [key]: value },
    }));
  };

  const toggleSalaryBenefit = (benefit: string) => {
    const currentBenefits = formData.salary.benefits;
    const newBenefits = currentBenefits.includes(benefit)
      ? currentBenefits.filter((b) => b !== benefit)
      : [...currentBenefits, benefit];
    updateSalary('benefits', newBenefits);
  };

  const totalSalary = formData.salary.base + formData.salary.performance + formData.salary.commission;

  const skillColors = ['#1E3A5F', '#4ECDC4', '#FF6B6B', '#FFD93D', '#6BCB77', '#9B59B6'];

  const allBenefits = ['五险一金', '带薪年假', '节日福利', '年度体检', '免费食宿', '员工折扣', '培训补贴', '年终奖'];

  return (
    <PageLayout
      title="智能JD生成"
      subtitle="输入用人痛点，AI一键生成标准职位描述"
      rightAction={
        isGenerated && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleSaveDraft} loading={isSaving}>
              <Save size={18} />
              保存草稿
            </Button>
            <Button onClick={handlePublish} loading={isPublishing}>
              <Send size={18} />
              发布职位
            </Button>
          </div>
        )
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card padding="lg" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-mint-200/50 to-accent-200/50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-mint-400 rounded-xl">
                  <Wand2 className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-primary-800">描述您的用人需求</h3>
                  <p className="text-sm text-neutral-500">越详细，生成的职位描述越精准</p>
                </div>
              </div>
              <Textarea
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                placeholder="例如：急需3名有3年以上五星级酒店前厅经验的前台，能接受三班倒，英语流利优先"
                rows={5}
                className="text-base"
              />
              {aiTypingText && (
                <div className="mt-4 p-4 bg-gradient-to-r from-mint-50 to-primary-50 rounded-xl border border-mint-200">
                  <div className="flex items-start gap-3">
                    <Sparkles className="text-mint-500 flex-shrink-0 mt-0.5 animate-pulse" size={20} />
                    <pre className="text-sm text-primary-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {displayText}
                      {!isComplete && <span className="inline-block w-2 h-5 bg-primary-500 ml-1 animate-pulse" />}
                    </pre>
                  </div>
                </div>
              )}
              <Button
                onClick={handleGenerate}
                loading={isGenerating || !!aiTypingText}
                fullWidth
                size="lg"
                className="mt-4 bg-gradient-to-r from-primary-500 via-primary-600 to-mint-500 hover:from-primary-600 hover:via-primary-700 hover:to-mint-600"
                disabled={!painPoint.trim()}
              >
                <Sparkles size={20} />
                {isGenerating || aiTypingText ? 'AI正在生成中...' : '一键生成职位描述'}
              </Button>
            </div>
          </Card>

          {isGenerated && (
            <div className="space-y-6 animate-fade-in">
              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <FileText className="text-primary-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">基本信息</h3>
                </div>
                <div className="space-y-5">
                  <div>
                    <Label required>职位名称</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      placeholder="请输入职位名称"
                    />
                  </div>
                  <div>
                    <Label required>所属行业</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {INDUSTRY_LIST.map((industry) => (
                        <button
                          key={industry.key}
                          onClick={() => updateFormData('industry', industry.key)}
                          className={cn(
                            'px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200',
                            formData.industry === industry.key
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-neutral-200 text-neutral-600 hover:border-primary-300 hover:bg-primary-50/50'
                          )}
                        >
                          {industry.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label required>工作地点</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <Input
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        placeholder="请输入工作地点"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="text-mint-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">职位描述</h3>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="请输入职位描述..."
                  rows={6}
                />
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="text-accent-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">技能要求</h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    {SKILL_DIMENSIONS.map((dim, idx) => (
                      <SkillSlider
                        key={dim.key}
                        label={dim.label}
                        value={formData.skillRadar[dim.key as keyof SkillRadar]}
                        onChange={(value) => updateSkillRadar(dim.key as keyof SkillRadar, value)}
                        color={skillColors[idx]}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <SkillRadarChart data={formData.skillRadar} size={250} />
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <Clock className="text-primary-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">工作时间</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SCHEDULE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateFormData('scheduleFlexibility', option.value as ScheduleType)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all duration-200',
                        formData.scheduleFlexibility === option.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50'
                      )}
                    >
                      <Clock
                        className={cn(
                          'mx-auto mb-2',
                          formData.scheduleFlexibility === option.value ? 'text-primary-500' : 'text-neutral-400'
                        )}
                        size={24}
                      />
                      <span
                        className={cn(
                          'font-medium',
                          formData.scheduleFlexibility === option.value ? 'text-primary-700' : 'text-neutral-600'
                        )}
                      >
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <DollarSign className="text-mint-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">薪资结构</h3>
                </div>
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>基本工资</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">¥</span>
                        <Input
                          value={String(formData.salary.base)}
                          onChange={(e) => updateSalary('base', Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>绩效工资</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">¥</span>
                        <Input
                          value={String(formData.salary.performance)}
                          onChange={(e) => updateSalary('performance', Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>提成/奖金</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">¥</span>
                        <Input
                          value={String(formData.salary.commission)}
                          onChange={(e) => updateSalary('commission', Number(e.target.value))}
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>福利选项</Label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {allBenefits.map((benefit) => (
                        <BenefitCheckbox
                          key={benefit}
                          label={benefit}
                          checked={formData.salary.benefits.includes(benefit)}
                          onChange={() => toggleSalaryBenefit(benefit)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="text-accent-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">任职要求</h3>
                </div>
                <ListEditor
                  items={formData.requirements}
                  onChange={(items) => updateFormData('requirements', items)}
                  placeholder="添加一项任职要求，按回车确认"
                  icon={<CheckCircle2 size={16} />}
                />
              </Card>

              <Card padding="lg">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="text-mint-500" size={20} />
                  <h3 className="font-serif text-lg font-bold text-primary-800">公司福利</h3>
                </div>
                <ListEditor
                  items={formData.benefits}
                  onChange={(items) => updateFormData('benefits', items)}
                  placeholder="添加一项公司福利，按回车确认"
                  icon={<CheckCircle2 size={16} />}
                />
              </Card>
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-6 h-fit space-y-6">
          <Card padding="lg" className="bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-white/20 rounded-xl">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold">{currentCompany.name}</h3>
                <Badge variant="info" size="sm" className="bg-white/20 text-white border-white/30">
                  {INDUSTRY_LIST.find((i) => i.key === currentCompany.industry)?.label}
                </Badge>
              </div>
            </div>
            <div className="space-y-2 text-white/80 text-sm">
              <p className="flex items-center gap-2">
                <MapPin size={16} />
                {currentCompany.address}
              </p>
              <p className="flex items-center gap-2">
                <Users size={16} />
                联系人：{currentCompany.contactPerson}
              </p>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-lg font-bold text-primary-800">职位预览</h3>
              <Badge variant="primary">实时预览</Badge>
            </div>

            {isGenerated ? (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-primary-800 mb-2">
                    {formData.title || '职位名称'}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">
                      {INDUSTRY_LIST.find((i) => i.key === formData.industry)?.label}
                    </Badge>
                    <Badge variant="success">
                      {SCHEDULE_OPTIONS.find((s) => s.value === formData.scheduleFlexibility)?.label}
                    </Badge>
                    <Badge variant="warning">
                      ¥{totalSalary.toLocaleString()}/月
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl">
                  <h4 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} className="text-mint-500" />
                    工作地点
                  </h4>
                  <p className="text-neutral-600">{formData.location || '待填写'}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-700 mb-2 flex items-center gap-2">
                    <FileText size={16} className="text-primary-500" />
                    职位描述
                  </h4>
                  <p className="text-neutral-600 leading-relaxed whitespace-pre-wrap">
                    {formData.description || '暂无描述'}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                    <Target size={16} className="text-accent-500" />
                    技能画像
                  </h4>
                  <div className="flex justify-center">
                    <SkillRadarChart data={formData.skillRadar} size={220} />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-mint-50 to-primary-50 rounded-xl">
                  <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-mint-500" />
                    薪资构成
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">基本工资</span>
                      <span className="font-medium text-primary-700">¥{formData.salary.base.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">绩效工资</span>
                      <span className="font-medium text-mint-600">¥{formData.salary.performance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-600">提成/奖金</span>
                      <span className="font-medium text-accent-500">¥{formData.salary.commission.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-primary-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-primary-700">预计月收入</span>
                        <span className="font-bold text-xl text-primary-600">¥{totalSalary.toLocaleString()}</span>
                      </div>
                    </div>
                    {formData.salary.benefits.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <span className="text-sm text-neutral-500 mb-2 block">其他福利</span>
                        <div className="flex flex-wrap gap-1.5">
                          {formData.salary.benefits.map((b, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white text-primary-600 text-xs rounded-full"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formData.requirements.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                      <Target size={16} className="text-accent-500" />
                      任职要求
                    </h4>
                    <ul className="space-y-2">
                      {formData.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-neutral-600">
                          <CheckCircle2 size={18} className="text-mint-500 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.benefits.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary-700 mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-mint-500" />
                      公司福利
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((benefit, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-gradient-to-r from-mint-100 to-primary-100 text-primary-700 rounded-full text-sm font-medium"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-100 to-mint-100 rounded-full flex items-center justify-center">
                  <Wand2 className="text-primary-400" size={32} />
                </div>
                <p className="text-neutral-500">输入用人需求后，这里将实时显示生成的职位预览</p>
              </div>
            )}
          </Card>

          {isGenerated && (
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={handleSaveDraft} loading={isSaving} size="lg">
                <Save size={20} />
                保存草稿
              </Button>
              <Button fullWidth onClick={handlePublish} loading={isPublishing} size="lg">
                <Send size={20} />
                发布职位
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        size="md"
        title={successAction === 'publish' ? '发布成功' : '保存成功'}
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSuccessModal(false)}>
              继续编辑
            </Button>
            <Button onClick={() => setShowSuccessModal(false)}>
              {successAction === 'publish' ? '查看职位' : '查看草稿'}
            </Button>
          </div>
        }
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-mint-400 to-primary-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-white" size={40} />
          </div>
          <h3 className="font-serif text-xl font-bold text-primary-800 mb-2">
            {successAction === 'publish' ? '职位发布成功！' : '草稿保存成功！'}
          </h3>
          <p className="text-neutral-500">
            {successAction === 'publish'
              ? '您的职位已成功发布，正在为您匹配候选人...'
              : '您的职位草稿已保存，可随时继续编辑'}
          </p>
        </div>
      </Modal>
    </PageLayout>
  );
}
