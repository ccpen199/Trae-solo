import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  X,
  MapPin,
  Calendar,
  Clock,
  Users,
  Shield,
  CheckCircle2,
  Image as ImageIcon,
  Navigation
} from 'lucide-react';
import { useCircleStore } from '@/stores/useCircleStore';
import { mockUsers } from '@/data/mockUsers';
import Input from '@/components/common/Input';
import TextArea from '@/components/common/TextArea';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Tag from '@/components/common/Tag';
import Loading from '@/components/common/Loading';
import Empty from '@/components/common/Empty';
import type { Activity } from '@/types';

export default function ActivityPublish() {
  const { circleId } = useParams<{ circleId: string }>();
  const navigate = useNavigate();
  const { currentCircle, fetchCircleById, publishActivity } = useCircleStore();
  const [currentUser] = useState(mockUsers[0]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('50');
  const [membersOnly, setMembersOnly] = useState(true);
  const [needReview, setNeedReview] = useState(false);
  const [otherConditions, setOtherConditions] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (circleId) {
      loadCircle(circleId);
    }
  }, [circleId]);

  const loadCircle = async (id: string) => {
    setLoading(true);
    await fetchCircleById(id);
    setLoading(false);
  };

  const isAdmin = currentCircle?.adminId === currentUser.id;

  const handleImageUpload = () => {
    const randomSeed = 'activity-' + Date.now();
    const imageUrl = `https://picsum.photos/seed/${randomSeed}/800/400`;
    setCoverImage(imageUrl);
  };

  const removeImage = () => {
    setCoverImage('');
  };

  const handleMapSelect = () => {
    setLocationName('惠州西湖风景区');
    setAddress('惠州市惠城区环城西路惠州西湖风景区内');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = '请输入活动主题';
    } else if (title.length < 5) {
      newErrors.title = '活动主题至少5个字符';
    }
    
    if (!coverImage) {
      newErrors.coverImage = '请上传活动封面';
    }
    
    if (!description.trim()) {
      newErrors.description = '请输入活动描述';
    } else if (description.length < 20) {
      newErrors.description = '活动描述至少20个字符';
    }
    
    if (!startDate || !startTime) {
      newErrors.startTime = '请选择开始时间';
    }
    
    if (!endDate || !endTime) {
      newErrors.endTime = '请选择结束时间';
    }
    
    if (startDate && startTime && endDate && endTime) {
      const start = new Date(`${startDate}T${startTime}`);
      const end = new Date(`${endDate}T${endTime}`);
      if (start >= end) {
        newErrors.endTime = '结束时间必须晚于开始时间';
      }
      if (start < new Date()) {
        newErrors.startTime = '开始时间不能早于当前时间';
      }
    }
    
    if (!locationName.trim()) {
      newErrors.locationName = '请输入地点名称';
    }
    
    if (!address.trim()) {
      newErrors.address = '请输入详细地址';
    }
    
    const maxNum = parseInt(maxParticipants);
    if (!maxParticipants || isNaN(maxNum) || maxNum < 2 || maxNum > 1000) {
      newErrors.maxParticipants = '人数限制需在2-1000之间';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !currentCircle) return;
    
    setSubmitting(true);
    
    try {
      const activityData: Partial<Activity> = {
        circleId: currentCircle.id,
        title: title.trim(),
        description: description.trim(),
        coverImage,
        location: locationName.trim(),
        address: address.trim(),
        startTime: new Date(`${startDate}T${startTime}`),
        endTime: new Date(`${endDate}T${endTime}`),
        maxParticipants: parseInt(maxParticipants),
      };
      
      const newActivity = await publishActivity(activityData);
      navigate(`/activities/${newActivity.id}`);
    } catch (error) {
      console.error('发布活动失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!currentCircle) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Empty description="圈子不存在" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-800 mb-2">无权限访问</h3>
          <p className="text-neutral-500 mb-4">仅圈子管理员可发布活动</p>
          <Button variant="primary" onClick={() => navigate(`/circles/${currentCircle.id}`)}>
            返回圈子
          </Button>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-neutral-100"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </motion.button>
            <h1 className="flex-1 text-center text-lg font-bold text-neutral-800">
              发布活动
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <motion.div variants={itemVariants}>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Tag color="westlake" size="sm">
                  {currentCircle.name}
                </Tag>
                <span className="text-sm text-neutral-500">
                  发起活动
                </span>
              </div>
              <div className="text-sm text-neutral-500">
                作为圈主，你可以发起线下活动，邀请圈子成员参与。
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-2">
                活动主题 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="请输入活动主题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                showCount
                error={errors.title}
              />
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-2">
                活动封面 <span className="text-red-500">*</span>
              </label>
              {coverImage ? (
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={coverImage}
                    alt="活动封面"
                    className="w-full h-48 object-cover"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={removeImage}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  onClick={handleImageUpload}
                  className={
                    'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ' +
                    (errors.coverImage ? 'border-red-300 bg-red-50' : 'border-neutral-200 hover:border-westlake-400')
                  }
                >
                  <Upload className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600 font-medium mb-1">点击上传封面图片</p>
                  <p className="text-sm text-neutral-400">支持 JPG、PNG 格式，建议尺寸 800x400</p>
                  {errors.coverImage && (
                    <p className="text-xs text-red-500 mt-2">{errors.coverImage}</p>
                  )}
                </motion.div>
              )}
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-2">
                活动描述 <span className="text-red-500">*</span>
              </label>
              <TextArea
                placeholder="请详细描述活动内容、流程、注意事项等信息..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={2000}
                showCount
                autoSize
                error={errors.description}
              />
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-4">
                活动时间 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <Calendar className="w-4 h-4 text-westlake-500" />
                    <span>开始时间</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        error={errors.startTime}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        prefix={<Clock className="w-4 h-4 text-neutral-400" />}
                      />
                    </div>
                  </div>
                  {errors.startTime && (
                    <p className="text-xs text-red-500 mt-1">{errors.startTime}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <Calendar className="w-4 h-4 text-honghua-500" />
                    <span>结束时间</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        error={errors.endTime}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        prefix={<Clock className="w-4 h-4 text-neutral-400" />}
                      />
                    </div>
                  </div>
                  {errors.endTime && (
                    <p className="text-xs text-red-500 mt-1">{errors.endTime}</p>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-4">
                活动地点 <span className="text-red-500">*</span>
              </label>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <MapPin className="w-4 h-4 text-westlake-500" />
                    <span>地点名称</span>
                  </div>
                  <Input
                    placeholder="如：惠州西湖丰渚园"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    error={errors.locationName}
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <Navigation className="w-4 h-4 text-honghua-500" />
                    <span>详细地址</span>
                  </div>
                  <Input
                    placeholder="请输入详细地址"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    error={errors.address}
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleMapSelect}
                  className="bg-neutral-50 border border-dashed border-neutral-200 rounded-lg p-6 text-center cursor-pointer hover:border-westlake-400 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">点击在地图上选点（模拟）</p>
                </motion.div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-westlake-500" />
                  <span>人数限制</span>
                  <span className="text-red-500">*</span>
                </div>
              </label>
              <Input
                type="number"
                placeholder="最大参与人数"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                min={2}
                max={1000}
                suffix="人"
                error={errors.maxParticipants}
              />
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <label className="block text-sm font-medium text-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-chaojing-500" />
                  <span>报名条件</span>
                </div>
              </label>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div>
                    <div className="font-medium text-neutral-800">仅限圈子成员</div>
                    <div className="text-xs text-neutral-500">仅已加入圈子的成员可报名</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={membersOnly}
                    onChange={(e) => setMembersOnly(e.target.checked)}
                    className="w-5 h-5 accent-westlake-500 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
                  <div>
                    <div className="font-medium text-neutral-800">需要审核</div>
                    <div className="text-xs text-neutral-500">报名需管理员审核通过</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={needReview}
                    onChange={(e) => setNeedReview(e.target.checked)}
                    className="w-5 h-5 accent-westlake-500 rounded"
                  />
                </label>

                <div>
                  <div className="text-sm text-neutral-600 mb-2">其他条件（选填）</div>
                  <TextArea
                    placeholder="如：需要自带装备、体能要求等..."
                    value={otherConditions}
                    onChange={(e) => setOtherConditions(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card>
              <h3 className="font-medium text-neutral-800 mb-3">活动预览</h3>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-neutral-600">
                    活动将发布到 <span className="font-medium text-neutral-800">{currentCircle.name}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-neutral-600">
                    {membersOnly ? '仅圈子成员可报名' : '所有人可报名'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-neutral-600">
                    {needReview ? '报名需审核' : '无需审核，直接通过'}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 p-4 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => navigate(-1)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              loading={submitting}
              onClick={handleSubmit}
              leftIcon={<Upload className="w-5 h-5" />}
            >
              发布活动
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
