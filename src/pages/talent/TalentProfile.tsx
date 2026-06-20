import { useState, useEffect, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, Badge, Button, SkillRadarChart, Modal } from '@/components/ui';
import { mockTalents } from '@shared/mock/data';
import { INDUSTRY_LIST, SKILL_DIMENSIONS } from '@shared/types';
import type { TalentProfile, Certificate, SkillRadar, IndustryType, ScheduleType } from '@shared/types';
import { Camera, Upload, Plus, Award, Video, MapPin, Target, Save, CheckCircle, X, Briefcase, Clock, User, Phone, Mail, DollarSign, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

const mockWorkExperiences: WorkExperience[] = [
  {
    id: 'exp-001',
    company: '上海外滩华尔道夫酒店',
    role: '前台接待主管',
    startDate: '2021-03',
    endDate: '至今',
    description: '负责前台团队管理，客户接待与投诉处理，带领5人团队实现客户满意度95%以上。'
  },
  {
    id: 'exp-002',
    company: '上海虹桥万豪酒店',
    role: '前台接待员',
    startDate: '2019-07',
    endDate: '2021-02',
    description: '负责宾客入住退房手续办理，提供 concierge 服务，多次获得月度服务之星。'
  },
  {
    id: 'exp-003',
    company: '洲际酒店集团',
    role: '实习生',
    startDate: '2018-12',
    endDate: '2019-06',
    description: '参与酒店运营各部门轮岗实习，了解酒店整体运作流程。'
  }
];

const currentTalent = mockTalents[0];

export default function TalentProfilePage() {
  const [profile, setProfile] = useState<TalentProfile>(currentTalent);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const completeness = 85;
  const missingItems = ['视频简历', '工作经历证明材料', '学历证书'];

  const [skillValues, setSkillValues] = useState<SkillRadar>(profile.skillRadar);
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(mockWorkExperiences);
  const [newExperience, setNewExperience] = useState<Partial<WorkExperience>>({});
  const [newCertificate, setNewCertificate] = useState<Partial<Certificate>>({});
  const [newTag, setNewTag] = useState('');
  const [newScenario, setNewScenario] = useState('');
  const [expectedPosition, setExpectedPosition] = useState(['前台接待', '宾客服务', '客户关系']);
  const [newPosition, setNewPosition] = useState('');
  const [workType, setWorkType] = useState<ScheduleType[]>(['shift', 'flexible']);
  const [preferredLocations, setPreferredLocations] = useState(['上海市', '杭州市', '苏州市']);
  const [newLocation, setNewLocation] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleProfileChange = (field: keyof TalentProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    triggerAutoSave();
  };

  const handleSkillChange = (key: keyof SkillRadar, value: number) => {
    setSkillValues(prev => ({ ...prev, [key]: value }));
    triggerAutoSave();
  };

  const triggerAutoSave = () => {
    setAutoSaveStatus('unsaved');
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      setTimeout(() => {
        setAutoSaveStatus('saved');
      }, 800);
    }, 1500);
  };

  const handleAddExperience = () => {
    if (newExperience.company && newExperience.role) {
      const exp: WorkExperience = {
        id: `exp-${Date.now()}`,
        company: newExperience.company,
        role: newExperience.role,
        startDate: newExperience.startDate || '',
        endDate: newExperience.endDate || '至今',
        description: newExperience.description || ''
      };
      setWorkExperiences(prev => [exp, ...prev]);
      setNewExperience({});
      setExpModalOpen(false);
      triggerAutoSave();
    }
  };

  const handleAddCertificate = () => {
    if (newCertificate.name && newCertificate.issuer) {
      const cert: Certificate = {
        id: `cert-${Date.now()}`,
        name: newCertificate.name,
        issuer: newCertificate.issuer,
        issueDate: newCertificate.issueDate ? new Date(newCertificate.issueDate) : new Date(),
        verified: false
      };
      setProfile(prev => ({
        ...prev,
        certificates: [...prev.certificates, cert]
      }));
      setNewCertificate({});
      setCertModalOpen(false);
      triggerAutoSave();
    }
  };

  const handleAddTag = () => {
    if (newTag && !profile.tags.includes(newTag)) {
      handleProfileChange('tags', [...profile.tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleProfileChange('tags', profile.tags.filter(t => t !== tag));
  };

  const handleAddScenario = () => {
    if (newScenario && !profile.serviceScenarios.includes(newScenario)) {
      handleProfileChange('serviceScenarios', [...profile.serviceScenarios, newScenario]);
      setNewScenario('');
    }
  };

  const handleRemoveScenario = (scenario: string) => {
    handleProfileChange('serviceScenarios', profile.serviceScenarios.filter(s => s !== scenario));
  };

  const handleAddPosition = () => {
    if (newPosition && !expectedPosition.includes(newPosition)) {
      setExpectedPosition(prev => [...prev, newPosition]);
      setNewPosition('');
    }
  };

  const handleRemovePosition = (pos: string) => {
    setExpectedPosition(prev => prev.filter(p => p !== pos));
  };

  const toggleWorkType = (type: ScheduleType) => {
    setWorkType(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
    triggerAutoSave();
  };

  const handleAddLocation = () => {
    if (newLocation && !preferredLocations.includes(newLocation) && preferredLocations.length < 3) {
      setPreferredLocations(prev => [...prev, newLocation]);
      setNewLocation('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setPreferredLocations(prev => prev.filter(l => l !== loc));
  };

  const toggleIndustry = (industry: IndustryType) => {
    const newIndustries = profile.preferredIndustries.includes(industry)
      ? profile.preferredIndustries.filter(i => i !== industry)
      : [...profile.preferredIndustries, industry];
    handleProfileChange('preferredIndustries', newIndustries);
  };

  const handleSave = () => {
    setAutoSaveStatus('saving');
    setTimeout(() => {
      setAutoSaveStatus('saved');
      setIsEditing(false);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  return (
    <PageLayout title="我的画像" subtitle="完善能力画像，获得更多优质机会">
      <div className="relative pb-24">
        <Card className="mb-6 gradient-border">
          <div className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold text-primary-800">资料完整度</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold font-serif text-primary-600">{completeness}%</span>
                  <Badge variant={completeness >= 80 ? 'success' : 'warning'} size="sm">
                    {completeness >= 80 ? '优秀' : '待完善'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {autoSaveStatus === 'saved' && (
                  <span className="flex items-center gap-1.5 text-mint-600">
                    <CheckCircle size={16} /> 已自动保存
                  </span>
                )}
                {autoSaveStatus === 'saving' && (
                  <span className="flex items-center gap-1.5 text-primary-500">
                    <Save size={16} className="animate-pulse" /> 保存中...
                  </span>
                )}
                {autoSaveStatus === 'unsaved' && (
                  <span className="flex items-center gap-1.5 text-accent-500">
                    <Settings size={16} className="animate-spin" /> 有未保存的更改
                  </span>
                )}
              </div>
            </div>
            <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-mint-400 to-accent-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-neutral-500">待完善项：</span>
              {missingItems.map((item, idx) => (
                <Badge key={idx} variant="warning" size="sm">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative group">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                  <div className="absolute inset-0 bg-primary-900/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={28} />
                  </div>
                  <input type="file" accept="image/*" className="hidden" id="avatar-upload" />
                  <label htmlFor="avatar-upload" className="absolute bottom-1 right-1 w-9 h-9 bg-mint-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-mint-600 transition-colors">
                    <Camera size={16} />
                  </label>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <User size={14} /> 姓名
                      </label>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <Phone size={14} /> 手机号
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="请输入手机号"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <Mail size={14} /> 邮箱
                      </label>
                      <input
                        type="email"
                        value="wangxiaoming@email.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <MapPin size={14} /> 当前所在地
                      </label>
                      <input
                        type="text"
                        value={profile.currentLocation}
                        onChange={(e) => handleProfileChange('currentLocation', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="请输入所在城市"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                        <DollarSign size={14} /> 期望月薪（元/月）
                      </label>
                      <input
                        type="number"
                        value={profile.expectedSalary}
                        onChange={(e) => handleProfileChange('expectedSalary', Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                        placeholder="请输入期望薪资"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card header={<h3 className="font-serif text-lg font-semibold text-primary-800">意向行业</h3>}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {INDUSTRY_LIST.map((industry) => {
                  const isSelected = profile.preferredIndustries.includes(industry.key);
                  return (
                    <button
                      key={industry.key}
                      onClick={() => toggleIndustry(industry.key)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        isSelected
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-lg"
                          style={{ color: industry.color }}
                        >
                          {industry.icon === 'building' && '🏨'}
                          {industry.icon === 'utensils' && '🍽️'}
                          {industry.icon === 'sparkles' && '✨'}
                          {industry.icon === 'heart' && '💗'}
                          {industry.icon === 'shopping-bag' && '🛍️'}
                          {industry.icon === 'globe' && '🌐'}
                        </span>
                        {isSelected && <CheckCircle size={18} className="text-mint-500" />}
                      </div>
                      <div className={cn(
                        'font-medium',
                        isSelected ? 'text-primary-700' : 'text-neutral-700'
                      )}>
                        {industry.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card header={
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-primary-800">工作经历</h3>
                <Button size="sm" variant="ghost" onClick={() => setExpModalOpen(true)}>
                  <Plus size={16} /> 添加经历
                </Button>
              </div>
            }>
              <div className="relative">
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary-400 via-mint-400 to-accent-400" />
                <div className="space-y-6">
                  {workExperiences.map((exp, idx) => (
                    <div key={exp.id} className="relative pl-12">
                      <div className={cn(
                        'absolute left-1.5 w-5 h-5 rounded-full border-4 border-white shadow-md',
                        idx === 0 ? 'bg-mint-500' : 'bg-primary-400'
                      )} />
                      <div className="bg-neutral-50 rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div>
                            <h4 className="font-semibold text-primary-800">{exp.role}</h4>
                            <p className="text-neutral-600 flex items-center gap-2">
                              <Briefcase size={14} /> {exp.company}
                            </p>
                          </div>
                          <Badge variant="info" size="sm" className="self-start">
                            <Clock size={12} className="mr-1" />
                            {exp.startDate} - {exp.endDate}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">{exp.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card header={
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-primary-800 flex items-center gap-2">
                  <Award className="text-accent-500" size={20} /> 证书资质
                </h3>
                <Button size="sm" variant="ghost" onClick={() => setCertModalOpen(true)}>
                  <Upload size={16} /> 上传证书
                </Button>
              </div>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all',
                      cert.verified
                        ? 'border-mint-300 bg-mint-50/50 shadow-glow'
                        : 'border-neutral-200 bg-white'
                    )}
                  >
                    {cert.verified && (
                      <div className="absolute top-3 right-3">
                        <Badge variant="success" size="sm" className="flex items-center gap-1">
                          <CheckCircle size={12} /> 已验证
                        </Badge>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        cert.verified ? 'bg-mint-100' : 'bg-neutral-100'
                      )}>
                        <Award size={22} className={cert.verified ? 'text-mint-600' : 'text-neutral-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-primary-800 truncate">{cert.name}</h4>
                        <p className="text-sm text-neutral-600">{cert.issuer}</p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {new Date(cert.issueDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <label className="border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group">
                  <Upload size={28} className="text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
                  <span className="text-sm text-neutral-500 group-hover:text-primary-600">点击上传证书</span>
                  <span className="text-xs text-neutral-400 mt-1">支持 JPG, PNG, PDF</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" />
                </label>
              </div>
            </Card>

            <Card header={
              <h3 className="font-serif text-lg font-semibold text-primary-800 flex items-center gap-2">
                <Video className="text-accent-500" size={20} /> 视频简历
              </h3>
            }>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative aspect-video bg-gradient-to-br from-primary-100 to-mint-100 rounded-xl overflow-hidden">
                  {profile.videoResumeUrl ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 rounded-xl">
                      <div className="text-center text-white">
                        <Video size={48} className="mx-auto mb-3 opacity-80" />
                        <p className="text-sm opacity-70">视频简历已上传</p>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer group">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg">
                        <Upload size={28} className="text-primary-500" />
                      </div>
                      <span className="text-primary-700 font-medium">上传视频简历</span>
                      <span className="text-sm text-primary-500/70 mt-1">60秒展示更好的自己</span>
                      <input type="file" accept="video/*" className="hidden" />
                    </label>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-primary-800">💡 优质视频简历小贴士</h4>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-mint-500 mt-0.5 flex-shrink-0" />
                      <span>环境整洁、光线充足，镜头保持稳定</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-mint-500 mt-0.5 flex-shrink-0" />
                      <span>面带微笑，眼神注视镜头，语速适中</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-mint-500 mt-0.5 flex-shrink-0" />
                      <span>介绍核心优势和过往服务亮点</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-mint-500 mt-0.5 flex-shrink-0" />
                      <span>时长控制在30-60秒，内容精炼</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card header={
              <h3 className="font-serif text-lg font-semibold text-primary-800 flex items-center gap-2">
                <Target className="text-mint-500" size={20} /> 服务场景
              </h3>
            }>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {profile.serviceScenarios.map((scenario, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium border border-primary-200"
                    >
                      {scenario}
                      <button
                        onClick={() => handleRemoveScenario(scenario)}
                        className="hover:text-accent-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newScenario}
                    onChange={(e) => setNewScenario(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddScenario()}
                    placeholder="例如：五星级酒店前台、高端美容院"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                  />
                  <Button onClick={handleAddScenario}>
                    <Plus size={18} /> 添加
                  </Button>
                </div>
                <div className="p-4 bg-gradient-to-r from-mint-50 to-primary-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">场景适配度</span>
                    <span className="text-lg font-bold font-serif text-mint-600">{profile.scenarioFitScore}分</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-mint-400 to-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${profile.scenarioFitScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card header={
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-primary-800">能力雷达图</h3>
                <Button size="sm" variant={isEditing ? 'primary' : 'ghost'} onClick={() => setIsEditing(!isEditing)}>
                  <Settings size={14} /> {isEditing ? '完成' : '编辑'}
                </Button>
              </div>
            }>
              <div className="flex flex-col items-center">
                <SkillRadarChart data={skillValues} size={260} />
                {isEditing && (
                  <div className="w-full mt-4 space-y-3">
                    {SKILL_DIMENSIONS.map((dim) => (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600">{dim.label}</span>
                          <span className="font-semibold text-primary-600">{skillValues[dim.key as keyof SkillRadar]}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={skillValues[dim.key as keyof SkillRadar]}
                          onChange={(e) => handleSkillChange(dim.key as keyof SkillRadar, Number(e.target.value))}
                          className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card header={<h3 className="font-serif text-lg font-semibold text-primary-800">技能标签</h3>}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {profile.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent-50 text-accent-600 rounded-full text-sm border border-accent-200"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-accent-700 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="添加技能标签"
                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </Card>

            <Card header={<h3 className="font-serif text-lg font-semibold text-primary-800">意向职位</h3>}>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {expectedPosition.map((pos, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-mint-50 text-mint-700 rounded-full text-sm border border-mint-200"
                    >
                      {pos}
                      <button
                        onClick={() => handleRemovePosition(pos)}
                        className="hover:text-mint-800 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPosition()}
                    placeholder="添加意向职位"
                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                  />
                  <Button size="sm" onClick={handleAddPosition}>
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </Card>

            <Card header={<h3 className="font-serif text-lg font-semibold text-primary-800">工作类型偏好</h3>}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'fixed', label: '全职', icon: '💼' },
                  { value: 'flexible', label: '兼职', icon: '⏰' },
                  { value: 'shift', label: '灵活', icon: '🔄' }
                ].map((type) => {
                  const isSelected = workType.includes(type.value as ScheduleType);
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleWorkType(type.value as ScheduleType)}
                      className={cn(
                        'p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-primary-300'
                      )}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <span className={cn(
                        'text-sm font-medium',
                        isSelected ? 'text-primary-700' : 'text-neutral-600'
                      )}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card header={
              <h3 className="font-serif text-lg font-semibold text-primary-800 flex items-center gap-2">
                <MapPin size={18} className="text-accent-500" /> 意向工作地点
              </h3>
            }>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {preferredLocations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium"
                    >
                      <MapPin size={14} className="text-accent-500" />
                      {loc}
                      <button
                        onClick={() => handleRemoveLocation(loc)}
                        className="hover:text-accent-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {preferredLocations.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                      placeholder="添加城市（最多3个）"
                      className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm"
                    />
                    <Button size="sm" onClick={handleAddLocation}>
                      <Plus size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-4 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="text-sm text-neutral-500 hidden sm:block">
              最后更新：刚刚
            </div>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? '取消编辑' : '继续编辑'}
            </Button>
            <Button onClick={handleSave} loading={autoSaveStatus === 'saving'}>
              <Save size={18} /> 保存资料
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title="添加工作经历"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setExpModalOpen(false)}>取消</Button>
            <Button onClick={handleAddExperience}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">公司名称 *</label>
              <input
                type="text"
                value={newExperience.company || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder="请输入公司名称"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">职位 *</label>
              <input
                type="text"
                value={newExperience.role || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder="请输入职位"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">开始时间</label>
              <input
                type="month"
                value={newExperience.startDate || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">结束时间</label>
              <input
                type="month"
                value={newExperience.endDate || ''}
                onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                placeholder="至今"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">工作描述</label>
            <textarea
              value={newExperience.description || ''}
              onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none"
              placeholder="请描述您的主要职责和成就..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title="添加证书"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setCertModalOpen(false)}>取消</Button>
            <Button onClick={handleAddCertificate}>保存</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">证书名称 *</label>
            <input
              type="text"
              value={newCertificate.name || ''}
              onChange={(e) => setNewCertificate(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
              placeholder="例如：高级美容师证书"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">发证机构 *</label>
            <input
              type="text"
              value={newCertificate.issuer || ''}
              onChange={(e) => setNewCertificate(prev => ({ ...prev, issuer: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
              placeholder="例如：中国美发美容协会"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">发证日期</label>
            <input
              type="date"
              value={newCertificate.issueDate ? new Date(newCertificate.issueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setNewCertificate(prev => ({ ...prev, issueDate: e.target.value ? new Date(e.target.value) : undefined }))}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-700">证书文件</label>
            <label className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group">
              <Upload size={24} className="text-neutral-400 group-hover:text-primary-500 mb-2 transition-colors" />
              <span className="text-sm text-neutral-500 group-hover:text-primary-600">点击上传证书扫描件</span>
              <input type="file" accept="image/*,.pdf" className="hidden" />
            </label>
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}
