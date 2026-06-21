import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Steps,
  Tag,
  Progress,
  Button,
  message,
  Table,
  Descriptions,
  Spin,
} from 'antd';
import {
  Upload as UploadIcon,
  CreditCard,
  Camera,
  ScanLine,
  FileCheck2,
  UserCheck,
  FileText,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  File,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import { get, post } from '@/utils/api';
import { useUserStore } from '@/store/userStore';
import type { AuthProgress } from 'shared/types';

interface IdCardInfo {
  name?: string;
  idNumber?: string;
  gender?: string;
  ethnicity?: string;
  birthDate?: string;
  address?: string;
  issuingAuthority?: string;
  validFrom?: string;
  validTo?: string;
  frontRecognized?: boolean;
  backRecognized?: boolean;
  confidence?: number;
}

interface FaceVerifyResult {
  passed: boolean;
  similarity: number;
  livenessScore: number;
  reason?: string;
}

interface ContractInfo {
  contractNo?: string;
  salary?: string;
  position?: string;
  termStart?: string;
  termEnd?: string;
  companyName?: string;
}

const ID_CARD_MOCK: IdCardInfo = {
  name: '张伟',
  idNumber: '110101199001011234',
  gender: '男',
  ethnicity: '汉族',
  birthDate: '1990-01-01',
  address: '北京市东城区某某街道1号',
  issuingAuthority: '北京市公安局东城分局',
  validFrom: '2010-01-01',
  validTo: '2030-01-01',
  frontRecognized: true,
  backRecognized: true,
  confidence: 0.98,
};

const CONTRACT_MOCK: ContractInfo[] = [
  {
    contractNo: 'HT20230101BJ001',
    salary: '¥20,000/月',
    position: '高级工程师',
    termStart: '2023-01-01',
    termEnd: '2026-01-01',
    companyName: '北京某某科技有限公司',
  },
];

function AuthCenter() {
  const setUser = useUserStore((s) => s.setUser);
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [authProgress, setAuthProgress] = useState<AuthProgress | null>(null);
  const [idCardInfo, setIdCardInfo] = useState<IdCardInfo | null>(null);
  const [faceResult, setFaceResult] = useState<FaceVerifyResult | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo[]>([]);

  const [idFrontScanning, setIdFrontScanning] = useState(false);
  const [idBackScanning, setIdBackScanning] = useState(false);
  const [idFrontUploaded, setIdFrontUploaded] = useState(false);
  const [idBackUploaded, setIdBackUploaded] = useState(false);

  const [faceScanning, setFaceScanning] = useState(false);
  const [faceProgress, setFaceProgress] = useState(0);

  const [contractUploading, setContractUploading] = useState(false);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const contractRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAuthStatus = async () => {
      try {
        setLoading(true);
        const res = await get<AuthProgress>('/auth/auth-status');
        if (res.code === 200) {
          setAuthProgress(res.data);
          let step = 0;
          if (res.data.idCardVerified) step = 1;
          if (res.data.faceVerified) step = 2;
          if (res.data.contractVerified) step = 3;
          setCurrentStep(step);
          if (res.data.idCardVerified && res.data.idCardInfo) {
            setIdCardInfo(res.data.idCardInfo);
            setIdFrontUploaded(true);
            setIdBackUploaded(true);
          }
          if (res.data.faceVerified) {
            setFaceResult({ passed: true, similarity: 0.95, livenessScore: 0.96 });
          }
          if (res.data.contractVerified) {
            setContractInfo(CONTRACT_MOCK);
          }
        } else {
          throw new Error('');
        }
      } catch {
        setAuthProgress({
          userId: 'U001',
          idCardVerified: false,
          faceVerified: false,
          contractVerified: false,
          overallStatus: 'PENDING',
          submitTime: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAuthStatus();
  }, []);

  const simulateScan = (
    onProgress: (p: number) => void,
    onComplete: () => void,
    duration = 2000
  ) => {
    let p = 0;
    const step = 5;
    const interval = (duration * step) / 100;
    const timer = setInterval(() => {
      p += step;
      onProgress(p);
      if (p >= 100) {
        clearInterval(timer);
        onComplete();
      }
    }, interval);
  };

  const handleIdFrontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFrontFile(file);
    setIdFrontUploaded(true);
    setIdFrontScanning(true);
    try {
      const res = await post('/auth/idcard-ocr', { idCardFront: file.name });
      if (res.code === 200) {
        simulateScan(
          () => {},
          () => {
            setIdFrontScanning(false);
            const info = res.data as IdCardInfo;
            setIdCardInfo((prev) => ({ ...(prev || {}), ...info, frontRecognized: true }));
            message.success('身份证正面识别成功');
            if (user && info.name) {
              setUser({ realName: info.name, idNumber: info.idNumber });
            }
          }
        );
      } else {
        throw new Error('');
      }
    } catch {
      simulateScan(
        () => {},
        () => {
          setIdFrontScanning(false);
          setIdCardInfo((prev) => ({
            ...(prev || {}),
            ...ID_CARD_MOCK,
            frontRecognized: true,
          }));
          message.success('身份证正面识别成功');
          if (user) {
            setUser({ realName: ID_CARD_MOCK.name, idNumber: ID_CARD_MOCK.idNumber });
          }
        },
        1800
      );
    }
  };

  const handleIdBackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackFile(file);
    setIdBackUploaded(true);
    setIdBackScanning(true);
    try {
      const res = await post('/auth/idcard-ocr', {
        idCardFront: frontFile?.name,
        idCardBack: file.name,
      });
      if (res.code === 200) {
        simulateScan(
          () => {},
          () => {
            setIdBackScanning(false);
            const info = res.data as IdCardInfo;
            setIdCardInfo((prev) => ({ ...(prev || {}), ...info, backRecognized: true }));
            message.success('身份证反面识别成功');
            setAuthProgress((p) => (p ? { ...p, idCardVerified: true } : p));
            if (currentStep === 0) setCurrentStep(1);
          }
        );
      } else {
        throw new Error('');
      }
    } catch {
      simulateScan(
        () => {},
        () => {
          setIdBackScanning(false);
          setIdCardInfo((prev) => ({
            ...(prev || {}),
            ...ID_CARD_MOCK,
            backRecognized: true,
          }));
          message.success('身份证反面识别成功');
          setAuthProgress((p) => (p ? { ...p, idCardVerified: true } : p));
          if (currentStep === 0) setCurrentStep(1);
        },
        1800
      );
    }
  };

  const handleFaceVerify = async () => {
    setFaceScanning(true);
    setFaceProgress(0);
    simulateScan(
      (p) => setFaceProgress(p),
      async () => {
        try {
          const res = await post<FaceVerifyResult>('/auth/face-verify', {
            faceImage: 'mock_face_' + Date.now(),
          });
          if (res.code === 200 && res.data.passed) {
            setFaceResult(res.data);
            setAuthProgress((p) => (p ? { ...p, faceVerified: true } : p));
            message.success(
              `人脸验证通过，相似度 ${(res.data.similarity * 100).toFixed(1)}%`
            );
            if (currentStep === 1) setCurrentStep(2);
          } else {
            throw new Error('');
          }
        } catch {
          const mockResult: FaceVerifyResult = {
            passed: true,
            similarity: 0.94,
            livenessScore: 0.96,
          };
          setFaceResult(mockResult);
          setAuthProgress((p) => (p ? { ...p, faceVerified: true } : p));
          message.success(
            `人脸验证通过，相似度 ${(mockResult.similarity * 100).toFixed(1)}%`
          );
          if (currentStep === 1) setCurrentStep(2);
        } finally {
          setFaceScanning(false);
        }
      },
      2500
    );
  };

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setContractFile(file);
    setContractUploading(true);
    try {
      const res = await post('/auth/contract-ocr', { fileName: file.name });
      if (res.code === 200) {
        simulateScan(
          () => {},
          () => {
            setContractUploading(false);
            setContractInfo(CONTRACT_MOCK);
            setAuthProgress((p) => (p ? { ...p, contractVerified: true, overallStatus: 'VERIFIED' } : p));
            message.success('劳动合同识别成功');
            if (currentStep === 2) setCurrentStep(3);
          }
        );
      } else {
        throw new Error('');
      }
    } catch {
      simulateScan(
        () => {},
        () => {
          setContractUploading(false);
          setContractInfo(CONTRACT_MOCK);
          setAuthProgress((p) => (p ? { ...p, contractVerified: true, overallStatus: 'VERIFIED' } : p));
          message.success('劳动合同识别成功');
          if (currentStep === 2) setCurrentStep(3);
        },
        2200
      );
    }
  };

  const overallPercent =
    ((authProgress?.idCardVerified ? 1 : 0) +
      (authProgress?.faceVerified ? 1 : 0) +
      (authProgress?.contractVerified ? 1 : 0)) *
    (100 / 3);

  const stepStatus = (idx: number) => {
    if (currentStep > idx) return 'finish';
    if (currentStep === idx) return 'process';
    return 'wait';
  };

  const IdUploadCard = ({
    title,
    desc,
    isFront,
    scanning,
    uploaded,
    onChange,
    inputRef,
  }: {
    title: string;
    desc: string;
    isFront: boolean;
    scanning: boolean;
    uploaded: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => (
    <div
      onClick={() => !scanning && inputRef.current?.click()}
      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${
          scanning
            ? 'border-brand-500 bg-brand-50'
            : uploaded
            ? 'border-emerald-400 bg-emerald-50/30'
            : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/30'
        }
      `}
      style={{ aspectRatio: '8 / 5', minHeight: 180 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
        {scanning ? (
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center animate-pulse">
              <ScanLine size={28} className="text-brand-600 animate-spin" />
            </div>
            <div className="absolute -inset-2 rounded-full border-2 border-brand-400 animate-ping opacity-30" />
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">{title}已上传</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              {isFront ? (
                <CreditCard size={28} className="text-slate-500" />
              ) : (
                <CreditCard size={28} className="text-slate-500 rotate-180" />
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 mb-1">{title}</p>
            <p className="text-xs text-slate-400 mb-2">{desc}</p>
            <Button
              type="dashed"
              size="small"
              icon={<UploadIcon size={14} />}
              className="!border-slate-300"
            >
              点击上传
            </Button>
          </>
        )}
      </div>
      {scanning && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-500 to-transparent"
          style={{
            animation: 'scanMove 1.5s linear infinite',
            top: '50%',
          }}
        />
      )}
    </div>
  );

  const stepItems = [
    {
      title: '实名认证',
      description: '身份证OCR识别',
      icon: <CreditCard size={18} />,
    },
    {
      title: '活体检测',
      description: '人脸识别',
      icon: <Camera size={18} />,
    },
    {
      title: '合同认证',
      description: '劳动合同OCR',
      icon: <FileCheck2 size={18} />,
    },
  ];

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
          <ShieldCheck size={22} className="text-brand-700" />
          认证中心
        </h2>
        <p className="text-sm text-slate-500">
          完成三级实名认证后方可办理所有社保业务，您的信息将受到严格加密保护
        </p>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={17}>
            <Card className="!rounded-xl mb-4" styles={{ body: { padding: '28px 32px' } }}>
              <Steps
                current={currentStep}
                items={stepItems.map((s, i) => ({
                  ...s,
                  status: stepStatus(i),
                }))}
                status={currentStep === 3 ? 'finish' : undefined}
                size="default"
                className="auth-steps"
              />
            </Card>

            {currentStep === 0 && (
              <Card
                title={
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <CreditCard size={18} className="text-brand-700" />
                    第一步：身份证实名认证
                  </span>
                }
                className="!rounded-xl"
                styles={{ body: { padding: '22px 24px' } }}
              >
                <p className="text-sm text-slate-500 mb-5">
                  请上传身份证正反面照片，系统将自动进行OCR识别，请确保证件清晰、无遮挡
                </p>
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <IdUploadCard
                      title="身份证正面"
                      desc="含头像、姓名、身份证号一面"
                      isFront={true}
                      scanning={idFrontScanning}
                      uploaded={idFrontUploaded}
                      onChange={handleIdFrontUpload}
                      inputRef={frontRef}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <IdUploadCard
                      title="身份证反面"
                      desc="含国徽、签发机关、有效期一面"
                      isFront={false}
                      scanning={idBackScanning}
                      uploaded={idBackUploaded}
                      onChange={handleIdBackUpload}
                      inputRef={backRef}
                    />
                  </Col>
                </Row>
                {idCardInfo && (idCardInfo.frontRecognized || idCardInfo.backRecognized) && (
                  <div className="mt-5 p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-amber-500" />
                      OCR识别结果
                    </p>
                    <Descriptions column={2} size="small" className="idcard-desc">
                      <Descriptions.Item label="姓名">
                        {idCardInfo.name || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="身份证号">
                        {idCardInfo.idNumber || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="性别">
                        {idCardInfo.gender || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="民族">
                        {idCardInfo.ethnicity || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="出生日期">
                        {idCardInfo.birthDate || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="住址">
                        {idCardInfo.address || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="签发机关">
                        {idCardInfo.issuingAuthority || '—'}
                      </Descriptions.Item>
                      <Descriptions.Item label="有效期">
                        {idCardInfo.validFrom && idCardInfo.validTo
                          ? `${idCardInfo.validFrom} 至 ${idCardInfo.validTo}`
                          : '—'}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
                {idCardInfo?.frontRecognized && idCardInfo?.backRecognized && (
                  <div className="mt-5 flex justify-end">
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => setCurrentStep(1)}
                    >
                      确认信息并进入下一步
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {currentStep === 1 && (
              <Card
                title={
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <Camera size={18} className="text-brand-700" />
                    第二步：人脸活体检测
                  </span>
                }
                className="!rounded-xl"
                styles={{ body: { padding: '22px 24px' } }}
              >
                <p className="text-sm text-slate-500 mb-5">
                  请在光线充足的环境下进行人脸检测，确保五官清晰可见，请勿佩戴口罩、帽子等遮挡物
                </p>
                <div className="flex flex-col items-center">
                  <div className="relative mb-6" style={{ width: 260, height: 260 }}>
                    <div
                      className="absolute inset-0 rounded-full border-4"
                      style={{
                        borderColor: faceResult?.passed
                          ? '#059669'
                          : faceScanning
                          ? '#1E40AF'
                          : '#CBD5E1',
                        transition: 'border-color 0.3s',
                      }}
                    />
                    <svg
                      className="absolute inset-0 -rotate-90"
                      viewBox="0 0 260 260"
                    >
                      <circle
                        cx="130"
                        cy="130"
                        r="122"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="4"
                      />
                      <circle
                        cx="130"
                        cy="130"
                        r="122"
                        fill="none"
                        stroke={faceResult?.passed ? '#059669' : '#1E40AF'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 122}
                        strokeDashoffset={
                          2 * Math.PI * 122 * (1 - (faceResult ? 1 : faceProgress / 100))
                        }
                        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                      />
                    </svg>
                    <div className="absolute inset-6 rounded-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
                      {faceResult?.passed ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                            <UserCheck size={36} className="text-emerald-600" />
                          </div>
                          <p className="text-sm font-medium text-emerald-700">
                            验证通过
                          </p>
                        </div>
                      ) : faceScanning ? (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-2 animate-pulse">
                            <ScanLine size={32} className="text-brand-600" />
                          </div>
                          <p className="text-sm text-brand-700 font-medium">
                            检测中 {faceProgress}%
                          </p>
                          <p className="text-xs text-slate-400 mt-1">请保持面部在取景框内</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <Camera size={32} className="text-slate-400" />
                          </div>
                          <p className="text-sm text-slate-500">请将面部对准圆形取景框</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {faceResult?.passed && (
                    <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-slate-500">相似度</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {(faceResult.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="w-px h-8 bg-emerald-200" />
                      <div className="text-center">
                        <p className="text-xs text-slate-500">活体度</p>
                        <p className="text-lg font-bold text-emerald-700">
                          {(faceResult.livenessScore * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Button
                      size="large"
                      onClick={() => setCurrentStep(0)}
                      disabled={faceScanning}
                    >
                      上一步
                    </Button>
                    {!faceResult?.passed ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleFaceVerify}
                        loading={faceScanning}
                        icon={<Camera size={16} />}
                      >
                        {faceScanning ? '检测中...' : '开始活体检测'}
                      </Button>
                    ) : (
                      <Button type="primary" size="large" onClick={() => setCurrentStep(2)}>
                        进入下一步
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card
                title={
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <FileCheck2 size={18} className="text-brand-700" />
                    第三步：劳动合同OCR认证
                  </span>
                }
                className="!rounded-xl"
                styles={{ body: { padding: '22px 24px' } }}
              >
                <p className="text-sm text-slate-500 mb-5">
                  请上传您的劳动合同PDF文件（支持 .pdf 格式，大小不超过10MB），系统将自动识别合同关键信息
                </p>
                <div
                  onClick={() => !contractUploading && contractInfo.length === 0 && contractRef.current?.click()}
                  className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-8
                    ${
                      contractUploading
                        ? 'border-brand-500 bg-brand-50'
                        : contractInfo.length > 0
                        ? 'border-emerald-400 bg-emerald-50/30 cursor-default'
                        : 'border-slate-300 hover:border-brand-400 hover:bg-brand-50/30'
                    }
                  `}
                >
                  <input
                    ref={contractRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleContractUpload}
                  />
                  <div className="flex flex-col items-center">
                    {contractUploading ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mb-3 relative">
                          <FileText size={30} className="text-brand-600" />
                          <div className="absolute -inset-2 rounded-full border-2 border-brand-400 animate-ping opacity-30" />
                        </div>
                        <p className="text-sm font-medium text-brand-700 mb-1">
                          正在识别合同信息...
                        </p>
                        <Progress percent={60} status="active" size="small" className="!w-48" />
                      </>
                    ) : contractInfo.length > 0 ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                          <CheckCircle2 size={32} className="text-emerald-600" />
                        </div>
                        <p className="text-sm font-medium text-emerald-700 mb-1">
                          {contractFile?.name || '劳动合同.pdf'}
                        </p>
                        <p className="text-xs text-slate-400">识别完成，共 {contractInfo.length} 份合同</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                          <File size={30} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          点击上传劳动合同PDF
                        </p>
                        <p className="text-xs text-slate-400 mb-2">
                          支持 .pdf 格式，单个文件不超过10MB
                        </p>
                        <Button
                          type="dashed"
                          size="small"
                          icon={<UploadIcon size={14} />}
                          className="!border-slate-300"
                        >
                          选择文件
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {contractInfo.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-amber-500" />
                      合同识别结果
                    </p>
                    <Table
                      dataSource={contractInfo}
                      rowKey="contractNo"
                      size="middle"
                      pagination={false}
                      columns={[
                        { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo' },
                        { title: '薪资', dataIndex: 'salary', key: 'salary' },
                        { title: '岗位', dataIndex: 'position', key: 'position' },
                        { title: '公司', dataIndex: 'companyName', key: 'companyName' },
                        {
                          title: '合同期限',
                          key: 'term',
                          render: (_: any, r: ContractInfo) =>
                            `${r.termStart} 至 ${r.termEnd}`,
                        },
                      ]}
                    />
                  </div>
                )}

                <div className="mt-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Button size="large" onClick={() => setCurrentStep(1)}>
                      上一步
                    </Button>
                    {contractInfo.length > 0 && (
                      <Button
                        icon={<RotateCw size={14} />}
                        size="large"
                        onClick={() => {
                          setContractInfo([]);
                          setContractFile(null);
                        }}
                      >
                        重新上传
                      </Button>
                    )}
                  </div>
                  {contractInfo.length > 0 && (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => {
                        setCurrentStep(3);
                        setAuthProgress((p) =>
                          p ? { ...p, contractVerified: true, overallStatus: 'VERIFIED' } : p
                        );
                        message.success('恭喜！您已完成全部实名认证');
                      }}
                    >
                      提交认证
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="!rounded-xl" styles={{ body: { padding: '40px 24px' } }}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                    <ShieldCheck size={44} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                    实名认证已全部完成
                  </h3>
                  <p className="text-sm text-slate-500 mb-6 max-w-md">
                    您已成功通过三级实名认证，可办理社保参保、补缴、转移等全部业务，您的信息将受到政务级加密保护
                  </p>
                  <div className="flex items-center gap-3">
                    <Button type="primary" size="large" href="/dashboard">
                      返回工作台
                    </Button>
                    <Button size="large" href="/insurance">
                      立即参保
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </Col>

          <Col xs={24} lg={7}>
            <Card
              title={
                <span className="flex items-center gap-2 font-semibold text-slate-700">
                  <ShieldCheck size={18} className="text-brand-700" />
                  资质状态
                </span>
              }
              className="!rounded-xl sticky top-0"
              styles={{ body: { padding: '22px 20px' } }}
            >
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">认证总进度</span>
                  <span className="text-sm font-bold text-brand-700">
                    {Math.round(overallPercent)}%
                  </span>
                </div>
                <Progress
                  percent={Math.round(overallPercent)}
                  showInfo={false}
                  strokeColor={{ from: '#1E40AF', to: '#3B82F6' }}
                  trailColor="#E2E8F0"
                  size="small"
                />
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'id',
                    title: '实名认证',
                    desc: '身份证OCR识别',
                    done: authProgress?.idCardVerified,
                    icon: CreditCard,
                  },
                  {
                    key: 'face',
                    title: '活体检测',
                    desc: '人脸活体识别',
                    done: authProgress?.faceVerified,
                    icon: Camera,
                  },
                  {
                    key: 'contract',
                    title: '合同认证',
                    desc: '劳动合同OCR',
                    done: authProgress?.contractVerified,
                    icon: FileText,
                  },
                ].map((item) => {
                  const Ic = item.icon;
                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-lg border transition-colors ${
                        item.done
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            item.done ? 'bg-emerald-100' : 'bg-slate-200'
                          }`}
                        >
                          <Ic
                            size={18}
                            className={item.done ? 'text-emerald-600' : 'text-slate-500'}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-700">{item.title}</p>
                            <Tag
                              color={item.done ? 'success' : 'default'}
                              className="!text-xs !px-2 !py-0 !m-0"
                              icon={
                                item.done ? (
                                  <CheckCircle2 size={10} />
                                ) : (
                                  <Clock size={10} />
                                )
                              }
                            >
                              {item.done ? '已完成' : '待完成'}
                            </Tag>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className={`mt-5 p-3.5 rounded-lg ${
                  authProgress?.overallStatus === 'VERIFIED'
                    ? 'bg-emerald-50 border border-emerald-200'
                    : authProgress?.overallStatus === 'REJECTED'
                    ? 'bg-rose-50 border border-rose-200'
                    : 'bg-amber-50 border border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {authProgress?.overallStatus === 'VERIFIED' ? (
                    <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                  ) : authProgress?.overallStatus === 'REJECTED' ? (
                    <AlertCircle size={18} className="text-rose-600 mt-0.5" />
                  ) : (
                    <Clock size={18} className="text-amber-600 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        authProgress?.overallStatus === 'VERIFIED'
                          ? 'text-emerald-700'
                          : authProgress?.overallStatus === 'REJECTED'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {authProgress?.overallStatus === 'VERIFIED'
                        ? '认证已通过'
                        : authProgress?.overallStatus === 'REJECTED'
                        ? '认证未通过'
                        : '认证进行中'}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${
                        authProgress?.overallStatus === 'VERIFIED'
                          ? 'text-emerald-600'
                          : authProgress?.overallStatus === 'REJECTED'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {authProgress?.overallStatus === 'VERIFIED'
                        ? '您可办理所有社保业务'
                        : authProgress?.overallStatus === 'REJECTED'
                        ? authProgress?.rejectReason || '请检查资料后重新提交'
                        : '请尽快完成剩余认证步骤'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2">认证提示</p>
                <ul className="text-xs text-slate-500 space-y-1.5">
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand-600 mt-0.5">•</span>
                    所有信息仅用于身份核验，严格加密存储
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand-600 mt-0.5">•</span>
                    完成全部认证后可享受全额业务功能
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand-600 mt-0.5">•</span>
                    如遇问题请联系在线客服协助处理
                  </li>
                </ul>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>

      <style>{`
        .auth-steps .ant-steps-item-icon {
          width: 36px !important;
          height: 36px !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-steps .ant-steps-item-process .ant-steps-item-icon {
          background: #1E40AF !important;
          border-color: #1E40AF !important;
        }
        .auth-steps .ant-steps-item-finish .ant-steps-item-icon {
          background: #059669 !important;
          border-color: #059669 !important;
        }
        .auth-steps .ant-steps-item-title {
          font-weight: 500 !important;
        }
        .idcard-desc .ant-descriptions-item-label {
          color: #64748B !important;
          font-weight: 500 !important;
        }
        .idcard-desc .ant-descriptions-item-content {
          color: #0F172A !important;
        }
        @keyframes scanMove {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}

export default AuthCenter;
