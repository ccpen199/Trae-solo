import { useState } from 'react';
import {
  ChevronRight,
  Check,
  Bold,
  List,
  Heading1,
  Heading2,
  Heading3,
  Search,
  Plus,
  X,
  Upload,
  Eye,
  FileText,
  Briefcase,
  MapPin,
  Banknote,
  Clock,
  Monitor,
  TrendingUp,
  User,
  Phone,
  Building2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';

const stepNavItems = [
  { id: 1, title: '基本信息', desc: '岗位基础数据' },
  { id: 2, title: 'JD描述', desc: '岗位详情与福利' },
  { id: 3, title: '配置带教人', desc: '指定指导人' },
  { id: 4, title: '预览发布', desc: '确认并上线' },
];

const workTypes = [
  { id: 'onsite', label: '到岗实习', desc: '办公室办公' },
  { id: 'hybrid', label: '混合模式', desc: '灵活结合' },
  { id: 'remote', label: '远程实习', desc: '线上办公' },
];

const welfarePresets = [
  { id: 'w1', label: '实习补贴', variant: 'brand' as const },
  { id: 'w2', label: '转正机会', variant: 'brand' as const },
  { id: 'w3', label: '导师带教', variant: 'teal' as const },
  { id: 'w4', label: '免费三餐', variant: 'amber' as const },
  { id: 'w5', label: '住房补贴', variant: 'brand' as const },
  { id: 'w6', label: '交通补贴', variant: 'sky' as const },
  { id: 'w7', label: '通讯补贴', variant: 'sky' as const },
  { id: 'w8', label: '节日福利', variant: 'rose' as const },
  { id: 'w9', label: '健身房', variant: 'teal' as const },
  { id: 'w10', label: '下午茶', variant: 'amber' as const },
  { id: 'w11', label: '弹性工作制', variant: 'teal' as const },
  { id: 'w12', label: '项目奖金', variant: 'brand' as const },
  { id: 'w13', label: '团建活动', variant: 'rose' as const },
  { id: 'w14', label: '年度旅游', variant: 'sky' as const },
  { id: 'w15', label: '六险一金', variant: 'brand' as const },
  { id: 'w16', label: '定期体检', variant: 'teal' as const },
  { id: 'w17', label: '学习经费', variant: 'amber' as const },
  { id: 'w18', label: '大牛指导', variant: 'teal' as const },
  { id: 'w19', label: '落户机会', variant: 'brand' as const },
  { id: 'w20', label: '期权激励', variant: 'rose' as const },
  { id: 'w21', label: '员工折扣', variant: 'sky' as const },
  { id: 'w22', label: '生日福利', variant: 'rose' as const },
];

const mockMentors = [
  { id: 1, name: '张明远', position: '高级前端工程师', dept: '前端技术部', phone: '138****5678', avatar: '张' },
  { id: 2, name: '李思涵', position: '资深后端架构师', dept: '平台技术部', phone: '139****2345', avatar: '李' },
  { id: 3, name: '王昊然', position: '产品设计总监', dept: '产品设计部', phone: '137****8901', avatar: '王' },
  { id: 4, name: '陈雨欣', position: '数据分析主管', dept: '数据智能部', phone: '136****4567', avatar: '陈' },
  { id: 5, name: '刘子墨', position: '高级算法工程师', dept: 'AI研发部', phone: '135****0123', avatar: '刘' },
  { id: 6, name: '赵雅琳', position: '运营经理', dept: '市场运营部', phone: '134****6789', avatar: '赵' },
];

const agreementTemplates = [
  { id: 'tpl1', name: '标准实习协议模板_v3.2.pdf', isDefault: true },
  { id: 'tpl2', name: '技术岗专项实习协议.pdf', isDefault: false },
  { id: 'tpl3', name: '远程实习协议模板.pdf', isDefault: false },
];

export default function JobPublishPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    jobName: '',
    department: '',
    city: '',
    salaryMin: '',
    salaryMax: '',
    internshipMonths: '',
    workType: 'onsite',
    conversionRate: '',
    jdContent: '',
    selectedWelfare: [] as string[],
    selectedMentors: [1] as number[],
    selectedAgreement: 'tpl1',
  });

  const [addMentorOpen, setAddMentorOpen] = useState(false);
  const [newMentor, setNewMentor] = useState({ name: '', position: '', dept: '', phone: '' });
  const [mentorSearch, setMentorSearch] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const updateForm = <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleWelfare = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedWelfare: prev.selectedWelfare.includes(id)
        ? prev.selectedWelfare.filter((w) => w !== id)
        : [...prev.selectedWelfare, id],
    }));
  };

  const toggleMentor = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedMentors: prev.selectedMentors.includes(id)
        ? prev.selectedMentors.filter((m) => m !== id)
        : [...prev.selectedMentors, id],
    }));
  };

  const applyFormat = (format: string) => {
    const textarea = document.getElementById('jd-editor') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = formData.jdContent;
    const prefixes: Record<string, string> = {
      h1: '# ',
      h2: '## ',
      h3: '### ',
      bold: '**',
      list: '- ',
    };
    const prefix = prefixes[format];
    const before = value.substring(0, start);
    const selected = value.substring(start, end);
    const after = value.substring(end);
    const newText =
      format === 'bold'
        ? `${before}${prefix}${selected}${prefix}${after}`
        : `${before}${prefix}${selected}${after}`;
    updateForm('jdContent', newText);
  };

  const filteredMentors = mockMentors.filter(
    (m) =>
      m.name.includes(mentorSearch) ||
      m.position.includes(mentorSearch) ||
      m.dept.includes(mentorSearch)
  );

  const renderStepNav = () => (
    <Card className="mb-6 animate-fade-in-up overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-4 sm:px-8 py-5 bg-gradient-to-r from-cream-50 to-white">
          {stepNavItems.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                      isDone
                        ? 'bg-teal-gradient text-white shadow-[0_6px_16px_-4px_rgba(46,196,182,0.5)]'
                        : isActive
                        ? 'bg-brand-gradient text-white shadow-float scale-105'
                        : 'bg-ink-100 text-ink-400'
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : step.id}
                  </div>
                  <div className="text-center hidden sm:block">
                    <div
                      className={`text-sm font-semibold ${
                        isActive ? 'text-ink-900' : isDone ? 'text-teal-600' : 'text-ink-400'
                      }`}
                    >
                      {step.title}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5">{step.desc}</div>
                  </div>
                </div>
                {idx < stepNavItems.length - 1 && (
                  <div className="flex-1 mx-2 sm:mx-6 h-0.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-teal-gradient transition-all duration-500 ${
                        isDone ? 'w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const renderStep1 = () => (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-brand-500" />
          </div>
          填写岗位基本信息
        </CardTitle>
        <p className="text-sm text-ink-500 mt-1">基础信息将展示在岗位详情页首屏，请准确填写</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="岗位名称"
            placeholder="例：前端开发实习生"
            leftIcon={<Briefcase className="w-4 h-4" />}
            value={formData.jobName}
            onChange={(e) => updateForm('jobName', e.target.value)}
          />
          <Input
            label="所属部门"
            placeholder="例：前端技术部"
            leftIcon={<Building2 className="w-4 h-4" />}
            value={formData.department}
            onChange={(e) => updateForm('department', e.target.value)}
          />
          <Input
            label="工作城市"
            placeholder="例：上海市浦东新区"
            leftIcon={<MapPin className="w-4 h-4" />}
            value={formData.city}
            onChange={(e) => updateForm('city', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="薪资范围（元/天）"
              placeholder="最低"
              leftIcon={<Banknote className="w-4 h-4" />}
              value={formData.salaryMin}
              onChange={(e) => updateForm('salaryMin', e.target.value)}
            />
            <Input
              label=" "
              placeholder="最高"
              wrapperClassName="mt-6"
              value={formData.salaryMax}
              onChange={(e) => updateForm('salaryMax', e.target.value)}
            />
          </div>
          <Input
            label="实习期（月）"
            placeholder="例：6"
            leftIcon={<Clock className="w-4 h-4" />}
            value={formData.internshipMonths}
            onChange={(e) => updateForm('internshipMonths', e.target.value)}
            helperText="建议至少3个月以上"
          />
          <Input
            label="转正率预估（%）"
            placeholder="例：60"
            leftIcon={<TrendingUp className="w-4 h-4" />}
            value={formData.conversionRate}
            onChange={(e) => updateForm('conversionRate', e.target.value)}
            helperText="展示给学生，提升吸引力"
          />
        </div>
        <div className="mt-6">
          <label className="text-sm font-medium text-ink-700 ml-0.5 block mb-3">
            工作类型
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {workTypes.map((wt) => (
              <button
                key={wt.id}
                onClick={() => updateForm('workType', wt.id)}
                className={`p-4 rounded-xl2 border transition-all duration-200 text-left ${
                  formData.workType === wt.id
                    ? 'border-brand-300 bg-brand-50/60 shadow-glow ring-2 ring-brand-400/20'
                    : 'border-ink-200 hover:border-ink-300 bg-white hover:bg-cream-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      formData.workType === wt.id ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {wt.id === 'onsite' && <Monitor className="w-4.5 h-4.5" />}
                    {wt.id === 'hybrid' && <Building2 className="w-4.5 h-4.5" />}
                    {wt.id === 'remote' && <User className="w-4.5 h-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold text-sm ${
                        formData.workType === wt.id ? 'text-ink-900' : 'text-ink-700'
                      }`}
                    >
                      {wt.label}
                    </div>
                    <div className="text-xs text-ink-500 mt-0.5">{wt.desc}</div>
                  </div>
                  {formData.workType === wt.id && (
                    <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-500" />
            </div>
            岗位描述（JD）
          </CardTitle>
          <p className="text-sm text-ink-500 mt-1">使用下方工具栏快速格式化内容，提升岗位吸引力</p>
        </CardHeader>
        <CardContent>
          <div className="border border-ink-200 rounded-xl2 overflow-hidden bg-white focus-within:ring-2 focus-within:ring-brand-400/20 focus-within:border-brand-400 transition-all">
            <div className="flex items-center gap-1 px-3 py-2.5 border-b border-ink-100 bg-cream-50/70">
              {[
                { id: 'h1', icon: Heading1, label: 'H1' },
                { id: 'h2', icon: Heading2, label: 'H2' },
                { id: 'h3', icon: Heading3, label: 'H3' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => applyFormat(fmt.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-600 hover:bg-white hover:text-brand-600 hover:shadow-soft transition-all"
                  title={fmt.label}
                >
                  <fmt.icon className="w-4 h-4" />
                </button>
              ))}
              <div className="w-px h-5 bg-ink-200 mx-1" />
              <button
                onClick={() => applyFormat('bold')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-600 hover:bg-white hover:text-brand-600 hover:shadow-soft transition-all"
                title="加粗"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => applyFormat('list')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-600 hover:bg-white hover:text-brand-600 hover:shadow-soft transition-all"
                title="无序列表"
              >
                <List className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              <span className="text-xs text-ink-400 pr-2">
                支持 Markdown 简化语法
              </span>
            </div>
            <textarea
              id="jd-editor"
              value={formData.jdContent}
              onChange={(e) => updateForm('jdContent', e.target.value)}
              placeholder={`## 岗位职责
- 参与公司核心产品的前端开发工作
- 负责页面组件的设计、开发与优化
- 与产品、后端团队紧密配合，确保项目按期交付

## 任职要求
1. 计算机相关专业，本科及以上学历
2. 熟悉 **HTML/CSS/JavaScript** 基础
3. 有 React 或 Vue 项目经验者优先
4. 每周至少到岗 4 天，实习 6 个月以上`}
              className="w-full min-h-[280px] p-4 text-sm text-ink-800 placeholder:text-ink-300 outline-none resize-y leading-relaxed"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            福利待遇标签
          </CardTitle>
          <p className="text-sm text-ink-500 mt-1">
            已选择 {formData.selectedWelfare.length} 项，点击可添加或取消
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {welfarePresets.map((w) => {
              const isSelected = formData.selectedWelfare.includes(w.id);
              return (
                <Tag
                  key={w.id}
                  variant={w.variant}
                  size="sm"
                  onClick={() => toggleWelfare(w.id)}
                  className={`cursor-pointer transition-all duration-200 py-1.5 ${
                    isSelected
                      ? 'ring-2 ring-offset-1 ring-brand-400/40 scale-[1.02]'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {w.label}
                </Tag>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                <User className="w-4 h-4 text-sky-500" />
              </div>
              选择带教人
            </CardTitle>
            <p className="text-sm text-ink-500 mt-1">已选择 {formData.selectedMentors.length} 位带教人，可多选</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setAddMentorOpen(true)}>
            <Plus className="w-4 h-4" />
            新增带教人
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="搜索带教人姓名、职位或部门"
              leftIcon={<Search className="w-4 h-4" />}
              value={mentorSearch}
              onChange={(e) => setMentorSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMentors.map((mentor) => {
              const isSelected = formData.selectedMentors.includes(mentor.id);
              return (
                <div
                  key={mentor.id}
                  onClick={() => toggleMentor(mentor.id)}
                  className={`relative p-4 rounded-xl2 border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-teal-300 bg-teal-50/40 ring-2 ring-teal-400/20 shadow-card'
                      : 'border-ink-200 hover:border-ink-300 bg-white hover:bg-cream-50/50 hover:shadow-soft'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center shadow-soft">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center text-white font-bold shadow-soft shrink-0">
                      {mentor.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink-900 text-sm">{mentor.name}</div>
                      <div className="text-xs text-brand-600 font-medium mt-0.5">{mentor.position}</div>
                      <div className="text-xs text-ink-500 mt-1.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {mentor.dept}
                      </div>
                      <div className="text-xs text-ink-500 mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {mentor.phone}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Modal
        open={addMentorOpen}
        onClose={() => setAddMentorOpen(false)}
        title="新增带教人"
        description="录入带教人信息，以便分配到各岗位"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddMentorOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => setAddMentorOpen(false)}
            >
              确认添加
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Input
            label="带教人姓名"
            placeholder="请输入姓名"
            leftIcon={<User className="w-4 h-4" />}
            value={newMentor.name}
            onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
          />
          <Input
            label="职位"
            placeholder="例：高级前端工程师"
            leftIcon={<Briefcase className="w-4 h-4" />}
            value={newMentor.position}
            onChange={(e) => setNewMentor({ ...newMentor, position: e.target.value })}
          />
          <Input
            label="所属部门"
            placeholder="例：前端技术部"
            leftIcon={<Building2 className="w-4 h-4" />}
            value={newMentor.dept}
            onChange={(e) => setNewMentor({ ...newMentor, dept: e.target.value })}
          />
          <Input
            label="联系电话"
            placeholder="请输入手机号"
            leftIcon={<Phone className="w-4 h-4" />}
            value={newMentor.phone}
            onChange={(e) => setNewMentor({ ...newMentor, phone: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <Card className="animate-fade-in-up overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <Eye className="w-4 h-4 text-rose-500" />
              </div>
              岗位详情预览
            </CardTitle>
            <Badge variant="warn">预览模式</Badge>
          </div>
        </CardHeader>
        <div className="mx-5 mb-5 border border-ink-200 rounded-xl2 overflow-hidden bg-white">
          <div className="bg-gradient-to-br from-ink-50 to-cream-50 px-6 py-5 border-b border-ink-100">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-ink-900 tracking-tight">
                  {formData.jobName || '前端开发实习生'}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="salary">
                    <Banknote className="w-3 h-3" />
                    {formData.salaryMin || 200} - {formData.salaryMax || 350} 元/天
                  </Badge>
                  <Badge variant="city">
                    <MapPin className="w-3 h-3" />
                    {formData.city || '上海市浦东新区'}
                  </Badge>
                  <Badge variant="status">
                    <Clock className="w-3 h-3" />
                    实习 {formData.internshipMonths || '6'} 个月
                  </Badge>
                  <Badge variant="success">
                    <TrendingUp className="w-3 h-3" />
                    转正率 {formData.conversionRate || '60'}%
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant="verified">
                  <Check className="w-3 h-3" />
                  橙青科技有限公司
                </Badge>
                <span className="text-xs text-ink-500">{formData.department || '前端技术部'}</span>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-brand-gradient" />
                岗位福利
              </h4>
              <div className="flex flex-wrap gap-2">
                {(formData.selectedWelfare.length
                  ? welfarePresets.filter((w) => formData.selectedWelfare.includes(w.id))
                  : welfarePresets.slice(0, 6)
                ).map((w) => (
                  <Tag key={w.id} variant={w.variant} size="sm">
                    {w.label}
                  </Tag>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-2 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-teal-gradient" />
                岗位详情
              </h4>
              <div className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap bg-cream-50/50 p-4 rounded-xl border border-ink-100 min-h-[160px]">
                {formData.jdContent ||
                  `## 岗位职责
- 参与公司核心产品的前端开发工作
- 负责页面组件的设计、开发与优化
- 与产品、后端团队紧密配合，确保项目按期交付

## 任职要求
1. 计算机相关专业，本科及以上学历
2. 熟悉 HTML/CSS/JavaScript 基础
3. 有 React 或 Vue 项目经验者优先
4. 每周至少到岗 4 天，实习 6 个月以上`}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-sky-500" />
                带教团队（{formData.selectedMentors.length}人）
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mockMentors
                  .filter((m) => formData.selectedMentors.includes(m.id))
                  .map((mentor) => (
                    <div
                      key={mentor.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-sky-50/50 border border-sky-100"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {mentor.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-900 truncate">
                          {mentor.name}
                        </div>
                        <div className="text-xs text-ink-500 truncate">{mentor.position}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-ink-600" />
            </div>
            绑定实习协议模板
          </CardTitle>
          <p className="text-sm text-ink-500 mt-1">录用学生时将自动使用此模板发送协议</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agreementTemplates.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => updateForm('selectedAgreement', tpl.id)}
                className={`w-full p-4 rounded-xl2 border transition-all duration-200 flex items-center gap-4 text-left ${
                  formData.selectedAgreement === tpl.id
                    ? 'border-brand-300 bg-brand-50/50 ring-2 ring-brand-400/20'
                    : 'border-ink-200 hover:border-ink-300 hover:bg-cream-50/50'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    formData.selectedAgreement === tpl.id
                      ? 'bg-brand-gradient text-white'
                      : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-900 text-sm">{tpl.name}</span>
                    {tpl.isDefault && <Badge variant="brand" size="xs">推荐</Badge>}
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">上传于 2026-05-18 · 共 4 页</div>
                </div>
                {formData.selectedAgreement === tpl.id && (
                  <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
            <button className="w-full p-4 rounded-xl2 border-2 border-dashed border-ink-200 hover:border-brand-300 hover:bg-brand-50/30 flex items-center justify-center gap-2 text-ink-500 hover:text-brand-600 transition-all duration-200">
              <Upload className="w-4.5 h-4.5" />
              <span className="text-sm font-medium">上传新的协议模板</span>
            </button>
          </div>
        </CardContent>
        <div className="px-5 py-4 border-t border-ink-100 bg-cream-50/50">
          <Button variant="primary" size="lg" className="w-full" onClick={() => setShowPreview(true)}>
            <Upload className="w-4.5 h-4.5" />
            确认并发布岗位
          </Button>
        </div>
      </Card>

      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="发布成功！"
        description="岗位已成功上线，可在岗位列表中查看"
        size="sm"
        footer={
          <Button variant="primary" onClick={() => setShowPreview(false)}>
            知道了
          </Button>
        }
      >
        <div className="flex flex-col items-center py-6">
          <div className="w-20 h-20 rounded-full bg-teal-gradient flex items-center justify-center shadow-[0_12px_32px_-8px_rgba(46,196,182,0.5)] mb-4 animate-scale-in">
            <Check className="w-10 h-10 text-white" />
          </div>
          <div className="text-lg font-bold text-ink-900 mb-1">岗位已成功发布</div>
          <div className="text-sm text-ink-500 text-center">
            预计 24 小时内将收到首批简历投递
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50/60 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {renderStepNav()}

        <div className="animate-fade-in-up">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between mt-6 sticky bottom-4 z-20">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur border border-ink-100 shadow-soft">
            <span className="text-xs text-ink-500">完成度</span>
            <div className="w-32 h-2 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-ink-700 font-num">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button variant="outline" size="md" onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronRight className="w-4 h-4 rotate-180" />
                上一步
              </Button>
            )}
            {currentStep < 4 ? (
              <Button variant="primary" size="md" onClick={() => setCurrentStep(currentStep + 1)}>
                下一步
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button variant="secondary" size="md" onClick={() => setCurrentStep(1)}>
                重新开始
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
