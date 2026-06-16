import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Card, Progress, Tag, Button, Tooltip } from 'antd';

interface Step {
  name: string;
  icon: React.ElementType;
  department: string;
  status: 'completed' | 'current' | 'pending';
}

interface MaterialItem {
  name: string;
  shared: boolean;
  departments: string[];
}

interface CollaborationScene {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  gradient: string;
  icon: React.ElementType;
  iconBg: string;
  route: string;
  steps: Step[];
  materials: MaterialItem[];
  currentStep: number;
  totalDays: number;
  elapsedDays: number;
}

const enterpriseSteps: Step[] = [
  { name: '名称核准', icon: FileCheck, department: '市场监管局', status: 'completed' },
  { name: '工商注册', icon: Building2, department: '市场监管局', status: 'completed' },
  { name: '公章刻制', icon: ShieldCheck, department: '公安局', status: 'current' },
  { name: '税务登记', icon: CreditCard, department: '税务局', status: 'pending' },
  { name: '社保开户', icon: Users, department: '人社局', status: 'pending' },
  { name: '银行开户', icon: CreditCard, department: '商业银行', status: 'pending' },
];

const newbornSteps: Step[] = [
  { name: '出生证明', icon: FileCheck, department: '卫健委', status: 'completed' },
  { name: '户口登记', icon: UserPlus, department: '公安局', status: 'current' },
  { name: '医保参保', icon: Heart, department: '医保局', status: 'pending' },
  { name: '预防接种', icon: Syringe, department: '卫健委', status: 'pending' },
];

const enterpriseMaterials: MaterialItem[] = [
  { name: '身份证明', shared: true, departments: ['市场监管局', '公安局', '税务局'] },
  { name: '企业章程', shared: true, departments: ['市场监管局', '税务局'] },
  { name: '验资报告', shared: false, departments: ['市场监管局'] },
  { name: '住所证明', shared: true, departments: ['市场监管局', '税务局', '人社局'] },
];

const newbornMaterials: MaterialItem[] = [
  { name: '出生医学证明', shared: true, departments: ['公安局', '医保局', '卫健委'] },
  { name: '父母身份证', shared: true, departments: ['公安局', '医保局'] },
  { name: '结婚证', shared: true, departments: ['公安局', '医保局'] },
  { name: '户口本', shared: false, departments: ['公安局'] },
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
    route: '/collaboration/enterprise',
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
    route: '/collaboration/newborn',
    steps: newbornSteps,
    materials: newbornMaterials,
    currentStep: 2,
    totalDays: 2,
    elapsedDays: 0.5,
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

const MaterialSharing = ({ materials }: { materials: MaterialItem[] }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const sharedCount = materials.filter((m) => m.shared).length;

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
            <div className="flex items-center">
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

const SceneCard = ({ scene, delay }: { scene: CollaborationScene; delay: number }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const Icon = scene.icon;
  const progress = Math.round((scene.elapsedDays / scene.totalDays) * 100);

  const handleClick = () => {
    navigate(scene.route);
  };

  return (
    <Card
      className={`relative overflow-hidden border-0 shadow-xl transition-all duration-500 cursor-pointer group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${isHovered ? 'shadow-2xl scale-[1.02]' : ''}`}
      bodyStyle={{ padding: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
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
                handleClick();
              }}
            >
              联合办理
            </Button>
          </div>
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
