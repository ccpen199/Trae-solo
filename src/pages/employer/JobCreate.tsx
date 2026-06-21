import { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  PlusCircle,
  MapPin,
  Clock,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Utensils,
  ShoppingBag,
  Home,
  Truck,
  Shield,
  MoreHorizontal,
} from 'lucide-react';
import { useStore } from '@/store';
import { mockJobs, mockResumes, mockApplications, mockInterviews, mockAnalyticsData, mockCompanies, mockVerificationRecords } from '@/mock/data';
import Tag from '@/components/ui/Tag';
import { formatSalary } from '@/utils/helpers';
import type { IndustryType, WorkHours } from '@/../shared/types';

const industries = [
  { id: 'restaurant', name: '餐饮', icon: Utensils, color: 'bg-orange-500' },
  { id: 'retail', name: '零售', icon: ShoppingBag, color: 'bg-blue-500' },
  { id: 'housekeeping', name: '家政', icon: Home, color: 'bg-purple-500' },
  { id: 'logistics', name: '物流', icon: Truck, color: 'bg-green-500' },
  { id: 'security', name: '安保', icon: Shield, color: 'bg-red-500' },
  { id: 'other', name: '其他', icon: MoreHorizontal, color: 'bg-gray-500' },
];

const days = [
  { id: 1, name: '周一' },
  { id: 2, name: '周二' },
  { id: 3, name: '周三' },
  { id: 4, name: '周四' },
  { id: 5, name: '周五' },
  { id: 6, name: '周六' },
  { id: 0, name: '周日' },
];

const presetTags = ['包住', '包吃', '日结', '健康证', '经验不限', '学历不限', '就近分配', '五险一金', '弹性排班', '培训上岗', '加班补贴', '节日福利'];

const presetBenefits = ['包工作餐', '员工折扣', '五险一金', '带薪培训', '加班补贴', '节日福利', '全勤奖', '年终奖', '交通补贴', '住房补贴', '高温补贴', '夜班补贴'];

