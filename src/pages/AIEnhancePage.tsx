import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Palette,
  Camera,
  Download,
  Grid3X3,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import PhotoUploader from '@/components/photo/PhotoUploader';
import CompareViewer from '@/components/photo/CompareViewer';
import SectionTitle from '@/components/common/SectionTitle';
import { photos } from '@/mock/data/photos';
import { Photo } from '@/types';
import { cn } from '@/lib/utils';

export default function AIEnhancePage() {
  const navigate = useNavigate();
  const [selectedPhotoId, setSelectedPhotoId] = useState(photos[0]?.id || '');

  const [qualityEnabled, setQualityEnabled] = useState(true);
  const [qualityIntensity, setQualityIntensity] = useState(50);
  const [denoise, setDenoise] = useState(40);
  const [sharpen, setSharpen] = useState(30);
  const [upscale, setUpscale] = useState(50);

  const [skinEnabled, setSkinEnabled] = useState(false);
  const [skinIntensity, setSkinIntensity] = useState(50);
  const [whiteBalance, setWhiteBalance] = useState(50);
  const [skinSmooth, setSkinSmooth] = useState(40);
  const [brighten, setBrighten] = useState(30);

  const [blurEnabled, setBlurEnabled] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(50);
  const [depthOfField, setDepthOfField] = useState(60);
  const [subjectRecognition, setSubjectRecognition] = useState(70);

  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0];

  const adaptedPhoto: Photo = {
    ...selectedPhoto,
    aiEnhanced: qualityEnabled || skinEnabled || blurEnabled,
    aiParams: {
      qualityEnhance: {
        enabled: qualityEnabled,
        intensity: qualityIntensity,
      },
      skinCorrection: {
        enabled: skinEnabled,
        intensity: skinIntensity,
      },
      backgroundBlur: {
        enabled: blurEnabled,
        intensity: blurIntensity,
      },
    },
    privacy: 'private',
    visibleFriendIds: [],
  };

  const handleOneClickEnhance = () => {
    setIsProcessing(true);
    setQualityEnabled(true);
    setQualityIntensity(70);
    setDenoise(60);
    setSharpen(50);
    setUpscale(80);

    setSkinEnabled(true);
    setSkinIntensity(60);
    setWhiteBalance(55);
    setSkinSmooth(50);
    setBrighten(45);

    setBlurEnabled(true);
    setBlurIntensity(50);
    setDepthOfField(55);
    setSubjectRecognition(80);

    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handleDownload = () => {
    alert('下载功能演示');
  };

  const handleStartCreate = () => {
    navigate('/products');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-paper-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="mb-8"
        >
          <motion.div variants={itemVariants}>
            <SectionTitle
              title="AI 智能处理"
              subtitle="一键美化你的照片，让每张照片都成为艺术品"
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="grid gap-6 lg:grid-cols-12"
        >
          {/* Left Panel - Upload & Photo List */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3"
          >
            <div className="sticky top-24 space-y-6">
              <div className="rounded-xl bg-white p-5 shadow-soft">
                <h3 className="mb-4 font-display text-lg font-semibold text-paper-900">
                  上传照片
                </h3>
                <PhotoUploader maxFiles={10} />
              </div>

              <div className="rounded-xl bg-white p-5 shadow-soft">
                <h3 className="mb-4 font-display text-lg font-semibold text-paper-900">
                  已上传照片
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible lg:flex lg:flex-wrap">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhotoId(photo.id)}
                      className={cn(
                        'relative flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200',
                        'w-20 h-20 sm:w-full sm:h-auto sm:aspect-square',
                        selectedPhotoId === photo.id
                          ? 'ring-2 ring-brand-500 ring-offset-2'
                          : 'hover:ring-2 hover:ring-brand-300 hover:ring-offset-1'
                      )}
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt="照片缩略图"
                        className="h-full w-full object-cover"
                      />
                      {photo.aiEnhanced && (
                        <div className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          AI
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Center - Compare Viewer */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-6"
          >
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-paper-900">
                  效果对比
                </h3>
                <div className="flex items-center gap-2 text-sm text-paper-500">
                  <ImageIcon className="h-4 w-4" />
                  <span>{selectedPhoto.width} x {selectedPhoto.height}</span>
                </div>
              </div>
              <CompareViewer photo={adaptedPhoto} />
            </div>
          </motion.div>

          {/* Right Panel - AI Controls */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-3"
          >
            <div className="sticky top-24 space-y-6">
              {/* Quick Actions */}
              <div className="rounded-xl bg-white p-5 shadow-soft">
                <h3 className="mb-4 font-display text-lg font-semibold text-paper-900">
                  快捷操作
                </h3>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-brand shadow-glow"
                    onClick={handleOneClickEnhance}
                    isLoading={isProcessing}
                  >
                    <Zap className="h-4 w-4" />
                    一键美化
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={handleDownload}>
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                    <Button variant="outline" onClick={handleStartCreate}>
                      <Grid3X3 className="h-4 w-4" />
                      开始制作
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quality Enhance */}
              <div className="rounded-xl bg-white p-5 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-display font-semibold text-paper-900">
                      画质增强
                    </span>
                  </div>
                  <Switch
                    checked={qualityEnabled}
                    onCheckedChange={setQualityEnabled}
                  />
                </div>

                {qualityEnabled && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-paper-600">总强度</span>
                        <span className="font-medium text-brand-600">
                          {qualityIntensity}%
                        </span>
                      </div>
                      <Slider
                        value={qualityIntensity}
                        onChange={setQualityIntensity}
                      />
                    </div>
                    <div className="space-y-3 border-t border-paper-100 pt-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">降噪</span>
                          <span className="text-paper-600">{denoise}%</span>
                        </div>
                        <Slider
                          value={denoise}
                          onChange={setDenoise}
                          className="h-6"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">锐化</span>
                          <span className="text-paper-600">{sharpen}%</span>
                        </div>
                        <Slider
                          value={sharpen}
                          onChange={setSharpen}
                          className="h-6"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">超分辨率</span>
                          <span className="text-paper-600">{upscale}%</span>
                        </div>
                        <Slider
                          value={upscale}
                          onChange={setUpscale}
                          className="h-6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Skin Correction */}
              <div className="rounded-xl bg-white p-5 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                      <Palette className="h-4 w-4" />
                    </div>
                    <span className="font-display font-semibold text-paper-900">
                      肤色校正
                    </span>
                  </div>
                  <Switch
                    checked={skinEnabled}
                    onCheckedChange={setSkinEnabled}
                  />
                </div>

                {skinEnabled && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-paper-600">总强度</span>
                        <span className="font-medium text-gold-600">
                          {skinIntensity}%
                        </span>
                      </div>
                      <Slider
                        value={skinIntensity}
                        onChange={setSkinIntensity}
                      />
                    </div>
                    <div className="space-y-3 border-t border-paper-100 pt-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">白平衡</span>
                          <span className="text-paper-600">{whiteBalance}%</span>
                        </div>
                        <Slider
                          value={whiteBalance}
                          onChange={setWhiteBalance}
                          className="h-6"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">磨皮</span>
                          <span className="text-paper-600">{skinSmooth}%</span>
                        </div>
                        <Slider
                          value={skinSmooth}
                          onChange={setSkinSmooth}
                          className="h-6"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">提亮</span>
                          <span className="text-paper-600">{brighten}%</span>
                        </div>
                        <Slider
                          value={brighten}
                          onChange={setBrighten}
                          className="h-6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Background Blur */}
              <div className="rounded-xl bg-white p-5 shadow-soft">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-600">
                      <Camera className="h-4 w-4" />
                    </div>
                    <span className="font-display font-semibold text-paper-900">
                      背景虚化
                    </span>
                  </div>
                  <Switch
                    checked={blurEnabled}
                    onCheckedChange={setBlurEnabled}
                  />
                </div>

                {blurEnabled && (
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-paper-600">总强度</span>
                        <span className="font-medium text-forest-600">
                          {blurIntensity}%
                        </span>
                      </div>
                      <Slider
                        value={blurIntensity}
                        onChange={setBlurIntensity}
                      />
                    </div>
                    <div className="space-y-3 border-t border-paper-100 pt-4">
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">景深</span>
                          <span className="text-paper-600">{depthOfField}%</span>
                        </div>
                        <Slider
                          value={depthOfField}
                          onChange={setDepthOfField}
                          className="h-6"
                        />
                      </div>
                      <div>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-paper-500">主体识别</span>
                          <span className="text-paper-600">
                            {subjectRecognition}%
                          </span>
                        </div>
                        <Slider
                          value={subjectRecognition}
                          onChange={setSubjectRecognition}
                          className="h-6"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
