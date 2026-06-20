import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ListChecks,
  DollarSign,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
  Plus,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

import useCastingStore from '@/store/useCastingStore';

const categories = [
  { id: '时装周', label: '时装秀场', icon: '👗', description: '时装周、品牌秀场、T台走秀' },
  { id: '平面广告', label: '商业广告', icon: '📷', description: '平面拍摄、品牌广告、杂志大片' },
  { id: '影视 casting', label: '影视表演', icon: '🎬', description: '电影、电视剧、网络剧角色' },
  { id: '直播带货', label: '直播带货', icon: '📱', description: '电商直播、带货主播' },
  { id: '活动展示', label: '活动展示', icon: '🎪', description: '展会、发布会、商演活动' },
  { id: '品牌代言', label: '品牌代言', icon: '⭐', description: '品牌代言人、形象大使' },
];

const experienceLevels = [
  { id: 'beginner', label: '新手入门', description: '0-1年经验，有专业培训背景' },
  { id: 'intermediate', label: '有一定经验', description: '1-3年经验，参与过多个项目' },
  { id: 'advanced', label: '资深经验', description: '3-5年经验，行业内有一定知名度' },
  { id: 'expert', label: '顶级专家', description: '5年以上经验，一线模特/演员' },
];

const languages = ['中文', '英语', '日语', '韩语', '法语', '粤语', '西班牙语', '德语'];

const skills = [
  'T台走秀', '平面拍摄', '影视表演', '淘宝直播', '舞蹈', '声乐',
  '主持', '健身', '游泳', '武术', '瑜伽', '钢琴', '吉他', '美妆', '穿搭',
];

const castingSchema = z.object({
  title: z.string().min(5, '标题至少需要5个字符').max(100, '标题最多100个字符'),
  category: z.string().min(1, '请选择分类'),
  company: z.string().min(2, '请输入公司/机构名称'),
  description: z.string().min(20, '描述至少需要20个字符').max(2000, '描述最多2000个字符'),

  gender: z.enum(['male', 'female', 'any']),
  ageMin: z.number().min(16, '最小年龄不能小于16').max(60, '最小年龄不能大于60'),
  ageMax: z.number().min(16, '最大年龄不能小于16').max(60, '最大年龄不能大于60'),
  heightMin: z.number().min(140, '最小身高不能小于140cm').max(220, '最小身高不能大于220cm'),
  heightMax: z.number().min(140, '最大身高不能小于140cm').max(220, '最大身高不能大于220cm'),
  experienceLevel: z.string().optional(),
  selectedSkills: z.array(z.string()).default([]),
  selectedLanguages: z.array(z.string()).default([]),

  budgetMin: z.number().min(0, '最低预算不能小于0'),
  budgetMax: z.number().min(0, '最高预算不能小于0'),
  startDate: z.string().min(1, '请选择开始日期'),
  endDate: z.string().min(1, '请选择结束日期'),
  deadline: z.string().min(1, '请选择申请截止日期'),
  location: z.string().min(2, '请输入地点'),

  contractFile: z.any().optional(),
  referenceImages: z.array(z.any()).default([]),
  auditionDetails: z.string().max(1000, '试镜详情最多1000个字符').optional(),
});

type CastingFormData = z.infer<typeof castingSchema>;

interface StepInfo {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const CastingCreate: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const { createCasting, loading } = useCastingStore();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<CastingFormData>({
    resolver: zodResolver(castingSchema),
    defaultValues: {
      title: '',
      category: '',
      company: '',
      description: '',
      gender: 'any',
      ageMin: 18,
      ageMax: 35,
      heightMin: 160,
      heightMax: 190,
      experienceLevel: '',
      selectedSkills: [],
      selectedLanguages: [],
      budgetMin: 3000,
      budgetMax: 10000,
      startDate: '',
      endDate: '',
      deadline: '',
      location: '',
      auditionDetails: '',
      referenceImages: [],
    },
    mode: 'onChange',
  });

