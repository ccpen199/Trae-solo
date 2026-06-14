import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  InputNumber,
  Checkbox,
  Progress,
  Avatar,
  Tag,
  Space,
  Divider,
  message,
} from 'antd';
import {
  Radio,
  Pause,
  Play,
  Square,
  MapPin,
  Clock,
  Thermometer,
  Heart,
  Activity,
  Droplets,
  Pill,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import type { VitalSign, Medication } from '@/types';

interface WaveformBarProps {
  delay: number;
}

function WaveformBar({ delay }: WaveformBarProps) {
  return (
    <div
      className="w-1 bg-red-500 rounded-full animate-pulse"
      style={{
        height: `${20 + Math.random() * 40}px`,
        animationDelay: `${delay}s`,
        animationDuration: `${0.5 + Math.random() * 0.5}s`,
      }}
    />
  );
}

export default function ServiceOngoing() {
  const { orders, filterOrdersByStatus, nurses, getNurseById } = useGlobalStore();

  const inServiceOrders = useMemo(
    () => filterOrdersByStatus('in-service'),
    [filterOrdersByStatus]
  );

  const currentOrder = inServiceOrders[0];
  const currentNurse = currentOrder?.nurseId
    ? getNurseById(currentOrder.nurseId)
    : undefined;

  const [isRecording, setIsRecording] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const [vitalSigns, setVitalSigns] = useState<VitalSign>({
    temperature: 36.5,
    heartRate: 75,
    bloodPressure: { systolic: 120, diastolic: 80 },
    respiratoryRate: 18,
    oxygenSaturation: 98,
    bloodGlucose: 5.6,
    recordedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  });

  const [medications, setMedications] = useState<Medication[]>([
    { name: '硝苯地平缓释片', dosage: '30mg', frequency: '每日1次', administered: false, remark: '早餐后服用' },
    { name: '阿司匹林肠溶片', dosage: '100mg', frequency: '每日1次', administered: false },
    { name: '二甲双胍片', dosage: '500mg', frequency: '每日2次', administered: false, remark: '餐中服用' },
  ]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    message.info(isPaused ? '继续录制' : '已暂停录制');
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsPaused(false);
    message.success('录制已停止，数据正在上传...');
  };

  const toggleServiceItem = (code: string) => {
    const newCompleted = new Set(completedItems);
    if (newCompleted.has(code)) {
      newCompleted.delete(code);
    } else {
      newCompleted.add(code);
    }
    setCompletedItems(newCompleted);
  };

  const handleVitalSignChange = (field: keyof VitalSign, value: number | { systolic: number; diastolic: number }) => {
    setVitalSigns((prev) => ({
      ...prev,
      [field]: value,
      recordedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    }));
  };

  const toggleMedication = (index: number) => {
    const newMeds = [...medications];
    newMeds[index] = { ...newMeds[index], administered: !newMeds[index].administered };
    setMedications(newMeds);
  };

  const handleSaveVitalSigns = () => {
    message.success('生命体征已保存');
  };

  const handleSaveMedications = () => {
    message.success('用药记录已保存');
  };

  const waveformBars = useMemo(
    () => Array.from({ length: 30 }, (_, i) => <WaveformBar key={i} delay={i * 0.05} />),
    []
  );

  if (!currentOrder) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-slate-500">
          <Activity className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg">当前没有进行中的服务</p>
        </div>
      </div>
    );
  }

  const progress = (completedItems.size / currentOrder.serviceItems.length) * 100;

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-red-50 via-red-100 to-red-50 -mx-6 -mt-6 mb-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className={cn(
                    'h-4 w-4 rounded-full bg-red-500',
                    isRecording && !isPaused && 'animate-pulse'
                  )}
                />
                {isRecording && !isPaused && (
                  <div className="absolute inset-0 h-4 w-4 animate-ping rounded-full bg-red-400 opacity-75" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-red-600" />
                  <span className="text-lg font-semibold text-red-700">
                    {isRecording ? (isPaused ? '录制已暂停' : '正在录制') : '录制已停止'}
                  </span>
                </div>
                <p className="text-sm text-red-600/70">服务音视频全程记录中</p>
              </div>
            </div>

            <div className="text-center">
              <div className="font-mono text-3xl font-bold text-red-700">
                {formatTime(elapsedTime)}
              </div>
              <p className="text-xs text-red-600/70">已录制时长</p>
            </div>

            <div className="flex items-end gap-0.5 h-12 px-4">
              {isRecording && !isPaused ? waveformBars : (
                <div className="flex items-end gap-0.5 h-full">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className="w-1 bg-red-300 rounded-full" style={{ height: '4px' }} />
                  ))}
                </div>
              )}
            </div>

            <Space size="middle">
              <Button
                type="primary"
                size="large"
                icon={isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                onClick={handlePauseResume}
                disabled={!isRecording}
                className={cn(
                  'min-w-[100px]',
                  isPaused ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {isPaused ? '继续' : '暂停'}
              </Button>
              <Button
                type="primary"
                size="large"
                danger
                icon={<Square className="h-4 w-4" />}
                onClick={handleStop}
                disabled={!isRecording}
                className="min-w-[100px]"
              >
                停止
              </Button>
            </Space>
          </div>
        </div>

        <div className="flex items-center gap-6 p-2">
          <div className="flex items-center gap-3">
            <Avatar size={48} icon={<User className="h-6 w-6" />} className="bg-blue-500" />
            <div>
              <p className="font-medium text-slate-800">{currentNurse?.name || currentOrder.nurseInfo?.name}</p>
              <p className="text-sm text-slate-500">执业护士 · {currentOrder.nurseInfo?.phone}</p>
            </div>
          </div>
          <Divider type="vertical" className="h-10" />
          <div className="flex items-center gap-3">
            <Avatar size={48} icon={<User className="h-6 w-6" />} className="bg-purple-500" />
            <div>
              <p className="font-medium text-slate-800">
                {currentOrder.patientInfo.name}
                <Tag color="blue" className="ml-2">{currentOrder.patientInfo.age}岁</Tag>
              </p>
              <p className="text-sm text-slate-500">{currentOrder.patientInfo.diagnosis}</p>
            </div>
          </div>
          <Divider type="vertical" className="h-10" />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600">已签到</span>
              <span className="text-slate-400">|</span>
              <span>GPS: 116.4074°E, 39.9042°N</span>
              <span className="text-slate-400">|</span>
              <Clock className="h-4 w-4" />
              <span>{dayjs(currentOrder.actualStartTime).format('YYYY-MM-DD HH:mm')}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="服务项目进度" className="border-0 shadow-lg">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              已完成 {completedItems.size} / {currentOrder.serviceItems.length} 项
            </span>
            <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
          </div>
          <Progress
            percent={progress}
            strokeColor={{ from: '#108ee9', to: '#87d068' }}
            trailColor="#f0f0f0"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {currentOrder.serviceItems.map((item) => (
            <div
              key={item.code}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                completedItems.has(item.code)
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              )}
            >
              <Checkbox
                checked={completedItems.has(item.code)}
                onChange={() => toggleServiceItem(item.code)}
              />
              <div className="flex-1">
                <span className={cn(
                  'text-sm font-medium',
                  completedItems.has(item.code) ? 'text-emerald-700 line-through' : 'text-slate-700'
                )}>
                  {item.name}
                </span>
                <p className="text-xs text-slate-400">{item.duration}分钟 · ¥{item.price}</p>
              </div>
              {completedItems.has(item.code) && (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-rose-500" />
              <span>生命体征快捷录入</span>
            </div>
          }
          className="border-0 shadow-lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-slate-600">体温</span>
              </div>
              <InputNumber
                size="small"
                min={34}
                max={42}
                step={0.1}
                value={vitalSigns.temperature}
                onChange={(v) => v !== null && handleVitalSignChange('temperature', v)}
                formatter={(v) => `${v} ℃`}
                parser={(v) => Number(v?.replace(' ℃', '') || 0)}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                <span className="text-sm text-slate-600">心率</span>
              </div>
              <InputNumber
                size="small"
                min={30}
                max={200}
                value={vitalSigns.heartRate}
                onChange={(v) => v !== null && handleVitalSignChange('heartRate', v)}
                formatter={(v) => `${v} bpm`}
                parser={(v) => Number(v?.replace(' bpm', '') || 0)}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-slate-600">血压(收缩/舒张)</span>
              </div>
              <div className="flex items-center gap-1">
                <InputNumber
                  size="small"
                  min={60}
                  max={220}
                  value={vitalSigns.bloodPressure?.systolic}
                  onChange={(v) =>
                    v !== null &&
                    handleVitalSignChange('bloodPressure', {
                      systolic: v,
                      diastolic: vitalSigns.bloodPressure?.diastolic ?? 80,
                    })
                  }
                  className="w-20"
                />
                <span className="text-slate-400">/</span>
                <InputNumber
                  size="small"
                  min={40}
                  max={140}
                  value={vitalSigns.bloodPressure?.diastolic}
                  onChange={(v) =>
                    v !== null &&
                    handleVitalSignChange('bloodPressure', {
                      systolic: vitalSigns.bloodPressure?.systolic ?? 120,
                      diastolic: v,
                    })
                  }
                  className="w-20"
                />
                <span className="text-xs text-slate-400">mmHg</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-cyan-500" />
                <span className="text-sm text-slate-600">呼吸频率</span>
              </div>
              <InputNumber
                size="small"
                min={8}
                max={40}
                value={vitalSigns.respiratoryRate}
                onChange={(v) => v !== null && handleVitalSignChange('respiratoryRate', v)}
                formatter={(v) => `${v} 次/分`}
                parser={(v) => Number(v?.replace(' 次/分', '') || 0)}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-slate-600">血氧饱和度</span>
              </div>
              <InputNumber
                size="small"
                min={70}
                max={100}
                value={vitalSigns.oxygenSaturation}
                onChange={(v) => v !== null && handleVitalSignChange('oxygenSaturation', v)}
                formatter={(v) => `${v}%`}
                parser={(v) => Number(v?.replace('%', '') || 0)}
                className="w-32"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-slate-600">血糖</span>
              </div>
              <InputNumber
                size="small"
                min={1}
                max={30}
                step={0.1}
                value={vitalSigns.bloodGlucose}
                onChange={(v) => v !== null && handleVitalSignChange('bloodGlucose', v)}
                formatter={(v) => `${v} mmol/L`}
                parser={(v) => Number(v?.replace(' mmol/L', '') || 0)}
                className="w-32"
              />
            </div>
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              录入时间：{vitalSigns.recordedAt}
            </span>
            <Button
              type="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleSaveVitalSigns}
            >
              保存体征
            </Button>
          </div>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-500" />
              <span>用药清单勾选</span>
            </div>
          }
          className="border-0 shadow-lg"
        >
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div
                key={med.name}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  med.administered
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                )}
              >
                <Checkbox
                  checked={med.administered}
                  onChange={() => toggleMedication(index)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-emerald-500" />
                    <span className={cn(
                      'text-sm font-medium',
                      med.administered ? 'text-emerald-700' : 'text-slate-700'
                    )}>
                      {med.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                    <span>{med.dosage}</span>
                    <span>{med.frequency}</span>
                    {med.remark && <span className="text-amber-500">{med.remark}</span>}
                  </div>
                </div>
                {med.administered && (
                  <Tag color="success" className="m-0">
                    已执行
                  </Tag>
                )}
              </div>
            ))}
          </div>
          <Divider className="my-4" />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              已执行 {medications.filter((m) => m.administered).length} / {medications.length} 项
            </span>
            <Button
              type="primary"
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={handleSaveMedications}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              保存用药
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-lg">
        <Button size="large" danger>
          签退
        </Button>
        <Button type="primary" size="large" icon={<CheckCircle2 className="h-4 w-4" />}>
          提交护理记录
        </Button>
      </div>
    </div>
  );
}
