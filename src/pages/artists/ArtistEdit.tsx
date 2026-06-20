import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  Ruler,
  Image,
  Tags,
  ChevronRight,
  ChevronLeft,
  Save,
  Upload,
  X,
  Plus,
  MapPin,
  Calendar as CalendarIcon,
  CheckCircle2,
  Camera,
  Video,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { TagCloud } from '@/components/ui/TagCloud';
import { useArtistStore } from '@/store/useArtistStore';
import { mockCurrentArtistProfile } from '@/data/mockData';
import { cn } from '@/lib/utils';
import type { ArtistProfile } from '@shared/types';

const step1Schema = z.object({
  realName: z.string().min(2, '请输入真实姓名'),
  stageName: z.string().min(1, '请输入艺名'),
  gender: z.enum(['male', 'female', 'other'], { required_error: '请选择性别' }),
  age: z.number().min(16, '年龄必须大于16岁').max(80, '年龄必须小于80岁'),
  birthday: z.string().optional(),
  location: z.string().min(2, '请输入所在城市'),
});

const step2Schema = z.object({
  height: z.number().min(100, '身高必须大于100cm').max(250, '身高必须小于250cm'),
  weight: z.number().min(30, '体重必须大于30kg').max(200, '体重必须小于200kg'),
  bust: z.number().min(50, '请输入合理数值').max(200, '请输入合理数值'),
  waist: z.number().min(40, '请输入合理数值').max(200, '请输入合理数值'),
  hips: z.number().min(50, '请输入合理数值').max(200, '请输入合理数值'),
  eyeColor: z.string().min(1, '请输入眼睛颜色'),
  hairColor: z.string().min(1, '请输入头发颜色'),
});

const allSkills = [
  'T台走秀', '平面拍摄', '影视表演', '舞蹈', '钢琴', '健身', '游泳', '篮球',
  '淘宝直播', '美妆', '穿搭', '短视频拍摄', '主持', '声乐', '吉他', '瑜伽',
  '茶艺', '街舞', '滑板', '摄影', '珠宝展示', '高尔夫', '马术', '拳击', 'DJ',
  '唱歌', '绘画',
];

const allLanguages = ['中文', '英语', '日语', '韩语', '法语', '德语', '西班牙语', '俄语', '粤语', '闽南语'];

const allTags = [
  { label: '气质佳', category: 'appearance' },
  { label: '高级脸', category: 'appearance' },
  { label: '阳光帅气', category: 'appearance' },
  { label: '甜美可爱', category: 'appearance' },
  { label: '冷艳气质', category: 'appearance' },
  { label: '成熟稳重', category: 'appearance' },
  { label: '潮流达人', category: 'appearance' },
  { label: '优雅端庄', category: 'appearance' },
  { label: '肌肉型男', category: 'appearance' },
  { label: '清纯玉女', category: 'appearance' },
  { label: 'T台经验丰富', category: 'experience' },
  { label: '电商爆款模特', category: 'experience' },
  { label: '时装周经验', category: 'experience' },
  { label: '奢侈品代言经验', category: 'experience' },
  { label: '珠宝品牌专属', category: 'experience' },
  { label: '健身模特', category: 'experience' },
  { label: '英语流利', category: 'language' },
  { label: '中英双语主持', category: 'skill' },
  { label: '舞蹈功底深厚', category: 'skill' },
  { label: '美妆博主', category: 'skill' },
];

const steps = [
  { id: 1, title: '基本信息', icon: <User className="w-5 h-5" /> },
  { id: 2, title: '身材数据', icon: <Ruler className="w-5 h-5" /> },
  { id: 3, title: '媒体资料', icon: <Image className="w-5 h-5" /> },
  { id: 4, title: '技能标签', icon: <Tags className="w-5 h-5" /> },
];

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

const ArtistEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateArtist, loading } = useArtistStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(mockCurrentArtistProfile.skills);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(mockCurrentArtistProfile.languages);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    mockCurrentArtistProfile.tags.map((t) => t.tag)
  );
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(
    mockCurrentArtistProfile.mediaAssets.filter((m) => m.type === 'photo').map((m) => m.url)
  );
  const [uploadedThreeViews, setUploadedThreeViews] = useState<string[]>(
    mockCurrentArtistProfile.mediaAssets.filter((m) => m.type === 'three_view').map((m) => m.url)
  );
  const [videoUrl, setVideoUrl] = useState('');

  const currentArtist: ArtistProfile = mockCurrentArtistProfile;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(currentStep === 1 ? step1Schema : step2Schema),
    defaultValues: {
      realName: currentArtist.realName,
      stageName: currentArtist.stageName,
      gender: currentArtist.gender,
      age: currentArtist.age,
      birthday: '',
      location: currentArtist.location,
      height: currentArtist.height,
      weight: currentArtist.weight,
      bust: currentArtist.bust,
      waist: currentArtist.waist,
      hips: currentArtist.hips,
      eyeColor: currentArtist.eyeColor,
      hairColor: currentArtist.hairColor,
    },
    mode: 'onChange',
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < 2) {
      handleSubmit(() => setCurrentStep(currentStep + 1))();
    } else if (currentStep < steps.length) {
      if (currentStep === 2) {
        handleSubmit(() => setCurrentStep(currentStep + 1))();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (id) {
      await updateArtist(id, {
        skills: selectedSkills,
        languages: selectedLanguages,
      });
    }
    navigate(`/artists/${id || currentArtist.id}`);
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleLanguageToggle = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePhotoUpload = () => {
    const newPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
      'professional model portrait studio photography'
    )}&image_size=square_hd`;
    setUploadedPhotos((prev) => [...prev, newPhoto]);
  };

  const handleThreeViewUpload = () => {
    const newPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
      'model three view measurement photo'
    )}&image_size=square_hd`;
    setUploadedThreeViews((prev) => [...prev, newPhoto]);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const removeThreeView = (index: number) => {
    setUploadedThreeViews((prev) => prev.filter((_, i) => i !== index));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="真实姓名"
                placeholder="请输入真实姓名"
                {...register('realName')}
                error={errors.realName?.message}
              />
              <Input
                label="艺名 / 舞台名"
                placeholder="请输入艺名"
                {...register('stageName')}
                error={errors.stageName?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-midnight-200 mb-3">性别</label>
              <div className="flex gap-3">
                {[
                  { value: 'male', label: '男' },
                  { value: 'female', label: '女' },
                  { value: 'other', label: '其他' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('gender', option.value as any)}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 border-2',
                      watch('gender') === option.value
                        ? 'bg-gradient-primary text-white border-transparent shadow-button'
                        : 'bg-midnight-800/50 text-midnight-300 border-midnight-700 hover:border-midnight-600'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.gender && (
                <p className="mt-1.5 text-sm text-red-400">{errors.gender.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="年龄"
                type="number"
                placeholder="请输入年龄"
                {...register('age', { valueAsNumber: true })}
                error={errors.age?.message}
                leftIcon={<CalendarIcon className="w-4 h-4" />}
              />
              <Input
                label="出生日期（选填）"
                type="date"
                {...register('birthday')}
                leftIcon={<CalendarIcon className="w-4 h-4" />}
              />
            </div>

            <Input
              label="所在城市"
              placeholder="例如：上海市"
              {...register('location')}
              error={errors.location?.message}
              leftIcon={<MapPin className="w-4 h-4" />}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <Input
                label="身高 (cm)"
                type="number"
                placeholder="175"
                {...register('height', { valueAsNumber: true })}
                error={errors.height?.message}
                leftIcon={<Ruler className="w-4 h-4" />}
              />
              <Input
                label="体重 (kg)"
                type="number"
                placeholder="52"
                {...register('weight', { valueAsNumber: true })}
                error={errors.weight?.message}
                leftIcon={<Ruler className="w-4 h-4" />}
              />
              <div />
              <Input
                label="胸围 (cm)"
                type="number"
                placeholder="85"
                {...register('bust', { valueAsNumber: true })}
                error={errors.bust?.message}
              />
              <Input
                label="腰围 (cm)"
                type="number"
                placeholder="60"
                {...register('waist', { valueAsNumber: true })}
                error={errors.waist?.message}
              />
              <Input
                label="臀围 (cm)"
                type="number"
                placeholder="88"
                {...register('hips', { valueAsNumber: true })}
                error={errors.hips?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="眼睛颜色"
                placeholder="例如：棕色"
                {...register('eyeColor')}
                error={errors.eyeColor?.message}
              />
              <Input
                label="头发颜色"
                placeholder="例如：黑色"
                {...register('hairColor')}
                error={errors.hairColor?.message}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-midnight-200 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-500" />
                  精选照片 ({uploadedPhotos.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={handlePhotoUpload}
                >
                  上传照片
                </Button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {uploadedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden group border-2 border-midnight-700 hover:border-rose-500/50 transition-all"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="primary" size="sm">封面</Badge>
                      </div>
                    )}
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handlePhotoUpload}
                  className="aspect-square rounded-xl border-2 border-dashed border-midnight-600 hover:border-rose-500/50 flex flex-col items-center justify-center gap-2 text-midnight-400 hover:text-rose-400 transition-all"
                >
                  <Plus className="w-6 h-6" />
                  <span className="text-xs">添加照片</span>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-midnight-200 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-sapphire-500" />
                  三视照 ({uploadedThreeViews.length}/3)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Upload className="w-4 h-4" />}
                  onClick={handleThreeViewUpload}
                >
                  上传三视照
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {['正面', '侧面', '背面'].map((label, index) => (
                  <div key={label}>
                    <p className="text-xs text-midnight-400 mb-2 text-center">{label}</p>
                    {uploadedThreeViews[index] ? (
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden group border-2 border-midnight-700 hover:border-sapphire-500/50 transition-all">
                        <img
                          src={uploadedThreeViews[index]}
                          alt={label}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeThreeView(index)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleThreeViewUpload}
                        className="aspect-[3/4] w-full rounded-xl border-2 border-dashed border-midnight-600 hover:border-sapphire-500/50 flex flex-col items-center justify-center gap-2 text-midnight-400 hover:text-sapphire-400 transition-all"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-xs">上传{label}</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-midnight-200 mb-4 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-500" />
                才艺视频
              </h4>
              <div className="border-2 border-dashed border-midnight-700 hover:border-emerald-500/50 rounded-xl p-8 text-center transition-all">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Upload className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-medium mb-1">拖拽视频到此处，或点击上传</p>
                <p className="text-sm text-midnight-400 mb-4">支持 MP4、MOV 格式，最大 500MB</p>
                <Input
                  placeholder="或粘贴视频链接"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-midnight-200">
                  专业技能 <Badge variant="primary" size="sm" className="ml-2">{selectedSkills.length}</Badge>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => handleSkillToggle(skill)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border',
                      selectedSkills.includes(skill)
                        ? 'bg-sapphire-500/20 text-sapphire-300 border-sapphire-500/40'
                        : 'bg-midnight-700/50 text-midnight-300 border-midnight-600 hover:border-midnight-500'
                    )}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-midnight-200">
                  语言能力 <Badge variant="warning" size="sm" className="ml-2">{selectedLanguages.length}</Badge>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {allLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageToggle(lang)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border',
                      selectedLanguages.includes(lang)
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-midnight-700/50 text-midnight-300 border-midnight-600 hover:border-midnight-500'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-midnight-200">
                  特色标签 <Badge variant="success" size="sm" className="ml-2">{selectedTags.length}</Badge>
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleTagToggle(tag.label)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border',
                      selectedTags.includes(tag.label)
                        ? tag.category === 'appearance'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : tag.category === 'experience'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-midnight-600/50 text-midnight-200 border-midnight-500'
                        : 'bg-midnight-700/50 text-midnight-300 border-midnight-600 hover:border-midnight-500'
                    )}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 animate-fade-in-down">
          <button
            onClick={() => navigate(`/artists/${id || currentArtist.id}`)}
            className="inline-flex items-center gap-2 text-midnight-300 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回个人资料
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">编辑个人资料</h1>
          <p className="text-midnight-300">完善你的资料，获得更多曝光机会</p>
        </div>

        <Card variant="glass" className="animate-fade-in-up">
          <CardHeader className="border-b border-midnight-700/50 pb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300',
                        currentStep > step.id
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : currentStep === step.id
                          ? 'bg-gradient-primary text-white shadow-button'
                          : 'bg-midnight-700/50 text-midnight-400'
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.icon
                      )}
                    </div>
                    {step.id < steps.length && (
                      <div
                        className={cn(
                          'w-12 md:w-20 h-0.5 mx-2 transition-all duration-300',
                          currentStep > step.id ? 'bg-emerald-500' : 'bg-midnight-700'
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-right">
                <p className="text-sm text-midnight-400">
                  步骤 {currentStep} / {steps.length}
                </p>
                <p className="text-sm font-medium text-white">
                  {steps[currentStep - 1].title}
                </p>
              </div>
            </div>
            <Progress value={progress} />
          </CardHeader>

          <CardContent className="py-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              {steps[currentStep - 1].title}
            </h2>
            {renderStepContent()}
          </CardContent>

          <CardFooter className="border-t border-midnight-700/50 pt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              上一步
            </Button>
            {currentStep === steps.length ? (
              <Button
                onClick={handleSave}
                loading={loading}
                leftIcon={<Save className="w-4 h-4" />}
              >
                保存资料
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                下一步
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ArtistEdit;
