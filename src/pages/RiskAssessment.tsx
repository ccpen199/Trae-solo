import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Steps,
  Progress,
  Card,
  Radio,
  Button,
  Result,
  message,
  Empty,
  Tag,
  Space,
  Divider,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Send,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockOrders, mockRiskQuestions } from '@/mock';
import PageHeader from '@/components/PageHeader';
import PatientTypeTag from '@/components/PatientTypeTag';
import StatusBadge from '@/components/StatusBadge';
import type { RiskLevel, PatientType, RiskQuestion, RiskAssessment } from '@/types';
import dayjs from 'dayjs';

function scoreToRiskLevel(totalScore: number, maxScore: number): RiskLevel {
  const ratio = totalScore / Math.max(maxScore, 1);
  if (ratio < 0.25) return 'low';
  if (ratio < 0.5) return 'medium';
  if (ratio < 0.75) return 'high';
  return 'critical';
}

const suggestionByRisk: Record<RiskLevel, { title: string; items: string[] }> = {
  low: {
    title: '患者状态稳定，可按常规流程安排上门护理服务',
    items: [
      '安排具备基础护理资质的护士即可',
      '服务前电话确认患者身体状况无异常',
      '建议每3个月复评一次风险等级',
    ],
  },
  medium: {
    title: '存在一定风险因素，需加强护理过程中的观察与防护',
    items: [
      '优先选择有相应护理经验的护士',
      '服务前做好跌倒、压疮等风险防护准备',
      '家属需在服务期间在场陪同',
      '服务过程全程开启录像留存',
    ],
  },
  high: {
    title: '风险等级较高，需安排资深护士并做好应急预案',
    items: [
      '必须指派3年以上工作经验的资深护士',
      '出发前与主治医生或家属充分沟通病情',
      '携带应急药品与急救设备',
      '服务全程开启双录像+GPS实时追踪',
      '护士长远程监控服务过程',
    ],
  },
  critical: {
    title: '极高风险！建议升级服务方案或转介医疗机构',
    items: [
      '必须由主管护师级别以上护士带队服务',
      '强烈建议家属或护工全程陪同',
      '服务前签署高风险服务知情同意书',
      '联系就近急救中心做好应急准备',
      '完成服务后2小时内必须电话随访',
      '72小时内安排护士复访评估',
    ],
  },
};