export default function JobCreate() {
  const { setJobs, setCompany, setVerificationRecord, addJob } = useStore();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    hours: true,
    requirements: true,
    benefits: true,
    tags: true,
  });

  const [formData, setFormData] = useState({
    title: '',
    salaryMin: '',
    salaryMax: '',
    salaryType: 'monthly' as 'hourly' | 'daily' | 'monthly',
    location: '',
    description: '',
  });

  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [workHours, setWorkHours] = useState<WorkHours[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  useEffect(() => {
    setCompany(mockCompanies[0]);
    setVerificationRecord(mockVerificationRecords[0]);
  }, [setCompany, setVerificationRecord]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const addWorkHours = () => {
    if (selectedDays.length === 0) return;
    const newHours: WorkHours[] = selectedDays.map(day => ({
      day,
      startTime,
      endTime,
    }));
    setWorkHours(prev => [...prev, ...newHours]);
    setSelectedDays([]);
  };

  const removeWorkHours = (index: number) => {
    setWorkHours(prev => prev.filter((_, i) => i !== index));
  };

  const addRequirement = () => {
    setRequirements(prev => [...prev, '']);
  };

  const updateRequirement = (index: number, value: string) => {
    setRequirements(prev => prev.map((r, i) => (i === index ? value : r)));
  };

  const removeRequirement = (index: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const toggleBenefit = (benefit: string) => {
    setBenefits(prev =>
      prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = () => {
    if (!selectedIndustry) {
      alert('请选择行业');
      return;
    }
    if (!formData.title || !formData.salaryMin || !formData.salaryMax || !formData.location) {
      alert('请填写完整的基本信息');
      return;
    }

    const newJob = {
      id: `job-${Date.now()}`,
      companyId: 'comp-001',
      companyName: '味千餐饮管理有限公司',
      title: formData.title,
      industry: selectedIndustry,
      salaryMin: Number(formData.salaryMin),
      salaryMax: Number(formData.salaryMax),
      salaryType: formData.salaryType,
      location: formData.location,
      longitude: 121.5256,
      latitude: 31.2337,
      workHours,
      description: formData.description,
      requirements: requirements.filter(r => r.trim()),
      benefits,
      status: 'draft' as const,
      reviewStatus: 'pending' as const,
      tags: selectedTags,
      createdAt: new Date().toISOString(),
    };

    addJob(newJob);
    alert('岗位创建成功！');
    window.history.back();
  };

  const previewJob = {
    ...formData,
    salaryMin: Number(formData.salaryMin) || 0,
    salaryMax: Number(formData.salaryMax) || 0,
    title: formData.title || '岗位名称',
    location: formData.location || '工作地点',
    workHours,
    requirements: requirements.filter(r => r.trim()),
    benefits,
    tags: selectedTags,
  };

  const getDayName = (day: number) => days.find(d => d.id === day)?.name || '';

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布新岗位</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">选择行业模板</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {industries.map(ind => {
                const Icon = ind.icon;
                const isSelected = selectedIndustry === ind.id;
                return (
                  <button
                    key={ind.id}
                    onClick={() => setSelectedIndustry(ind.id as IndustryType)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${ind.color} flex items-center justify-center text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{ind.name}</span>
                    {isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('basic')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">基本信息</span>
              </div>
              {expandedSections.basic ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSections.basic && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">岗位名称</label>
                  <input
                    type="text"
                    placeholder="如：餐饮服务员"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最低薪资</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.salaryMin}
                        onChange={e => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最高薪资</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.salaryMax}
                        onChange={e => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">薪资类型</label>
                    <select
                      value={formData.salaryType}
                      onChange={e => setFormData(prev => ({ ...prev, salaryType: e.target.value as 'hourly' | 'daily' | 'monthly' }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="hourly">元/时</option>
                      <option value="daily">元/天</option>
                      <option value="monthly">元/月</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工作地点</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="请输入详细地址"
                      value={formData.location}
                      onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">岗位描述</label>
                  <textarea
                    rows={4}
                    placeholder="请详细描述岗位的工作内容和职责"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('hours')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">工作时段</span>
              </div>
              {expandedSections.hours ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSections.hours && (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">选择日期</label>
                  <div className="flex flex-wrap gap-2">
                    {days.map(day => (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDays.includes(day.id)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={addWorkHours}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      添加时段
                    </button>
                  </div>
                </div>
                {workHours.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">已添加时段</p>
                    <div className="flex flex-wrap gap-2">
                      {workHours.map((wh, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm text-gray-700">
                            {getDayName(wh.day)} {wh.startTime}-{wh.endTime}
                          </span>
                          <button
                            onClick={() => removeWorkHours(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('requirements')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">岗位要求</span>
              </div>
              {expandedSections.requirements ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSections.requirements && (
              <div className="p-6 space-y-3">
                {requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="请输入岗位要求"
                      value={req}
                      onChange={e => updateRequirement(index, e.target.value)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => removeRequirement(index)}
                      className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addRequirement}
                  className="flex items-center gap-2 text-primary text-sm hover:text-primary/80"
                >
                  <PlusCircle className="h-4 w-4" />
                  添加要求
                </button>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('benefits')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-gray-900">福利待遇</span>
              </div>
              {expandedSections.benefits ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSections.benefits && (
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {presetBenefits.map(benefit => (
                    <button
                      key={benefit}
                      onClick={() => toggleBenefit(benefit)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        benefits.includes(benefit)
                          ? 'bg-success text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {benefit}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection('tags')}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Tag label="" />
                <span className="font-semibold text-gray-900">岗位标签</span>
              </div>
              {expandedSections.tags ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
            {expandedSections.tags && (
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {presetTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="自定义标签"
                    value={customTag}
                    onChange={e => setCustomTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    onClick={addCustomTag}
                    className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    添加
                  </button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTags.map((tag, index) => (
                      <Tag
                        key={index}
                        label={tag}
                        color="orange"
                        onClose={() => toggleTag(tag)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              保存并发布
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">实时预览</h2>
            <div className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{previewJob.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {mockCompanies[0].name}
                  </p>
                </div>
                <span className="text-accent font-bold text-lg">
                  {formatSalary(previewJob.salaryMin, previewJob.salaryMax, previewJob.salaryType)}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {previewJob.tags.map((tag, i) => (
                  <Tag key={i} label={tag} color="orange" />
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{previewJob.location}</span>
                </div>
                {previewJob.workHours.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      {previewJob.workHours.slice(0, 3).map(wh => getDayName(wh.day)).join('、')}
                      {previewJob.workHours.length > 3 && `等${previewJob.workHours.length}天`}
                    </span>
                  </div>
                )}
              </div>

              {previewJob.requirements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">岗位要求</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {previewJob.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {previewJob.benefits.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">福利待遇</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {previewJob.benefits.map((benefit, i) => (
                      <span key={i} className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {previewJob.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">岗位描述</h4>
                  <p className="text-sm text-gray-600">{previewJob.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
