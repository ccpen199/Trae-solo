import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Wrench,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  MoreHorizontal,
  MapPin,
  Home,
  Image as ImageIcon,
  X,
  Upload,
  AlertTriangle,
  AlertCircle,
  ArrowUp,
  Send,
  CalendarClock,
} from 'lucide-react';
import { Input, Select, Upload as AntUpload, DatePicker, message } from 'antd';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { cn } from '@/utils/cn';
import type { WorkOrderType, WorkOrderPriority } from '@/types/entity';
import { WORK_ORDER_TYPE, WORK_ORDER_PRIORITY } from '@/constants/enums';

const { TextArea } = Input;

interface TypeOption {
  key: WorkOrderType;
  label: string;
  icon: typeof Wrench;
  color: string;
  bg: string;
}

const typeOptions: TypeOption[] = [
  {
    key: 'REPAIR',
    label: '报修',
    icon: Wrench,
    color: 'text-danger-400',
    bg: 'bg-danger-500/15',
  },
  {
    key: 'COMPLAINT',
    label: '投诉',
    icon: MessageSquare,
    color: 'text-warning-400',
    bg: 'bg-warning-500/15',
  },
  {
    key: 'CONSULT',
    label: '咨询',
    icon: HelpCircle,
    color: 'text-primary-400',
    bg: 'bg-primary-500/15',
  },
  {
    key: 'SUGGESTION',
    label: '建议',
    icon: Lightbulb,
    color: 'text-success-400',
    bg: 'bg-success-500/15',
  },
  {
    key: 'APPOINTMENT',
    label: '预约服务',
    icon: CalendarClock,
    color: 'text-info-400',
    bg: 'bg-info-500/15',
  },
];

const communityOptions = [
  { label: '阳光花园', value: 'c1' },
  { label: '翠湖苑', value: 'c2' },
  { label: '金色家园', value: 'c3' },
];

const buildingOptions: Record<string, { label: string; value: string }[]> = {
  c1: [
    { label: '1号楼', value: 'b1' },
    { label: '2号楼', value: 'b2' },
    { label: '3号楼', value: 'b3' },
  ],
  c2: [
    { label: 'A栋', value: 'b4' },
    { label: 'B栋', value: 'b5' },
  ],
  c3: [
    { label: '1号楼', value: 'b6' },
    { label: '2号楼', value: 'b7' },
  ],
};

const unitOptions: Record<string, { label: string; value: string }[]> = {
  b1: [
    { label: '1单元', value: 'u1' },
    { label: '2单元', value: 'u2' },
    { label: '3单元', value: 'u3' },
  ],
  b2: [
    { label: '1单元', value: 'u4' },
    { label: '2单元', value: 'u5' },
  ],
  b3: [
    { label: '1单元', value: 'u6' },
    { label: '2单元', value: 'u7' },
  ],
  b4: [
    { label: '1单元', value: 'u8' },
  ],
  b5: [
    { label: '1单元', value: 'u9' },
    { label: '2单元', value: 'u10' },
  ],
  b6: [
    { label: '1单元', value: 'u11' },
    { label: '2单元', value: 'u12' },
  ],
  b7: [
    { label: '1单元', value: 'u13' },
  ],
};

const roomOptions: Record<string, { label: string; value: string }[]> = {
  u1: [
    { label: '501室', value: 'r1' },
    { label: '502室', value: 'r2' },
    { label: '601室', value: 'r3' },
  ],
  u2: [
    { label: '301室', value: 'r4' },
    { label: '302室', value: 'r5' },
    { label: '401室', value: 'r6' },
  ],
  u3: [
    { label: '201室', value: 'r7' },
    { label: '202室', value: 'r8' },
  ],
};

