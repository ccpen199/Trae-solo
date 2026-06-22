import { useEffect, useState } from 'react';
import {
  Upload,
  CheckCircle2,
  ShieldCheck,
  Camera,
  Eye,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { FaceVerifyResult, IDCardInfo, VerifyStatus } from '@/types';
import {
  mockFaceSnapshotBase64,
  mockFaceVerify,
  mockIDCardFrontBase64,
  mockIDCardOCR,
} from '@/utils/faceMock';
import { classNames } from '@/utils/formatters';

export interface VerifyFlowResult {
  idCard: IDCardInfo;
  faceVerify: FaceVerifyResult;
  verifyStatus: VerifyStatus;
}

interface VerifyFlowProps {
  defaultIdCard?: IDCardInfo;
  defaultVerify?: VerifyStatus;
  defaultFace?: FaceVerifyResult;
  onComplete?: (r: VerifyFlowResult) => void;
  onCancel?: () => void;
}

type Step = 1 | 2 | 3;
type FaceAction = 'blink' | 'shake' | 'noddle';

const FACE_ACTIONS: { value: FaceAction; label: string; emoji: string; desc: string }[] = [
  { value: 'blink', label: '眨眼检测', emoji: '😉', desc: '请对着镜头连续眨两次眼睛' },
  { value: 'shake', label: '摇头检测', emoji: '🙂', desc: '请缓慢左右摇头各一次' },
  { value: 'noddle', label: '点头检测', emoji: '🙏', desc: '请缓慢上下点头三次' },
];

export default function VerifyFlow({
  defaultIdCard,
  defaultVerify,
  defaultFace,
  onComplete,
  onCancel,
}: VerifyFlowProps) {
  const [step, setStep] = useState<Step>(
    defaultVerify === 'verified' || defaultVerify === 'face_done'
      ? 3
      : defaultVerify === 'ocr_done'
        ? 2
        : 1
  );
  const [idCard, setIdCard] = useState<IDCardInfo>(
    defaultIdCard ?? {
      name: '',
      gender: '',
      nation: '',
      birth: '',
      address: '',
      idNo: '',
      issuingAuthority: '',
      validPeriod: '',
    }
  );
  const [ocrLoading, setOcrLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>(
    defaultVerify ?? 'unverified'
  );
  const [faceResult, setFaceResult] = useState<FaceVerifyResult>(
    defaultFace ?? { passed: false, score: 0, timestamp: '' }
  );
  const [faceImage, setFaceImage] = useState<string | undefined>();
  const [faceLoading, setFaceLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<FaceAction>('blink');
  const [faceProgress, setFaceProgress] = useState(0);
  const [actionFailed, setActionFailed] = useState(false);

  function performOCR() {
    setOcrLoading(true);
    const seed = Date.now();
    setTimeout(() => {
      const info = mockIDCardOCR(seed);
      info.frontImage = mockIDCardFrontBase64(info.name, info.idNo);
      setIdCard(info);
      setVerifyStatus('ocr_done');
      setOcrLoading(false);
    }, 1600);
  }

  function confirmIdCard() {
    setVerifyStatus('ocr_done');
    setStep(2);
  }

  function startFaceVerify() {
    setStep(3);
    setFaceLoading(true);
    setFaceProgress(0);
    setActionFailed(false);
    const a = FACE_ACTIONS[Math.floor(Math.random() * FACE_ACTIONS.length)];
    setCurrentAction(a.value);
  }

  useEffect(() => {
    if (!faceLoading) return;
    const total = 2400;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / total);
      setFaceProgress(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        const result = mockFaceVerify(currentAction);
        setFaceResult(result);
        if (result.passed) {
          setFaceImage(mockFaceSnapshotBase64(idCard.name || '租客'));
          setVerifyStatus('verified');
        } else {
          setActionFailed(true);
        }
        setFaceLoading(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [faceLoading, currentAction, idCard.name]);

  function finish() {
    const finalStatus = faceResult.passed ? 'verified' : verifyStatus;
    onComplete?.({
      idCard,
      faceVerify: faceResult,
      verifyStatus: finalStatus,
    });
  }

  const actionDesc = FACE_ACTIONS.find((a) => a.value === currentAction)!;

  return (
    <div className="space-y-6">
      <Stepper step={step} />

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-up">
          <div className="relative card p-6 rounded-2xl min-h-[300px] flex flex-col items-center justify-center text-center">
            {idCard.frontImage ? (
              <div className="space-y-4 w-full">
                <img
                  src={idCard.frontImage}
                  alt="身份证正面"
                  className="rounded-xl shadow-lg mx-auto max-w-full"
                />
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> 身份证正面已上传
                </div>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-700 flex items-center justify-center mb-4">
                  <Upload className="w-9 h-9" />
                </div>
                <h4 className="font-serif text-lg font-semibold text-slate-900 mb-2">
                  上传身份证正面
                </h4>
                <p className="text-sm text-slate-500 mb-5">
                  请确保照片清晰、四角完整，光线充足
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn-primary"
                    onClick={performOCR}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        OCR 识别中…
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        模拟上传 & OCR
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-brand-700" />
              <h4 className="font-serif text-lg font-semibold text-slate-900">OCR 识别结果</h4>
            </div>
            {idCard.name ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="姓名" value={idCard.name} />
                  <Field label="性别" value={idCard.gender} />
                  <Field label="民族" value={idCard.nation} />
                  <Field label="出生日期" value={idCard.birth} />
                  <Field label="身份证号" value={idCard.idNo} mono />
                  <Field label="签发机关" value={idCard.issuingAuthority} />
                  <Field label="有效期限" value={idCard.validPeriod} mono />
                  <div className="col-span-2">
                    <div className="label">户籍地址</div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 text-xs leading-relaxed">
                      {idCard.address}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setIdCard({
                        name: '',
                        gender: '',
                        nation: '',
                        birth: '',
                        address: '',
                        idNo: '',
                        issuingAuthority: '',
                        validPeriod: '',
                        frontImage: undefined,
                      });
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 重新识别
                  </button>
                  <button className="btn-primary btn-sm" onClick={confirmIdCard}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    信息确认无误
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center text-sm text-slate-400 py-12">
                <Eye className="w-10 h-10 mx-auto mb-3 opacity-30" />
                请先上传身份证照片以查看识别结果
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in-up">
          <div className="card p-6 rounded-2xl">
            <h4 className="font-serif text-lg font-semibold text-slate-900 mb-3">
              ✅ 第一步已完成：身份信息已采集
            </h4>
            <p className="text-sm text-slate-600 mb-5">
              租客 <b>{idCard.name}</b> 的身份证信息已通过 OCR 采集并确认。下一步需进行<b>人脸活体检测</b>
              ，以满足《个人信息保护法》及实名制要求，确保为本人入住。
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <b>温馨提示：</b>根据《民法典》第707条，租赁期限六个月以上的，应当采用书面形式。系统将在租客完成核验后自动启用租约签署流程。
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setStep(1)}>
                返回修改
              </button>
              <button className="btn-primary" onClick={startFaceVerify}>
                <Camera className="w-4 h-4" />
                开始活体比对
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-up">
          <div className="card p-6 rounded-2xl">
            <div className="aspect-[4/5] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden flex items-center justify-center">
              {faceLoading ? (
                <>
                  <div className="absolute inset-8 rounded-2xl border-2 border-brand-400/60 animate-pulse-soft flex flex-col items-center justify-center p-6 text-center">
                    <div className="text-7xl mb-4">{actionDesc.emoji}</div>
                    <div className="text-white font-serif text-lg font-semibold mb-2">
                      {actionDesc.label}
                    </div>
                    <div className="text-slate-300 text-sm mb-6">{actionDesc.desc}</div>
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all"
                        style={{ width: `${faceProgress * 100}%` }}
                      />
                    </div>
                    <div className="text-slate-400 text-xs mt-3">
                      活体检测进行中… {Math.round(faceProgress * 100)}%
                    </div>
                  </div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-72 border-2 border-dashed border-brand-300/30 rounded-3xl pointer-events-none" />
                </>
              ) : faceImage ? (
                <>
                  <img
                    src={faceImage}
                    alt="人脸快照"
                    className="h-full rounded-2xl shadow-2xl"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-emerald-500/90 text-white text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 活体通过{' '}
                    {Math.round(faceResult.score * 100)}分
                  </div>
                </>
              ) : actionFailed ? (
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">😟</div>
                  <div className="text-white font-serif text-lg font-semibold mb-2">
                    活体检测未通过
                  </div>
                  <div className="text-slate-400 text-sm mb-6">
                    置信度仅 {Math.round(faceResult.score * 100)}%，建议在光线充足环境重新检测
                  </div>
                  <button
                    className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                    onClick={() => {
                      setActionFailed(false);
                      startFaceVerify();
                    }}
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" /> 重新检测
                  </button>
                </div>
              ) : (
                <div className="text-center p-8">
                  <Camera className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <div className="text-white font-serif text-lg font-semibold mb-2">
                    准备开始活体检测
                  </div>
                  <div className="text-slate-400 text-sm">
                    请点击右侧「开始检测」按钮，按提示完成动作
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="card p-6 rounded-2xl space-y-4">
            <h4 className="font-serif text-lg font-semibold text-slate-900">
              🛡️ 活体比对结果
            </h4>
            <div className="space-y-3">
              <ResultRow
                label="与身份证人脸比对"
                pass={faceResult.passed}
                value={faceResult.score ? `${Math.round(faceResult.score * 100)}%` : '—'}
              />
              <ResultRow
                label="活体动作识别"
                pass={faceResult.passed}
                value={faceResult.timestamp ? actionDesc.label : '—'}
              />
              <ResultRow label="静默活体检测" pass={faceResult.passed} />
              <ResultRow label="防翻拍检测" pass={faceResult.passed} />
            </div>

            {faceResult.passed && faceResult.timestamp && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold mb-1">
                  <ShieldCheck className="w-5 h-5" />
                  核验通过
                </div>
                <div className="text-xs text-emerald-700/80 leading-relaxed">
                  租客 <b>{idCard.name}</b> 已通过实名认证，人脸与身份证一致性
                  {Math.round(faceResult.score * 100)}%，可签署正式租约。
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-between gap-2">
              <div>
                {!faceLoading && !faceResult.passed && (
                  <button className="btn-primary" onClick={startFaceVerify}>
                    {actionFailed ? '重新检测' : '开始检测'}
                  </button>
                )}
                {!faceLoading && faceResult.passed && (
                  <button className="btn-secondary btn-sm" onClick={() => startFaceVerify()}>
                    <RefreshCw className="w-3.5 h-3.5" /> 重新检测
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                {onCancel && (
                  <button className="btn-secondary btn-sm" onClick={onCancel}>
                    <X className="w-3.5 h-3.5" /> 取消
                  </button>
                )}
                <button
                  className="btn-primary btn-sm"
                  onClick={finish}
                  disabled={verifyStatus !== 'verified'}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  完成核验
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps = [
    { n: 1, label: '身份证OCR', desc: '上传身份证并识别' },
    { n: 2, label: '信息确认', desc: '核对采集信息' },
    { n: 3, label: '活体比对', desc: '人脸活体检测' },
  ];
  return (
    <div className="card p-5 rounded-2xl">
      <ol className="grid grid-cols-3 gap-4">
        {steps.map((s, i) => {
          const active = step >= s.n;
          const isCurrent = step === s.n;
          return (
            <li
              key={s.n}
              className={classNames(
                'relative flex items-center gap-3 pl-1',
                i !== steps.length - 1 &&
                  'after:absolute after:left-[42px] after:top-[22px] after:h-[2px] after:right-0 after:bg-gradient-to-r',
                i !== steps.length - 1 && active
                  ? 'after:from-brand-500 after:to-brand-300'
                  : i !== steps.length - 1 && 'after:from-slate-200 after:to-slate-100'
              )}
            >
              <div
                className={classNames(
                  'z-10 w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-all',
                  active
                    ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-700/20'
                    : 'bg-slate-100 text-slate-400',
                  isCurrent && 'ring-4 ring-brand-100 scale-105'
                )}
              >
                {active ? <CheckCircle2 className="w-5 h-5" /> : s.n}
              </div>
              <div>
                <div
                  className={classNames(
                    'text-sm font-semibold',
                    active ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-400">{s.desc}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div
        className={
          'p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-800 text-sm ' +
          (mono ? 'font-mono text-xs' : '')
        }
      >
        {value || '—'}
      </div>
    </div>
  );
}

function ResultRow({
  label,
  pass,
  value,
}: {
  label: string;
  pass?: boolean;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-100">
      <div className="text-sm text-slate-700">{label}</div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-mono text-slate-500">{value}</span>}
        {pass ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> 通过
          </span>
        ) : pass === false ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
            待检测
          </span>
        ) : null}
      </div>
    </div>
  );
}
