import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck, FileText, Upload, MapPin, Bell, Star,
  Briefcase, ScanLine, Search, MessageCircle, AlertTriangle,
  ChevronRight, CheckCircle2, Clock, ArrowRight, Download,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useApplicationStore } from '@/stores/applicationStore';
import { certificates } from '@/mock/data';

const lifecycleSteps = [
  { key: 'appointment', label: '预约管理', icon: CalendarCheck, color: 'from-blue-500 to-blue-400' },
  { key: 'application', label: '申办中心', icon: FileText, color: 'from-violet-500 to-violet-400' },
  { key: 'upload', label: '材料上传', icon: Upload, color: 'from-amber-500 to-amber-400' },
  { key: 'tracking', label: '进度追踪', icon: MapPin, color: 'from-emerald-500 to-emerald-400' },
  { key: 'result', label: '结果推送', icon: Bell, color: 'from-rose-500 to-rose-400' },
  { key: 'review', label: '服务评价', icon: Star, color: 'from-cyan-500 to-cyan-400' },
];

const quickActions = [
  { label: '我要办事', icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
  { label: '我要亮证', icon: ScanLine, color: 'bg-emerald-50 text-emerald-600' },
  { label: '我的预约', icon: CalendarCheck, color: 'bg-violet-50 text-violet-600' },
  { label: '进度查询', icon: Search, color: 'bg-amber-50 text-amber-600' },
  { label: '在线咨询', icon: MessageCircle, color: 'bg-cyan-50 text-cyan-600' },
  { label: '投诉建议', icon: AlertTriangle, color: 'bg-rose-50 text-rose-600' },
];

const mockAppointments = [
  { id: 'ap1', service: '身份证补换领', date: '2026-06-12', time: '09:30', location: '昆山市政务服务中心3楼A12窗口' },
  { id: 'ap2', service: '不动产登记', date: '2026-06-15', time: '14:00', location: '昆山市自然资源局2楼B05窗口' },
];

const mockPendingUploads = [
  { id: 'pu1', service: '营业执照办理', docName: '经营场所证明', progress: 0 },
  { id: 'pu2', service: '营业执照办理', docName: '法人身份证明', progress: 100 },
  { id: 'pu3', service: '公积金提取', docName: '提取申请表', progress: 60 },
];

const mockResults = [
  { id: 'mr1', service: '预约挂号', resultType: 'notification', content: '就诊完成通知', date: '2026-05-30', downloadable: false },
  { id: 'mr2', service: '营业执照办理', resultType: 'certificate', content: '营业执照电子证照', date: '2026-05-25', downloadable: true },
];

const mockPendingReviews = [
  { id: 'pr1', service: '预约挂号', date: '2026-05-30', rating: 0 },
  { id: 'pr2', service: '社保参保登记', date: '2026-05-20', rating: 0 },
];

const mockActivityFeed = [
  { id: 'af1', action: '提交了公积金提取申请', time: '2小时前', type: 'apply' },
  { id: 'af2', action: '亮证核验通过 - 社保卡', time: '5小时前', type: 'verify' },
  { id: 'af3', action: '预约了身份证补换领', time: '1天前', type: 'appointment' },
  { id: 'af4', action: '营业执照办理已审批通过', time: '2天前', type: 'result' },
  { id: 'af5', action: '上传了公积金提取申请表', time: '3天前', type: 'upload' },
  { id: 'af6', action: '评价了社保参保登记服务 ⭐5', time: '5天前', type: 'review' },
];

const activityIconMap: Record<string, React.ElementType> = {
  apply: FileText,
  verify: ScanLine,
  appointment: CalendarCheck,
  result: Bell,
  upload: Upload,
  review: Star,
};

function WorkbenchHeader() {
  const user = useAuthStore((s) => s.user);
  const applications = useApplicationStore((s) => s.applications);
  const activeCount = applications.filter((a) => ['submitted', 'under_review', 'approved'].includes(a.status)).length;
  const completedCount = applications.filter((a) => a.status === 'completed').length;
  const certCount = certificates.filter((c) => c.status === 'valid').length;
  const greeting = user?.role === 'enterprise' ? '企业工作台' : '市民工作台';

  return (
    <div className="gov-card p-5 bg-gradient-to-r from-gov-blue to-gov-blue-light text-white">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
          {user?.name[0] || '用'}
        </div>
        <div>
          <h2 className="text-lg font-bold">{greeting}</h2>
          <p className="text-white/80 text-sm">{user?.name}，欢迎使用昆山政务服务</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/15 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-white/80 mt-0.5">办理中</p>
        </div>
        <div className="bg-white/15 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{completedCount}</p>
          <p className="text-xs text-white/80 mt-0.5">已完成</p>
        </div>
        <div className="bg-white/15 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">{certCount}</p>
          <p className="text-xs text-white/80 mt-0.5">证照</p>
        </div>
      </div>
    </div>
  );
}

function LifecycleWorkbench() {
  const [activeStep, setActiveStep] = useState<string>('appointment');
  const applications = useApplicationStore((s) => s.applications);

  return (
    <div>
      <h3 className="text-base font-bold text-gov-text mb-3">办事全流程</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {lifecycleSteps.map((step, i) => {
          const Icon = step.icon;
          const isActive = activeStep === step.key;
          return (
            <motion.button
              key={step.key}
              onClick={() => setActiveStep(step.key)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all ${
                isActive ? 'bg-white shadow-md ring-2 ring-gov-blue' : 'bg-gov-bg hover:bg-white/80'
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-gov-blue' : 'text-gov-text-secondary'}`}>
                {step.label}
              </span>
              {i < lifecycleSteps.length - 1 && (
                <ChevronRight className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gov-border hidden md:block" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="gov-card p-4">
        {activeStep === 'appointment' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">预约管理</h4>
            {mockAppointments.length > 0 ? (
              <div className="space-y-3">
                {mockAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-start gap-3 p-3 bg-gov-bg rounded-lg">
                    <CalendarCheck className="w-5 h-5 text-gov-blue shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gov-text">{apt.service}</p>
                      <p className="text-xs text-gov-text-secondary mt-1">
                        {apt.date} {apt.time} · {apt.location}
                      </p>
                    </div>
                    <span className="gov-badge bg-blue-50 text-blue-700 text-xs shrink-0">待办理</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gov-text-secondary text-center py-6">暂无预约</p>
            )}
          </div>
        )}

        {activeStep === 'application' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">申办中心</h4>
            {applications.filter((a) => ['submitted', 'under_review', 'approved'].includes(a.status)).length > 0 ? (
              <div className="space-y-3">
                {applications.filter((a) => ['submitted', 'under_review', 'approved'].includes(a.status)).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gov-bg rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-violet-500" />
                      <div>
                        <p className="text-sm font-medium text-gov-text">{app.serviceName}</p>
                        <p className="text-xs text-gov-text-secondary">步骤 {app.currentStep}/{app.steps.length}</p>
                      </div>
                    </div>
                    <span className={`gov-badge text-xs ${
                      app.status === 'submitted' ? 'bg-blue-50 text-blue-700' :
                      app.status === 'under_review' ? 'bg-amber-50 text-amber-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {app.status === 'submitted' ? '已提交' : app.status === 'under_review' ? '审核中' : '已批准'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gov-text-secondary text-center py-6">暂无进行中的申办</p>
            )}
          </div>
        )}

        {activeStep === 'upload' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">材料上传</h4>
            <div className="space-y-3">
              {mockPendingUploads.map((item) => (
                <div key={item.id} className="p-3 bg-gov-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gov-text">{item.docName}</p>
                      <p className="text-xs text-gov-text-secondary">{item.service}</p>
                    </div>
                    {item.progress === 100 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Upload className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  <div className="w-full bg-white rounded-full h-1.5">
                    <div
                      className={`rounded-full h-1.5 transition-all ${item.progress === 100 ? 'bg-emerald-500' : 'bg-gov-blue'}`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gov-text-secondary mt-1">{item.progress === 100 ? '已上传' : item.progress > 0 ? '上传中...' : '待上传'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 'tracking' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">进度追踪</h4>
            <div className="space-y-4">
              {applications.filter((a) => ['submitted', 'under_review', 'approved'].includes(a.status)).slice(0, 2).map((app) => (
                <div key={app.id} className="p-3 bg-gov-bg rounded-lg">
                  <p className="text-sm font-medium text-gov-text mb-3">{app.serviceName}</p>
                  <div className="space-y-0">
                    {app.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 relative">
                        {i < app.steps.length - 1 && (
                          <div className={`absolute left-[9px] top-5 w-0.5 h-full ${
                            step.status === 'completed' ? 'bg-emerald-300' : 'bg-gov-border'
                          }`} />
                        )}
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          step.status === 'completed' ? 'bg-emerald-500' :
                          step.status === 'active' ? 'bg-gov-blue' : 'bg-gray-200'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          ) : step.status === 'active' ? (
                            <Clock className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <div className="pb-3">
                          <p className={`text-sm ${step.status === 'active' ? 'font-semibold text-gov-blue' : step.status === 'completed' ? 'text-gov-text' : 'text-gov-text-secondary'}`}>
                            {step.name}
                          </p>
                          {step.completedAt && (
                            <p className="text-xs text-gov-text-secondary">{step.completedAt}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 'result' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">结果推送</h4>
            <div className="space-y-3">
              {mockResults.map((r) => (
                <div key={r.id} className="flex items-start gap-3 p-3 bg-gov-bg rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-400 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gov-text">{r.service}</p>
                    <p className="text-xs text-gov-text-secondary">{r.content} · {r.date}</p>
                  </div>
                  {r.downloadable && (
                    <button className="flex items-center gap-1 text-xs text-gov-blue font-medium shrink-0">
                      <Download className="w-3 h-3" /> 下载
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeStep === 'review' && (
          <div>
            <h4 className="text-sm font-semibold text-gov-text mb-3">服务评价</h4>
            <div className="space-y-3">
              {mockPendingReviews.map((r) => (
                <div key={r.id} className="p-3 bg-gov-bg rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gov-text">{r.service}</p>
                      <p className="text-xs text-gov-text-secondary">{r.date}</p>
                    </div>
                    <span className="gov-badge bg-amber-50 text-amber-700 text-xs">待评价</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-5 h-5 cursor-pointer transition-colors ${
                          s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div>
      <h3 className="text-base font-bold text-gov-text mb-3">快捷入口</h3>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.label}
              className="flex flex-col items-center gap-2 p-3 gov-card gov-card-hover"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gov-text">{action.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-gov-text">最近动态</h3>
        <button className="text-xs text-gov-blue font-medium flex items-center gap-1">
          查看全部 <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gov-border" />
        <div className="space-y-3">
          {mockActivityFeed.map((item) => {
            const Icon = activityIconMap[item.type] || FileText;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-10"
              >
                <div className="absolute left-2 top-1.5 w-5 h-5 rounded-full bg-gov-bg flex items-center justify-center">
                  <Icon className="w-3 h-3 text-gov-blue" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gov-text">{item.action}</p>
                  <span className="text-xs text-gov-text-secondary shrink-0 ml-2">{item.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProfileWorkbench() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <WorkbenchHeader />
      <QuickActions />
      <LifecycleWorkbench />
      <ActivityFeed />
    </motion.div>
  );
}
