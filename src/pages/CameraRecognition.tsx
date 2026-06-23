import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Loader2, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { recognitionApi } from '@/services/api';
import { RecognitionPrediction } from '../../../shared/types';
import CategoryBadge from '@/components/CategoryBadge';

export default function CameraRecognition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [predictions, setPredictions] = useState<RecognitionPrediction[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const currentCity = useAppStore((state) => state.currentCity);

  const initCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      setError('无法访问摄像头，请检查权限设置');
      console.error('Camera error:', err);
    }
  }, [facingMode]);

  useEffect(() => {
    initCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [initCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    return base64;
  }, []);

  const handleRecognize = useCallback(async (imageBase64: string) => {
    if (!currentCity) {
      setError('请先选择城市');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await recognitionApi.recognizeImage(imageBase64, currentCity.id);
      if (result.success && result.predictions.length > 0) {
        setPredictions(result.predictions);
        setShowResult(true);
      } else {
        setError('未能识别出物品，请重试');
      }
    } catch (err) {
      setError('识别失败，请稍后重试');
      console.error('Recognition error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentCity]);

  const handleTakePhoto = useCallback(() => {
    const base64 = capturePhoto();
    if (base64) handleRecognize(base64);
  }, [capturePhoto, handleRecognize]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      handleRecognize(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [handleRecognize]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const closeResult = useCallback(() => {
    setShowResult(false);
    setPredictions([]);
  }, []);

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? 'opacity-100' : 'opacity-0'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />

      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <h1 className="text-white text-lg font-medium text-center">拍照识别</h1>
      </div>

      {error && (
        <div className="absolute top-16 left-4 right-4 p-4 bg-red-500/90 text-white rounded-xl text-center">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <p className="text-gray-700 font-medium">正在识别中...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent pb-10">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <Upload className="w-6 h-6" />
          </button>

          <button
            onClick={handleTakePhoto}
            disabled={!cameraReady || isLoading}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>

          <button
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out z-30 ${showResult ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '70vh' }}
      >
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">识别结果</h2>
            <button
              onClick={closeResult}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            {predictions.map((pred, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border-2 transition-all ${idx === 0 ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{pred.itemName}</h3>
                    <div className="mt-2">
                      <CategoryBadge category={pred.category} size="sm" />
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${pred.confidence >= 0.8 ? 'text-green-600' : pred.confidence >= 0.6 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {(pred.confidence * 100).toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-500">置信度</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">投放要求</p>
                    <p className="text-sm text-gray-600">{pred.disposalRequirements}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">常见误区</p>
                    <p className="text-sm text-gray-600">{pred.commonMisconceptions}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
