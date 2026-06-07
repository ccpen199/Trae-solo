import { useState } from 'react';
import { BookOpen, Search, ChevronRight, CheckCircle2, FileText, HelpCircle, ArrowRight, RotateCcw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string }[];
}

interface GuideResult {
  serviceName: string;
  description: string;
  handlingTime: string;
  requiredMaterials: string[];
  steps: string[];
}

const questions: Question[] = [
  {
    id: '1',
    question: '请问您的企业属于以下哪个行业？',
    options: [
      { value: 'tech', label: '信息技术/互联网' },
      { value: 'manufacturing', label: '制造业/工业' },
      { value: 'service', label: '服务业' },
      { value: 'finance', label: '金融/投资' },
      { value: 'other', label: '其他行业' },
    ],
  },
  {
    id: '2',
    question: '您的企业规模是？',
    options: [
      { value: 'large', label: '大型企业' },
      { value: 'medium', label: '中型企业' },
      { value: 'small', label: '小型企业' },
      { value: 'micro', label: '微型企业' },
    ],
  },
  {
    id: '3',
    question: '您希望办理哪类业务？',
    options: [
      { value: 'qualification', label: '资质认定/认证' },
      { value: 'subsidy', label: '补贴/资金申请' },
      { value: 'tax', label: '税收优惠/减免' },
      { value: 'registration', label: '备案/登记注册' },
      { value: 'finance', label: '融资/金融服务' },
    ],
  },
  {
    id: '4',
    question: '您的企业是否为高新技术企业？',
    options: [
      { value: 'yes', label: '是，已获得认定' },
      { value: 'no', label: '否，尚未申请' },
      { value: 'applying', label: '正在申请中' },
    ],
  },
];

const resultMappings: Record<string, GuideResult> = {
  'tech-large-qualification-yes': {
    serviceName: '高新技术企业重新认定',
    description: '对已获得高新技术企业资格的企业进行重新认定，继续享受税收优惠政策。',
    handlingTime: '15个工作日',
    requiredMaterials: [
      '高新技术企业认定申请书',
      '企业营业执照副本',
      '近三年财务审计报告',
      '知识产权证明材料',
      '科技成果转化证明材料',
    ],
    steps: [
      '在线填写申请信息',
      '上传相关证明材料',
      '提交申请等待受理',
      '专家评审',
      '公示及颁发证书',
    ],
  },
  'tech-small-subsidy-no': {
    serviceName: '科技型中小企业技术创新基金',
    description: '支持科技型中小企业技术创新活动的专项基金，助力企业快速成长。',
    handlingTime: '20个工作日',
    requiredMaterials: [
      '项目申报书',
      '企业营业执照副本',
      '可行性研究报告',
      '相关知识产权证明',
      '企业财务报表',
    ],
    steps: [
      '注册并实名认证',
      '在线填报项目信息',
      '上传申报材料',
      '主管部门初审',
      '专家评审与立项',
      '签订合同与拨款',
    ],
  },
  'manufacturing-medium-qualification-no': {
    serviceName: '专精特新中小企业认定',
    description: '认定具有专业化、精细化、特色化、新颖化特征的中小企业，给予政策扶持。',
    handlingTime: '20个工作日',
    requiredMaterials: [
      '专精特新中小企业认定申请书',
      '企业营业执照副本',
      '近三年财务审计报告',
      '核心技术证明材料',
      '市场占有率证明材料',
    ],
    steps: [
      '企业自评与申报',
      '地市审核推荐',
      '省级专家评审',
      '公示与认定',
      '颁发证书',
    ],
  },
  'manufacturing-large-subsidy-yes': {
    serviceName: '企业技术改造专项资金',
    description: '支持企业进行技术改造和设备更新，提升产业竞争力。',
    handlingTime: '10个工作日',
    requiredMaterials: [
      '技术改造项目备案表',
      '资金申请报告',
      '设备购置合同及发票',
      '企业营业执照副本',
      '项目实施进度说明',
    ],
    steps: [
      '项目备案',
      '在线提交资金申请',
      '材料审核',
      '现场核查',
      '资金拨付',
    ],
  },
  'default': {
    serviceName: '企业综合服务包',
    description: '根据您的企业情况，我们为您推荐以下综合服务方案，包含多项惠企政策。',
    handlingTime: '根据具体事项确定',
    requiredMaterials: [
      '企业基本信息材料',
      '法定代表人身份证明',
      '企业信用报告',
      '其他专项证明材料（根据具体服务事项）',
    ],
    steps: [
      '在线预约服务',
      '专人对接咨询',
      '定制服务方案',
      '协助办理相关手续',
      '跟踪办理进度',
    ],
  },
};

