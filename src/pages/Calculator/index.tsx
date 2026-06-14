import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Form,
  Slider,
  Select,
  InputNumber,
  Row,
  Col,
  Statistic,
  Button,
  Divider,
  Alert,
} from 'antd';
import {
  CalculatorOutlined,
  WalletOutlined,
  BankOutlined,
  RiseOutlined,
  MoneyCollectOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { calculatorApi, type PensionEstimateResult } from '@/lib/api';

const { Option } = Select;

const HUNAN_AVERAGE_SALARY_2024 = 5869;

const PENSION_MONTHS: Record<number, number> = {
  55: 170,
  60: 139,
  65: 101,
};

const payGradeOptions = [
  { value: 200, label: '200元/年（最低档）' },
  { value: 300, label: '300元/年' },
  { value: 500, label: '500元/年' },
  { value: 1000, label: '1000元/年' },
  { value: 2000, label: '2000元/年' },
  { value: 3000, label: '3000元/年（最高档）' },
];

const governmentSubsidyMap: Record<number, number> = {
  200: 40,
  300: 50,
  500: 70,
  1000: 120,
  2000: 200,
  3000: 300,
};

const CalculatorPage = () => {
  const [form] = Form.useForm();
  const [payYears, setPayYears] = useState(25);
  const [payGrade, setPayGrade] = useState(2000);
  const [retirementAge, setRetirementAge] = useState(60);
  const [currentAge, setCurrentAge] = useState(40);
  const [result, setResult] = useState<PensionEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculatePension = useMemo(() => {
    const yearsToRetirement = retirementAge - currentAge;
    const totalPayYears = payYears;
    const governmentSubsidy = governmentSubsidyMap[payGrade] || 40;

    const personalAccount = (payGrade + governmentSubsidy) * totalPayYears;
    const averageSalaryIndex = 0.6 + (payGrade / 3000) * 0.6;

    const indexedAverageSalary = HUNAN_AVERAGE_SALARY_2024 * averageSalaryIndex;

    const basicPension =
      ((HUNAN_AVERAGE_SALARY_2024 + indexedAverageSalary) / 2) * (totalPayYears / 100);

    const months = PENSION_MONTHS[retirementAge] || 139;
    const personalPension = personalAccount / months;

    const totalPension = Math.round((basicPension + personalPension) * 100) / 100;
    const totalPayment = payGrade * totalPayYears;
    const totalSubsidy = governmentSubsidy * totalPayYears;

    return {
      basicPension: Math.round(basicPension * 100) / 100,
      personalPension: Math.round(personalPension * 100) / 100,
      totalPension,
      totalPayment,
      totalSubsidy,
      yearsToRetirement,
      governmentSubsidy,
    };
  }, [payYears, payGrade, retirementAge, currentAge]);

  const calcResult = async () => {
    try {
      setLoading(true);
      const res = await calculatorApi.estimatePension({
        payYears,
        payGrade,
        retirementAge,
        currentAge,
      });
      if (res?.success && res.data) {
        setResult(res.data);
      }
    } catch {
      const yearsToRetirement = retirementAge - currentAge;
      const avgIndex = 0.6 + (payGrade / 3000) * 0.6;
      const indexedSalary = HUNAN_AVERAGE_SALARY_2024 * avgIndex;
      setResult({
        basicPension: calculatePension.basicPension,
        personalPension: calculatePension.personalPension,
        totalPension: calculatePension.totalPension,
        details: {
          hunanAverageSalary: HUNAN_AVERAGE_SALARY_2024,
          indexedAverageSalary: Math.round(indexedSalary * 100) / 100,
          formula: `基础养老金 = (${HUNAN_AVERAGE_SALARY_2024} + ${Math.round(indexedSalary * 100) / 100}) / 2 * ${payYears}% = ${calculatePension.basicPension}元`,
          personalAccountMonths: PENSION_MONTHS[retirementAge] || 139,
          annualIncrease: yearsToRetirement * 100,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calcResult();
  }, [payYears, payGrade, retirementAge, currentAge]);

  const chartOption = useMemo(() => {
    const years = [15, 20, 25, 30];
    const basicData = years.map((y) => {
      const governmentSubsidy = governmentSubsidyMap[payGrade] || 40;
      const personalAccount = (payGrade + governmentSubsidy) * y;
      const averageSalaryIndex = 0.6 + (payGrade / 3000) * 0.6;
      const indexedAverageSalary = HUNAN_AVERAGE_SALARY_2024 * averageSalaryIndex;
      const basicP =
        ((HUNAN_AVERAGE_SALARY_2024 + indexedAverageSalary) / 2) * (y / 100);
      const months = PENSION_MONTHS[retirementAge] || 139;
      const personalP = personalAccount / months;
      return {
        basic: Math.round(basicP),
        personal: Math.round(personalP),
        total: Math.round(basicP + personalP),
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
        type: 'shadow',
        },
      },
      legend: {
        data: ['基础养老金', '个人账户养老金'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: years.map((y) => `${y}年`),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '{value}元',
        },
      },
      series: [
        {
          name: '基础养老金',
          type: 'bar',
          stack: 'total',
          itemStyle: {
            color: '#165DFF',
          },
          data: basicData.map((d) => d.basic),
        },
        {
          name: '个人账户养老金',
          type: 'bar',
          stack: 'total',
          itemStyle: {
            color: '#FFB020',
          },
          data: basicData.map((d) => d.personal),
        },
      ],
    };
  }, [payGrade, retirementAge]);

  const handleReset = () => {
    setPayYears(25);
    setPayGrade(2000);
    setRetirementAge(60);
    setCurrentAge(40);
    form.setFieldsValue({
      payYears: 25,
      payGrade: 2000,
      retirementAge: 60,
      currentAge: 40,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">
          <CalculatorOutlined className="mr-2 text-primary" />
          政策计算器
        </h2>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>

      <Alert
        message="测算说明"
        description="本计算器根据湖南省城乡居民养老保险政策进行测算，实际领取金额以社保部门核定为准。"
        type="info"
        showIcon
        className="bg-blue-50"
      />

      <Row gutter={24}>
        <Col xs={24} lg={10}>
          <Card title="养老金测算" className="shadow-sm">
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                payYears: 25,
                payGrade: 2000,
                retirementAge: 60,
                currentAge: 40,
              }}
            >
              <Form.Item name="payYears" label={`缴费年限：${payYears}年`} rules={[{ required: true }]}>
                <Slider
                  min={15}
                  max={40}
                  value={payYears}
                  onChange={(val) => setPayYears(val as number)}
                  marks={{
                    15: '15',
                    20: '20',
                    25: '25',
                    30: '30',
                    35: '35',
                    40: '40',
                  }}
                  tooltip={{ formatter: (val) => `${val}年` }}
                />
              </Form.Item>

              <Form.Item name="payGrade" label="缴费档次" rules={[{ required: true }]}>
                <Select
                  value={payGrade}
                  onChange={(val) => setPayGrade(val)}
                  placeholder="请选择缴费档次"
                >
                  {payGradeOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="retirementAge" label="预计退休年龄" rules={[{ required: true }]}>
                <Select
                  value={retirementAge}
                  onChange={(val) => setRetirementAge(val)}
                  placeholder="请选择退休年龄"
                >
                  <Option value={55}>55岁</Option>
                  <Option value={60}>60岁</Option>
                  <Option value={65}>65岁</Option>
                </Select>
              </Form.Item>

              <Form.Item name="currentAge" label="当前年龄" rules={[{ required: true }]}>
                <InputNumber
                  min={16}
                  max={retirementAge - 1}
                  value={currentAge}
                  onChange={(val) => setCurrentAge(val as number)}
                  className="w-full"
                  placeholder="请输入当前年龄"
                  addonAfter="岁"
                />
              </Form.Item>
            </Form>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                政府补贴：
                <span className="text-success font-semibold">
                  {governmentSubsidyMap[payGrade] || 40}元/年
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                预计领取年龄：
                <span className="text-primary font-semibold">
                  {retirementAge}岁
                </span>
              </p>
              <p className="text-sm text-gray-600">
                距退休还有：
                <span className="text-warning font-semibold">
                  {retirementAge - currentAge}年
                </span>
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <div className="space-y-6">
            <Card className="shadow-sm">
              <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">预估月养老金</p>
              <p className="text-5xl font-bold text-primary mt-2">
                ¥{result?.totalPension.toLocaleString() || '0'}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                （{retirementAge}岁后每月预计领取
              </p>
            </div>

              <Row gutter={16}>
                <Col xs={12}>
                  <Statistic
                    title="基础养老金"
                    value={result?.basicPension || 0}
                    precision={2}
                    prefix={<BankOutlined className="text-primary" />}
                    suffix="元"
                    className="text-primary"
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="个人账户养老金"
                    value={result?.personalPension || 0}
                    precision={2}
                    prefix={<WalletOutlined className="text-gold" />}
                    suffix="元"
                    className="text-gold"
                  />
                </Col>
              </Row>

              <Divider />

              <Row gutter={16}>
                <Col xs={12}>
                  <Statistic
                    title="累计缴费金额"
                    value={calculatePension.totalPayment}
                    prefix={<MoneyCollectOutlined className="text-warning" />}
                    suffix="元"
                    className="text-warning"
                  />
                </Col>
                <Col xs={12}>
                  <Statistic
                    title="累计政府补贴"
                    value={calculatePension.totalSubsidy}
                    prefix={<RiseOutlined className="text-success" />}
                    suffix="元"
                    className="text-success"
                  />
                </Col>
              </Row>
            </Card>

            <Card title="不同缴费年限养老金对比" className="shadow-sm">
              <ReactECharts
                option={chartOption}
                style={{ height: '300px' }}
                showLoading={loading}
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                * 按当前缴费档次 {payGrade}元/年 测算
              </p>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default CalculatorPage;
