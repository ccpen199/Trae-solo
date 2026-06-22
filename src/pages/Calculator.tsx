import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Select,
  Slider,
  InputNumber,
  Checkbox,
  Button,
  Table,
  Space,
  Typography,
  Tabs,
  Segmented,
  Drawer,
  Divider,
  Tag,
  Timeline,
  message,
  Spin,
} from 'antd';
import {
  FileTextOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ReactECharts from 'echarts-for-react';
import { post, get } from '../utils/api';
import {
  calculateInsurance,
  calculateCompare,
} from '../utils/calculator';
import { formatMoney, formatDateTime } from '../utils/format';
import { cityPolicies, cityRatePlans } from '../../shared/mockData';
import type {
  CityCode,
  InsuranceType,
  CalculatorResult,
  CalculatorResultItem,
  CompareResult,
  LegalBasis,
  CityPolicy,
} from '../../shared/types';
import {
  CITIES,
  CITY_NAMES,
} from '../../shared/types';

const { Title, Text, Paragraph } = Typography;

interface HistoryRecord {
  id: string;
  timestamp: string;
  cityCode: CityCode;
  baseAmount: number;
  selectedItems: InsuranceType[];
  housingFundPercent: number;
  viewMode: 'personal' | 'company';
  result: CalculatorResult;
}

const INSURANCE_OPTIONS = [
  { label: '养老保险', value: 'PENSION' },
  { label: '医疗保险', value: 'MEDICAL' },
  { label: '失业保险', value: 'UNEMPLOYMENT' },
  { label: '工伤保险', value: 'INJURY' },
  { label: '生育保险', value: 'MATERNITY' },
  { label: '住房公积金', value: 'HOUSING_FUND' },
];

function Calculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [cityCode, setCityCode] = useState<CityCode>('BJ');
  const [policies, setPolicies] = useState<Record<CityCode, CityPolicy>>(cityPolicies);
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
  const [viewMode, setViewMode] = useState<'personal' | 'company'>('personal');
  const [activeTab, setActiveTab] = useState<string>('detail');
  const [calcResult, setCalcResult] = useState<CalculatorResult | null>(null);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [legalDrawerOpen, setLegalDrawerOpen] = useState(false);
  const [currentLegalBasis, setCurrentLegalBasis] = useState<LegalBasis | null>(null);
  const [currentInsuranceName, setCurrentInsuranceName] = useState<string>('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const currentPolicy = policies[cityCode];
  const basePercent = Math.round((baseAmount / currentPolicy.socialAvgSalary) * 100);

  useEffect(() => {
    fetchPolicies();
    loadHistory();
    const tab = searchParams.get('tab');
    const city = searchParams.get('city');
    const base = searchParams.get('base');
    const items = searchParams.get('items');
    const fund = searchParams.get('fund');
    if (tab === 'compare') {
      setActiveTab('compare');
    }
    if (city && CITIES.includes(city as CityCode)) {
      setCityCode(city as CityCode);
    }
    if (base && !isNaN(Number(base))) {
      setBaseAmount(Number(base));
    }
    if (items) {
      const itemList = items.split(',').filter((i) =>
        [
          'PENSION',
          'MEDICAL',
          'UNEMPLOYMENT',
          'INJURY',
          'MATERNITY',
          'HOUSING_FUND',
        ].includes(i)
      ) as InsuranceType[];
      if (itemList.length > 0) {
        setSelectedItems(itemList);
      }
    }
    if (fund && !isNaN(Number(fund))) {
      setHousingFundPercent(Number(fund));
    }
    setInitialized(true);
  }, []);

  useEffect(() => {
    doCalculate();
  }, [cityCode, baseAmount, selectedItems, housingFundPercent, viewMode]);

  useEffect(() => {
    if (activeTab === 'compare') {
      doCompare();
    }
  }, [activeTab, baseAmount, selectedItems, housingFundPercent, viewMode]);

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

  const loadHistory = () => {
    try {
      const saved = localStorage.getItem('calculator_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      setHistory([]);
    }
  };

  const saveToHistory = (result: CalculatorResult) => {
    const record: HistoryRecord = {
      id: `HIST_${Date.now()}`,
      timestamp: new Date().toISOString(),
      cityCode,
      baseAmount,
      selectedItems: [...selectedItems],
      housingFundPercent,
      viewMode,
      result,
    };
    const newHistory = [record, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('calculator_history', JSON.stringify(newHistory));
  };

  const doCalculate = async () => {
    if (selectedItems.length === 0) {
      setCalcResult(null);
      return;
    }
    setLoading(true);
    try {
      const res = await post<CalculatorResult>('/calculator/calculate', {
        cityCode,
        baseAmount,
        selectedItems,
        housingFundPercent,
      });
      if (res.data) {
        setCalcResult(res.data);
      }
    } catch {
      const fallback = calculateInsurance({
        cityCode,
        baseAmount,
        selectedItems,
        housingFundPercent: housingFundPercent / 100,
        isCompanyPay: viewMode === 'company',
      });
      setCalcResult(fallback);
    } finally {
      setLoading(false);
    }
  };

  const doCompare = async () => {
    if (selectedItems.length === 0) {
      setCompareResult(null);
      return;
    }
    setCompareLoading(true);
    try {
      const res = await post<CompareResult>('/calculator/compare', {
        baseAmount,
        selectedItems,
        housingFundPercent,
        cities: CITIES,
      });
      if (res.data) {
        setCompareResult(res.data);
      }
    } catch {
      const fallback = calculateCompare({
        baseAmount,
        selectedItems,
        housingFundPercent: housingFundPercent / 100,
        cities: CITIES,
      });
      setCompareResult(fallback);
    } finally {
      setCompareLoading(false);
    }
  };

  const applyHistoryRecord = (record: HistoryRecord) => {
    setCityCode(record.cityCode);
    setBaseAmount(record.baseAmount);
    setSelectedItems(record.selectedItems);
    setHousingFundPercent(record.housingFundPercent);
    setViewMode(record.viewMode);
    message.success('已应用历史测算参数');
  };

  const handleSaveResult = () => {
    if (calcResult) {
      saveToHistory(calcResult);
      message.success('测算结果已保存到历史记录');
    }
  };

  const openLegalDrawer = (item: CalculatorResultItem) => {
    setCurrentLegalBasis(item.legalBasis);
    setCurrentInsuranceName(item.name);
    setLegalDrawerOpen(true);
  };

  const detailColumns: ColumnsType<CalculatorResultItem> = [
    {
      title: '险种',
      dataIndex: 'name',
      key: 'name',
      width: 110,
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: '缴费基数',
      dataIndex: 'base',
      key: 'base',
      width: 110,
      render: (v) => formatMoney(v),
    },
    {
      title: '个人比例',
      dataIndex: 'personalRate',
      key: 'personalRate',
      width: 90,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '个人金额',
      dataIndex: 'personalAmount',
      key: 'personalAmount',
      width: 110,
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
      width: 90,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '企业金额',
      dataIndex: 'companyAmount',
      key: 'companyAmount',
      width: 110,
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
      width: 110,
      render: (v) => <Text strong>{formatMoney(v)}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      width: 130,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => openLegalDrawer(record)}
        >
          查看政策依据
        </Button>
      ),
    },
  ];

  const compareChartOption = useMemo(() => {
    if (!compareResult) return {};
    const cityNames = CITIES.map((c) => CITY_NAMES[c]);
    const personalData = CITIES.map(
      (c) => compareResult.results[c]?.personalTotal || 0
    );
    const companyData = CITIES.map(
      (c) => compareResult.results[c]?.companyTotal || 0
    );
    const grandData = CITIES.map(
      (c) => compareResult.results[c]?.grandTotal || 0
    );

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any[]) => {
          let html = `<strong>${params[0].name}</strong><br/>`;
          params.forEach((p) => {
            html += `${p.marker}${p.seriesName}: ${formatMoney(p.value)}<br/>`;
          });
          return html;
        },
      },
      legend: {
        data: ['个人缴纳', '企业缴纳', '总计'],
        top: 0,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 50,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => `¥${(v / 1000).toFixed(1)}k`,
        },
      },
      yAxis: {
        type: 'category',
        data: cityNames,
      },
      series: [
        {
          name: '个人缴纳',
          type: 'bar',
          data: personalData,
          itemStyle: { color: '#DC2626' },
          barWidth: 12,
        },
        {
          name: '企业缴纳',
          type: 'bar',
          data: companyData,
          itemStyle: { color: '#D97706' },
          barWidth: 12,
        },
        {
          name: '总计',
          type: 'bar',
          data: grandData,
          itemStyle: { color: '#1E40AF' },
          barWidth: 12,
        },
      ],
    };
  }, [compareResult]);

  const heatmapColumns: ColumnsType<any> = [
    {
      title: '城市',
      dataIndex: 'cityName',
      key: 'cityName',
      fixed: 'left',
      width: 80,
    },
    {
      title: '个人缴纳',
      dataIndex: 'personalTotal',
      key: 'personalTotal',
      width: 120,
      render: (v, record) => {
        const max = compareResult
          ? Math.max(
              ...CITIES.map(
                (c) => compareResult.results[c]?.personalTotal || 0
              )
            )
          : 1;
        const ratio = v / max;
        const bg = `rgba(220, 38, 38, ${ratio * 0.3})`;
        return (
          <div
            style={{
              background: bg,
              padding: '4px 8px',
              borderRadius: 4,
              color: ratio > 0.7 ? '#991B1B' : '#0F172A',
              fontWeight: 600,
            }}
          >
            {formatMoney(v)}
          </div>
        );
      },
    },
    {
      title: '企业缴纳',
      dataIndex: 'companyTotal',
      key: 'companyTotal',
      width: 120,
      render: (v) => {
        const max = compareResult
          ? Math.max(
              ...CITIES.map(
                (c) => compareResult.results[c]?.companyTotal || 0
              )
            )
          : 1;
        const ratio = v / max;
        const bg = `rgba(217, 119, 6, ${ratio * 0.3})`;
        return (
          <div
            style={{
              background: bg,
              padding: '4px 8px',
              borderRadius: 4,
              color: ratio > 0.7 ? '#92400E' : '#0F172A',
              fontWeight: 600,
            }}
          >
            {formatMoney(v)}
          </div>
        );
      },
    },
    {
      title: '总计',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      width: 120,
      render: (v) => {
        const max = compareResult
          ? Math.max(
              ...CITIES.map(
                (c) => compareResult.results[c]?.grandTotal || 0
              )
            )
          : 1;
        const ratio = v / max;
        const bg = `rgba(30, 64, 175, ${ratio * 0.3})`;
        return (
          <div
            style={{
              background: bg,
              padding: '4px 8px',
              borderRadius: 4,
              color: ratio > 0.7 ? '#1E3A8A' : '#0F172A',
              fontWeight: 600,
            }}
          >
            {formatMoney(v)}
          </div>
        );
      },
    },
    {
      title: '与最低差额',
      dataIndex: 'diff',
      key: 'diff',
      width: 120,
      render: (v) => (
        <Tag color={v === 0 ? 'green' : v < 500 ? 'blue' : 'orange'}>
          +{formatMoney(v)}
        </Tag>
      ),
    },
  ];

  const heatmapData = useMemo(() => {
    if (!compareResult) return [];
    const results = CITIES.map((c) => compareResult.results[c]).filter(
      Boolean
    ) as CalculatorResult[];
    const minGrand = Math.min(...results.map((r) => r.grandTotal));
    return CITIES.map((c) => {
      const r = compareResult.results[c];
      return {
        key: c,
        cityCode: c,
        cityName: CITY_NAMES[c],
        personalTotal: r?.personalTotal || 0,
        companyTotal: r?.companyTotal || 0,
        grandTotal: r?.grandTotal || 0,
        diff: r ? Number((r.grandTotal - minGrand).toFixed(2)) : 0,
      };
    }).sort((a, b) => a.grandTotal - b.grandTotal);
  }, [compareResult]);

  const policyCompareColumns: ColumnsType<any> = [
    {
      title: '城市',
      dataIndex: 'cityName',
      key: 'cityName',
      fixed: 'left',
      width: 80,
      render: (v, record: any) => (
        <div>
          <Text strong>{v}</Text>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {record.effectiveDate}起
          </div>
        </div>
      ),
    },
    {
      title: '社平工资',
      dataIndex: 'socialAvgSalary',
      key: 'socialAvgSalary',
      width: 100,
      render: (v) => formatMoney(v),
    },
    {
      title: '基数下限',
      dataIndex: 'minBase',
      key: 'minBase',
      width: 100,
      render: (v) => formatMoney(v),
    },
    {
      title: '基数上限',
      dataIndex: 'maxBase',
      key: 'maxBase',
      width: 100,
      render: (v) => formatMoney(v),
    },
    {
      title: '养老个人%',
      dataIndex: 'pensionPersonal',
      key: 'pensionPersonal',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '养老企业%',
      dataIndex: 'pensionCompany',
      key: 'pensionCompany',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '医疗个人%',
      dataIndex: 'medicalPersonal',
      key: 'medicalPersonal',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '医疗企业%',
      dataIndex: 'medicalCompany',
      key: 'medicalCompany',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '失业个人%',
      dataIndex: 'unemploymentPersonal',
      key: 'unemploymentPersonal',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '失业企业%',
      dataIndex: 'unemploymentCompany',
      key: 'unemploymentCompany',
      width: 100,
      render: (v) => `${(v * 100).toFixed(1)}%`,
    },
    {
      title: '公积金%',
      dataIndex: 'housingFund',
      key: 'housingFund',
      width: 90,
      render: (v) => `${(v * 100).toFixed(0)}%`,
    },
    {
      title: '政策亮点',
      dataIndex: 'highlights',
      key: 'highlights',
      width: 180,
      render: (v: string[]) => (
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          {v.slice(0, 2).map((h, i) => (
            <Tag key={i} color="blue" style={{ marginBottom: 4 }}>
              {h}
            </Tag>
          ))}
        </div>
      ),
    },
  ];

  const policyCompareData = useMemo(() => {
    return CITIES.map((code) => {
      const policy = policies[code] || cityPolicies[code];
      const ratePlan = cityRatePlans[code];
      const findRate = (type: string) =>
        ratePlan?.items?.find((i: any) => i.type === type) || {};
      const pension = findRate('PENSION');
      const medical = findRate('MEDICAL');
      const unemployment = findRate('UNEMPLOYMENT');
      const housingFund = findRate('HOUSING_FUND');
      return {
        key: code,
        cityCode: code,
        cityName: CITY_NAMES[code],
        socialAvgSalary: policy?.socialAvgSalary || 0,
        minBase: policy?.minBase || 0,
        maxBase: policy?.maxBase || 0,
        pensionPersonal: pension.personalRate || 0,
        pensionCompany: pension.companyRate || 0,
        medicalPersonal: medical.personalRate || 0,
        medicalCompany: medical.companyRate || 0,
        unemploymentPersonal: unemployment.personalRate || 0,
        unemploymentCompany: unemployment.companyRate || 0,
        housingFund: housingFund.personalRate || 0.12,
        highlights: policy?.highlights || [],
        effectiveDate: ratePlan?.effectiveDate || '',
      };
    });
  }, [policies]);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
          <CalculatorOutlined style={{ marginRight: 8 }} />
          智能测算中心
        </Title>
        <Text type="secondary">
          支持单城明细测算与六地横向对比，所有结果附政策法规依据
        </Text>
      </div>

      <Card style={{ marginBottom: 24 }} styles={{ body: { padding: 20 } }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">参保城市</Text>
            </div>
            <Select
              value={cityCode}
              onChange={(v) => setCityCode(v)}
              style={{ width: '100%' }}
              options={CITIES.map((c) => ({
                label: CITY_NAMES[c],
                value: c,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={10}>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">
                缴费基数（{basePercent}%） · 范围：
                {formatMoney(currentPolicy.minBase)}~
                {formatMoney(currentPolicy.maxBase)}
              </Text>
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Slider
                min={currentPolicy.minBase}
                max={currentPolicy.maxBase}
                step={100}
                value={baseAmount}
                onChange={(v) => setBaseAmount(v)}
                style={{ flex: 1, margin: '0 12px' }}
                tooltip={{ formatter: (v) => formatMoney(v) }}
              />
              <InputNumber
                min={currentPolicy.minBase}
                max={currentPolicy.maxBase}
                step={100}
                value={baseAmount}
                onChange={(v) => v !== null && setBaseAmount(v)}
                formatter={(v) =>
                  `¥ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
                parser={(v) => Number(v?.replace(/[¥\s,]/g, '') || 0)}
                style={{ width: 140 }}
              />
            </Space.Compact>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">公积金比例</Text>
            </div>
            <Select
              value={housingFundPercent}
              onChange={(v) => setHousingFundPercent(v)}
              style={{ width: '100%' }}
              options={[5, 6, 7, 8, 9, 10, 11, 12].map((p) => ({
                label: `${p}%`,
                value: p,
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={2}>
            <div style={{ marginBottom: 6 }}>
              <Text type="secondary">视角</Text>
            </div>
            <Segmented
              value={viewMode}
              onChange={(v) => setViewMode(v as 'personal' | 'company')}
              options={[
                { label: '个人', value: 'personal' },
                { label: '企业', value: 'company' },
              ]}
            />
          </Col>
        </Row>
        <Divider style={{ margin: '16px 0' }} />
        <div>
          <Text type="secondary" style={{ marginRight: 12 }}>
            参保险种：
          </Text>
          <Checkbox.Group
            value={selectedItems}
            onChange={(v) => setSelectedItems(v as InsuranceType[])}
            options={INSURANCE_OPTIONS}
          />
        </div>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={18}>
          <Card styles={{ body: { padding: 0 } }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              style={{ padding: '0 24px' }}
              items={[
                {
                  key: 'detail',
                  label: '单城测算明细',
                  children: (
                    <Spin spinning={loading}>
                      <div style={{ padding: '0 24px 24px' }}>
                        {calcResult && (
                          <>
                            <Row gutter={24} style={{ marginBottom: 24 }}>
                              <Col span={8}>
                                <Card
                                  size="small"
                                  style={{
                                    background: '#FEF2F2',
                                    border: 'none',
                                  }}
                                >
                                  <div
                                    style={{ fontSize: 12, color: '#991B1B' }}
                                  >
                                    个人月缴
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 24,
                                      fontWeight: 700,
                                      color: '#DC2626',
                                    }}
                                  >
                                    {formatMoney(calcResult.personalTotal)}
                                  </div>
                                </Card>
                              </Col>
                              <Col span={8}>
                                <Card
                                  size="small"
                                  style={{
                                    background: '#FFFBEB',
                                    border: 'none',
                                  }}
                                >
                                  <div
                                    style={{ fontSize: 12, color: '#92400E' }}
                                  >
                                    企业月缴
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 24,
                                      fontWeight: 700,
                                      color: '#D97706',
                                    }}
                                  >
                                    {formatMoney(calcResult.companyTotal)}
                                  </div>
                                </Card>
                              </Col>
                              <Col span={8}>
                                <Card
                                  size="small"
                                  style={{
                                    background:
                                      'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 100%)',
                                    border: 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: 'rgba(255,255,255,0.8)',
                                    }}
                                  >
                                    月缴总计
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 24,
                                      fontWeight: 700,
                                      color: '#FFFFFF',
                                    }}
                                  >
                                    {formatMoney(calcResult.grandTotal)}
                                  </div>
                                </Card>
                              </Col>
                            </Row>
                            <div style={{ marginBottom: 12 }}>
                              <Space>
                                <Tag color="blue">{calcResult.cityName}</Tag>
                                <Tag>
                                  基数：{formatMoney(calcResult.baseAmount)}
                                </Tag>
                                <Button
                                  size="small"
                                  icon={<ReloadOutlined />}
                                  onClick={handleSaveResult}
                                >
                                  保存本次测算
                                </Button>
                              </Space>
                            </div>
                            <Table
                              columns={detailColumns}
                              dataSource={calcResult.items}
                              pagination={false}
                              rowKey="type"
                              size="middle"
                            />
                          </>
                        )}
                        {!calcResult && (
                          <div
                            style={{
                              padding: 60,
                              textAlign: 'center',
                              color: '#94A3B8',
                            }}
                          >
                            请选择至少一个险种进行测算
                          </div>
                        )}
                      </div>
                    </Spin>
                  ),
                },
                {
                  key: 'compare',
                  label: '六地对比报表',
                  children: (
                    <Spin spinning={compareLoading}>
                      <div style={{ padding: '0 24px 24px' }}>
                        {compareResult && (
                          <>
                            <Card
                              size="small"
                              style={{ marginBottom: 16, background: '#F0F9FF' }}
                            >
                              <Space size="large">
                                <Tag color="success">
                                  成本最低：
                                  {CITY_NAMES[compareResult.summary.cheapestCity]}
                                </Tag>
                                <Tag color="warning">
                                  成本最高：
                                  {CITY_NAMES[compareResult.summary.mostExpensiveCity]}
                                </Tag>
                                <Tag>
                                  个人最大差额：
                                  {formatMoney(compareResult.summary.maxDiffPersonal)}
                                </Tag>
                                <Tag>
                                  企业最大差额：
                                  {formatMoney(compareResult.summary.maxDiffCompany)}
                                </Tag>
                              </Space>
                            </Card>
                            <div style={{ marginBottom: 24 }}>
                              <Title level={5} style={{ marginBottom: 12 }}>
                                横向柱状对比
                              </Title>
                              <ReactECharts
                                option={compareChartOption}
                                style={{ height: 360 }}
                                notMerge={true}
                              />
                            </div>
                            <div>
                              <Title level={5} style={{ marginBottom: 12 }}>
                                金额差异热力表
                              </Title>
                              <Table
                                columns={heatmapColumns}
                                dataSource={heatmapData}
                                pagination={false}
                                size="middle"
                                rowKey="key"
                              />
                            </div>
                            <Divider />
                            <div>
                              <Title level={5} style={{ marginBottom: 12 }}>
                                城市政策参数对比（政策依据落点）
                              </Title>
                              <Table
                                columns={policyCompareColumns}
                                dataSource={policyCompareData}
                                pagination={false}
                                size="small"
                                rowKey="key"
                                scroll={{ x: 1200 }}
                              />
                              <div
                                style={{
                                  marginTop: 12,
                                  fontSize: 12,
                                  color: '#64748B',
                                }}
                              >
                                <FileTextOutlined style={{ marginRight: 6 }} />
                                以上政策参数均源自各地人社局、医保局、住房公积金管理中心官方文件，点击单城明细可查看各险种具体法规依据
                              </div>
                            </div>
                          </>
                        )}
                        {!compareResult && (
                          <div
                            style={{
                              padding: 60,
                              textAlign: 'center',
                              color: '#94A3B8',
                            }}
                          >
                            请选择至少一个险种进行测算
                          </div>
                        )}
                      </div>
                    </Spin>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={6}>
          <Card
            styles={{ body: { padding: 16 } }}
            title={
              <Space>
                <HistoryOutlined />
                <Text strong>历史测算</Text>
              </Space>
            }
          >
            {history.length > 0 ? (
              <Timeline
                items={history.map((h, idx) => ({
                  color: idx === 0 ? '#1E40AF' : '#CBD5E1',
                  dot: idx === 0 ? <CalculatorOutlined /> : undefined,
                  children: (
                    <div
                      style={{
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 6,
                        background: idx === 0 ? '#EFF6FF' : 'transparent',
                      }}
                      onClick={() => applyHistoryRecord(h)}
                    >
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {formatDateTime(h.timestamp)}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Tag>{CITY_NAMES[h.cityCode]}</Tag>
                        <Tag color="blue">
                          {formatMoney(h.baseAmount)}
                        </Tag>
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13 }}>
                        <Text strong style={{ color: '#1E40AF' }}>
                          {formatMoney(
                            h.viewMode === 'personal'
                              ? h.result.personalTotal
                              : h.result.grandTotal
                          )}
                        </Text>
                        <Text type="secondary" style={{ marginLeft: 4 }}>
                          /月（{h.viewMode === 'personal' ? '个人' : '含企业'}）
                        </Text>
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: '#1E40AF',
                        }}
                      >
                        点击回退应用 →
                      </div>
                    </div>
                  ),
                }))}
              />
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  color: '#94A3B8',
                  fontSize: 13,
                }}
              >
                暂无历史记录
                <div style={{ marginTop: 4, fontSize: 12 }}>
                  测算后点击「保存本次测算」记录
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E40AF' }} />
            <span>{currentInsuranceName} - 政策法规依据</span>
          </Space>
        }
        open={legalDrawerOpen}
        onClose={() => setLegalDrawerOpen(false)}
        width={520}
      >
        {currentLegalBasis && (
          <div className="fade-in">
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
                {currentLegalBasis.title}
              </Title>
              <Row gutter={[0, 8]}>
                <Col span={12}>
                  <Text type="secondary">文号：</Text>
                  <Text strong>{currentLegalBasis.docNo}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">生效日期：</Text>
                  <Text strong>{currentLegalBasis.effectiveDate}</Text>
                </Col>
                <Col span={24}>
                  <Text type="secondary">引用条款：</Text>
                  <Tag color="blue">{currentLegalBasis.article}</Tag>
                </Col>
              </Row>
            </Card>
            <Card size="small" title="条款内容摘要">
              <Paragraph style={{ margin: 0 }}>
                根据{currentLegalBasis.title}（{currentLegalBasis.docNo}）
                {currentLegalBasis.article}规定，用人单位和职工应当按照国家规定的
                比例共同缴纳社会保险费。缴费基数以职工本人上年度月平均工资为准，
                不得低于当地规定的最低缴费基数，也不得高于最高缴费基数。
                住房公积金缴存比例由单位和个人共同承担，具体比例在规定范围内
                由单位根据实际情况确定。
              </Paragraph>
            </Card>
            <div
              style={{
                marginTop: 16,
                padding: 12,
                background: '#FEF3C7',
                borderRadius: 6,
                fontSize: 12,
                color: '#92400E',
              }}
            >
              提示：以上信息仅供参考，具体政策以当地人社局/公积金中心官方发布为准。
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default Calculator;
