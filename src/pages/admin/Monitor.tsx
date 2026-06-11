import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CircleCheck, CircleAlert, CircleX } from 'lucide-react';
import { dashboardStats, serviceDomains } from '@/mock/data';

const domainStatuses = serviceDomains.map((d, i) => ({
  name: d.name,
  color: d.color,
  responseTime: [120, 85, 210, 150, 95, 180][i],
  successRate: [99.9, 99.8, 98.5, 99.7, 99.6, 97.2][i],
}));

function getStatusLevel(rate: number) {
  if (rate >= 99.5) return { level: 'green', icon: CircleCheck, text: 'text-emerald-500' };
  if (rate >= 98) return { level: 'yellow', icon: CircleAlert, text: 'text-amber-500' };
  return { level: 'red', icon: CircleX, text: 'text-red-500' };
}

const dayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const alerts = [
  { id: 1, time: '11:23', message: '生活休闲域响应时间异常升高 (>500ms)', severity: 'warning' },
  { id: 2, time: '10:15', message: '医疗健康域短暂不可用 (30s)', severity: 'error' },
  { id: 3, time: '09:00', message: '民生服务域响应时间恢复正常', severity: 'info' },
  { id: 4, time: '08:45', message: '办事服务域部署新版本 v2.3.1', severity: 'info' },
];

function GaugeChart({ value, size = 180 }: { value: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1A56DB"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gov-text">{value}%</span>
        <span className="text-xs text-gov-text-secondary">服务可用率</span>
      </div>
    </div>
  );
}

function HeatmapGrid({ data }: { data: number[][] }) {
  const maxVal = 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1 mb-2 pl-12">
        {Array.from({ length: 24 }, (_, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[9px] text-gov-text-secondary"
            style={{ minWidth: 0 }}
          >
            {i % 4 === 0 ? `${i}h` : ''}
          </div>
        ))}
      </div>
      {data.map((row, dayIdx) => (
        <div key={dayIdx} className="flex items-center gap-1">
          <span className="text-xs text-gov-text-secondary w-10 text-right shrink-0">
            {dayLabels[dayIdx]}
          </span>
          <div className="flex gap-1 flex-1">
            {row.map((val, hourIdx) => {
              const intensity = val / maxVal;
              const opacity = 0.15 + intensity * 0.85;
              return (
                <div
                  key={hourIdx}
                  className="flex-1 aspect-square rounded-sm min-w-0"
                  style={{
                    backgroundColor: `rgba(26, 86, 219, ${opacity})`,
                    minWidth: 0,
                  }}
                  title={`${dayLabels[dayIdx]} ${hourIdx}:00 - ${val}`}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Monitor() {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h2 className="gov-section-title">
        <Activity className="w-5 h-5 text-gov-blue" />
        监控统计
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="gov-card p-6 flex flex-col items-center justify-center">
          <GaugeChart value={dashboardStats.serviceAvailability} />
          <p className="text-sm text-gov-text-secondary mt-2">当前服务整体可用率</p>
        </div>

        <div className="lg:col-span-2 gov-card p-6">
          <h3 className="gov-section-title mb-4">服务域状态</h3>
          <div className="space-y-3">
            {domainStatuses.map((ds) => {
              const st = getStatusLevel(ds.successRate);
              const Icon = st.icon;
              return (
                <div key={ds.name} className="flex items-center justify-between py-2 border-b border-gov-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${st.text}`} />
                    <span className="text-sm font-medium text-gov-text">{ds.name}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gov-text-secondary">响应 <span className="text-gov-text font-medium">{ds.responseTime}ms</span></span>
                    <span className="text-gov-text-secondary">成功率 <span className={`font-medium ${st.text}`}>{ds.successRate}%</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">每小时访问热力图</h3>
        <div ref={canvasRef}>
          <HeatmapGrid data={dashboardStats.hourlyHeatmap} />
        </div>
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gov-text-secondary">
          <span>低</span>
          <div className="flex gap-0.5">
            {[0.15, 0.35, 0.55, 0.75, 1].map((op, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: `rgba(26, 86, 219, ${op})` }}
              />
            ))}
          </div>
          <span>高</span>
        </div>
      </div>

      <div className="gov-card p-6">
        <h3 className="gov-section-title mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          告警记录
        </h3>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 py-2 border-b border-gov-border last:border-0"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  alert.severity === 'error'
                    ? 'bg-red-500'
                    : alert.severity === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm text-gov-text">{alert.message}</p>
              </div>
              <span className="text-xs text-gov-text-secondary shrink-0">{alert.time}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
