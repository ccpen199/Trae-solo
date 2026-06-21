import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Slider,
  InputNumber,
  Switch,
  Tooltip,
  Button,
  Table,
  Space,
  Typography,
  Divider,
  message,
  Modal,
} from 'antd';
import {
  InfoCircleOutlined,
  SaveOutlined,
  ReloadOutlined,
  BarChartOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { post, get } from '../utils/api';
import { calculateInsurance } from '../utils/calculator';
import { formatMoney } from '../utils/format';
import { cityPolicies, cityRatePlans } from '../../shared/mockData';
import type {
  CityCode,
  InsuranceType,
  CityPolicy,
  CalculatorResult,
  CalculatorResultItem,
  LegalBasis,
  RateItem,
} from '../../shared/types';
import { CITIES, CITY_NAMES, INSURANCE_NAMES } from '../../shared/types';

const { Title, Text } = Typography;

const PRESET_LEVELS = [60, 80, 100, 150, 200, 300];
const INSURANCE_ORDER: InsuranceType[] = [
  'PENSION',
  'MEDICAL',
  'UNEMPLOYMENT',
  'INJURY',
  'MATERNITY',
  'HOUSING_FUND',
];

function InsurancePlan() {
  const [selectedCity, setSelectedCity] = useState<CityCode>('BJ');
  const [policies, setPolicies] = useState<Record<CityCode, CityPolicy>>(cityPolicies);
  const [basePercent, setBasePercent] = useState<number>(100);
  const [baseAmount, setBaseAmount] = useState<number>(cityPolicies.BJ.socialAvgSalary);
  const [selectedItems, setSelectedItems] = useState<InsuranceType[]>([
    'PENSION',
    'MEDICAL',
    'UNEMPLOYMENT',
    'INJURY',
    'MATERNITY',
    'HOUSING_FUND',
  ]);
  const [housingFundPercent, setHousingFundPercent] = useState<number>(12);
  const [calcResult, setCalcResult] = useState<CalculatorResult | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPolicy = policies[selectedCity];
  const currentRatePlan = cityRatePlans[selectedCity];

  useEffect(() => {
    fetchPolicies();
  }, []);

  useEffect(() => {
    const percent = basePercent / 100;
    const newBase = Math.round(currentPolicy.socialAvgSalary * percent);
    const clamped = Math.min(
      Math.max(newBase, currentPolicy.minBase),
      currentPolicy.maxBase
    );
    setBaseAmount(clamped);
  }, [basePercent, selectedCity]);

  useEffect(() => {
    doCalculate();
  }, [selectedCity, baseAmount, selectedItems, housingFundPercent]);

  const fetchPolicies = async () => {
    try {
      const res = await get<Record<CityCode, CityPolicy>>('/calculator/policies');
      if (res.data) {
        setPolicies(res.data);
      }
    } catch {
      setPolicies(cityPolicies);
    }
  };

  const doCalculate = async () => {
    setLoading(true);
    try {
      const res = await post<CalculatorResult>('/calculator/calculate', {
        cityCode: selectedCity,
        baseAmount,
        selectedItems,
        housingFundPercent,
      });
      if (res.data) {
        setCalcResult(res.data);
      }
    } catch {
      const fallback = calculateInsurance({
        cityCode: selectedCity,
        baseAmount,
        selectedItems,
        housingFundPercent: housingFundPercent / 100,
        isCompanyPay: true,
      });
      setCalcResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (code: CityCode) => {
    setSelectedCity(code);
    const hfItem = cityRatePlans[code].items.find((i) => i.type === 'HOUSING_FUND');
    if (hfItem) {
      setHousingFundPercent(Math.round(hfItem.personalRate * 100) / 100);
    }
  };

  const handleBasePercentChange = (value: number) => {
    setBasePercent(value);
  };

  const handleBaseAmountChange = (value: number | null) => {
    if (value === null) return;
    const clamped = Math.min(
      Math.max(value, currentPolicy.minBase),
      currentPolicy.maxBase
    );
    setBaseAmount(clamped);
    const percent = Math.round((clamped / currentPolicy.socialAvgSalary) * 100);
    setBasePercent(Math.min(Math.max(percent, 60), 300));
  };

  const toggleInsurance = (type: InsuranceType, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, type]);
    } else {
      setSelectedItems(selectedItems.filter((t) => t !== type));
    }
  };

  const handleReset = () => {
    setSelectedCity('BJ');
    setBasePercent(100);
    setSelectedItems([
      'PENSION',
      'MEDICAL',
      'UNEMPLOYMENT',
      'INJURY',
      'MATERNITY',
      'HOUSING_FUND',
    ]);
    setHousingFundPercent(12);
    message.success('已重置为默认配置');
  };

  const handleSave = () => {
    const planData = {
      cityCode: selectedCity,
      baseAmount,
      basePercent,
      selectedItems,
      housingFundPercent,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('insurance_plan', JSON.stringify(planData));
    message.success('参保方案已保存');
  };

  const resultColumns: ColumnsType<CalculatorResultItem> = [
    {
      title: '险种',
      dataIndex: 'name',
      key: 'name',
      width: 100,
    },
    {
      title: '缴费基数',
      dataIndex: 'base',
      key: 'base',
      width: 90,
      render: (v) => formatMoney(v),
    },
    {
      title: '个人比例',
      dataIndex: 'personalRate',
      key: 'personalRate',
      width: 80,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '个人金额',
      dataIndex: 'personalAmount',
      key: 'personalAmount',
      width: 90,
      render: (v) => (
        <Text type="danger" strong>
          {formatMoney(v)}
        </Text>
      ),
    },
    {
      title: '企业比例',
      dataIndex: 'companyRate',
      key: 'companyRate',
      width: 80,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '企业金额',
      dataIndex: 'companyAmount',
      key: 'companyAmount',
      width: 90,
      render: (v) => (
        <Text type="warning" strong>
          {formatMoney(v)}
        </Text>
      ),
    },
    {
      title: '合计',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 90,
      render: (v) => <Text strong>{formatMoney(v)}</Text>,
    },
  ];

  const renderLegalBasisTooltip = (lb: LegalBasis) => (
    <div style={{ maxWidth: 320 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>{lb.title}</p>
      <p style={{ margin: '4px 0', color: '#64748B', fontSize: 12 }}>
        {lb.docNo} · {lb.article}
      </p>
      <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
        生效日期：{lb.effectiveDate}
      </p>
    </div>
  );

  return (
    <div className="fade-in" style={{ paddingRight: 340 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          参保方案配置
        </Title>
        <Text type="secondary">
          选择城市、缴费基数与险种组合，系统实时测算五险一金明细
        </Text>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          参保城市
        </Title>
        <Row gutter={[16, 16]}>
          {CITIES.map((code) => {
            const p = policies[code];
            const isSelected = selectedCity === code;
            return (
              <Col xs={24} sm={12} md={8} lg={8} xl={4} key={code}>
                <Card
                  hoverable
                  onClick={() => handleCitySelect(code)}
                  style={{
                    borderColor: isSelected ? '#1E40AF' : '#E2E8F0',
                    borderWidth: isSelected ? 2 : 1,
                    background: isSelected ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text strong style={{ fontSize: 16 }}>
                      {CITY_NAMES[code]}
                    </Text>
                    {isSelected && (
                      <CheckCircleFilled style={{ color: '#1E40AF', fontSize: 18 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>
                    社平工资：{formatMoney(p.socialAvgSalary)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                    最低基数：{formatMoney(p.minBase)}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {p.highlights.map((h, i) => (
                      <Tag
                        key={i}
                        color={isSelected ? 'blue' : 'default'}
                        style={{ fontSize: 11, margin: 0 }}
                      >
                        {h}
                      </Tag>
                    ))}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          缴费基数档位
        </Title>
        <Row gutter={24} align="middle">
          <Col xs={24} md={4}>
            <Text>基数比例：</Text>
            <Text strong style={{ color: '#1E40AF', fontSize: 18, marginLeft: 8 }}>
              {basePercent}%
            </Text>
          </Col>
          <Col xs={24} md={14}>
            <Slider
              min={60}
              max={300}
              step={5}
              value={basePercent}
              onChange={handleBasePercentChange}
              marks={{ 60: '60%', 100: '100%', 200: '200%', 300: '300%' }}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
          </Col>
          <Col xs={24} md={6}>
            <Space>
              <Text>缴费基数：</Text>
              <InputNumber
                min={currentPolicy.minBase}
                max={currentPolicy.maxBase}
                step={100}
                value={baseAmount}
                onChange={handleBaseAmountChange}
                formatter={(v) => `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number(v?.replace(/[¥\s,]/g, '') || 0)}
                style={{ width: 160 }}
              />
            </Space>
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <Space wrap>
          <Text type="secondary">预设档位：</Text>
          {PRESET_LEVELS.map((lv) => (
            <Button
              key={lv}
              type={basePercent === lv ? 'primary' : 'default'}
              size="small"
              onClick={() => handleBasePercentChange(lv)}
            >
              {lv}%
            </Button>
          ))}
        </Space>
        <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
          基数范围：{formatMoney(currentPolicy.minBase)} ~ {formatMoney(currentPolicy.maxBase)}
          （社平工资{currentPolicy.baseRangeMinPercent}%~{currentPolicy.baseRangeMaxPercent}%）
        </div>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 16 }}>
          五险一金险种组合
        </Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INSURANCE_ORDER.map((type) => {
            const rateItem = currentRatePlan.items.find(
              (i) => i.type === type
            ) as RateItem;
            const isSelected = selectedItems.includes(type);
            const isHousingFund = type === 'HOUSING_FUND';
            const pRate = isHousingFund
              ? housingFundPercent
              : rateItem.personalRate * 100;
            const cRate = isHousingFund
              ? housingFundPercent
              : rateItem.companyRate * 100;

            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: isSelected ? '#F8FAFC' : '#FFFFFF',
                  border: `1px solid ${isSelected ? '#BFDBFE' : '#E2E8F0'}`,
                  borderRadius: 8,
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <Switch
                  checked={isSelected}
                  onChange={(checked) => toggleInsurance(type, checked)}
                />
                <Text strong style={{ width: 100 }}>
                  {INSURANCE_NAMES[type]}
                </Text>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Space size="large">
                    <span>
                      个人：
                      <Text strong style={{ color: '#DC2626' }}>
                        {pRate.toFixed(1)}%
                      </Text>
                    </span>
                    <span>
                      企业：
                      <Text strong style={{ color: '#D97706' }}>
                        {cRate.toFixed(1)}%
                      </Text>
                    </span>
                    {rateItem.fixedAmount && (
                      <span>
                        固定额：
                        <Text strong>{formatMoney(rateItem.fixedAmount)}</Text>
                      </span>
                    )}
                  </Space>
                </div>
                {isHousingFund && isSelected && (
                  <div style={{ width: 220 }}>
                    <Slider
                      min={5}
                      max={12}
                      step={1}
                      value={housingFundPercent}
                      onChange={(v) => setHousingFundPercent(v)}
                      marks={{ 5: '5%', 8: '8%', 12: '12%' }}
                      tooltip={{ formatter: (v) => `${v}%` }}
                    />
                  </div>
                )}
                <Tooltip title={renderLegalBasisTooltip(rateItem.legalBasis)}>
                  <Button
                    type="link"
                    size="small"
                    icon={<InfoCircleOutlined />}
                    style={{ padding: 0 }}
                  >
                    法律依据
                  </Button>
                </Tooltip>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <Button
          type="primary"
          size="large"
          icon={<SaveOutlined />}
          onClick={handleSave}
        >
          保存方案
        </Button>
        <Button size="large" icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
        <Button
          size="large"
          icon={<BarChartOutlined />}
          onClick={() => setCompareModalOpen(true)}
        >
          查看对比
        </Button>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 24,
          top: 88,
          width: 300,
          zIndex: 100,
        }}
      >
        <Card
          styles={{ body: { padding: 20 } }}
          style={{
            boxShadow: '0 10px 40px -10px rgba(30, 64, 175, 0.2)',
            border: '1px solid #BFDBFE',
          }}
        >
          <Title level={5} style={{ marginBottom: 16 }}>
            实时测算结果
          </Title>
          <Row gutter={[0, 12]} style={{ marginBottom: 16 }}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                个人合计
              </Text>
              <div>
                <Text
                  strong
                  style={{ fontSize: 20, color: '#DC2626' }}
                >
                  {formatMoney(calcResult?.personalTotal || 0)}
                </Text>
              </div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                企业合计
              </Text>
              <div>
                <Text
                  strong
                  style={{ fontSize: 20, color: '#D97706' }}
                >
                  {formatMoney(calcResult?.companyTotal || 0)}
                </Text>
              </div>
            </Col>
          </Row>
          <div
            style={{
              background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 16,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
              月缴总计（个人+企业）
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>
              {formatMoney(calcResult?.grandTotal || 0)}
            </div>
          </div>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            <Table
              size="small"
              columns={resultColumns}
              dataSource={calcResult?.items || []}
              pagination={false}
              rowKey="type"
              loading={loading}
            />
          </div>
        </Card>
      </div>

      <Modal
        title="六地对比预览"
        open={compareModalOpen}
        onCancel={() => setCompareModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCompareModalOpen(false)}>
            关闭
          </Button>,
          <Button
            key="go"
            type="primary"
            onClick={() => {
              setCompareModalOpen(false);
              window.location.href = '/calculator';
            }}
          >
            前往测算中心查看详情
          </Button>,
        ]}
        width={700}
      >
        <Text type="secondary">
          当前城市：{CITY_NAMES[selectedCity]}，基数：{formatMoney(baseAmount)}
        </Text>
        <Divider />
        <Row gutter={[16, 16]}>
          {CITIES.map((code) => {
            const r = (() => {
              try {
                return calculateInsurance({
                  cityCode: code,
                  baseAmount,
                  selectedItems,
                  housingFundPercent: housingFundPercent / 100,
                  isCompanyPay: true,
                });
              } catch {
                return null;
              }
            })();
            return (
              <Col span={8} key={code}>
                <Card size="small">
                  <Text strong>{CITY_NAMES[code]}</Text>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    个人：{formatMoney(r?.personalTotal || 0)}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>
                    企业：{formatMoney(r?.companyTotal || 0)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Text strong style={{ color: '#1E40AF' }}>
                      {formatMoney(r?.grandTotal || 0)}
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal>
    </div>
  );
}

export default InsurancePlan;
