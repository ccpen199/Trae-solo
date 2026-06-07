import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/utils/api';
import type {
  SukangStatus,
  OCRResult,
  OCRStep,
  SukangResponse,
  OCRResponse,
  SubmitResponse,
  VerificationHistoryResponse,
} from '@/types/verify';
import {
  verificationLevelLabels,
  verificationMethodLabels,
  verificationTypeLabels,
  statusConfig,
} from '@/types/verify';
import {
  ShieldCheck,
  Upload,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Clock,
  History,
  Shield,
  Lock,
  RefreshCw,
  HelpCircle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  Calendar,
  User,
  FileCheck,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function maskIdNumber(id: string): string {
  if (!id) return '';
  if (id.length <= 10) return id;
  return id.slice(0, 6) + '********' + id.slice(-4);
}

export default function Verify() {
  const { user, setSukangStatus, updateVerificationStatus, setVerificationHistory, verificationHistory, verificationStats, getVerificationCardData } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'verify' | 'history'>('verify');
  const [sukangLoading, setSukangLoading] = useState(false);
  const [sukangError, setSukangError] = useState<string | null>(null);
  const [sukangRetryCount, setSukangRetryCount] = useState(0);

  const [ocrStep, setOcrStep] = useState<OCRStep>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [showIdNumber, setShowIdNumber] = useState(false);
  const [ocrRetryCount, setOcrRetryCount] = useState(0);

  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const sukangStatus: SukangStatus = user?.sukang_status || null;
  const cfg = sukangStatus ? statusConfig[sukangStatus] : null;
  const StatusIcon = cfg ? (sukangStatus === 'green' ? CheckCircle2 : sukangStatus === 'yellow' ? AlertTriangle : XCircle) : ShieldCheck;
  const cardData = getVerificationCardData();

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await api.get<VerificationHistoryResponse>('/verify/history');
      setVerificationHistory(data.list, data.stats);
    } catch (error) {
      console.error('获取核验历史失败:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [setVerificationHistory]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSukangCheck = async () => {
    setSukangLoading(true);
    setSukangError(null);
    try {
      const data = await api.get<SukangResponse>('/verify/sukang');
      setSukangStatus(data.status);
      setSukangRetryCount(0);
      void fetchHistory();
      setSuccessMessage('苏康码查询成功！');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
    } catch (error) {
      const message = error instanceof Error ? error.message : '查询失败，请重试';
      setSukangError(message);
      setSukangRetryCount((prev) => prev + 1);
    } finally {
      setSukangLoading(false);
    }
  };

  const simulateOCRProgress = () => {
    const steps: { step: OCRStep; progress: number; delay: number }[] = [
      { step: 'preprocessing', progress: 25, delay: 500 },
      { step: 'recognizing', progress: 50, delay: 800 },
      { step: 'verifying', progress: 75, delay: 600 },
      { step: 'done', progress: 100, delay: 400 },
    ];

    let currentDelay = 0;
    setOcrStep('uploading');
    setOcrProgress(10);

    steps.forEach(({ step, progress, delay }) => {
      currentDelay += delay;
      setTimeout(() => {
        setOcrStep(step);
        setOcrProgress(progress);
      }, currentDelay);
    });
  };

  const handleOcrUpload = async () => {
    if (!frontFile || !backFile) return;
    setOcrStep('uploading');
    setOcrProgress(0);
    setOcrError(null);
    setOcrResult(null);
    setOcrConfirmed(false);

    simulateOCRProgress();

    try {
      const data = await api.post<OCRResponse>('/verify/ocr', {
        id_card_front: frontFile.name,
        id_card_back: backFile.name,
      });

      setTimeout(() => {
        setOcrResult(data.ocr);
        setOcrStep('done');
        setOcrProgress(100);
        setOcrRetryCount(0);
        updateVerificationStatus({
          verified: data.verified,
          verification_level: data.verification_level,
        });
        void fetchHistory();
      }, 2500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '识别失败，请重试';
      setOcrError(message);
      setOcrStep('failed');
      setOcrRetryCount((prev) => prev + 1);
    }
  };

  const handleSubmitVerification = async () => {
    if (!ocrResult || !ocrConfirmed) return;
    setOcrStep('verifying');

    try {
      const data = await api.post<SubmitResponse>('/verify/submit', {
        verification_type: 'ocr',
        verification_data: ocrResult,
        confirmed: true,
      });

      updateVerificationStatus({
        verified: data.user.verified,
        verification_level: data.user.verification_level,
        verification_method: data.user.verification_method,
        verification_expiry: data.user.verification_expiry,
        last_verified_at: data.user.last_verified_at,
      });

      void fetchHistory();
      setSuccessMessage('实名认证提交成功！');
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      setOcrStep('done');
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败，请重试';
      setOcrError(message);
      setOcrStep('failed');
    }
  };

  const handleResetOCR = () => {
    setOcrStep('idle');
    setOcrProgress(0);
    setFrontFile(null);
    setBackFile(null);
    setOcrResult(null);
    setOcrConfirmed(false);
    setOcrError(null);
  };

  const getStepLabel = (step: OCRStep): string => {
    const labels: Record<OCRStep, string> = {
      idle: '待上传',
      uploading: '上传中',
      preprocessing: '图片预处理',
      recognizing: '文字识别中',
      verifying: '信息校验中',
      done: '识别完成',
      failed: '识别失败',
    };
    return labels[step];
  };

  const renderVerificationStatusCard = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-warm-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-warm-800 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          实名认证状态
        </h2>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-green-500" />
          <span className="text-xs text-warm-500">数据已加密</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 bg-warm-50 rounded-lg">
          <div className={`p-2 rounded-lg ${cardData.verified ? 'bg-green-100' : 'bg-warm-100'}`}>
            {cardData.verified ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-warm-500" />
            )}
          </div>
          <div>
            <p className="text-sm text-warm-500">认证状态</p>
            <p className={`font-semibold ${cardData.verified ? 'text-green-600' : 'text-warm-700'}`}>
              {cardData.verified ? '已认证' : '未认证'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-warm-50 rounded-lg">
          <div className="p-2 rounded-lg bg-primary-50">
            <Award className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-warm-500">认证等级</p>
            <p className="font-semibold text-warm-800">
              {verificationLevelLabels[cardData.verification_level]}
              <span className="ml-2 text-xs text-warm-500">
                Lv.{cardData.verification_level}/3
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-warm-50 rounded-lg">
          <div className="p-2 rounded-lg bg-blue-50">
            <FileCheck className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-warm-500">认证方式</p>
            <p className="font-semibold text-warm-800">
              {cardData.verification_method
                ? verificationMethodLabels[cardData.verification_method] || cardData.verification_method
                : '暂无'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-warm-50 rounded-lg">
          <div className="p-2 rounded-lg bg-purple-50">
            <Calendar className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-warm-500">有效期</p>
            <p className="font-semibold text-warm-800">
              {cardData.verification_expiry
                ? formatDate(cardData.verification_expiry).split(' ')[0]
                : '长期有效'}
            </p>
            {cardData.last_verified_at && (
              <p className="text-xs text-warm-500 mt-1">
                最近核验: {formatDate(cardData.last_verified_at)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700">
          您的核验数据采用 AES-256-GCM 加密传输和存储，保障个人信息安全。认证等级越高，可享受的便民服务越丰富。
        </p>
      </div>
    </div>
  );

  const renderTimeline = () => {
    const recentHistory = verificationHistory.slice(0, 5);

    if (recentHistory.length === 0) {
      return (
        <div className="text-center py-6 text-warm-500">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>暂无核验记录</p>
        </div>
      );
    }

    return (
      <div className="relative">
        {recentHistory.map((item, index) => (
          <div key={item.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.status === 'success'
                    ? 'bg-green-100 text-green-600'
                    : item.status === 'failed'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-warm-100 text-warm-600'
                }`}
              >
                {item.status === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : item.status === 'failed' ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              {index < recentHistory.length - 1 && (
                <div className="w-0.5 flex-1 bg-warm-200 my-1" />
              )}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-warm-800">
                  {verificationTypeLabels[item.type] || item.type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-warm-100 text-warm-700'
                  }`}
                >
                  {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '处理中'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-warm-500">
                <span>{verificationMethodLabels[item.method] || item.method}</span>
                <span>·</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              {item.result && (
                <p className="text-sm text-warm-600 mt-1">
                  结果: {item.result === 'green' ? '绿码' : item.result === 'yellow' ? '黄码' : item.result === 'red' ? '红码' : item.result}
                </p>
              )}
              {item.error_message && (
                <p className="text-sm text-red-600 mt-1">错误: {item.error_message}</p>
              )}
              {item.request_encrypted && (
                <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                  <Lock className="w-3 h-3" />
                  <span>加密传输</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderOCRSection = () => (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
        <ScanLine className="w-5 h-5 text-primary" />
        身份证 OCR 识别
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="ml-auto text-warm-400 hover:text-warm-600"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </h2>

      {showHelp && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <h3 className="font-medium text-amber-800 mb-2">OCR 识别说明</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>• 请确保身份证照片清晰，无反光、无遮挡</li>
            <li>• 支持 JPG、PNG 格式，单张图片不超过 10MB</li>
            <li>• 识别过程约需 2-5 秒，请耐心等待</li>
            <li>• 识别完成后请核对信息，确认无误后提交</li>
            <li>• 所有数据采用 AES-256 加密传输和存储</li>
          </ul>
        </div>
      )}

      {ocrStep !== 'idle' && ocrStep !== 'done' && ocrStep !== 'failed' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-warm-700">{getStepLabel(ocrStep)}</span>
            <span className="text-sm text-warm-500">{ocrProgress}%</span>
          </div>
          <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500 ease-out"
              style={{ width: `${ocrProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm text-warm-500">正在处理，请稍候...</span>
          </div>
        </div>
      )}

      {ocrStep === 'failed' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-800">识别失败</p>
              <p className="text-sm text-red-700 mt-1">{ocrError}</p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleOcrUpload}
                  className="px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重试 ({ocrRetryCount}/3)
                </button>
                <button
                  onClick={handleResetOCR}
                  className="px-4 py-2 bg-warm-100 text-warm-700 text-sm rounded-md hover:bg-warm-200 transition-colors"
                >
                  重新上传
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(ocrStep === 'idle' || ocrStep === 'failed') && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-warm-600 mb-2">身份证正面（人像面）</label>
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-warm-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
                {frontFile ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                    <p className="text-sm text-warm-600 truncate px-2">{frontFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-warm-400 mb-1" />
                    <p className="text-sm text-warm-400">点击上传</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm text-warm-600 mb-2">身份证反面（国徽面）</label>
              <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-warm-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary-50 transition-colors">
                {backFile ? (
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-1" />
                    <p className="text-sm text-warm-600 truncate px-2">{backFile.name}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-warm-400 mb-1" />
                    <p className="text-sm text-warm-400">点击上传</p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <Lock className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              图片将通过 AES-256 加密通道传输，仅用于身份核验，核验完成后自动删除原始图片。
            </p>
          </div>

          <button
            onClick={handleOcrUpload}
            disabled={!frontFile || !backFile}
            className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            <ScanLine className="w-4 h-4" />
            开始识别
          </button>
        </>
      )}

      {ocrResult && ocrStep === 'done' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">识别成功，请核对以下信息</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">姓名</span>
                <span className="font-medium text-warm-800">{ocrResult.name}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">性别</span>
                <span className="font-medium text-warm-800">{ocrResult.gender}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">民族</span>
                <span className="font-medium text-warm-800">{ocrResult.ethnicity}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">出生日期</span>
                <span className="font-medium text-warm-800">{ocrResult.birth_date}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md col-span-2">
                <span className="text-sm text-warm-500">身份证号</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-warm-800">
                    {showIdNumber ? ocrResult.id_number : maskIdNumber(ocrResult.id_number)}
                  </span>
                  <button
                    onClick={() => setShowIdNumber(!showIdNumber)}
                    className="text-warm-400 hover:text-warm-600"
                  >
                    {showIdNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md col-span-2">
                <span className="text-sm text-warm-500">住址</span>
                <span className="font-medium text-warm-800 text-right">{ocrResult.address}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">签发机关</span>
                <span className="font-medium text-warm-800">{ocrResult.issue_authority}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-md">
                <span className="text-sm text-warm-500">有效期</span>
                <span className="font-medium text-warm-800">{ocrResult.valid_period}</span>
              </div>
            </div>
          </div>

          {user && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h3 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                信息对比
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span className="text-sm text-warm-500">姓名</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-800">{user.name}</span>
                    {user.name === ocrResult.name ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-md">
                  <span className="text-sm text-warm-500">手机号</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-warm-800">{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                    <Info className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <label className="flex items-start gap-3 p-3 bg-warm-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={ocrConfirmed}
              onChange={(e) => setOcrConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-primary rounded border-warm-300 focus:ring-primary"
            />
            <span className="text-sm text-warm-600">
              我已核对上述信息，确认无误并同意授权使用该信息进行实名认证。所有数据将加密存储，严格保护个人隐私。
            </span>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmitVerification}
              disabled={!ocrConfirmed}
              className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4" />
              确认提交
            </button>
            <button
              onClick={handleResetOCR}
              className="px-6 py-2.5 bg-warm-100 text-warm-700 rounded-md hover:bg-warm-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重新识别
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-warm-800 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          核验历史记录
        </h2>
        <button
          onClick={fetchHistory}
          disabled={historyLoading}
          className="text-sm text-primary hover:text-primary-light flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      {verificationStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{verificationStats.success_count}</p>
            <p className="text-xs text-green-600">成功次数</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-600">{verificationStats.failed_count}</p>
            <p className="text-xs text-red-600">失败次数</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{verificationStats.sukang_count}</p>
            <p className="text-xs text-blue-600">苏康码查询</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-purple-600">{verificationStats.ocr_count}</p>
            <p className="text-xs text-purple-600">OCR识别</p>
          </div>
        </div>
      )}

      {historyLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-warm-500">加载中...</p>
        </div>
      ) : verificationHistory.length === 0 ? (
        <div className="text-center py-12 text-warm-500">
          <History className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>暂无核验历史记录</p>
          <p className="text-sm mt-1">完成核验后将在此处显示记录</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(historyExpanded ? verificationHistory : verificationHistory.slice(0, 5)).map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg ${
                item.status === 'success'
                  ? 'border-green-200 bg-green-50/30'
                  : item.status === 'failed'
                    ? 'border-red-200 bg-red-50/30'
                    : 'border-warm-200 bg-warm-50/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'sukang'
                        ? 'bg-green-100 text-green-600'
                        : item.type === 'ocr'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {item.type === 'sukang' ? (
                      <ShieldCheck className="w-4 h-4" />
                    ) : item.type === 'ocr' ? (
                      <ScanLine className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-warm-800">
                      {verificationTypeLabels[item.type] || item.type}
                    </p>
                    <p className="text-xs text-warm-500">
                      {verificationMethodLabels[item.method] || item.method}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      item.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : item.status === 'failed'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-warm-100 text-warm-700'
                    }`}
                  >
                    {item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '处理中'}
                  </span>
                  <p className="text-xs text-warm-500 mt-1">{formatDate(item.created_at)}</p>
                </div>
              </div>
              {item.result && (
                <p className="text-sm text-warm-600 ml-10">
                  结果: {item.result === 'green' ? '绿码' : item.result === 'yellow' ? '黄码' : item.result === 'red' ? '红码' : item.result}
                </p>
              )}
              {item.error_message && (
                <p className="text-sm text-red-600 ml-10">错误: {item.error_message}</p>
              )}
              {item.request_encrypted && (
                <div className="flex items-center gap-1 mt-2 ml-10 text-xs text-green-600">
                  <Lock className="w-3 h-3" />
                  <span>加密传输 · AES-256-GCM</span>
                </div>
              )}
            </div>
          ))}

          {verificationHistory.length > 5 && (
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full py-3 text-center text-sm text-primary hover:text-primary-light flex items-center justify-center gap-1"
            >
              {historyExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  查看更多 ({verificationHistory.length - 5} 条)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl p-8 shadow-2xl animate-bounce-in">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 animate-scale-in" />
            </div>
            <p className="text-xl font-bold text-warm-800 text-center">{successMessage}</p>
            <p className="text-sm text-warm-500 text-center mt-2">数据已加密存储</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif-cn text-2xl font-bold text-warm-800">实名认证</h1>
        <div className="flex items-center gap-2 bg-warm-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('verify')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'verify'
                ? 'bg-white text-primary shadow-sm'
                : 'text-warm-600 hover:text-warm-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 inline mr-1" />
            核验
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-primary shadow-sm'
                : 'text-warm-600 hover:text-warm-800'
            }`}
          >
            <History className="w-4 h-4 inline mr-1" />
            历史
          </button>
        </div>
      </div>

      {activeTab === 'verify' ? (
        <>
          {renderVerificationStatusCard()}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              苏康码
            </h2>

            {sukangError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800">查询失败</p>
                    <p className="text-sm text-red-700 mt-1">{sukangError}</p>
                    <button
                      onClick={handleSukangCheck}
                      disabled={sukangLoading || sukangRetryCount >= 3}
                      className="mt-3 px-4 py-2 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重试 ({sukangRetryCount}/3)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {sukangStatus ? (
              <div className="flex flex-col items-center py-6">
                <div
                  className={`w-40 h-40 rounded-2xl ${cfg?.bg} flex flex-col items-center justify-center text-white shadow-lg transition-all duration-500`}
                >
                  <StatusIcon className="w-16 h-16 mb-2" />
                  <span className="text-2xl font-bold">{cfg?.label}</span>
                </div>
                <p className={`mt-4 text-lg font-semibold ${cfg?.text}`}>
                  当前状态：{cfg?.label}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-warm-500">数据加密传输</span>
                </div>
                <button
                  onClick={handleSukangCheck}
                  disabled={sukangLoading}
                  className="mt-4 px-6 py-2 bg-warm-100 text-warm-700 rounded-md hover:bg-warm-200 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {sukangLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  更新状态
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-warm-500 mb-4">尚未查询苏康码状态</p>
                <button
                  onClick={handleSukangCheck}
                  disabled={sukangLoading}
                  className="px-6 py-2.5 bg-primary text-white rounded-md hover:bg-primary-light transition-colors flex items-center gap-2 mx-auto disabled:opacity-60"
                >
                  {sukangLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  查询苏康码
                </button>
              </div>
            )}
          </div>

          {renderOCRSection()}

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="font-semibold text-warm-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              核验状态时间轴
            </h2>
            {renderTimeline()}
          </div>
        </>
      ) : (
        renderHistoryTab()
      )}
    </div>
  );
}
