import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  Image as ImageIcon,
  Search,
  X,
  Sparkles,
  ArrowLeft,
  Palette,
  Eye,
  RefreshCw,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  imageUrl: string;
  similarity: number;
  title: string;
  style: string;
}

const searchTitles = [
  '北欧简约客厅设计',
  '现代极简卧室空间',
  '日式禅意书房布置',
  '新中式典雅餐厅',
  '工业风开放式厨房',
  '轻奢主义主卧套房',
  '地中海风格阳台',
  '复古混搭客厅灵感',
  '原木自然系儿童房',
];

const searchStyles = ['北欧', '现代', '日式', '新中式', '工业风', '轻奢', '地中海', '混搭'];

function generateSearchResults(): SearchResult[] {
  const styles = ['nordic', 'modern', 'japanese', 'chinese', 'industrial', 'luxury', 'mediterranean'];
  const stylePrompts: Record<string, string> = {
    modern: 'Minimalist modern interior design with wood furniture and soft natural lighting, warm neutral tones',
    nordic: 'Scandinavian nordic interior design bright cozy living room white walls wooden floor plants',
    chinese: 'New Chinese style interior design elegant oriental furniture ink painting warm wood tones',
    luxury: 'Luxury modern interior design marble accents golden details velvet sofa elegant chandelier',
    industrial: 'Industrial style interior design exposed brick metal pipes concrete floor vintage loft',
    japanese: 'Japanese zen interior design tatami mats shoji screens natural wood minimalist tranquil',
    mediterranean: 'Mediterranean interior design whitewashed walls blue accents terracotta tiles natural light',
  };

  return Array.from({ length: 9 }, (_, i) => {
    const style = styles[i % styles.length];
    const prompt = `${stylePrompts[style]}, photorealistic interior design photography, professional lighting, high detail`;
    return {
      id: `result-${i}`,
      imageUrl: `/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=portrait_4_3&seed=${i + 200}`,
      similarity: 95 - i * 2 - Math.floor(Math.random() * 5),
      title: searchTitles[i % searchTitles.length],
      style: searchStyles[i % searchStyles.length],
    };
  });
}

const extractedColors = ['#8B6914', '#CBA356', '#C4623A', '#F5ECDA', '#FAF8F5'];

