import { CheckCircle, Clock, Circle } from 'lucide-react';

const trackingSteps = [
  { name: '预约成功', status: 'completed', time: '2026-06-10 09:00' },
  { name: '提交申请', status: 'completed', time: '2026-06-10 09:15' },
  { name: '材料审核', status: 'active', time: '' },
  { name: '审批决定', status: 'pending', time: '' },
  { name: '结果通知', status: 'pending', time: '' },
];

export default function StepTracking() {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gov-text mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-gov-blue" />
        办理进度
      </h3>
      <div className="space-y-0">
        {trackingSteps.map((step, i) => (
          <div key={step.name} className="flex gap-4">
            <div className="flex flex-col items-center">
              {step.status === 'completed' ? (
                <div className="w-8 h-8 rounded-full bg-gov-blue flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              ) : step.status === 'active' ? (
                <div className="w-8 h-8 rounded-full bg-gov-blue flex items-center justify-center animate-pulse-slow">
                  <Clock className="w-4 h-4 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <Circle className="w-4 h-4 text-gray-400" />
                </div>
              )}
              {i < trackingSteps.length - 1 && (
                <div
                  className={`w-0.5 h-12 ${
                    step.status === 'completed' ? 'bg-gov-blue' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={`font-medium ${
                  step.status === 'pending' ? 'text-gray-400' : 'text-gov-text'
                }`}
              >
                {step.name}
              </p>
              {step.time && (
                <p className="text-xs text-gov-text-secondary mt-0.5">{step.time}</p>
              )}
              {step.status === 'active' && (
                <p className="text-xs text-gov-blue mt-0.5">正在处理中...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
