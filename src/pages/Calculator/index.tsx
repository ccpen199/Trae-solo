import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Activity,
  Percent,
  AlertTriangle,
  Briefcase,
  Clock,
  Calculator,
  FileText,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { Card, Form, Input, InputNumber, Select, Button, Spin, Empty, Tag, Divider } from 'antd';
import ReactECharts from 'echarts-for-react';
import { CALCULATOR_META } from '@/constants';
import { CalculatorType, CalculatorResult, CalculatorField } from '@/types';
import { toolsApi } from '@/services/tools';
import { formatMoney } from '@/utils/format';

const iconMap: Record<string, React.ReactNode> = {
  Scale: <Scale className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  Percent: <Percent className="w-5 h-5" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Clock: <Clock className="w-5 h-5" />,
  Calculator: <Calculator className="w-5 h-5" />,
};

const calculatorFields: Record<CalculatorType, CalculatorField[]> = {
  court_fee: [
    { name: 'amount', label: '涉案金额', type: 'number', required: true, unit: '元', placeholder: '请输入涉案金额' },
    {
      name: 'caseType',
      label: '案件类型',
      type: 'select',
      required: true,
      options: [
        { label: '财产案件', value: 'property' },
        { label: '离婚案件', value: 'divorce' },
        { label: '劳动争议', value: 'labor' },
        { label: '知识产权', value: 'intellectual' },
        { label: '其他非财产案件', value: 'other' },
      ],
    },
  ],
  injury: [
    { name: 'level', label: '伤残等级', type: 'select', required: true, options: [
      { label: '一级伤残', value: 1 }, { label: '二级伤残', value: 2 }, { label: '三级伤残', value: 3 },
      { label: '四级伤残', value: 4 }, { label: '五级伤残', value: 5 }, { label: '六级伤残', value: 6 },
      { label: '七级伤残', value: 7 }, { label: '八级伤残', value: 8 }, { label: '九级伤残', value: 9 },
      { label: '十级伤残', value: 10 },
    ]},
    { name: 'salary', label: '本人月工资', type: 'number', required: true, unit: '元', placeholder: '请输入月工资' },
    { name: 'medicalExpenses', label: '医疗费用', type: 'number', required: true, unit: '元', placeholder: '请输入医疗费用' },
    { name: 'hospitalDays', label: '住院天数', type: 'number', required: true, unit: '天', placeholder: '请输入住院天数' },
    { name: 'region', label: '所在地区', type: 'select', required: true, options: [
      { label: '北京市', value: 'beijing' }, { label: '上海市', value: 'shanghai' },
      { label: '广东省', value: 'guangdong' }, { label: '江苏省', value: 'jiangsu' },
      { label: '浙江省', value: 'zhejiang' }, { label: '其他地区', value: 'other' },
    ]},
  ],
  interest: [
    { name: 'principal', label: '本金', type: 'number', required: true, unit: '元', placeholder: '请输入本金' },
    { name: 'annualRate', label: '年利率', type: 'number', required: true, unit: '%', placeholder: '请输入年利率' },
    { name: 'days', label: '计息天数', type: 'number', required: true, unit: '天', placeholder: '请输入天数' },
    { name: 'type', label: '计息方式', type: 'select', required: true, options: [
      { label: '单利', value: 'simple' }, { label: '复利', value: 'compound' },
    ]},
  ],
  penalty: [
    { name: 'contractAmount', label: '合同金额', type: 'number', required: true, unit: '元', placeholder: '请输入合同金额' },
    { name: 'penaltyRate', label: '约定年利率', type: 'number', required: true, unit: '%', placeholder: '请输入违约金年利率' },
    { name: 'delayDays', label: '逾期天数', type: 'number', required: true, unit: '天', placeholder: '请输入逾期天数' },
    { name: 'actualLoss', label: '实际损失（可选）', type: 'number', required: false, unit: '元', placeholder: '请输入实际损失金额' },
  ],
  lawyer_fee: [
    { name: 'amount', label: '案件标的额', type: 'number', required: true, unit: '元', placeholder: '请输入标的金额' },
    { name: 'region', label: '所在地区', type: 'select', required: true, options: [
      { label: '北京市', value: 'beijing' }, { label: '上海市', value: 'shanghai' },
      { label: '广东省', value: 'guangdong' }, { label: '江苏省', value: 'jiangsu' },
      { label: '浙江省', value: 'zhejiang' }, { label: '其他地区', value: 'other' },
    ]},
    { name: 'caseType', label: '案件类型', type: 'select', required: true, options: [
      { label: '民事诉讼', value: 'civil' }, { label: '刑事辩护', value: 'criminal' },
      { label: '行政诉讼', value: 'administrative' }, { label: '非诉业务', value: 'non_litigation' },
    ]},
  ],
  delay: [
    { name: 'judgmentAmount', label: '判决确定金额', type: 'number', required: true, unit: '元', placeholder: '请输入判决金额' },
    { name: 'delayDays', label: '迟延履行天数', type: 'number', required: true, unit: '天', placeholder: '请输入迟延天数' },
    { name: 'generalInterestRate', label: '一般债务利息年利率（可选）', type: 'number', required: false, unit: '%', placeholder: '请输入一般债务利息利率' },
  ],
  tax: [
    { name: 'income', label: '金额', type: 'number', required: true, unit: '元', placeholder: '请输入收入或含税金额' },
    { name: 'type', label: '税种', type: 'select', required: true, options: [
      { label: '个人所得税', value: 'individual' }, { label: '增值税', value: 'vat' },
    ]},
  ],
};

const CalculatorPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<CalculatorType>('court_fee');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculatorResult | null>(null);

  const calculatorList = useMemo(() => Object.values(CALCULATOR_META), []);
  const currentMeta = CALCULATOR_META[selectedType];
  const fields = calculatorFields[selectedType];

  const handleCalculate = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      let res: CalculatorResult;
      switch (selectedType) {
        case 'court_fee':
          res = await toolsApi.calculateCourtFee(values.amount || 0, values.caseType);
          break;
        case 'injury':
          res = await toolsApi.calculateInjury(values.level, values.salary || 0, values.medicalExpenses || 0, values.hospitalDays || 0, values.region);
          break;
        case 'interest':
          res = await toolsApi.calculateInterest(values.principal || 0, values.annualRate || 0, values.days || 0, values.type);
          break;
        case 'penalty':
          res = await toolsApi.calculatePenalty(values.contractAmount || 0, values.penaltyRate || 0, values.delayDays || 0, values.actualLoss || 0);
          break;
        case 'lawyer_fee':
          res = await toolsApi.calculateLawyerFee(values.amount || 0, values.region, values.caseType);
          break;
        case 'delay':
          res = await toolsApi.calculateDelayInterest(values.judgmentAmount || 0, values.delayDays || 0, values.generalInterestRate || 0);
          break;
        case 'tax':
          res = await toolsApi.calculateTax(values.income || 0, values.type);
          break;
        default:
          return;
      }
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setResult(null);
    form.resetFields();
  }, [selectedType, form]);

  const chartOption = useMemo(() => {
    if (!result || !result.result.breakdown.length) return null;
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}<br/>金额: ¥${formatMoney(params.value)}`,
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: result.result.breakdown.map(b => b.label.length > 8 ? b.label.slice(0, 8) + '...' : b.label),
        axisLabel: { color: '#6B7280', fontSize: 11, interval: 0, rotate: result.result.breakdown.length > 4 ? 30 : 0 },
        axisLine: { lineStyle: { color: '#DEE2E6' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#6B7280', formatter: (v: number) => '¥' + (v >= 10000 ? (v / 10000).toFixed(1) + '万' : v) },
        splitLine: { lineStyle: { color: '#F8F9FA' } },
      },
      series: [
        {
          type: 'bar',
          data: result.result.breakdown.map(b => b.amount),
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#194BA0' },
                { offset: 1, color: '#0A1628' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: '50%',
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => '¥' + formatMoney(params.value),
            fontSize: 11,
            color: '#495057',
          },
        },
      ],
    };
  }, [result]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary-900">法律计算器</h1>
        <p className="text-neutral-ink-500 mt-1">依据现行法律法规，快速计算诉讼费用、赔偿金额、利息等</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <Card className="lc-card border-0 p-2">
            <div className="space-y-1">
              {calculatorList.map((meta) => (
                <div
                  key={meta.type}
                  onClick={() => setSelectedType(meta.type)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedType === meta.type
                      ? 'bg-primary-900 text-white'
                      : 'hover:bg-primary-900/5 text-neutral-ink-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedType === meta.type ? 'bg-white/10' : 'bg-primary-50 text-primary-500'
                  }`}>
                    {iconMap[meta.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${selectedType === meta.type ? 'text-white' : 'text-neutral-ink-900'}`}>
                      {meta.name}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${selectedType === meta.type ? 'text-white' : 'text-neutral-ink-300'}`} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card
            className="lc-card border-0"
            title={
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-500 flex items-center justify-center">
                  {iconMap[currentMeta.icon]}
                </div>
                <div>
                  <span className="font-serif text-base font-semibold">{currentMeta.name}</span>
                  <p className="text-xs text-neutral-ink-500 mt-0.5 font-normal">{currentMeta.description}</p>
                </div>
              </div>
            }
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              className="mt-2"
            >
              {fields.map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={<span className="text-sm font-medium text-neutral-ink-700">{field.label}</span>}
                  rules={field.required ? [{ required: true, message: `请输入${field.label}` }] : []}
                >
                  {field.type === 'number' ? (
                    <InputNumber
                      className="!w-full"
                      placeholder={field.placeholder}
                      addonAfter={field.unit}
                      min={0}
                    />
                  ) : field.type === 'select' ? (
                    <Select placeholder={`请选择${field.label}`} options={field.options} />
                  ) : (
                    <Input placeholder={field.placeholder} addonAfter={field.unit} />
                  )}
                </Form.Item>
              ))}
              <Form.Item className="mb-0 mt-4">
                <Button type="primary" htmlType="submit" loading={loading} block size="large" className="!h-11">
                  开始计算
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card
            className="lc-card border-0 h-full"
            title={<span className="font-serif text-base font-semibold">计算结果</span>}
          >
            <Spin spinning={loading}>
              {result ? (
                <div className="space-y-5">
                  <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-lg">
                    <div className="text-sm text-neutral-ink-500 mb-2">计算结果</div>
                    <div className="text-4xl font-serif font-bold text-primary-900">
                      ¥{formatMoney(result.result.total)}
                    </div>
                  </div>

                  {chartOption && result.result.breakdown.length > 1 && (
                    <div>
                      <div className="text-sm font-semibold text-neutral-ink-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        费用明细
                      </div>
                      <ReactECharts option={chartOption} style={{ height: 220 }} />
                    </div>
                  )}

                  {!chartOption || result.result.breakdown.length <= 1 ? (
                    <div>
                      <div className="text-sm font-semibold text-neutral-ink-700 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary-500" />
                        费用明细
                      </div>
                      <div className="space-y-2">
                        {result.result.breakdown.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-2 px-3 bg-neutral-ink-50 rounded">
                            <span className="text-sm text-neutral-ink-700">{item.label}</span>
                            <span className="text-sm font-medium text-primary-900">¥{formatMoney(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <Divider className="!my-4" />

                  <div>
                    <div className="text-sm font-semibold text-neutral-ink-700 mb-2 flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-primary-500" />
                      计算公式
                    </div>
                    <div className="text-sm text-neutral-ink-600 bg-neutral-ivory p-3 rounded leading-relaxed">
                      {result.result.formula}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-neutral-ink-700 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary-500" />
                      法律依据
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {result.result.legalBasis.map((basis, idx) => (
                        <Tag key={idx} color="blue" className="!text-xs !py-1">
                          {basis}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <Empty description="请填写参数后点击计算" />
                </div>
              )}
            </Spin>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
