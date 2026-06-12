import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Camera,
  Stethoscope,
  ChevronRight,
  Upload,
  Eye,
  Scissors,
  Sparkles,
  ClipboardCheck,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge, Tag, Avatar } from '@/components/common/BadgeTagAvatar';
import { Tabs } from '@/components/common/UIComponents';
import { ServiceSOPGuide } from '@/components/business/ServiceSOPGuide';
import {
  CompareImage,
  ImageViewer,
} from '@/components/business/ImageComponents';
import { useAppointmentStore } from '@/stores/appointmentStore';
import { useInventoryStore } from '@/stores/inventoryStore';
import { cn, formatCurrency } from '@/utils/common';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ServiceExecutionPage() {
  const { appointments, sops, fetchAppointments, fetchSOPs, executeServiceStep, updateServiceTrace, isLoading } = useAppointmentStore();
  const { inventoryItems, fetchInventoryItems } = useInventoryStore();
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [showTrace, setShowTrace] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    fetchSOPs();
    fetchInventoryItems();
  }, [fetchAppointments, fetchSOPs, fetchInventoryItems]);

  const pendingAppointments = appointments.filter((a) => a.status === 'confirmed');
  const inServiceAppointments = appointments.filter((a) => a.status === 'in_service');
  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  const currentAppointment = appointments.find((a) => a.id === selectedAppointment);
  const currentSOP = currentAppointment ? sops.find((s) => s.serviceId === currentAppointment.serviceId) : null;

  const startService = (aptId: string) => {
    executeServiceStep(aptId, 'start_service', {});
  };

  const completeStep = (aptId: string, stepIndex: number) => {
    executeServiceStep(aptId, 'complete_step', { stepIndex });
  };

  const completeService = (aptId: string) => {
    executeServiceStep(aptId, 'complete_service', {});
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">服务执行</h1>
          <p className="text-neutral-500 mt-1">按SOP流程执行服务，全程可追溯</p>
        </div>
        <Button variant="outline" onClick={() => setShowTrace(!showTrace)}>
          <Eye className="w-4 h-4 mr-2" />
          {showTrace ? '隐藏' : '显示'}追溯视图
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待服务', value: pendingAppointments.length, color: 'bg-primary-100 text-primary-600' },
          { label: '服务中', value: inServiceAppointments.length, color: 'bg-amber-100 text-amber-600' },
          { label: '已完成', value: completedAppointments.length, color: 'bg-green-100 text-green-600' },
          { label: '今日完成', value: completedAppointments.filter((a) => a.scheduledDate === format(new Date(), 'yyyy-MM-dd')).length, color: 'bg-mint-100 text-mint-600' },
        ].map((stat, index) => (
          <Card key={index} hoverable>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${stat.color} flex items-center justify-center`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-1" padded={false}>
          <Tabs
            tabs={[
              { id: 'pending', label: `待服务 (${pendingAppointments.length})` },
              { id: 'in_service', label: `服务中 (${inServiceAppointments.length})` },
              { id: 'completed', label: '已完成' },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="px-4"
          />
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {(activeTab === 'pending' ? pendingAppointments :
              activeTab === 'in_service' ? inServiceAppointments : completedAppointments).map((apt) => (
              <motion.button
                key={apt.id}
                whileHover={{ x: 4 }}
                onClick={() => setSelectedAppointment(apt.id)}
                className={cn(
                  'w-full p-4 rounded-xl text-left transition-all border-2',
                  selectedAppointment === apt.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-transparent bg-neutral-50 hover:bg-white hover:shadow-soft'
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${apt.ownerName}`}
                    name={apt.ownerName}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-neutral-900 truncate">{apt.ownerName}</h4>
                      <Badge variant={
                        apt.status === 'in_service' ? 'warning' :
                        apt.status === 'completed' ? 'success' : 'info'
                      } size="sm">
                        {apt.status === 'confirmed' ? '待服务' :
                         apt.status === 'in_service' ? '服务中' :
                         apt.status === 'completed' ? '已完成' : apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-500 truncate">{apt.petName} · {apt.serviceId === 'srv_001' ? '精致洗护' : '服务'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">{apt.scheduledDate} {apt.startTime}</span>
                  <span className="font-semibold text-primary-600">{formatCurrency(apt.totalPrice)}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </Card>

        <Card className="col-span-2" padded={false}>
          {currentAppointment && currentSOP ? (
            <div className="flex flex-col h-[700px]">
              <div className="px-6 py-4 border-b border-neutral-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
                      {currentSOP.name}
                      <Badge variant="info">{currentSOP.steps.length}个步骤</Badge>
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      {currentAppointment.ownerName} · {currentAppointment.petName}
                    </p>
                  </div>
                  {currentAppointment.status === 'confirmed' && (
                    <Button onClick={() => startService(currentAppointment.id)} isLoading={isLoading}>
                      <Scissors className="w-4 h-4 mr-2" />
                      开始服务
                    </Button>
                  )}
                  {currentAppointment.status === 'in_service' && (
                    <Button
                      variant="success"
                      onClick={() => completeService(currentAppointment.id)}
                      isLoading={isLoading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      完成服务
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {currentAppointment.status === 'in_service' || currentAppointment.status === 'completed' ? (
                  <div className="space-y-8">
                    {currentSOP.steps.map((step, index) => {
                      const stepStatus = currentAppointment.traceRecords
                        ? currentAppointment.traceRecords.find((r) => r.stepIndex === index)?.status || 'pending'
                        : 'pending';
                      const traceRecord = currentAppointment.traceRecords?.find((r) => r.stepIndex === index);

                      return (
                        <ServiceSOPGuide
                          key={step.id}
                          step={step}
                          stepNumber={index + 1}
                          isActive={stepStatus === 'in_progress'}
                          isCompleted={stepStatus === 'completed'}
                          onComplete={() => completeStep(currentAppointment.id, index)}
                          onPhotoCapture={(url) => updateServiceTrace(currentAppointment.id, index, { beforeImageUrl: url })}
                          onNoteSave={(note) => updateServiceTrace(currentAppointment.id, index, { notes: note })}
                          traceRecord={traceRecord}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-neutral-400">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">点击「开始服务」开始执行SOP流程</p>
                    </div>
                  </div>
                )}

                {currentAppointment.traceRecords && currentAppointment.traceRecords.length > 0 && (
                  <div className="mt-8">
                    <h4 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-primary-500" />
                      服务前后对比
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {currentAppointment.traceRecords
                        .filter((r) => r.beforeImageUrl && r.afterImageUrl)
                        .map((record, index) => (
                          <div key={index} className="space-y-2">
                            <p className="text-sm font-medium text-neutral-700">
                              步骤 {record.stepIndex + 1}: {currentSOP.steps[record.stepIndex]?.name}
                            </p>
                            <CompareImage
                              beforeImage={record.beforeImageUrl!}
                              afterImage={record.afterImageUrl!}
                              onImageClick={(url) => setViewerImage(url)}
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {currentAppointment.status === 'completed' && (
                  <div className="mt-8 p-6 bg-green-50 rounded-2xl border-2 border-green-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-800">服务已完成</h4>
                        <p className="text-sm text-green-600 mt-0.5">
                          已生成服务报告，可在病历档案中查看
                        </p>
                      </div>
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        查看服务报告
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-[700px] flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">选择一个预约开始服务</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {viewerImage && (
        <ImageViewer
          imageUrl={viewerImage}
          onClose={() => setViewerImage(null)}
        />
      )}
    </motion.div>
  );
}