export default function ServiceGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[currentStep].id]: value };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    } else {
      setTimeout(() => setShowResult(true), 300);
    }
  };

  const getResult = (): GuideResult => {
    const key = `${answers['1']}-${answers['2']}-${answers['3']}-${answers['4']}`;
    return resultMappings[key] || resultMappings['default'];
  };

  const resetGuide = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const result = showResult ? getResult() : null;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">智能导办</h1>
        <p className="page-description">通过智能问答，快速找到适合您企业的政务服务</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {!showResult ? (
          <div className="card p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-[#1a56db]" />
                  <span className="font-medium text-gray-900">智能导办问答</span>
                </div>
                <span className="text-sm text-gray-500">第 {currentStep + 1} 题 / 共 {questions.length} 题</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#1a56db] to-[#3b82f6] transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {questions[currentStep].question}
              </h2>
              <p className="text-gray-500 text-sm">请选择最符合您企业情况的选项</p>
            </div>

            <div className="space-y-3">
              {questions[currentStep].options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  className={cn(
                    'w-full p-4 text-left rounded-xl border-2 transition-all duration-200',
                    'hover:border-[#1a56db] hover:bg-blue-50',
                    'flex items-center justify-between group',
                    answers[questions[currentStep].id] === option.value
                      ? 'border-[#1a56db] bg-blue-50'
                      : 'border-gray-200 bg-white'
                  )}
                >
                  <span className="text-gray-700 group-hover:text-[#1a56db] transition-colors">
                    {option.label}
                  </span>
                  {answers[questions[currentStep].id] === option.value ? (
                    <CheckCircle2 className="w-5 h-5 text-[#1a56db]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1a56db] transition-colors" />
                  )}
                </button>
              ))}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="mt-6 text-[#1a56db] hover:underline text-sm flex items-center gap-1"
              >
                ← 返回上一题
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">导办完成！</h2>
              <p className="text-gray-500 mb-6">根据您的企业情况，为您推荐以下服务</p>

              <div className="text-left bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-[#1a56db] mb-2">{result?.serviceName}</h3>
                <p className="text-gray-600 mb-4">{result?.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>办理时限: {result?.handlingTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Link to="/services" className="btn-primary flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  立即办理
                </Link>
                <button onClick={resetGuide} className="btn-secondary flex items-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  重新导办
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1a56db]" />
                  所需材料
                </h3>
                <ul className="space-y-3">
                  {result?.requiredMaterials.map((material, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-[#1a56db] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{material}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#1a56db]" />
                  办理流程
                </h3>
                <div className="relative">
                  {result?.steps.map((step, index) => (
                    <div key={index} className="flex gap-3 mb-4 last:mb-0">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 bg-[#1a56db] text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        {index < (result?.steps.length || 0) - 1 && (
                          <div className="w-0.5 h-8 bg-[#1a56db]/20" />
                        )}
                      </div>
                      <div className="flex-1 pt-1.5">
                        <p className="text-gray-700">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">您可能还感兴趣的服务</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['研发费用加计扣除', '知识产权质押融资', '企业信用修复'].map((service, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-xl hover:border-[#1a56db] hover:bg-blue-50 transition-all cursor-pointer">
                    <p className="font-medium text-gray-900 mb-1">{service}</p>
                    <p className="text-[#1a56db] text-sm flex items-center gap-1">
                      查看详情 <ArrowRight className="w-4 h-4" />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
