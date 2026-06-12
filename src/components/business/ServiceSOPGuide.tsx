import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/BadgeTagAvatar';
import { ImageUploader } from './ImageComponents';
import type { SOPStep, ServiceTrace } from '@/types/appointment';
import { cn } from '@/utils/common';

interface ServiceSOPGuideProps {
  steps: SOPStep[];
  traces: ServiceTrace[];
  onStepComplete: (stepId: string, data: { notes?: string; beforePhotos?: string[]; afterPhotos?: string[] }) => Promise<void>;
  isExecuting?: boolean;
}

export function ServiceSOPGuide({ steps, traces, onStepComplete, isExecuting = true }: ServiceSOPGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    if (traces.length === steps.length) return steps.length - 1;
    return traces.length;
  });
  const [notes, setNotes] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStepStatus = (index: number) => {
    if (index < traces.length) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const currentStep = steps[currentStepIndex];
  const isCompleted = traces.length === steps.length;

  const handleComplete = async () => {
    if (!currentStep) return;
    if (currentStep.requirePhoto && beforePhotos.length === 0 && afterPhotos.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onStepComplete(currentStep.id, {
        notes: notes || undefined,
        beforePhotos: beforePhotos.length > 0 ? beforePhotos : undefined,
        afterPhotos: afterPhotos.length > 0 ? afterPhotos : undefined,
      });

      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
        setNotes('');
        setBeforePhotos([]);
        setAfterPhotos([]);
      }
    } catch (error) {
      console.error('Failed to complete step:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-200" />
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const trace = traces[index];

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'relative pl-14',
                  status === 'current' && 'z-10'
                )}
              >
                <div
                  className={cn(
                    'absolute left-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                    status === 'completed'
                      ? 'bg-primary-500 text-white'
                      : status === 'current'
                      ? 'bg-primary-100 text-primary-700 ring-4 ring-primary-50'
                      : 'bg-neutral-100 text-neutral-400'
                  )}
                >
                  {status === 'completed' ? <Check className="w-5 h-5" /> : step.stepNumber}
                </div>

                <Card
                  className={cn(
                    status === 'current'
                      ? 'border-primary-200 shadow-card'
                      : status === 'completed'
                      ? 'border-green-200 bg-green-50/30'
                      : 'opacity-60'
                  )}
                  padded={false}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-neutral-900">{step.title}</h4>
                        <p className="text-sm text-neutral-500 mt-0.5">{step.description}</p>
                      </div>
                      {step.requirePhoto && (
                        <Badge variant="warning" size="sm">
                          <Camera className="w-3 h-3 mr-1" />
                          需拍照
                        </Badge>
                      )}
                    </div>

                    {trace && (
                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>已完成 · {trace.completedBy}</span>
                        </div>
                        {trace.notes && (
                          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                            <FileText className="w-4 h-4 inline mr-2 text-neutral-400" />
                            {trace.notes}
                          </p>
                        )}
                        {(trace.beforePhotos || trace.afterPhotos) && (
                          <div className="flex gap-2 mt-3">
                            {trace.beforePhotos?.map((photo, i) => (
                              <img
                                key={`before-${i}`}
                                src={photo}
                                alt={`服务前 ${i + 1}`}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ))}
                            {trace.afterPhotos?.map((photo, i) => (
                              <img
                                key={`after-${i}`}
                                src={photo}
                                alt={`服务后 ${i + 1}`}
                                className="w-16 h-16 rounded-lg object-cover border-2 border-primary-300"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isExecuting && !isCompleted && currentStep && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-card border border-primary-100"
        >
          <h4 className="font-semibold text-lg text-neutral-900 mb-4">
            执行步骤：{currentStep.title}
          </h4>

          {currentStep.requirePhoto && (
            <div className="space-y-4 mb-6">
              <ImageUploader
                images={beforePhotos}
                onChange={setBeforePhotos}
                label="服务前照片"
                maxImages={2}
              />
              <ImageUploader
                images={afterPhotos}
                onChange={setAfterPhotos}
                label="服务后照片"
                maxImages={2}
              />
              {beforePhotos.length === 0 && afterPhotos.length === 0 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>此步骤需要上传服务前后对比照片</span>
                </div>
              )}
            </div>
          )}

          {currentStep.requireNote && (
            <div className="mb-6">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="请输入操作备注..."
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 outline-none transition-all resize-none h-24"
              />
            </div>
          )}

          <Button
            onClick={handleComplete}
            isLoading={isSubmitting}
            disabled={currentStep.requirePhoto && beforePhotos.length === 0 && afterPhotos.length === 0}
            size="lg"
            className="w-full"
          >
            完成此步骤
          </Button>
        </motion.div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-primary-50 to-mint-50 rounded-2xl p-8 text-center border border-primary-200"
        >
          <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl font-semibold text-primary-700 mb-2">
            服务流程已全部完成
          </h4>
          <p className="text-neutral-600">所有步骤已执行完毕，服务记录已自动存档</p>
        </motion.div>
      )}
    </div>
  );
}
