import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileImage, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useDGeneratorStore } from '@/store/dGeneratorStore';
import { cn } from '@/lib/utils';

export default function Step1Upload() {
  const {
    uploadedFile,
    uploadProgress,
    isRecognizing,
    recognitionDone,
    setUploadedFile,
    setUploadProgress,
    setIsRecognizing,
    setRecognitionDone,
    resetUpload,
    setStep,
  } = useDGeneratorStore();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploadedFile(file);
    startRecognition();
  }, [setUploadedFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    disabled: isRecognizing,
  });

  const startRecognition = () => {
    setIsRecognizing(true);
    setRecognitionDone(false);
    setUploadProgress(0);

    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setUploadProgress(progress);

      if (progress < 100) {
        requestAnimationFrame(tick);
      } else {
        setIsRecognizing(false);
        setRecognitionDone(true);
      }
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
    };
  }, []);

  return (
    <div className="flex flex-col h-full items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <h2 className="text-2xl font-bold text-carbon-800 mb-2 text-center">上传户型图</h2>
        <p className="text-carbon-500 mb-8 text-center">支持 JPG、PNG 格式，建议图片清晰、无遮挡</p>

        {!uploadedFile && (
          <div
            {...getRootProps()}
            className={cn(
              'relative border-2 border-dashed rounded-card p-16 text-center cursor-pointer transition-all duration-300',
              isDragActive
                ? 'border-terracotta-500 bg-terracotta-50 scale-[1.01]'
                : 'border-wood-300 bg-ivory-50 hover:border-wood-500 hover:bg-wood-50'
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-wood-100 flex items-center justify-center">
                <Upload className="w-10 h-10 text-wood-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-carbon-700 mb-1">
                  {isDragActive ? '松开鼠标上传' : '点击或拖拽上传户型图'}
                </p>
                <p className="text-sm text-carbon-500">支持 JPG / PNG / WEBP</p>
              </div>
            </div>
          </div>
        )}

        {uploadedFile && (
          <div className="space-y-6">
            <div className="relative bg-ivory-100 rounded-card p-4 border border-wood-200">
              <button
                onClick={resetUpload}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/80 hover:bg-carbon-100 text-carbon-500 hover:text-carbon-700 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <FileImage className="w-6 h-6 text-terracotta-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-carbon-800 truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-carbon-500">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                </div>
                {recognitionDone && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">识别完成</span>
                  </div>
                )}
              </div>

              <div className="relative aspect-video bg-white rounded-lg overflow-hidden border border-wood-200">
                <svg viewBox="0 0 800 500" className="w-full h-full">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E8E4DD" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="800" height="500" fill="url(#grid)" />

                  <g fill="none" stroke="#8B6914" strokeWidth="3" strokeLinejoin="round">
                    <rect x="60" y="40" width="360" height="220" rx="2" />
                    <rect x="440" y="40" width="300" height="180" rx="2" />
                    <rect x="60" y="280" width="260" height="180" rx="2" />
                    <rect x="340" y="280" width="200" height="180" rx="2" />
                    <rect x="560" y="240" width="180" height="120" rx="2" />
                    <rect x="560" y="380" width="180" height="80" rx="2" />
                  </g>

                  <g fill="#DE8F69" opacity="0.9">
                    <rect x="200" y="40" width="80" height="8" />
                    <rect x="520" y="40" width="60" height="8" />
                    <rect x="440" y="130" width="8" height="60" />
                    <rect x="60" y="360" width="8" height="60" />
                    <rect x="320" y="280" width="8" height="60" />
                  </g>

                  <g fill="#7A9CA9" opacity="0.85">
                    <circle cx="280" cy="44" r="10" />
                    <circle cx="620" cy="44" r="10" />
                    <circle cx="736" cy="130" r="10" />
                    <circle cx="140" cy="456" r="10" />
                    <circle cx="436" cy="456" r="10" />
                  </g>

                  <g fontSize="14" fill="#555452" fontWeight="500">
                    <text x="240" y="160" textAnchor="middle">客厅 4.2×5.5m</text>
                    <text x="590" y="135" textAnchor="middle">主卧 3.6×4.2m</text>
                    <text x="190" y="375" textAnchor="middle">次卧 3.0×3.6m</text>
                    <text x="440" y="375" textAnchor="middle">厨房 2.5×3.2m</text>
                    <text x="650" y="305" textAnchor="middle">餐厅</text>
                    <text x="650" y="425" textAnchor="middle">卫生间 2.0×2.4m</text>
                  </g>

                  {isRecognizing && (
                    <>
                      <rect
                        y={500 * (uploadProgress / 100) - 60}
                        width="800"
                        height="60"
                        fill="url(#scanGradient)"
                        opacity="0.4"
                      />
                      <line
                        x1="0"
                        y1={500 * (uploadProgress / 100)}
                        x2="800"
                        y2={500 * (uploadProgress / 100)}
                        stroke="#C4623A"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                      <defs>
                        <linearGradient id="scanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#C4623A" stopOpacity="0" />
                          <stop offset="100%" stopColor="#C4623A" stopOpacity="0.5" />
                        </linearGradient>
                      </defs>
                    </>
                  )}
                </svg>
              </div>
            </div>

            {isRecognizing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-carbon-600">
                    <Loader2 className="w-4 h-4 animate-spin text-terracotta-500" />
                    <span>AI 正在识别户型结构...</span>
                  </div>
                  <span className="font-semibold text-terracotta-600">{Math.round(uploadProgress)}%</span>
                </div>
                <div className="h-2 bg-ivory-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-terracotta-400 to-terracotta-600 transition-all duration-100 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {recognitionDone && (
              <div className="flex justify-end gap-3">
                <button
                  onClick={resetUpload}
                  className="px-6 py-2.5 rounded-btn border border-wood-300 text-carbon-700 hover:bg-wood-50 transition-colors font-medium"
                >
                  重新上传
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-2.5 rounded-btn bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white font-medium hover:from-terracotta-600 hover:to-terracotta-700 shadow-lg shadow-terracotta-500/20 transition-all"
                >
                  下一步 →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