  const steps: StepInfo[] = [
    { id: 1, title: '基本信息', icon: <FileText className="w-4 h-4" /> },
    { id: 2, title: '招募要求', icon: <ListChecks className="w-4 h-4" /> },
    { id: 3, title: '预算与时间', icon: <DollarSign className="w-4 h-4" /> },
    { id: 4, title: '附件材料', icon: <Paperclip className="w-4 h-4" /> },
  ];

  const selectedSkills = watch('selectedSkills') || [];
  const selectedLanguages = watch('selectedLanguages') || [];

  const toggleSkill = (skill: string) => {
    const current = watch('selectedSkills') || [];
    if (current.includes(skill)) {
      setValue('selectedSkills', current.filter((s) => s !== skill), { shouldDirty: true });
    } else {
      setValue('selectedSkills', [...current, skill], { shouldDirty: true });
    }
  };

  const toggleLanguage = (lang: string) => {
    const current = watch('selectedLanguages') || [];
    if (current.includes(lang)) {
      setValue('selectedLanguages', current.filter((l) => l !== lang), { shouldDirty: true });
    } else {
      setValue('selectedLanguages', [...current, lang], { shouldDirty: true });
    }
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CastingFormData) => {
    setIsSubmitting(true);
    try {
      const requirements: any[] = [
        { field: 'gender', operator: data.gender === 'any' ? 'in' : 'eq', value: data.gender === 'any' ? ['male', 'female'] : data.gender },
        { field: 'age', operator: 'between', value: [data.ageMin, data.ageMax] },
        { field: 'height', operator: 'between', value: [data.heightMin, data.heightMax] },
      ];

      if (data.selectedSkills.length > 0) {
        requirements.push({ field: 'skills', operator: 'in', value: data.selectedSkills });
      }
      if (data.selectedLanguages.length > 0) {
        requirements.push({ field: 'languages', operator: 'in', value: data.selectedLanguages });
      }

      await createCasting({
        agencyId: 'agency-1',
        title: data.title,
        description: data.description,
        category: data.category,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'published',
        requirements,
      });

      setPublishSuccess(true);
    } catch (error) {
      console.error('Failed to create casting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    alert('草稿已保存！');
  };

  if (publishSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="glass" className="max-w-md w-full mx-4">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-glow-secondary">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">试镜发布成功！</h2>
            <p className="text-midnight-300 mb-8">
              你的试镜招募已成功发布，模特将可以看到并申请该职位
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={onBack}>
                返回列表
              </Button>
              <Button onClick={onBack}>查看详情</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-midnight-300 hover:text-rose-400 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          返回
        </button>

        <Card variant="glass" className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold text-white">发布新试镜</h1>
              <Badge variant="secondary" size="sm">
                步骤 {currentStep} / 4
              </Badge>
            </div>
            <p className="text-midnight-300 mb-6">填写以下信息发布你的模特招募需求</p>

            <div className="relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-midnight-700" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-primary transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
              <div className="relative flex items-center justify-between">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300',
                        currentStep > step.id
                          ? 'bg-gradient-primary text-white shadow-button'
                          : currentStep === step.id
                          ? 'bg-gradient-primary text-white shadow-button scale-110'
                          : 'bg-midnight-800 text-midnight-400 border-2 border-midnight-700'
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    <span
                      className={cn(
                        'mt-2 text-xs font-medium transition-colors',
                        currentStep >= step.id ? 'text-white' : 'text-midnight-500'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card variant="glass">
            <CardContent className="p-6 md:p-8">
              {currentStep === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">基本信息</h2>
                    <p className="text-sm text-midnight-400 mb-6">填写试镜的基本信息和描述</p>
                  </div>

                  <div>
                    <Controller
                      name="title"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="试镜标题 *"
                          placeholder="例如：2024春夏上海时装周走秀模特招募"
                          error={errors.title?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Controller
                      name="company"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          label="公司/机构名称 *"
                          placeholder="输入公司或经纪机构名称"
                          error={errors.company?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-3">
                      试镜分类 *
                    </label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {categories.map((cat) => (
                            <RadioGroupItem
                              key={cat.id}
                              value={cat.id}
                              label={
                                <span className="flex items-center gap-2">
                                  <span className="text-lg">{cat.icon}</span>
                                  {cat.label}
                                </span>
                              }
                              description={cat.description}
                            />
                          ))}
                        </RadioGroup>
                      )}
                    />
                    {errors.category && (
                      <p className="mt-2 text-sm text-red-400 animate-fade-in">{errors.category.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      项目描述 *
                    </label>
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="详细描述项目内容、品牌背景、工作要求等..."
                          rows={6}
                          className={cn(
                            'w-full px-4 py-3 rounded-xl bg-midnight-900/50 border-2 text-white placeholder-midnight-500 focus:outline-none transition-colors resize-none',
                            errors.description ? 'border-red-500 focus:border-red-500' : 'border-midnight-700 focus:border-rose-500'
                          )}
                        />
                      )}
                    />
                    {errors.description && (
                      <p className="mt-1.5 text-sm text-red-400 animate-fade-in">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">招募要求</h2>
                    <p className="text-sm text-midnight-400 mb-6">设置模特筛选条件和技能要求</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-3">
                      性别要求
                    </label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-3 gap-3"
                        >
                          <RadioGroupItem value="male" label="男模特" />
                          <RadioGroupItem value="female" label="女模特" />
                          <RadioGroupItem value="any" label="不限" />
                        </RadioGroup>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="ageMin"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最小年龄"
                          placeholder="18"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.ageMin?.message}
                        />
                      )}
                    />
                    <Controller
                      name="ageMax"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最大年龄"
                          placeholder="35"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.ageMax?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="heightMin"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最小身高 (cm)"
                          placeholder="160"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.heightMin?.message}
                        />
                      )}
                    />
                    <Controller
                      name="heightMax"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最大身高 (cm)"
                          placeholder="190"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.heightMax?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-3">
                      经验要求
                    </label>
                    <Controller
                      name="experienceLevel"
                      control={control}
                      render={({ field }) => (
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        >
                          {experienceLevels.map((level) => (
                            <RadioGroupItem
                              key={level.id}
                              value={level.id}
                              label={level.label}
                              description={level.description}
                            />
                          ))}
                        </RadioGroup>
                      )}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-midnight-200">
                        技能要求
                      </label>
                      <span className="text-xs text-midnight-400">
                        已选 {selectedSkills.length} 项
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                              isSelected
                                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                : 'bg-midnight-800/50 text-midnight-300 border-midnight-700 hover:border-midnight-600 hover:text-white'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-midnight-200">
                        语言要求
                      </label>
                      <span className="text-xs text-midnight-400">
                        已选 {selectedLanguages.length} 项
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang) => {
                        const isSelected = selectedLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={cn(
                              'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                              isSelected
                                ? 'bg-sapphire-500/15 text-sapphire-400 border-sapphire-500/30'
                                : 'bg-midnight-800/50 text-midnight-300 border-midnight-700 hover:border-midnight-600 hover:text-white'
                            )}
                          >
                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">预算与时间</h2>
                    <p className="text-sm text-midnight-400 mb-6">设置预算范围和项目时间安排</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="budgetMin"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最低预算 (元)"
                          placeholder="3000"
                          leftIcon={<DollarSign className="w-4 h-4" />}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.budgetMin?.message}
                        />
                      )}
                    />
                    <Controller
                      name="budgetMax"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          label="最高预算 (元)"
                          placeholder="10000"
                          leftIcon={<DollarSign className="w-4 h-4" />}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          error={errors.budgetMax?.message}
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Controller
                      name="startDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="date"
                          label="项目开始日期 *"
                          leftIcon={<Calendar className="w-4 h-4" />}
                          error={errors.startDate?.message}
                        />
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="date"
                          label="项目结束日期 *"
                          leftIcon={<Calendar className="w-4 h-4" />}
                          error={errors.endDate?.message}
                        />
                      )}
                    />
                  </div>

                  <Controller
                    name="deadline"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="date"
                        label="申请截止日期 *"
                        leftIcon={<Calendar className="w-4 h-4" />}
                        error={errors.deadline?.message}
                      />
                    )}
                  />

                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="工作地点 *"
                        placeholder="例如：上海市静安区"
                        leftIcon={<MapPin className="w-4 h-4" />}
                        error={errors.location?.message}
                      />
                    )}
                  />
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-1">附件材料</h2>
                    <p className="text-sm text-midnight-400 mb-6">上传合同、参考图片等相关材料</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-3">
                      合同文件 <span className="text-midnight-500">(选填)</span>
                    </label>
                    <div className="border-2 border-dashed border-midnight-700 rounded-xl p-8 text-center hover:border-rose-500/50 transition-colors cursor-pointer">
                      <Upload className="w-10 h-10 text-midnight-500 mx-auto mb-3" />
                      <p className="text-sm text-midnight-300 mb-1">点击或拖拽文件到此处上传</p>
                      <p className="text-xs text-midnight-500">支持 PDF、DOC、DOCX 格式，最大 10MB</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-midnight-200">
                        参考图片 <span className="text-midnight-500">(选填，最多 9 张)</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-lg bg-midnight-800/50 border border-midnight-700 overflow-hidden relative group"
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-sapphire-500/20" />
                          <button className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="aspect-square rounded-lg border-2 border-dashed border-midnight-700 flex flex-col items-center justify-center text-midnight-500 hover:border-rose-500/50 hover:text-rose-400 transition-colors"
                      >
                        <Plus className="w-6 h-6 mb-1" />
                        <span className="text-xs">添加图片</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      试镜详情说明 <span className="text-midnight-500">(选填)</span>
                    </label>
                    <Controller
                      name="auditionDetails"
                      control={control}
                      render={({ field }) => (
                        <textarea
                          {...field}
                          placeholder="试镜时间、地点、需要准备的材料等..."
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-midnight-900/50 border-2 border-midnight-700 text-white placeholder-midnight-500 focus:outline-none focus:border-rose-500 transition-colors resize-none"
                        />
                      )}
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-midnight-900/30 border border-midnight-700/50">
                    <h4 className="text-sm font-medium text-white mb-2">发布前请确认：</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-sm text-midnight-300">
                        <Checkbox id="confirm1" />
                        <label htmlFor="confirm1" className="cursor-pointer">
                          所有信息真实有效，不存在虚假内容
                        </label>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-midnight-300">
                        <Checkbox id="confirm2" />
                        <label htmlFor="confirm2" className="cursor-pointer">
                          同意平台服务条款和隐私政策
                        </label>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>

            <CardContent className="p-6 pt-0 flex flex-col sm:flex-row justify-between gap-3">
              <div className="order-2 sm:order-1">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                    onClick={handlePrev}
                  >
                    上一步
                  </Button>
                ) : (
                  onBack && (
                    <Button
                      type="button"
                      variant="ghost"
                      leftIcon={<ArrowLeft className="w-4 h-4" />}
                      onClick={onBack}
                    >
                      取消
                    </Button>
                  )
                )}
              </div>

              <div className="flex gap-3 order-1 sm:order-2">
                {currentStep < 4 ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={handleSaveDraft}
                    >
                      保存草稿
                    </Button>
                    <Button
                      type="button"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleNext}
                    >
                      下一步
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Save className="w-4 h-4" />}
                      onClick={handleSaveDraft}
                    >
                      保存草稿
                    </Button>
                    <Button
                      type="submit"
                      leftIcon={<Send className="w-4 h-4" />}
                      loading={loading || isSubmitting}
                    >
                      立即发布
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default CastingCreate;
