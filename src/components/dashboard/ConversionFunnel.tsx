import React from 'react';
import type { FunnelStep } from '../../../shared/types';

interface ConversionFunnelProps {
  data: FunnelStep[];
  period: string;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data, period }) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const totalWidth = 100;

  const colors = [
    { bg: 'bg-gradient-to-r from-green-600 to-green-500', text: 'text-white' },
    { bg: 'bg-gradient-to-r from-green-500 to-emerald-500', text: 'text-white' },
    { bg: 'bg-gradient-to-r from-emerald-500 to-teal-500', text: 'text-white' },
    { bg: 'bg-gradient-to-r from-teal-500 to-cyan-500', text: 'text-white' },
    { bg: 'bg-gradient-to-r from-cyan-500 to-blue-500', text: 'text-white' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          统计周期: <span className="font-medium text-slate-700">{period}</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-slate-500">转化</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <span className="text-xs text-slate-500">流失</span>
          </div>
        </div>
      </div>

      {data.map((step, index) => {
        const widthPercent = totalWidth * (step.value / maxValue);
        const color = colors[index % colors.length];
        const prevValue = index > 0 ? data[index - 1].value : step.value;
        const dropCount = prevValue - step.value;
        const dropPercent = prevValue > 0 ? ((dropCount / prevValue) * 100).toFixed(1) : '0';

        return (
          <div key={step.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                  {index + 1}
                </span>
                <span className="font-medium text-slate-700">{step.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-800">
                  {step.value.toLocaleString()}
                </span>
                {index > 0 && (
                  <span className="text-sm text-green-600 font-medium">
                    转化率 {step.conversionRate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-stretch h-16 rounded-lg overflow-hidden bg-slate-50">
                <div
                  className={`${color.bg} flex items-center px-4 transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className={`text-sm font-semibold ${color.text}`}>
                    {widthPercent.toFixed(1)}%
                  </span>
                </div>
                {index > 0 && dropCount > 0 && (
                  <div className="flex-1 flex items-center justify-end pr-4">
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-red-400 rounded-sm" />
                      流失 {dropCount.toLocaleString()} ({dropPercent}%)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {index < data.length - 1 && (
              <div className="flex items-center justify-center py-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-16 h-px bg-slate-200" />
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    转化效率 {data[index + 1].conversionRate.toFixed(1)}%
                  </span>
                  <span className="w-16 h-px bg-slate-200" />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">整体转化率</p>
            <p className="text-2xl font-bold text-green-600">
              {data.length > 0 ? ((data[data.length - 1].value / data[0].value) * 100).toFixed(1) : 0}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">平均转化效率</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.length > 1
                ? (
                    data.slice(1).reduce((sum, d) => sum + d.conversionRate, 0) /
                    (data.length - 1)
                  ).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-500 mb-1">最大流失环节</p>
            <p className="text-2xl font-bold text-orange-500">
              {data.length > 1
                ? data
                    .slice(1)
                    .reduce((max, d) => (d.dropRate > max.dropRate ? d : max), data[1])
                    .name
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
