import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Cpu, CheckCircle2, XCircle, ChevronRight, Image as ImageIcon,
} from 'lucide-react';
import { useInspectionStore } from '@/stores/useInspectionStore';
import StatusBadge from '@/components/StatusBadge';
import CategoryIcon from '@/components/CategoryIcon';

function scoreColor(score: number) {
  if (score >= 80) return 'border-green-300 bg-green-50';
  if (score >= 50) return 'border-amber-300 bg-amber-50';
  return 'border-red-300 bg-red-50';
}

function scoreTextColor(score: number) {
  if (score >= 80) return 'text-green-700';
  if (score >= 50) return 'text-amber-700';
  return 'text-red-700';
}

export default function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentInspection, loading, fetchInspectionDetail, aiScreen, checkStep } = useInspectionStore();
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [stepNotes, setStepNotes] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const item = (currentInspection || {}) as Record<string, unknown>;
  const steps = (item.steps as Record<string, unknown>[]) || [];
  const images = (item.images as string[]) || [];
  const aiData = aiResult || (item.ai_result as Record<string, unknown> | null);

  useEffect(() => {
    if (id) fetchInspectionDetail(id);
  }, [id, fetchInspectionDetail]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  const handleAiScreen = useCallback(async () => {
    if (!id) return;
    try {
      const res = await aiScreen(id);
      setAiResult(res as Record<string, unknown>);
      showToast('AI初筛完成');
    } catch {
      showToast('AI初筛失败，请重试');
    }
  }, [id, aiScreen, showToast]);

  const handleCheckStep = useCallback(async (stepIndex: number, passed: boolean) => {
    if (!id) return;
    try {
      await checkStep(id, {
        step_index: stepIndex,
        passed,
        notes: stepNotes[String(stepIndex)] || '',
      });
      showToast(passed ? '步骤已通过' : '步骤未通过');
      fetchInspectionDetail(id);
    } catch {
      showToast('操作失败');
    }
  }, [id, checkStep, stepNotes, showToast, fetchInspectionDetail]);

  const handleComplete = useCallback(async (passed: boolean) => {
    if (!id) return;
    try {
      await checkStep(id, { final: true, passed });
      showToast(passed ? '质检完成' : '已标记不合格');
      fetchInspectionDetail(id);
    } catch {
      showToast('操作失败');
    }
  }, [id, checkStep, showToast, fetchInspectionDetail]);

  if (loading && !currentInspection) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-40 rounded-xl bg-gray-200" />
        <div className="h-60 rounded-xl bg-gray-200" />
      </div>
    );
  }

  const aiScore = (aiData?.score as number) || 0;
  const aiLabel = (aiData?.label as string) || '';
  const aiConfidence = (aiData?.confidence as number) || 0;
  const defects = (aiData?.defects as string[]) || [];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      <button
        onClick={() => navigate('/admin/inspection')}
        className="flex items-center gap-1 text-sm text-neutral-muted hover:text-forest-700"
      >
        <ArrowLeft className="h-4 w-4" /> 返回质检工单
      </button>

      <div className="rounded-xl bg-white p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="rounded bg-neutral-bg px-3 py-1 font-mono text-sm text-neutral-muted">
              {((item.id as string) || '').slice(-8).toUpperCase()}
            </span>
            <CategoryIcon category={(item.category as string) || ''} size="md" />
          </div>
          <StatusBadge status={(item.status as string) || ''} category="inspection" />
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-text">AI 初筛</h2>
          {!aiData && (
            <button
              onClick={handleAiScreen}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-800 disabled:opacity-50"
            >
              <Cpu className="h-4 w-4" /> 开始AI初筛
            </button>
          )}
        </div>
        {aiData ? (
          <div className={`rounded-xl border-2 p-5 ${scoreColor(aiScore)}`}>
            <div className="mb-3 flex items-center gap-6">
              <div>
                <p className="text-xs text-neutral-muted">评分</p>
                <p className={`text-3xl font-bold ${scoreTextColor(aiScore)}`}>{aiScore}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-muted">标签</p>
                <p className="text-sm font-medium text-neutral-text">{aiLabel}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-muted">置信度</p>
                <p className="text-sm font-medium text-neutral-text">{(aiConfidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            {defects.length > 0 && (
              <div>
                <p className="mb-1 text-xs text-neutral-muted">缺陷</p>
                <div className="flex flex-wrap gap-2">
                  {defects.map((d, i) => (
                    <span key={i} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700">{d}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-muted">尚未进行AI初筛</p>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-neutral-text">SOP 质检步骤</h2>
        <div className="relative space-y-0">
          {steps.map((step, i) => {
            const stepStatus = step.status as string;
            const isCurrent = stepStatus === 'in_progress' || (!stepStatus && i === steps.findIndex((s) => s.status !== 'completed'));
            const isCompleted = stepStatus === 'completed';
            const isFailed = stepStatus === 'failed';

            return (
              <div key={i} className="relative flex gap-4 pb-6">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      isCompleted ? 'border-green-500 bg-green-500' :
                      isFailed ? 'border-red-500 bg-red-500' :
                      isCurrent ? 'border-forest-700 bg-forest-50' :
                      'border-neutral-border bg-white'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4 text-white" /> :
                     isFailed ? <XCircle className="h-4 w-4 text-white" /> :
                     <span className="text-xs font-medium text-neutral-muted">{i + 1}</span>}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-full w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-neutral-border'}`} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-forest-700' : 'text-neutral-text'}`}>
                    {step.name as string}
                  </p>
                  {isCurrent && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={stepNotes[String(i)] || ''}
                        onChange={(e) => setStepNotes((prev) => ({ ...prev, [i]: e.target.value }))}
                        placeholder="备注..."
                        className="w-full rounded-lg border border-neutral-border p-2 text-sm focus:border-forest-700 focus:outline-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCheckStep(i, true)}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
                        >
                          <CheckCircle2 className="h-3 w-3" /> 通过
                        </button>
                        <button
                          onClick={() => handleCheckStep(i, false)}
                          className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700"
                        >
                          <XCircle className="h-3 w-3" /> 不通过
                        </button>
                      </div>
                    </div>
                  )}
                  {isCompleted && step.notes && (
                    <p className="mt-1 text-xs text-neutral-muted">{step.notes as string}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {images.length > 0 && (
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-neutral-text">
            <ImageIcon className="h-5 w-5" /> 图片
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg bg-neutral-bg">
                <img src={img} alt={`图片 ${i + 1}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => handleComplete(true)}
          className="flex items-center gap-2 rounded-xl bg-forest-700 px-6 py-3 text-sm font-medium text-white hover:bg-forest-800"
        >
          <CheckCircle2 className="h-4 w-4" /> 完成质检
        </button>
        <button
          onClick={() => handleComplete(false)}
          className="flex items-center gap-2 rounded-xl border border-red-300 bg-white px-6 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" /> 标记不合格
        </button>
      </div>
    </div>
  );
}
