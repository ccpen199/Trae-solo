import React, { useState, useRef, useEffect } from 'react';
import { Camera, Video, Upload, X, Smile, Sparkles, Heart } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import apiClient from '../api/client';
import { useToast } from '../components/Toast';

const CameraPage: React.FC = () => {
  const [mode, setMode] = useState<'photo' | 'upload'>('photo');
  const [selectedBaby, setSelectedBaby] = useState<number | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [babies, setBabies] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const stickers = ['😊', '🥰', '👶', '⭐', '🌈', '🎀', '🍼', '🧸'];
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);

  useEffect(() => {
    fetchBabies();
  }, []);

  const fetchBabies = async () => {
    try {
      const response = await apiClient.get('/babies');
      setBabies(response.data.data || []);
      if (response.data.data?.length > 0) {
        setSelectedBaby(response.data.data[0].id);
      }
    } catch (err) {
      console.error('获取宝宝列表失败', err);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      showToast('请先选择照片', 'error');
      return;
    }
    if (!selectedBaby) {
      showToast('请选择宝宝', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInputRef.current.files[0]);
      formData.append('babyId', selectedBaby.toString());
      formData.append('caption', caption || '美好的瞬间');
      formData.append('type', 'photo');

      await apiClient.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('上传成功！', 'success');
      setPreviewImage(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      showToast(err.errorMessage || '上传失败', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-20">
      <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">拍宝宝</h1>
        <p className="text-sm text-gray-500">记录宝宝的可爱瞬间</p>
      </header>

      <div className="px-6 py-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('photo')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              mode === 'photo'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Camera className="w-5 h-5" />
            拍照
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              mode === 'upload'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            <Upload className="w-5 h-5" />
            上传照片
          </button>
        </div>

        {babies.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择宝宝
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {babies.map((baby) => (
                <button
                  key={baby.id}
                  onClick={() => setSelectedBaby(baby.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all ${
                    selectedBaby === baby.id
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                >
                  {baby.gender === 'male' ? '👦' : '👧'} {baby.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
          >
            {previewImage ? (
              <>
                <img
                  src={previewImage}
                  alt="预览"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImage(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                {selectedSticker && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl">
                    {selectedSticker}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <p className="text-gray-500">点击选择照片</p>
                <p className="text-sm text-gray-400 mt-1">支持 JPG、PNG 格式</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {previewImage && (
          <>
            <div className="card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Smile className="w-5 h-5 text-primary" />
                <span className="font-medium text-gray-700">添加贴纸</span>
              </div>
              <div className="flex gap-3 flex-wrap">
                {stickers.map((sticker) => (
                  <button
                    key={sticker}
                    onClick={() => setSelectedSticker(selectedSticker === sticker ? null : sticker)}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                      selectedSticker === sticker
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {sticker}
                  </button>
                ))}
              </div>
            </div>

            <div className="card mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                描述一下吧
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="记录下这个美好的瞬间..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none h-24"
                maxLength={200}
              />
              <p className="text-right text-xs text-gray-400 mt-1">
                {caption.length}/200
              </p>
            </div>

            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  保存到时光机
                </>
              )}
            </button>
          </>
        )}

        <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl">
          <div className="flex items-start gap-3">
            <Heart className="w-6 h-6 text-pink-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">拍照小贴士</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 自然光线拍摄效果更佳</li>
                <li>• 多和宝宝互动，捕捉可爱表情</li>
                <li>• 添加贴纸让照片更有趣</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CameraPage;
