import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Space, Button, Table, Tag } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  AlertOutlined,
  FileProtectOutlined,
  DollarCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { reportApi } from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<any>({});
  const [piracyTrend, setPiracyTrend] = useState<any>([]);
  const [infringementStats, setInfringementStats] = useState<any>([]);
  const [processingEfficiency, setProcessingEfficiency] = useState<any>({});
  const [lossEstimation, setLossEstimation] = useState<any>([]);
  const [highRiskCourses, setHighRiskCourses] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        trendRes,
        statsRes,
        efficiencyRes,
        lossRes,
        riskRes,
      ] = await Promise.all([
        reportApi.overview(),
        reportApi.piracyTrend(30),
        reportApi.infringementStatistics(),
        reportApi.processingEfficiency(),
        reportApi.lossEstimation(),
        reportApi.highRiskCourses(),
      ]);

      setOverview(overviewRes.data);
      setPiracyTrend(trendRes.data);
      setInfringementStats(statsRes.data);
      setProcessingEfficiency(efficiencyRes.data);
      setLossEstimation(lossRes.data);
      setHighRiskCourses(riskRes.data);
    } catch (error) {
      console.error('加载报表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
  };

  const piracyTrendOption = {
    title: {
      text: '盗版线索趋势',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['新增线索', '已解决线索'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: piracyTrend.map((item: any) => item.date),
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        name: '新增线索',
        type: 'line',
        smooth: true,
        data: piracyTrend.map((item: any) => item.new_count),
        itemStyle: { color: '#ff4d4f' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(255, 77, 79, 0.3)' },
              { offset: 1, color: 'rgba(255, 77, 79, 0.05)' },
            ],
          },
        },
      },
      {
        name: '已解决线索',
        type: 'line',
        smooth: true,
        data: piracyTrend.map((item: any) => item.resolved_count),
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' },
            ],
          },
        },
      },
    ],
  };

  const platformStatsOption = {
    title: {
      text: '侵权平台分布',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center',
    },
    series: [
      {
        name: '侵权平台',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: infringementStats.map((item: any) => ({
          value: item.count,
          name: item.platform,
        })),
      },
    ],
  };

  const lossEstimationOption = {
    title: {
      text: '经济损失估算',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        return `${params[0].axisValue}<br/>损失金额: ¥${params[0].value.toLocaleString()}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: lossEstimation.map((item: any) => item.month),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
      },
    },
    series: [
      {
        name: '损失金额',
        type: 'bar',
        data: lossEstimation.map((item: any) => item.estimated_loss),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#faad14' },
              { offset: 1, color: '#fa8c16' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  const efficiencyOption = {
    title: {
      text: '处理效率分析',
      left: 'center',
      textStyle: { fontSize: 14, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        name: '处理效率',
        type: 'gauge',
        center: ['50%', '60%'],
        radius: '80%',
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 20,
            color: [
              [0.3, '#ff4d4f'],
              [0.7, '#faad14'],
              [1, '#52c41a'],
            ],
          },
        },
        pointer: {
          itemStyle: {
            color: 'auto',
          },
        },
        axisTick: {
          distance: -20,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2,
          },
        },
        splitLine: {
          distance: -25,
          length: 15,
          lineStyle: {
            color: '#fff',
            width: 3,
          },
        },
        axisLabel: {
          color: 'auto',
          distance: 30,
          fontSize: 12,
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: 'auto',
        },
        data: [
          {
            value: processingEfficiency.resolution_rate || 0,
            name: '结案率',
          },
        ],
      },
    ],
  };

  const riskColumns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '侵权次数',
      dataIndex: 'piracy_count',
      key: 'piracy_count',
      width: 100,
      render: (count: number) => (
        <Tag color="red">{count} 次</Tag>
      ),
    },
    {
      title: '未授权素材',
      dataIndex: 'unauthorized_material_count',
      key: 'unauthorized_material_count',
      width: 120,
      render: (count: number) => count > 0 ? (
        <Tag color="orange">{count} 个</Tag>
      ) : <Tag color="green">0 个</Tag>,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      key: 'risk_level',
      width: 100,
      render: (level: string) => {
        const levelMap: Record<string, { color: string; text: string }> = {
          high: { color: 'red', text: '高风险' },
          medium: { color: 'orange', text: '中风险' },
          low: { color: 'green', text: '低风险' },
        };
        const cfg = levelMap[level] || { color: 'default', text: level };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">版权报表</h1>
          <p className="page-description">版权保护运营数据分析报表</p>
        </div>
        <Space>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={loadData}>
            刷新数据
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#e6f4ff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <BookOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              <div>
                <Statistic title="课程总数" value={overview.total_courses || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#f6ffed', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileTextOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <Statistic title="素材总数" value={overview.total_materials || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#fff1f0', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              <div>
                <Statistic title="活跃线索" value={overview.active_piracy_clues || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#f9f0ff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileProtectOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Statistic title="维权案件" value={overview.active_enforcement_cases || 0} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#fff7e6', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <DollarCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div>
                <Statistic
                  title="挽回损失"
                  value={overview.total_compensation || 0}
                  precision={2}
                  prefix="¥"
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card size="small" style={{ background: '#f0f5ff', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              <div>
                <Statistic
                  title="处理率"
                  value={processingEfficiency.resolution_rate || 0}
                  suffix="%"
                />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card loading={loading} size="small">
            <ReactECharts option={piracyTrendOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card loading={loading} size="small">
            <ReactECharts option={platformStatsOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card loading={loading} size="small">
            <ReactECharts option={lossEstimationOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card loading={loading} size="small">
            <ReactECharts option={efficiencyOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="高风险课程" size="small" style={{ marginTop: 16 }} loading={loading}>
        <Table
          columns={riskColumns}
          dataSource={highRiskCourses}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: '暂无高风险课程' }}
        />
      </Card>
    </div>
  );
};

export default Reports;