const priorityOptions = [
  { key: 'LOW', label: '低', icon: ArrowUp, color: 'text-neutral-400', bg: 'bg-neutral-500/15' },
  { key: 'MEDIUM', label: '中', icon: ArrowUp, color: 'text-primary-400', bg: 'bg-primary-500/15' },
  { key: 'HIGH', label: '高', icon: AlertCircle, color: 'text-warning-400', bg: 'bg-warning-500/15' },
  { key: 'URGENT', label: '紧急', icon: AlertTriangle, color: 'text-danger-400', bg: 'bg-danger-500/15' },
];

export default function WorkOrderCreate() {
  const [type, setType] = useState<WorkOrderType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [appointmentTime, setAppointmentTime] = useState<dayjs.Dayjs | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleBack = () => {
    message.info('返回工单列表');
  };

  const handleTypeSelect = (key: WorkOrderType) => {
    setType(key);
  };

  const handleCommunityChange = (value: string) => {
    setCommunityId(value);
    setBuildingId('');
    setUnitId('');
    setRoomId('');
  };

  const handleBuildingChange = (value: string) => {
    setBuildingId(value);
    setUnitId('');
    setRoomId('');
  };

  const handleUnitChange = (value: string) => {
    setUnitId(value);
    setRoomId('');
  };

  const uploadProps: UploadProps = {
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
      return false;
    },
    multiple: true,
    accept: 'image/*',
    showUploadList: false,
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!type) {
      message.warning('请选择工单类型');
      return;
    }
    if (!title.trim()) {
      message.warning('请输入工单标题');
      return;
    }
    if (!description.trim()) {
      message.warning('请输入详细描述');
      return;
    }
    if (type === 'APPOINTMENT' && !appointmentTime) {
      message.warning('请选择预约时间');
      return;
    }

    setSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setSubmitting(false);
    message.success('工单提交成功！我们会尽快处理');

    setType('');
    setTitle('');
    setDescription('');
    setCommunityId('');
    setBuildingId('');
    setUnitId('');
    setRoomId('');
    setLocationDetail('');
    setPriority('MEDIUM');
    setAppointmentTime(null);
    setUploadedImages([]);
  };

  const handleCancel = () => {
    message.info('已取消');
    handleBack();
  };

  const canSubmit = type && title.trim() && description.trim();

  return (
    <div className="p-6">
      <PageHeader
        title="新建工单"
        subtitle="提交您的问题或建议，我们会尽快处理"
        showBack
        onBack={handleBack}
        breadcrumb={[
          { title: '首页' },
          { title: '工单管理' },
          { title: '新建工单' },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6"
        >
          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-medium">
                1
              </span>
              选择工单类型
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {typeOptions.map((option, index) => {
                const Icon = option.icon;
                const isSelected = type === option.key;
                return (
                  <motion.button
                    key={option.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    onClick={() => handleTypeSelect(option.key)}
                    className={cn(
                      'glass-card-hover p-5 flex flex-col items-center gap-3 transition-all duration-300',
                      isSelected && 'border-primary-500/50 bg-primary-500/10'
                    )}
                  >
                    <div
                      className={cn(
                        'w-14 h-14 rounded-2xl flex items-center justify-center transition-all',
                        isSelected ? option.bg : 'bg-white/5'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-7 h-7 transition-colors',
                          isSelected ? option.color : 'text-neutral-400'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors',
                        isSelected ? 'text-white' : 'text-neutral-300'
                      )}
                    >
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="divider mb-8" />

          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-medium">
                2
              </span>
              填写工单信息
            </h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  工单标题 <span className="text-danger-400">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请简要描述您的问题"
                  maxLength={50}
                  showCount
                  className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  详细描述 <span className="text-danger-400">*</span>
                </label>
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="请详细描述您遇到的问题或需求..."
                  rows={5}
                  maxLength={500}
                  showCount
                  className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  上传图片（选填，最多6张）
                </label>
                <div className="flex flex-wrap gap-3">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10"
                    >
                      <img
                        src={img}
                        alt={`上传图片 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {uploadedImages.length < 6 && (
                    <AntUpload {...uploadProps}>
                      <div className="w-20 h-20 rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-neutral-500 hover:border-primary-500/50 hover:text-primary-400 transition-colors cursor-pointer">
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-xs">上传</span>
                      </div>
                    </AntUpload>
                  )}
                </div>
                <p className="text-xs text-neutral-600 mt-2">支持 JPG、PNG 格式，最多上传6张</p>
              </div>
            </div>
          </div>

          {type === 'APPOINTMENT' && (
            <>
              <div className="divider mb-8" />
              <div className="mb-8">
                <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-info-500/20 text-info-400 text-xs flex items-center justify-center font-medium">
                    2.5
                  </span>
                  预约时间
                </h3>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    选择预约时间 <span className="text-danger-400">*</span>
                  </label>
                  <DatePicker
                    showTime
                    value={appointmentTime}
                    onChange={(date) => setAppointmentTime(date as dayjs.Dayjs)}
                    placeholder="请选择预约时间"
                    className="w-full"
                    minDate={dayjs()}
                    format="YYYY-MM-DD HH:mm"
                  />
                  <p className="text-xs text-neutral-600 mt-2">请选择您方便的时间，我们会准时上门服务</p>
                </div>
              </div>
            </>
          )}

          <div className="divider mb-8" />

          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-medium">
                3
              </span>
              位置信息
            </h3>
            <div className="space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    所属小区
                  </label>
                  <Select
                    placeholder="选择小区"
                    value={communityId || undefined}
                    onChange={handleCommunityChange}
                    className="w-full"
                    options={communityOptions}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    楼栋
                  </label>
                  <Select
                    placeholder="选择楼栋"
                    value={buildingId || undefined}
                    onChange={handleBuildingChange}
                    disabled={!communityId}
                    className="w-full"
                    options={buildingOptions[communityId] || []}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    单元
                  </label>
                  <Select
                    placeholder="选择单元"
                    value={unitId || undefined}
                    onChange={handleUnitChange}
                    disabled={!buildingId}
                    className="w-full"
                    options={unitOptions[buildingId] || []}
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">
                    房号
                  </label>
                  <Select
                    placeholder="选择房号"
                    value={roomId || undefined}
                    onChange={setRoomId}
                    disabled={!unitId}
                    className="w-full"
                    options={roomOptions[unitId] || []}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    具体位置描述（选填）
                  </div>
                </label>
                <Input
                  value={locationDetail}
                  onChange={(e) => setLocationDetail(e.target.value)}
                  placeholder="如：客厅、厨房、卫生间等具体位置"
                  maxLength={100}
                  className="!bg-white/5 !border-white/10 !text-white !placeholder-neutral-500 focus:!border-primary-500/50 focus:!ring-0"
                />
              </div>
            </div>
          </div>

          <div className="divider mb-8" />

          <div className="mb-8">
            <h3 className="text-sm font-medium text-neutral-300 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary-500/20 text-primary-400 text-xs flex items-center justify-center font-medium">
                4
              </span>
              紧急程度
            </h3>
            <div className="flex flex-wrap gap-3">
              {priorityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = priority === option.key;
                return (
                  <button
                    key={option.key}
                    onClick={() => setPriority(option.key as WorkOrderPriority)}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all duration-200',
                      isSelected
                        ? `${option.bg} ${option.color} border-current/50`
                        : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-300'
                    )}
                  >
                    {option.key === 'LOW' && <Icon className={cn('w-4 h-4', isSelected && 'rotate-180')} />}
                    {option.key !== 'LOW' && <Icon className="w-4 h-4" />}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-neutral-600 mt-3">
              提示：紧急工单会优先处理，请根据实际情况选择
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              onClick={handleCancel}
              className="btn-ghost"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                'btn-primary flex items-center gap-2 min-w-[120px] justify-center',
                (!canSubmit || submitting) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交工单
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
