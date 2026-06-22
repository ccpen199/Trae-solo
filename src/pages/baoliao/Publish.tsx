import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Camera,
  Video,
  Car,
  Leaf,
  Building2,
  Users,
  AlertTriangle,
  MoreHorizontal,
  Send,
  ImagePlus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Baoliao } from '@/types';
import { useBaoliaoStore } from '@/stores/useBaoliaoStore';
import { useUserStore } from '@/stores/useUserStore';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Tag from '@/components/common/Tag';
import Modal from '@/components/common/Modal';

const categoryOptions = [
  { value: 'traffic', label: '交通出行', icon: Car, color: 'westlake' as const },
  { value: 'environment', label: '城市环境', icon: Leaf, color: 'honghua' as const },
  { value: 'facility', label: '公共设施', icon: Building2, color: 'chaojing' as const },
  { value: 'livelihood', label: '民生服务', icon: Users, color: 'westlake' as const },
  { value: 'emergency', label: '突发事件', icon: AlertTriangle, color: 'neutral' as const },
  { value: 'other', label: '其他', icon: MoreHorizontal, color: 'neutral' as const },
];

const districts = [
  '惠城区', '惠阳区', '博罗县', '惠东县', '龙门县', '大亚湾区', '仲恺区',
];

interface FormErrors {
  title?: string;
  content?: string;
  category?: string;
  location?: string;
}

export default function PublishBaoliao() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useUserStore();
  const { publishBaoliao, loading } = useBaoliaoStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | undefined>();
  const [category, setCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [location, setLocation] = useState({
    lat: 23.0833,
    lng: 114.4167,
    address: '',
    district: '惠城区',
  });
  const [isLocating, setIsLocating] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    getCurrentLocation();
  }, [isLoggedIn, navigate]);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLocation({
        lat: 23.0833,
        lng: 114.4167,
        address: '惠州市惠城区江北街道云山西路',
        district: '惠城区',
      });
    } catch (error) {
      setLocation({
        lat: 23.0833,
        lng: 114.4167,
        address: '惠州市惠城区',
        district: '惠城区',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handleAddImage = () => {
    if (images.length >= 9) return;
    const newImage = `https://picsum.photos/seed/${Date.now()}/400/300`;
    setImages([...images, newImage]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVideo = () => {
    if (video) return;
    setVideo('https://example.com/video/' + Date.now());
  };

  const handleRemoveVideo = () => {
    setVideo(undefined);
  };

  const handleCategorySelect = (value: string, label: string) => {
    setCategory(value);
    setCategoryName(label);
    setErrors(prev => ({ ...prev, category: undefined }));
  };

  const handleDistrictSelect = (district: string) => {
    setLocation(prev => ({ ...prev, district }));
    setShowDistrictModal(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = '请输入爆料标题';
    } else if (title.length < 5) {
      newErrors.title = '标题至少5个字符';
    } else if (title.length > 50) {
      newErrors.title = '标题不能超过50个字符';
    }

    if (!content.trim()) {
      newErrors.content = '请输入爆料内容';
    } else if (content.length < 10) {
      newErrors.content = '内容至少10个字符';
    } else if (content.length > 1000) {
      newErrors.content = '内容不能超过1000个字符';
    }

    if (!category) {
      newErrors.category = '请选择事件分类';
    }

    if (!location.address) {
      newErrors.location = '请获取地理位置';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const result = await publishBaoliao({
        title: title.trim(),
        content: content.trim(),
        images,
        video,
        category: category as Baoliao['category'],
        categoryName,
        location,
      });

      navigate(`/baoliao/${result.id}`);
    } catch (error) {
      console.error('发布失败:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">请先登录后再发布爆料</p>
          <Button onClick={() => navigate('/login')}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-neutral-50 pb-32"
    >
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
          <h1 className="font-semibold text-lg text-neutral-800">发布爆料</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-card p-4 shadow-card"
        >
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            爆料标题 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="请输入标题，简洁明了地描述问题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            error={errors.title}
            showCount
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-card p-4 shadow-card"
        >
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            爆料内容 <span className="text-red-500">*</span>
          </label>
          <TextArea
            placeholder="请详细描述您遇到的问题或建议，包括时间、地点、具体情况等..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={1000}
            showCount
            autoSize
            rows={5}
            error={errors.content}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-card p-4 shadow-card"
        >
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            图片/视频上传
          </label>
          <div className="grid grid-cols-3 gap-3">
            {images.map((img, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-neutral-100 group"
              >
                <img
                  src={img}
                  alt={`上传图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            ))}

            {video && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-westlake-400 to-westlake-600 group"
              >
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <Video className="w-8 h-8 mb-1" />
                  <span className="text-xs">视频</span>
                </div>
                <button
                  onClick={handleRemoveVideo}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            )}

            {images.length < 9 && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddImage}
                className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 hover:border-westlake-400 flex flex-col items-center justify-center text-neutral-400 hover:text-westlake-500 transition-colors bg-neutral-50"
              >
                <ImagePlus className="w-8 h-8 mb-1" />
                <span className="text-xs">{images.length}/9</span>
              </motion.button>
            )}

            {!video && images.length < 9 && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddVideo}
                className="aspect-square rounded-lg border-2 border-dashed border-neutral-200 hover:border-honghua-400 flex flex-col items-center justify-center text-neutral-400 hover:text-honghua-500 transition-colors bg-neutral-50"
              >
                <Video className="w-8 h-8 mb-1" />
                <span className="text-xs">视频</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-card p-4 shadow-card"
        >
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            地理位置 <span className="text-red-500">*</span>
          </label>
          <button
            onClick={() => setShowDistrictModal(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-westlake-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-westlake-600" />
              </div>
              <div className="text-left">
                {isLocating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-westlake-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-neutral-500">定位中...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-neutral-800">
                      {location.address || '点击获取位置'}
                    </p>
                    <p className="text-xs text-neutral-500">{location.district}</p>
                  </>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
          {errors.location && (
            <p className="mt-1 text-xs text-red-500">{errors.location}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-card p-4 shadow-card"
        >
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            事件分类 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = category === option.value;
              return (
                <motion.button
                  key={option.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategorySelect(option.value, option.label)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200',
                    isSelected
                      ? 'border-westlake-500 bg-westlake-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      isSelected
                        ? 'bg-westlake-100 text-westlake-600'
                        : 'bg-neutral-100 text-neutral-500'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={cn(
                      'font-medium',
                      isSelected ? 'text-westlake-700' : 'text-neutral-700'
                    )}
                  >
                    {option.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
          {errors.category && (
            <p className="mt-2 text-xs text-red-500">{errors.category}</p>
          )}
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 pb-6">
        <div className="max-w-2xl mx-auto">
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            loading={loading}
            disabled={!title.trim() || !content.trim() || !category}
            leftIcon={<Send className="w-5 h-5" />}
          >
            发布爆料
          </Button>
          <p className="text-center text-xs text-neutral-400 mt-2">
            发布后需审核，通过后将获得积分奖励
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showDistrictModal && (
          <Modal
            isOpen={showDistrictModal}
            onClose={() => setShowDistrictModal(false)}
            title="选择区域"
          >
            <div className="grid grid-cols-2 gap-2">
              {districts.map((district) => (
                <motion.button
                  key={district}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDistrictSelect(district)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-all duration-200 text-left',
                    location.district === district
                      ? 'border-westlake-500 bg-westlake-50 text-westlake-700'
                      : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                  )}
                >
                  {district}
                </motion.button>
              ))}
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