export default function ImageSearchPage() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [extractingColors, setExtractingColors] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      messageApi.error('图片大小不能超过10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setHasSearched(false);
      setResults([]);
      messageApi.success('图片上传成功');
    };
    reader.readAsDataURL(file);
  }, [messageApi]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const handleSearch = () => {
    if (!uploadedImage) return;
    setSearching(true);
    setSearchProgress(0);
    setHasSearched(true);
    setResults([]);
    messageApi.loading({ content: 'AI正在分析图像特征...', key: 'search', duration: 0 });

    const interval = setInterval(() => {
      setSearchProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setSearching(false);
          setResults(generateSearchResults());
          messageApi.destroy('search');
          messageApi.success('搜索完成，找到9个相似灵感');
          return 100;
        }
        return p + 4;
      });
    }, 60);
  };

  const clearImage = () => {
    setUploadedImage(null);
    setResults([]);
    setHasSearched(false);
    setSearchProgress(0);
    messageApi.info('已清除上传图片');
  };

  const reUpload = () => {
    clearImage();
    messageApi.info('请重新上传图片');
  };

  const viewOriginalImage = () => {
    setShowOriginalModal(true);
  };

  const copyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    messageApi.success(`色值 ${color} 已复制到剪贴板`);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const extractColorScheme = () => {
    setExtractingColors(true);
    messageApi.loading({ content: '正在提取色彩方案...', key: 'extract', duration: 0 });
    setTimeout(() => {
      setExtractingColors(false);
      messageApi.destroy('extract');
      messageApi.success('色彩方案提取完成！');
    }, 1500);
  };

  const goTo3DGenerator = (result: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    messageApi.loading({ content: '正在跳转3D方案生成器...', key: '3d', duration: 0 });
    setTimeout(() => {
      messageApi.destroy('3d');
      navigate('/owner/3d-generator', { state: { style: result.style, colors: extractedColors } });
    }, 300);
  };

  return (
    <div className="min-h-screen bg-ivory-50">
      {contextHolder}
      <div className="container py-8">
        <button
          onClick={() => navigate('/owner/inspiration')}
          className="btn-ghost mb-6 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回灵感库
        </button>

        <div className="mb-8">
          <h1 className="section-title flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-terracotta-500" />
            以图搜图
          </h1>
          <p className="section-subtitle">上传一张室内设计图片，AI为你匹配相似风格的灵感</p>
        </div>

        <div className="grid grid-cols-10 gap-8">
          <div className="col-span-3">
            <div className="sticky top-8 space-y-6">
              <div className="card-base p-6">
                <h3 className="font-serif text-lg font-semibold text-carbon-800 mb-4">上传参考图</h3>

                {!uploadedImage ? (
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
                      isDragActive
                        ? 'border-terracotta-400 bg-terracotta-50 scale-[1.02]'
                        : 'border-ivory-300 hover:border-wood-400 hover:bg-wood-50/50'
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-wood-100 to-wood-200 flex items-center justify-center shadow-inner">
                      <Upload className="w-10 h-10 text-wood-600" />
                    </div>
                    <p className="text-carbon-700 font-medium mb-1 text-lg">
                      {isDragActive ? '松开上传图片' : '拖拽图片到此处'}
                    </p>
                    <p className="text-ivory-500 text-sm">或点击选择文件</p>
                    <p className="text-ivory-400 text-xs mt-3">支持 JPG、PNG、WEBP 格式，最大 10MB</p>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 z-10 w-7 h-7 bg-carbon-800 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-carbon-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className={cn(
                      'relative rounded-xl overflow-hidden cursor-pointer',
                      searching && 'ring-2 ring-terracotta-400'
                    )}
                      onClick={viewOriginalImage}
                    >
                      <img
                        src={uploadedImage}
                        alt="uploaded"
                        className="w-full h-72 object-cover"
                      />
                      <div className="absolute inset-0 bg-carbon-900/0 hover:bg-carbon-900/30 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Eye className="w-5 h-5" />
                          查看原图
                        </div>
                      </div>
                      {searching && (
                        <div className="absolute inset-0 bg-carbon-900/40 overflow-hidden">
                          <motion.div
                            className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-terracotta-400/40 to-transparent"
                            animate={{ y: ['-100%', '400%'] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                          />
                        </div>
                      )}
                    </div>
                    {searching && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-carbon-600 mb-2">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-terracotta-500 animate-pulse" />
                            AI 正在分析图像特征...
                          </span>
                          <span className="font-mono text-terracotta-600 font-semibold">{searchProgress}%</span>
                        </div>
                        <div className="h-2.5 bg-ivory-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-terracotta-400 via-terracotta-500 to-terracotta-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${searchProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <p className="text-xs text-ivory-500 mt-2">正在识别风格、色彩、材质特征...</p>
                      </div>
                    )}
                  </div>
                )}

                {uploadedImage && !searching && (
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={reUpload}
                      className="btn-secondary text-sm py-2 justify-center"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      重新上传
                    </button>
                    <button
                      onClick={viewOriginalImage}
                      className="btn-secondary text-sm py-2 justify-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      查看原图
                    </button>
                  </div>
                )}

                {hasSearched && results.length > 0 && !searching && (
                  <div className="mt-4 p-4 bg-haze-50 rounded-xl border border-haze-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-carbon-800 text-sm flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-haze-600" />
                        提取色彩方案
                      </h4>
                      <button
                        onClick={extractColorScheme}
                        disabled={extractingColors}
                        className={cn(
                          'text-xs text-haze-600 hover:text-haze-700 font-medium',
                          extractingColors && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {extractingColors ? '提取中...' : '重新提取'}
                      </button>
                    </div>
                    <div className="flex gap-1.5">
                      {extractedColors.map((color, i) => (
                        <motion.button
                          key={color}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => copyColor(color)}
                          className="group relative flex-1 aspect-square rounded-lg shadow-sm hover:shadow-md transition-all overflow-hidden"
                          style={{ backgroundColor: color }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-carbon-900/20">
                            {copiedColor === color ? (
                              <Check className="w-4 h-4 text-white" />
                            ) : (
                              <Palette className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                    <p className="text-[10px] text-haze-600 mt-2 text-center">点击色卡复制 HEX 色值</p>
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={!uploadedImage || searching}
                  className={cn(
                    'btn-primary w-full mt-6',
                    (!uploadedImage || searching) && 'opacity-50 cursor-not-allowed pointer-events-none'
                  )}
                >
                  {searching ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-pulse" />
                      AI 搜索中...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      开始智能搜索
                    </>
                  )}
                </button>
              </div>

              <div className="card-base p-6 bg-gradient-to-br from-wood-50/50 to-ivory-50 border-wood-100">
                <h4 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-wood-500" />
                  AI 搜索技巧
                </h4>
                <ul className="space-y-2 text-sm text-carbon-600">
                  <li className="flex gap-2">
                    <span className="text-terracotta-500">•</span>
                    上传清晰的空间整体照效果最佳
                  </li>
                  <li className="flex gap-2">
                    <span className="text-terracotta-500">•</span>
                    避免模糊、过度修图的照片
                  </li>
                  <li className="flex gap-2">
                    <span className="text-terracotta-500">•</span>
                    可多次上传不同角度的图片
                  </li>
                  <li className="flex gap-2">
                    <span className="text-terracotta-500">•</span>
                    提取色彩后可一键应用到3D方案
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="col-span-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl font-semibold text-carbon-800">
                  搜索结果
                  {results.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-ivory-500">
                      找到 {results.length} 个相似灵感
                    </span>
                  )}
                </h3>
              </div>
              {hasSearched && !searching && results.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-ivory-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    ≥90% 高度匹配
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-wood-500" />
                    ≥80% 相似
                  </span>
                </div>
              )}
            </div>

            {!hasSearched ? (
              <div className="card-base p-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-ivory-100 to-ivory-200 flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-ivory-400" />
                </div>
                <h4 className="font-serif text-2xl text-carbon-700 mb-2">等待搜索</h4>
                <p className="text-ivory-500 text-lg">上传一张室内设计图片，开启AI匹配之旅</p>
                <p className="text-ivory-400 text-sm mt-2">支持从相册、截图、网络图片搜索</p>
              </div>
            ) : searching ? (
              <div className="space-y-4">
                <div className="card-base p-6 bg-gradient-to-r from-terracotta-50 to-amber-50 border-terracotta-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-terracotta-400 to-terracotta-600 flex items-center justify-center text-white animate-pulse">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-carbon-800">AI 正在分析图像特征</h4>
                      <p className="text-sm text-ivory-600">正在识别风格、色彩、材质、空间布局等特征...</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="aspect-[4/3] rounded-xl bg-ivory-200 overflow-hidden relative"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-ivory-100/50 to-transparent animate-shimmer"
                        style={{ backgroundSize: '200% 100%' }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              <AnimatePresence mode="popLayout">
                <motion.div
                  layout
                  className="grid grid-cols-3 gap-4"
                >
                  {results.map((result, idx) => (
                    <motion.div
                      key={result.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.06, duration: 0.4 }}
                      className="card-hoverable overflow-hidden group"
                    >
                      <div
                        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
                        onClick={() => navigate(`/owner/inspiration/${result.id}`)}
                      >
                        <img
                          src={result.imageUrl}
                          alt={result.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3">
                          <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-sm',
                            result.similarity >= 90
                              ? 'bg-emerald-500/90 text-white'
                              : result.similarity >= 80
                                ? 'bg-wood-500/90 text-white'
                                : 'bg-ivory-500/90 text-white'
                          )}>
                            {result.similarity}% 匹配
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-carbon-900/70 via-carbon-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                          <h4 className="text-white font-medium mb-2 line-clamp-1">{result.title}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/owner/inspiration/${result.id}`)}
                              className="flex-1 py-1.5 bg-white/90 text-carbon-800 text-xs font-medium rounded-lg hover:bg-white transition-colors"
                            >
                              查看详情
                            </button>
                            <button
                              onClick={e => goTo3DGenerator(result, e)}
                              className="flex-1 py-1.5 bg-terracotta-500 text-white text-xs font-medium rounded-lg hover:bg-terracotta-600 transition-colors"
                            >
                              生成3D
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium text-carbon-800 mb-1 line-clamp-1 group-hover:text-terracotta-600 transition-colors">
                          {result.title}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ivory-500">{result.style}风格</span>
                          <button
                            onClick={e => goTo3DGenerator(result, e)}
                            className="text-xs text-terracotta-600 font-medium hover:text-terracotta-700 flex items-center gap-0.5"
                          >
                            应用到3D方案 →
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="card-base p-16 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ivory-100 flex items-center justify-center">
                  <Search className="w-10 h-10 text-ivory-400" />
                </div>
                <h4 className="font-serif text-xl text-carbon-700 mb-2">暂无匹配结果</h4>
                <p className="text-ivory-500 mb-4">请尝试上传其他室内设计图片</p>
                <button onClick={reUpload} className="btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  重新上传
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={showOriginalModal}
        onCancel={() => setShowOriginalModal(false)}
        footer={null}
        centered
        width="auto"
        closeIcon={<X className="w-5 h-5" />}
        styles={{ mask: { backgroundColor: 'rgba(0,0,0,0.8)' } }}
      >
        <div className="max-w-4xl max-h-[80vh] overflow-hidden">
          <img
            src={uploadedImage || ''}
            alt="original"
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </Modal>
    </div>
  );
}
