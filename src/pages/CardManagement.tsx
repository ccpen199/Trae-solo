import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Camera,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  RefreshCw,
} from 'lucide-react';
import Modal from '@/components/Modal';
import { mockSocialCard, mockUser } from '@/data/mock';
import { getStatusText, getStatusColor, formatIdNumber, delay, generateRandomCode } from '@/utils/format';
import type { CardStatus } from '@/types';

type Step = 'face' | 'sms' | 'confirm' | 'done';

export default function CardManagement() {
  const [cardStatus, setCardStatus] = useState<CardStatus>(mockSocialCard.status);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [unlostModalOpen, setUnlostModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState<'lost' | 'unlost'>('lost');

  const [step, setStep] = useState<Step>('face');
  const [faceVerified, setFaceVerified] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [showSmsCode, setShowSmsCode] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [correctCode] = useState(() => generateRandomCode());

  const startLostProcess = () => {
    if (cardStatus === 'lost') return;
    setActionMode('lost');
    resetProcess();
    setLostModalOpen(true);
  };

  const startUnlostProcess = () => {
    if (cardStatus !== 'lost') return;
    setActionMode('unlost');
    resetProcess();
    setUnlostModalOpen(true);
  };

  const resetProcess = () => {
    setStep('face');
    setFaceVerified(false);
    setFaceScanning(false);
    setSmsCode('');
    setSmsSent(false);
    setSmsCountdown(0);
    setProcessing(false);
  };

  const handleClose = () => {
    setLostModalOpen(false);
    setUnlostModalOpen(false);
    resetProcess();
  };

  const simulateFaceScan = async () => {
    setFaceScanning(true);
    await delay(2500);
    setFaceScanning(false);
    setFaceVerified(true);
  };

  const sendSmsCode = () => {
    setSmsSent(true);
    setSmsCountdown(60);
    const timer = setInterval(() => {
      setSmsCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    alert(`【演示】验证码已发送至 ${mockUser.phone}，验证码为：${correctCode}`);
  };

  const nextStepFromSms = () => {
    if (smsCode !== correctCode) {
      alert('验证码错误，请重新输入');
      return;
    }
    setStep('confirm');
  };

  const doAction = async () => {
    setProcessing(true);
    await delay(1500);
    setCardStatus(actionMode === 'lost' ? 'lost' : 'normal');
    setProcessing(false);
    setStep('done');
  };

  const renderStepIndicator = () => {
    const steps = [
      { key: 'face', label: '人脸识别' },
      { key: 'sms', label: '短信验证' },
      { key: 'confirm', label: '确认操作' },
      { key: 'done', label: '完成' },
    ];
    const currentIdx = steps.findIndex((s) => s.key === step);
    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, idx) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx < currentIdx
                    ? 'bg-green-500 text-white'
                    : idx === currentIdx
                    ? 'bg-gov-red text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {idx < currentIdx ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-xs hidden sm:block ${
                  idx <= currentIdx ? 'text-gray-700 font-medium' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  idx < currentIdx ? 'bg-green-500' : 'bg-gray-200'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderStepContent = () => {
    if (step === 'face') {
      return (
        <div className="text-center">
          <div
            className={`w-56 h-56 mx-auto rounded-full border-4 flex items-center justify-center relative overflow-hidden ${
              faceVerified
                ? 'border-green-500 bg-green-50'
                : faceScanning
                ? 'border-gov-red animate-pulse bg-red-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            {faceVerified ? (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-green-700 font-medium mt-2">人脸比对通过</p>
                <p className="text-xs text-gray-500 mt-1">相似度 98.7%</p>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Camera className="w-14 h-14 mx-auto mb-2" />
                <p className="text-sm">{faceScanning ? '正在识别中...' : '请将面部对准框内'}</p>
              </div>
            )}
            {faceScanning && (
              <div className="absolute inset-0 border-4 border-gov-red/30 rounded-full animate-ping"></div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            为保障您的账户安全，{actionMode === 'lost' ? '挂失' : '解挂'}操作需先完成人脸识别
          </p>
          <div className="mt-5">
            {!faceVerified ? (
              <button
                onClick={simulateFaceScan}
                disabled={faceScanning}
                className="gov-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
              >
                {faceScanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    识别中...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    开始人脸识别
                  </>
                )}
              </button>
            ) : (
              <button onClick={() => setStep('sms')} className="gov-btn-primary">
                下一步：短信验证
              </button>
            )}
          </div>
        </div>
      );
    }

    if (step === 'sms') {
      return (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              短信验证码
            </label>
            <p className="text-xs text-gray-500 mb-3">
              验证码已发送至：<span className="text-gray-700 font-medium">{mockUser.phone}</span>
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type={showSmsCode ? 'text' : 'password'}
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入6位验证码"
                  className="gov-input pr-10 tracking-widest text-lg text-center"
                  maxLength={6}
                />
                <button
                  onClick={() => setShowSmsCode(!showSmsCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showSmsCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={sendSmsCode}
                disabled={smsCountdown > 0}
                className="px-4 py-2.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {smsCountdown > 0 ? `${smsCountdown}s 后重发` : smsSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              演示提示：验证码已通过 alert 弹窗展示
            </p>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('face')} className="gov-btn-secondary">
              上一步
            </button>
            <button
              onClick={nextStepFromSms}
              disabled={smsCode.length !== 6}
              className="gov-btn-primary disabled:opacity-50"
            >
              下一步
            </button>
          </div>
        </div>
      );
    }

    if (step === 'confirm') {
      return (
        <div>
          <div className="bg-gray-50 rounded-lg p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">操作类型</span>
              <span className="font-medium text-gray-800">
                {actionMode === 'lost' ? '社保卡挂失' : '社保卡解挂'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">持卡人</span>
              <span className="font-medium text-gray-800">{mockSocialCard.holderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">身份证号</span>
              <span className="font-medium text-gray-800">
                {formatIdNumber(mockSocialCard.idNumber)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">社保卡号</span>
              <span className="font-medium text-gray-800">{mockSocialCard.cardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">验证方式</span>
              <span className="font-medium text-green-600">人脸识别 + 短信验证</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {actionMode === 'lost'
                ? '挂失后社保卡金融功能和社保功能将立即冻结，您可在解挂后恢复使用。如需补卡，请前往线下服务网点办理。'
                : '解挂后社保卡将恢复正常使用，请妥善保管您的社保卡。'}
            </p>
          </div>
          <div className="flex justify-between mt-6">
            <button onClick={() => setStep('sms')} className="gov-btn-secondary">
              上一步
            </button>
            <button
              onClick={doAction}
              disabled={processing}
              className="gov-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
            >
              {processing && <RefreshCw className="w-4 h-4 animate-spin" />}
              确认{actionMode === 'lost' ? '挂失' : '解挂'}
            </button>
          </div>
        </div>
      );
    }

    if (step === 'done') {
      return (
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h4 className="text-lg font-semibold text-gray-800">
            {actionMode === 'lost' ? '社保卡挂失成功' : '社保卡解挂成功'}
          </h4>
          <p className="text-sm text-gray-500 mt-2">
            操作已完成，实时同步至省社保卡中心系统
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button onClick={handleClose} className="gov-btn-secondary">
              关闭
            </button>
            <Link
              to="/card/progress"
              onClick={handleClose}
              className="gov-btn-primary inline-flex items-center gap-1"
            >
              查看社保卡状态
            </Link>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Link to="/" className="hover:text-gov-red">
          首页
        </Link>
        <span>/</span>
        <span className="text-gray-700">社保卡全生命周期管理</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">社保卡信息</h2>
                <p className="text-sm text-gray-500 mt-0.5">对接省社保卡中心，数据实时同步</p>
              </div>
              <span className={`gov-badge ${getStatusColor(cardStatus)}`}>
                {getStatusText(cardStatus)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-gradient-to-br from-blue-500 via-blue-700 to-blue-900 rounded-xl p-5 text-white relative overflow-hidden shadow-md">
                <div className="absolute top-3 right-3">
                  <Building2 className="w-8 h-8 text-blue-200" />
                </div>
                <div className="text-xs text-blue-200">中华人民共和国社会保障卡</div>
                <div className="text-base font-mono tracking-wider mt-2">
                  {mockSocialCard.cardNumber}
                </div>
                <div className="mt-8">
                  <div className="text-xs text-blue-200">持卡人姓名</div>
                  <div className="text-lg font-medium">{mockSocialCard.holderName}</div>
                </div>
                <div className="mt-3 flex justify-between">
                  <div>
                    <div className="text-xs text-blue-200">发卡日期</div>
                    <div className="text-sm">{mockSocialCard.issuedDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-200">有效期至</div>
                    <div className="text-sm">{mockSocialCard.validUntil}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">身份证号</span>
                  <span className="text-gray-800 font-mono">
                    {formatIdNumber(mockSocialCard.idNumber)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">合作银行</span>
                  <span className="text-gray-800">{mockSocialCard.bankName}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">金融账号</span>
                  <span className="text-gray-800 font-mono">{mockSocialCard.bankAccount}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">发卡地区</span>
                  <span className="text-gray-800">河北省石家庄市</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">卡片状态</span>
                  <span className={`gov-badge ${getStatusColor(cardStatus)}`}>
                    {getStatusText(cardStatus)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={startLostProcess}
              disabled={cardStatus === 'lost'}
              className="gov-card p-5 text-left hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-11 h-11 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-800">社保卡挂失</h4>
              <p className="text-xs text-gray-500 mt-1">
                丢失后立即挂失，冻结社保和金融功能
              </p>
              <p className="text-xs text-gov-red mt-2">需人脸识别 + 短信验证 →</p>
            </button>

            <button
              onClick={startUnlostProcess}
              disabled={cardStatus !== 'lost'}
              className="gov-card p-5 text-left hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="w-11 h-11 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-800">社保卡解挂</h4>
              <p className="text-xs text-gray-500 mt-1">找回卡片后恢复正常使用</p>
              <p className="text-xs text-gov-red mt-2">需人脸识别 + 短信验证 →</p>
            </button>

            <Link
              to="/card/progress"
              className="gov-card p-5 hover:shadow-md transition group"
            >
              <div className="w-11 h-11 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <Clock className="w-5 h-5" />
              </div>
              <h4 className="font-medium text-gray-800">制卡进度追踪</h4>
              <p className="text-xs text-gray-500 mt-1">
                对接省制卡中心API，显示各节点时间戳
              </p>
              <p className="text-xs text-gov-red mt-2">查看详情 →</p>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <div className="gov-card p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gov-red" />
              操作指引
            </h3>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gov-red text-white flex items-center justify-center text-xs flex-shrink-0">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-800">双重身份核验</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    挂失/解挂均需人脸识别 + 短信二次验证，确保操作安全
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gov-red text-white flex items-center justify-center text-xs flex-shrink-0">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-800">实时同步生效</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    操作完成后即时同步至省社保卡中心和合作银行
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-gov-red text-white flex items-center justify-center text-xs flex-shrink-0">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-800">线下辅助渠道</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    也可拨打12333热线或至社保卡服务网点办理
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="gov-card p-5 bg-amber-50 border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">安全提示</p>
                <p className="text-xs text-amber-700 mt-1">
                  社保卡包含个人敏感信息和金融账户，请勿转借他人。如遇可疑电话，请拨打12333核实。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={lostModalOpen || unlostModalOpen}
        onClose={handleClose}
        title={actionMode === 'lost' ? '社保卡挂失 - 身份核验' : '社保卡解挂 - 身份核验'}
        width="max-w-xl"
      >
        {renderStepIndicator()}
        {renderStepContent()}
      </Modal>
    </div>
  );
}