function cn(...inputs: (string | undefined | false)[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function RiskAssessment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    orders,
    setOrders,
    riskQuestions,
    setRiskQuestions,
    getOrderById,
    getRiskAssessmentByOrderId,
    addRiskAssessment,
    updateOrder,
    getRiskQuestionsByPatientType,
  } = useGlobalStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<RiskAssessment | null>(null);

  useEffect(() => {
    if (orders.length === 0) {
      setOrders(mockOrders);
    }
    if (riskQuestions.length === 0) {
      setRiskQuestions(mockRiskQuestions);
    }
  }, [orders.length, riskQuestions.length, setOrders, setRiskQuestions]);

  const order = useMemo(() => {
    if (!id) return undefined;
    return getOrderById(id) || mockOrders.find((o) => o.id === id);
  }, [id, getOrderById]);

  const questions = useMemo<RiskQuestion[]>(() => {
    if (!order) return [];
    const direct = getRiskQuestionsByPatientType(order.patientType);
    if (direct && direct.length > 0) return direct;
    return mockRiskQuestions.filter(
      (q) => q.category === 'general' || q.category === order.patientType
    );
  }, [order, getRiskQuestionsByPatientType]);

  const totalScore = useMemo(() => {
    return questions.reduce((sum, q) => {
      const idx = answers[q.id];
      if (idx === undefined || idx === null) return sum;
      return sum + (q.options[idx]?.score || 0);
    }, 0);
  }, [questions, answers]);

  const maxPossibleScore = useMemo(() => {
    return questions.reduce(
      (sum, q) => sum + Math.max(...q.options.map((o) => o.score)),
      0
    );
  }, [questions]);

  const currentRiskLevel = useMemo<RiskLevel>(() => {
    return scoreToRiskLevel(totalScore, maxPossibleScore);
  }, [totalScore, maxPossibleScore]);

  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const handleOptionChange = (e: RadioChangeEvent) => {
    if (!questions[currentIdx]) return;
    setAnswers((prev) => ({
      ...prev,
      [questions[currentIdx].id]: e.target.value,
    }));
  };

  const handlePrev = () => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
  };

  const handleSubmit = () => {
    if (!order || !id) return;
    const unanswered = questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      message.warning(`还有 ${unanswered.length} 题未作答，请完成全部题目`);
      const firstUnansweredIdx = questions.findIndex((q) => answers[q.id] === undefined);
      if (firstUnansweredIdx >= 0) setCurrentIdx(firstUnansweredIdx);
      return;
    }

    const answerArr = questions.map((q) => ({
      questionId: q.id,
      optionIndex: answers[q.id],
    }));

    const assessment: RiskAssessment = {
      id: `ra-${Date.now()}`,
      orderId: id,
      patientType: order.patientType as PatientType,
      answers: answerArr,
      totalScore,
      riskLevel: currentRiskLevel,
      suggestions: suggestionByRisk[currentRiskLevel].items.join('；'),
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };

    addRiskAssessment(assessment);
    updateOrder(id, {
      riskLevel: currentRiskLevel,
      riskAssessmentId: assessment.id,
      status: order.status === 'created' ? 'risk-assessed' : order.status,
    });
    setSubmittedResult(assessment);
    setSubmitted(true);
    message.success('风险评估提交成功！');
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
    setSubmittedResult(null);
  };

  const handleBackToOrder = () => {
    if (!id) return;
    navigate(`/orders/${id}`);
  };

  if (!order) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Empty description="订单不存在" />
      </div>
    );
  }

  if (submitted && submittedResult) {
    const finalLevel = submittedResult.riskLevel;
    const suggestion = suggestionByRisk[finalLevel];
    const statusIcon =
      finalLevel === 'low' ? (
        <CheckCircle2 className="h-20 w-20 text-emerald-500" />
      ) : finalLevel === 'medium' ? (
        <CheckCircle2 className="h-20 w-20 text-amber-500" />
      ) : (
        <AlertTriangle className={cn('h-20 w-20', finalLevel === 'high' ? 'text-orange-500' : 'text-red-500')} />
      );

    const resultStatus: 'success' | 'warning' | 'error' =
      finalLevel === 'low' ? 'success' : finalLevel === 'medium' ? 'warning' : 'error';

    return (
      <div>
        <PageHeader
          showBack={true}
          title="服务风险评估"
          description="根据患者类型完成标准化风险评估问卷"
          onBack={handleBackToOrder}
        />
        <Card className="shadow-sm max-w-3xl mx-auto">
          <Result
            icon={statusIcon}
            status={resultStatus}
            title={
              <div className="flex flex-col items-center gap-3">
                <StatusBadge type="risk" status={finalLevel} />
                <div className="mt-1">
                  <span className="text-4xl font-bold text-slate-900">{submittedResult.totalScore}</span>
                  <span className="text-slate-400 ml-1">/ {maxPossibleScore} 分</span>
                </div>
                <Progress
                  percent={Math.round((submittedResult.totalScore / Math.max(maxPossibleScore, 1)) * 100)}
                  showInfo={false}
                  className="w-full max-w-sm mx-auto mt-2"
                  strokeColor={
                    finalLevel === 'low' ? '#10B981' :
                    finalLevel === 'medium' ? '#F59E0B' :
                    finalLevel === 'high' ? '#F97316' : '#EF4444'
                  }
                />
              </div>
            }
            subTitle={
              <div className="text-base text-slate-600 mt-4 font-medium">
                {suggestion.title}
              </div>
            }
          />

          <div className="max-w-2xl mx-auto mt-2 mb-4">
            <Card
              size="small"
              title={
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-medical-600" />
                  <span>评估建议</span>
                </div>
              }
              className="border-slate-200"
            >
              <Space direction="vertical" className="w-full" size="middle">
                {suggestion.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </Space>
            </Card>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-center justify-between">
              <div>订单号：<span className="font-mono text-slate-700">{order.orderNo}</span></div>
              <div>评估时间：<span className="text-slate-700">{submittedResult.createdAt}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-4">
            <Button
              size="large"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={handleBackToOrder}
            >
              返回订单
            </Button>
            <Button
              size="large"
              type="primary"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={handleReset}
            >
              重新评估
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;
  const currentOptionScore = currentQ && currentAnswer !== undefined ? currentQ.options[currentAnswer]?.score : 0;

  return (
    <div>
      <PageHeader
        showBack={true}
        title="服务风险评估"
        description="根据患者类型完成标准化风险评估问卷"
        onBack={handleBackToOrder}
      />

      <div className="max-w-4xl mx-auto">
        <Card className="shadow-sm mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <PatientTypeTag type={order.patientType as PatientType} size="md" />
              <StatusBadge type="risk" status={currentRiskLevel} />
              <Tag icon={<ClipboardList className="h-3 w-3" />} color="default">
                {order.patientInfo.name} · {order.patientInfo.gender === 'male' ? '男' : '女'} · {order.patientInfo.age}岁
              </Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">
                第 <span className="text-lg text-medical-600 font-bold">{answeredCount}</span> / {questions.length} 题
              </span>
            </div>
          </div>
          <div className="mt-5">
            <Progress
              percent={Math.round(progressPercent)}
              strokeColor={{
                '0%': '#10B981',
                '50%': '#F59E0B',
                '100%': currentRiskLevel === 'critical' ? '#EF4444' : '#F97316',
              }}
              trailColor="#F1F5F9"
              className="!mb-0"
            />
          </div>
          <div className="mt-3">
            <Steps
              size="small"
              current={currentIdx}
              onChange={(val) => setCurrentIdx(val)}
              items={questions.map((q, i) => ({
                title: '',
                description: '',
                status:
                  answers[q.id] !== undefined
                    ? 'finish'
                    : i === currentIdx
                    ? 'process'
                    : 'wait',
              }))}
              className="[&_.ant-steps-item]:!flex-1"
            />
          </div>
        </Card>

        {currentQ && (
          <Card className="shadow-sm border-slate-200">
            <div className="mb-6">
              <div className="flex items-start gap-3">
                <span className={cn(
                  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                  currentQ.category === 'general'
                    ? 'bg-slate-500'
                    : currentQ.category === 'elderly'
                    ? 'bg-amber-500'
                    : currentQ.category === 'maternal'
                    ? 'bg-pink-500'
                    : currentQ.category === 'post-hospital'
                    ? 'bg-blue-500'
                    : 'bg-violet-500'
                )}>
                  {currentIdx + 1}
                </span>
                <div className="flex-1 pt-1">
                  <div className="mb-1">
                    <Tag
                      color={
                        currentQ.category === 'general' ? 'default' :
                        currentQ.category === 'elderly' ? 'warning' :
                        currentQ.category === 'maternal' ? 'magenta' :
                        currentQ.category === 'post-hospital' ? 'blue' : 'purple'
                      }
                      className="!m-0 !text-xs"
                    >
                      {currentQ.category === 'general' ? '通用评估' :
                       currentQ.category === 'elderly' ? '老年专项' :
                       currentQ.category === 'maternal' ? '母婴专项' :
                       currentQ.category === 'post-hospital' ? '院后康复' : '安宁疗护'}
                    </Tag>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 leading-relaxed">
                    {currentQ.question}
                  </h3>
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            <Radio.Group
              value={currentAnswer}
              onChange={handleOptionChange}
              className="w-full"
              style={{ width: '100%' }}
            >
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => (
                  <label
                    key={optIdx}
                    className={cn(
                      'block cursor-pointer rounded-xl border-2 transition-all p-4 group',
                      currentAnswer === optIdx
                        ? 'border-medical-500 bg-medical-50/60 shadow-sm ring-2 ring-medical-100'
                        : 'border-slate-200 hover:border-medical-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                          currentAnswer === optIdx
                            ? 'border-medical-600 bg-medical-600'
                            : 'border-slate-300 group-hover:border-medical-400'
                        )}
                      >
                        {currentAnswer === optIdx && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-3 min-w-0">
                        <div className={cn(
                          'text-base leading-relaxed',
                          currentAnswer === optIdx ? 'text-slate-900 font-medium' : 'text-slate-700'
                        )}>
                          {opt.label}
                        </div>
                        <div className="shrink-0">
                          <Tag
                            color={
                              opt.score === 0 ? 'success' :
                              opt.score <= 2 ? 'warning' :
                              opt.score <= 4 ? 'orange' : 'error'
                            }
                            className="!m-0"
                          >
                            +{opt.score} 分
                          </Tag>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name={currentQ.id}
                        value={optIdx}
                        checked={currentAnswer === optIdx}
                        onChange={handleOptionChange}
                        className="sr-only"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </Radio.Group>

            {currentAnswer !== undefined && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-medical-50 to-slate-50 border border-medical-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">当前选项累计得分</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-medical-600">{currentOptionScore}</span>
                    <span className="text-sm text-slate-400">分</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">当前总分</span>
                  <span className="font-medium text-slate-700">
                    {totalScore} / {maxPossibleScore} 分
                  </span>
                </div>
              </div>
            )}

            <Divider className="my-6" />

            <div className="flex items-center justify-between">
              <Button
                size="large"
                icon={<ChevronLeft className="h-4 w-4" />}
                onClick={handlePrev}
                disabled={currentIdx === 0}
              >
                上一题
              </Button>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>点击步骤条可快速跳转</span>
              </div>

              {currentIdx === questions.length - 1 ? (
                <Button
                  size="large"
                  type="primary"
                  icon={<Send className="h-4 w-4" />}
                  onClick={handleSubmit}
                  disabled={answeredCount < questions.length}
                >
                  提交评估
                </Button>
              ) : (
                <Button
                  size="large"
                  type="primary"
                  icon={<ChevronRight className="h-4 w-4" />}
                  onClick={handleNext}
                  disabled={currentAnswer === undefined}
                >
                  下一题
                </Button>
              )}
            </div>
          </Card>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">实时风险等级：</span>
              <StatusBadge type="risk" status={currentRiskLevel} />
              <span className="text-slate-400">·</span>
              <span className="text-slate-500">累计得分</span>
              <span className="font-bold text-slate-900">{totalScore}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-emerald-600">
                <CheckCircle2 className="h-4 w-4 inline mr-1" />
                已答 {answeredCount} 题
              </span>
              {answeredCount < questions.length && (
                <span className="text-amber-600">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  剩余 {questions.length - answeredCount} 题
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
