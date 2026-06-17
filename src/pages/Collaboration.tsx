import { useState, useEffect } from 'react';
import {
  Building2,
  Baby,
  CheckCircle,
  Clock,
  Share2,
  ArrowRight,
  Users,
  FileCheck,
  ShieldCheck,
  CreditCard,
  Heart,
  UserPlus,
  Syringe,
  MapPin,
  Home,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import { Card, Progress, Tag, Button, Tooltip, Popover } from 'antd';

interface Step {
  name: string;
  icon: React.ElementType;
  department: string;
  status: 'completed' | 'current' | 'pending';
  signStatus?: 'signed' | 'pending' | 'timeout';
  signer?: string;
  signTime?: string;
  expectedSignTime?: string;
}

interface MaterialItem {
  name: string;
  shared: boolean;
  departments: string[];
  consistency?: 'consistent' | 'diff' | 'conflict';
  diffDetails?: { dept: string; value: string }[];
  signedBy?: { dept: string; signer: string; time: string }[];
}

interface CollaborationScene {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  icon: React.ElementType;
  iconBg: string;
  steps: Step[];
  materials: MaterialItem[];
  currentStep: number;
  totalDays: number;
  elapsedDays: number;
}

const enterpriseSteps: Step[] = [
  { name: '名称核准', icon: FileCheck, department: '市场监管局', status: 'completed', signStatus: 'signed', signer: '张明', signTime: '2026-06-15 09:30' },
  { name: '工商注册', icon: Building2, department: '市场监管局', status: 'completed', signStatus: 'signed', signer: '李华', signTime: '2026-06-15 14:20' },
  { name: '公章刻制', icon: ShieldCheck, department: '公安局', status: 'current', signStatus: 'signed', signer: '王刚', signTime: '2026-06-16 10:00' },
  { name: '税务登记', icon: CreditCard, department: '税务局', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-17 12:00' },
  { name: '社保开户', icon: Users, department: '人社局', status: 'pending', signStatus: 'timeout', expectedSignTime: '2026-06-16 18:00' },
  { name: '银行开户', icon: CreditCard, department: '商业银行', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-18 10:00' },
];

const newbornSteps: Step[] = [
  { name: '出生证明', icon: FileCheck, department: '卫健委', status: 'completed', signStatus: 'signed', signer: '赵医生', signTime: '2026-06-16 08:00' },
  { name: '户口登记', icon: UserPlus, department: '公安局', status: 'current', signStatus: 'signed', signer: '孙警官', signTime: '2026-06-16 15:30' },
  { name: '医保参保', icon: Heart, department: '医保局', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-17 10:00' },
  { name: '预防接种', icon: Syringe, department: '卫健委', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-18 09:00' },
];

const crossProvinceSteps: Step[] = [
  { name: '迁入申请', icon: FileCheck, department: '公安厅', status: 'completed', signStatus: 'signed', signer: '刘主任', signTime: '2026-06-14 10:00' },
  { name: '迁出地核验', icon: MapPin, department: '公安厅', status: 'completed', signStatus: 'signed', signer: '陈警官', signTime: '2026-06-14 16:00' },
  { name: '户口核准', icon: ShieldCheck, department: '公安厅', status: 'current', signStatus: 'pending', expectedSignTime: '2026-06-17 12:00' },
  { name: '社保转移', icon: CreditCard, department: '人社厅', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-18 10:00' },
  { name: '学籍转移', icon: FileText, department: '教育厅', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-19 10:00' },
];

const housingFundSteps: Step[] = [
  { name: '贷款申请', icon: FileCheck, department: '住建厅', status: 'completed', signStatus: 'signed', signer: '周经理', signTime: '2026-06-15 09:00' },
  { name: '房产评估', icon: Home, department: '住建厅', status: 'completed', signStatus: 'signed', signer: '吴评估师', signTime: '2026-06-15 16:00' },
  { name: '税务核验', icon: CreditCard, department: '税务局', status: 'current', signStatus: 'signed', signer: '郑税务', signTime: '2026-06-16 11:00' },
  { name: '银行审批', icon: Building2, department: '银行', status: 'pending', signStatus: 'timeout', expectedSignTime: '2026-06-16 18:00' },
  { name: '贷款发放', icon: CreditCard, department: '银行', status: 'pending', signStatus: 'pending', expectedSignTime: '2026-06-20 10:00' },
];

const enterpriseMaterials: MaterialItem[] = [
  { name: '身份证明', shared: true, departments: ['市场监管局', '公安局', '税务局'], consistency: 'consistent' },
  { name: '企业章程', shared: true, departments: ['市场监管局', '税务局'], consistency: 'diff', diffDetails: [{ dept: '市场监管局', value: '章程版本 v2.1 (2026年修订)' }, { dept: '税务局', value: '章程版本 v2.0 (2025年修订)' }] },
  { name: '验资报告', shared: false, departments: ['市场监管局'] },
  { name: '住所证明', shared: true, departments: ['市场监管局', '税务局', '人社局'], consistency: 'consistent' },
];

const newbornMaterials: MaterialItem[] = [
  { name: '出生医学证明', shared: true, departments: ['公安局', '医保局', '卫健委'], consistency: 'diff', diffDetails: [{ dept: '公安局', value: '证明编号: SY20260616001' }, { dept: '医保局', value: '证明编号: SY20260616001 (备注栏缺失)' }] },
  { name: '父母身份证', shared: true, departments: ['公安局', '医保局'], consistency: 'consistent' },
  { name: '结婚证', shared: true, departments: ['公安局', '医保局'], consistency: 'consistent' },
  { name: '户口本', shared: false, departments: ['公安局'] },
];

const crossProvinceMaterials: MaterialItem[] = [
  { name: '身份证', shared: true, departments: ['公安厅', '人社厅', '教育厅'], consistency: 'consistent' },
  { name: '户口簿', shared: true, departments: ['公安厅', '人社厅'], consistency: 'consistent' },
  { name: '社保缴费记录', shared: true, departments: ['人社厅'], consistency: 'consistent' },
  { name: '学历证明', shared: true, departments: ['教育厅'], consistency: 'consistent' },
];

const housingFundMaterials: MaterialItem[] = [
  { name: '身份证', shared: true, departments: ['住建厅', '自然资源厅', '税务局', '银行'], consistency: 'consistent' },
  { name: '购房合同', shared: true, departments: ['住建厅', '自然资源厅', '税务局'], consistency: 'diff', diffDetails: [{ dept: '住建厅', value: '合同编号 GF2026-0089, 面积89.5㎡' }, { dept: '自然资源厅', value: '合同编号 GF2026-0089, 面积90.0㎡' }] },
  { name: '收入证明', shared: true, departments: ['银行'], consistency: 'consistent' },
  { name: '房产评估报告', shared: true, departments: ['住建厅', '银行'], consistency: 'conflict', diffDetails: [{ dept: '住建厅', value: '评估价格: 1,850,000元' }, { dept: '银行', value: '评估价格: 1,720,000元' }] },
];

const scenes: CollaborationScene[] = [
  {
    id: 'enterprise',
    title: '企业开办"一网通办"',
    subtitle: '多部门联合办理 · 6个环节',
    description: '整合市场监管、公安、税务、人社、银行等部门服务，实现企业开办全流程"一表填报、一次提交、一网通办"。',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    icon: Building2,
    iconBg: 'bg-white/20',
    steps: enterpriseSteps,
    materials: enterpriseMaterials,
    currentStep: 3,
    totalDays: 3,
    elapsedDays: 1,
  },
  {
    id: 'newborn',
    title: '新生儿出生"一件事"',
    subtitle: '多部门联合办理 · 4个环节',
    description: '整合卫生健康、公安、医保等部门服务，实现新生儿出生事项"一次告知、一表申请、一套材料、一网受理"。',
    gradient: 'from-pink-500 via-rose-500 to-red-500',
    icon: Baby,
    iconBg: 'bg-white/20',
    steps: newbornSteps,
    materials: newbornMaterials,
    currentStep: 2,
    totalDays: 2,
    elapsedDays: 0.5,
  },
  {
    id: 'cross_province',
    title: '跨省户口迁移联办',
    subtitle: '公安厅+人社厅+教育厅 · 5个环节',
    description: '整合公安、人社、教育等部门服务，实现跨省户口迁移、社保转移、学籍转移"一次申请、并联审批"。',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    icon: MapPin,
    iconBg: 'bg-white/20',
    steps: crossProvinceSteps,
    materials: crossProvinceMaterials,
    currentStep: 3,
    totalDays: 5,
    elapsedDays: 2,
  },
  {
    id: 'housing_fund',
    title: '公积金贷款一件事联办',
    subtitle: '住建厅+自然资源厅+税务局+银行 · 5个环节',
    description: '整合住建、自然资源、税务、银行等部门服务，实现公积金贷款全流程"一窗受理、并联审批"。',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Home,
    iconBg: 'bg-white/20',
    steps: housingFundSteps,
    materials: housingFundMaterials,
    currentStep: 3,
    totalDays: 5,
    elapsedDays: 2,
  },
];

const statusColorMap: Record<string, string> = {
  completed: 'text-green-400',
  current: 'text-white',
  pending: 'text-white/40',
};

const stepBgMap: Record<string, string> = {
  completed: 'bg-green-400',
  current: 'bg-white animate-pulse',
  pending: 'bg-white/30',
};

const StepProgress = ({ steps, currentStep }: { steps: Step[]; currentStep: number }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/70">办理进度</span>
        <span className="text-sm font-medium text-white">
          第 {currentStep} 步 / 共 {steps.length} 步
        </span>
      </div>
      <Progress
        percent={Math.round((currentStep / steps.length) * 100)}
        showInfo={false}
        strokeColor={{ from: '#ffffff', to: 'rgba(255,255,255,0.6)' }}
        trailColor="rgba(255,255,255,0.2)"
        size="small"
        className="mb-6"
      />
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/20 -z-10">
          <div
            className="h-full bg-white/80 transition-all duration-1000 ease-out"
            style={{
              width: `${visible ? Math.round(((currentStep - 1) / (steps.length - 1)) * 100) : 0}%`,
            }}
          />
        </div>
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Tooltip
                key={index}
                title={
                  <div className="text-center">
                    <div className="font-medium">{step.name}</div>
                    <div className="text-xs opacity-80">{step.department}</div>
                  </div>
                }
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-all duration-500 ${stepBgMap[step.status]} ${visible ? 'scale-100' : 'scale-0'}`}
                    style={{ transitionDelay: `${index * 100 + 300}ms` }}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Icon className={`w-4 h-4 ${statusColorMap[step.status]}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[60px] ${statusColorMap[step.status]}`}>
                    {step.name}
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const DepartmentSignStatus = ({ steps }: { steps: Step[] }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const signStatusConfig: Record<string, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    signed: { color: 'text-green-300', bg: 'bg-green-500/20', label: '已签收', icon: CheckCircle2 },
    pending: { color: 'text-yellow-300', bg: 'bg-yellow-500/20', label: '待签收', icon: Clock },
    timeout: { color: 'text-red-300', bg: 'bg-red-500/20', label: '超时预警', icon: AlertTriangle },
  };

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center mb-3">
        <ClipboardCheck className="w-4 h-4 text-white/70 mr-2" />
        <span className="text-sm text-white/70">部门签收</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const config = signStatusConfig[step.signStatus || 'pending'];
          const StatusIcon = config.icon;
          return (
            <div
              key={index}
              className={`flex items-center justify-between p-2.5 rounded-lg bg-white/10 backdrop-blur-sm transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
              style={{ transitionDelay: `${index * 80 + 400}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">{step.name}</span>
                <span className="text-xs text-white/50">({step.department})</span>
              </div>
              <div className="flex items-center gap-2">
                {step.signStatus === 'signed' && step.signer && step.signTime && (
                  <span className="text-xs text-white/50">
                    {step.signer} · {step.signTime}
                  </span>
                )}
                {step.signStatus === 'pending' && step.expectedSignTime && (
                  <span className="text-xs text-white/50">
                    预计 {step.expectedSignTime}
                  </span>
                )}
                {step.signStatus === 'timeout' && step.expectedSignTime && (
                  <span className="text-xs text-red-300/70">
                    超时 (应于 {step.expectedSignTime})
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MaterialSharing = ({ materials }: { materials: MaterialItem[] }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const sharedCount = materials.filter((m) => m.shared).length;

  const consistencyConfig: Record<string, { color: string; bg: string; label: string }> = {
    consistent: { color: 'text-green-300', bg: 'bg-green-500/20', label: '一致' },
    diff: { color: 'text-orange-300', bg: 'bg-orange-500/20', label: '差异' },
    conflict: { color: 'text-red-300', bg: 'bg-red-500/20', label: '冲突' },
  };

  const renderDiffContent = (material: MaterialItem) => {
    if (!material.diffDetails || material.diffDetails.length === 0) return null;
    return (
      <div className="p-3 min-w-[280px]">
        <p className="font-medium text-gov-gray-700 mb-2 text-sm">差异详情</p>
        {material.diffDetails.map((detail, idx) => (
          <div key={idx} className="mb-2 last:mb-0">
            <span className="text-xs text-gov-gray-500 font-medium">{detail.dept}：</span>
            <span className="text-xs text-gov-gray-700">{detail.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Share2 className="w-4 h-4 text-white/70 mr-2" />
          <span className="text-sm text-white/70">材料共享</span>
        </div>
        <Tag color="green" className="m-0 text-xs bg-green-500/20 text-green-300 border-green-500/30">
          {sharedCount}/{materials.length} 项已共享
        </Tag>
      </div>
      <div className="space-y-2">
        {materials.map((material, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-2.5 rounded-lg bg-white/10 backdrop-blur-sm transition-all duration-500 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
            style={{ transitionDelay: `${index * 100 + 500}ms` }}
          >
            <div className="flex items-center">
              {material.shared ? (
                <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-400 mr-2 flex-shrink-0" />
              )}
              <span className="text-sm text-white/90">{material.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {material.consistency && consistencyConfig[material.consistency] && (
                <>
                  {(material.consistency === 'diff' || material.consistency === 'conflict') && material.diffDetails ? (
                    <Popover content={renderDiffContent(material)} trigger="click">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full cursor-pointer ${consistencyConfig[material.consistency].bg} ${consistencyConfig[material.consistency].color} hover:opacity-80 transition-opacity`}
                      >
                        {consistencyConfig[material.consistency].label}
                      </span>
                    </Popover>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${consistencyConfig[material.consistency].bg} ${consistencyConfig[material.consistency].color}`}
                    >
                      {consistencyConfig[material.consistency].label}
                    </span>
                  )}
                </>
              )}
              {material.departments.slice(0, 2).map((dept, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/70 ml-1"
                >
                  {dept}
                </span>
              ))}
              {material.departments.length > 2 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 text-white/70 ml-1">
                  +{material.departments.length - 2}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const generateApplyNo = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString().substring(2, 10).toUpperCase();
  return `LB${datePart}${randomPart}`;
};

const ApplyPanel = ({ scene, onClose }: { scene: CollaborationScene; onClose: () => void }) => {
  const [applyNo] = useState(generateApplyNo);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mt-4 p-4 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-300" />
          <span className="text-sm font-medium text-white">联办申请已生成</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white/80 transition-colors text-xs"
        >
          收起
        </button>
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-xs text-white/70">
          <span className="mr-2">申请编号：</span>
          <span className="text-white font-mono">{applyNo}</span>
        </div>
        <div className="text-xs text-white/70">联办事项：</div>
        <div className="space-y-1 pl-2">
          {scene.steps.map((step, idx) => (
            <div key={idx} className="flex items-center text-xs text-white/80">
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center mr-2 flex-shrink-0">
                {idx + 1}
              </span>
              <span>{step.name}</span>
              <span className="text-white/50 ml-2">({step.department})</span>
            </div>
          ))}
        </div>
      </div>
      {submitted ? (
        <div className="flex items-center justify-center gap-2 py-2 text-green-300 text-sm">
          <CheckCircle2 className="w-4 h-4" />
          联办申请已提交成功
        </div>
      ) : (
        <Button
          type="primary"
          block
          className="bg-green-500 border-0 hover:bg-green-600 font-medium"
          onClick={() => setSubmitted(true)}
        >
          确认提交联办申请
        </Button>
      )}
    </div>
  );
};

const SceneCard = ({ scene, delay }: { scene: CollaborationScene; delay: number }) => {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showApplyPanel, setShowApplyPanel] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const Icon = scene.icon;
  const progress = Math.round((scene.elapsedDays / scene.totalDays) * 100);

  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-xl transition-all duration-500 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${isHovered ? 'shadow-2xl scale-[1.02]' : ''}`}
      bodyStyle={{ padding: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`bg-gradient-to-br ${scene.gradient} p-6 text-white relative`}>
        <div
          className={`absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-32 translate-x-32 transition-transform duration-700 ${isHovered ? 'scale-150' : 'scale-100'}`}
        />
        <div
          className={`absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-24 -translate-x-24 transition-transform duration-700 ${isHovered ? 'scale-150' : 'scale-100'}`}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className={`${scene.iconBg} p-3 rounded-xl mr-4 backdrop-blur-sm`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">{scene.title}</h3>
                <p className="text-sm text-white/70">{scene.subtitle}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{progress}%</p>
              <p className="text-xs text-white/60">整体进度</p>
            </div>
          </div>

          <p className="text-sm text-white/80 mb-6 leading-relaxed">{scene.description}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{scene.currentStep}</p>
              <p className="text-xs text-white/70">当前步骤</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{scene.elapsedDays}</p>
              <p className="text-xs text-white/70">已用天数</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{scene.totalDays}</p>
              <p className="text-xs text-white/70">承诺时限</p>
            </div>
          </div>

          <div className="mb-6">
            <StepProgress steps={scene.steps} currentStep={scene.currentStep} />
          </div>

          <div className="mb-6">
            <DepartmentSignStatus steps={scene.steps} />
          </div>

          <div className="mb-6">
            <MaterialSharing materials={scene.materials} />
          </div>

          <div
            className={`flex items-center justify-between transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '800ms' }}
          >
            <div className="flex items-center -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-white/30 border-2 border-white/60 flex items-center justify-center"
                >
                  <Users className="w-4 h-4 text-white" />
                </div>
              ))}
              <span className="ml-4 text-sm text-white/70">{scene.steps.length}个部门联办</span>
            </div>
            <Button
              type="primary"
              className="bg-white text-gray-800 border-0 hover:bg-white/90 hover:text-gray-900 font-medium shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:translate-x-1"
              icon={<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              onClick={(e) => {
                e.stopPropagation();
                setShowApplyPanel(!showApplyPanel);
              }}
            >
              联合办理
            </Button>
          </div>

          {showApplyPanel && (
            <ApplyPanel scene={scene} onClose={() => setShowApplyPanel(false)} />
          )}
        </div>
      </div>
    </Card>
  );
};

export default function Collaboration() {
  return (
    <div className="min-h-screen bg-gov-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gov-gray-700 mb-2">跨域协同中心</h1>
          <p className="text-gov-gray-500">多部门联合办理，实现"一件事一次办"</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {scenes.map((scene, index) => (
            <SceneCard key={scene.id} scene={scene} delay={index * 200} />
          ))}
        </div>

        <div className="mt-8 gov-card p-6">
          <h3 className="text-lg font-semibold text-gov-gray-700 mb-4">协同办理优势</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Share2, title: '材料共享', desc: '一次提交，多部门复用' },
              { icon: Clock, title: '压缩时限', desc: '并联审批，减少等待' },
              { icon: Users, title: '协同联动', desc: '部门间数据自动流转' },
              { icon: CheckCircle, title: '全程跟踪', desc: '办理进度实时可查' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start">
                  <div className="bg-primary-50 p-2.5 rounded-lg mr-3 flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gov-gray-700 mb-1">{item.title}</h4>
                    <p className="text-sm text-gov-gray-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
