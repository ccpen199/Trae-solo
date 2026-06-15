import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Typography, Space, Progress, Alert, App } from 'antd';
import {
  FileTextOutlined,
  FileProtectOutlined,
  DollarOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import apiClient from '../../api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OverviewStats {
  total_demands: number;
  total_contracts: number;
  total_revenue: number;
  total_users: number;
}

interface DemandStatus {
  status: string;
  count: number;
}

interface ContractByMonth {
  month: string;
  count: number;
  amount: number;
}

interface BomAnalysis {
  material_name: string;
  total_qty: number;
  total_cost: number;
  contract_count: number;
  supplier_name: string;
}

interface Performance {
  real_name: string;
  role: string;
  contract_count: number;
  total_amount: number;
}

interface WarrantyTracking {
  id: string;
  contract_no: string;
  total_amount: number;
  warranty_years: number;
  end_date: string;
  warranty_expire: string;
  days_remaining: number;
  owner_name: string;
  owner_phone: string;
}

const statusColorMap: Record<string, string> = {
  default: '#bfbfbf',
  blue: '#1890ff',
  processing: '#1890ff',
  warning: '#faad14',
  success: '#52c41a',
  error: '#ff4d4f',
};

const statusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待匹配', color: 'default' },
  matched: { text: '已匹配', color: 'blue' },
  signed: { text: '已签约', color: 'processing' },
  in_progress: { text: '进行中', color: 'warning' },
  completed: { text: '已完成', color: 'success' },
  cancelled: { text: '已取消', color: 'error' },
};

const AdminDashboard: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OverviewStats>({
    total_demands: 0,
    total_contracts: 0,
    total_revenue: 0,
    total_users: 0,
  });
  const [demandsByStatus, setDemandsByStatus] = useState<DemandStatus[]>([]);
  const [contractsByMonth, setContractsByMonth] = useState<ContractByMonth[]>([]);
  const [bomAnalysis, setBomAnalysis] = useState<BomAnalysis[]>([]);
  const [performance, setPerformance] = useState<Performance[]>([]);
  const [warrantyTracking, setWarrantyTracking] = useState<WarrantyTracking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/dashboard');
      const data = response.data;
      setOverview(data.overview);
      setDemandsByStatus(data.demands_by_status || []);
      setContractsByMonth(data.contracts_by_month || []);
      setBomAnalysis(data.bom_analysis || []);
      setPerformance(data.performance || []);
      setWarrantyTracking(data.warranty_tracking || []);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取看板数据失败');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '需求总数',
      value: overview.total_demands,
      icon: <FileTextOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      suffix: '个',
    },
    {
      title: '合同总数',
      value: overview.total_contracts,
      icon: <FileProtectOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      suffix: '份',
    },
    {
      title: '营收总额',
      value: overview.total_revenue,
      icon: <DollarOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      suffix: '元',
      isMoney: true,
    },
    {
      title: '用户总数',
      value: overview.total_users,
      icon: <UserOutlined style={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      suffix: '人',
    },
  ];

  const demandPieOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        name: '需求状态',
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
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
            fontSize: 18,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: demandsByStatus.map((item) => {
          const info = statusMap[item.status] || { text: item.status, color: 'default' };
          return {
            value: item.count,
            name: info.text,
            itemStyle: {
              color: statusColorMap[info.color] || '#1890ff',
            },
          };
        }),
      },
    ],
  };

  const contractTrendOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['合同数量', '签约金额'],
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
      data: contractsByMonth.map((item) => item.month),
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '合同数',
        position: 'left',
        axisLabel: {
          formatter: '{value} 份',
        },
      },
      {
        type: 'value',
        name: '金额',
        position: 'right',
        axisLabel: {
          formatter: '{value} 万',
        },
      },
    ],
    series: [
      {
        name: '合同数量',
        type: 'bar',
        data: contractsByMonth.map((item) => item.count),
        itemStyle: {
          color: '#1890ff',
          borderRadius: [4, 4, 0, 0],
        },
      },
      {
        name: '签约金额',
        type: 'line',
        yAxisIndex: 1,
        data: contractsByMonth.map((item) => Number((item.amount / 10000).toFixed(2))),
        smooth: true,
        itemStyle: {
          color: '#52c41a',
        },
        lineStyle: {
          width: 3,
        },
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

  const bomCostOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const param = params[0];
        return `${param.name}<br/>成本: ¥${param.value.toLocaleString()}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value / 10000).toFixed(0)}万`,
      },
    },
    yAxis: {
      type: 'category',
      data: bomAnalysis.slice(0, 10).map((item) => item.material_name).reverse(),
    },
    series: [
      {
        name: '成本',
        type: 'bar',
        data: bomAnalysis.slice(0, 10).map((item) => item.total_cost).reverse(),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#722ed1' },
              { offset: 1, color: '#1890ff' },
            ],
          },
          borderRadius: [0, 4, 4, 0],
        },
        label: {
          show: true,
          position: 'right',
          formatter: (params: any) => `¥${(params.value / 10000).toFixed(1)}万`,
        },
      },
    ],
  };

  const performanceColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => {
        const colors = ['#f5222d', '#fa8c16', '#faad14', '#d9d9d9', '#d9d9d9'];
        return (
          <Text strong style={{ color: colors[index] || '#d9d9d9', fontSize: 16 }}>
            {index + 1}
          </Text>
        );
      },
    },
    {
      title: '姓名',
      dataIndex: 'real_name',
      key: 'real_name',
      width: 100,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={role === 'designer' ? 'blue' : 'purple'}>
          {role === 'designer' ? '设计师' : '门店经理'}
        </Tag>
      ),
    },
    {
      title: '合同数',
      dataIndex: 'contract_count',
      key: 'contract_count',
      width: 100,
      render: (count: number) => <Text strong>{count} 份</Text>,
    },
    {
      title: '业绩金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          ¥{amount?.toLocaleString() || 0}
        </Text>
      ),
    },
  ];

  const warrantyColumns = [
    {
      title: '合同编号',
      dataIndex: 'contract_no',
      key: 'contract_no',
      width: 160,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>,
    },
    {
      title: '合同金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => (
        <Text strong style={{ color: '#f5222d' }}>
          ¥{amount?.toLocaleString() || 0}
        </Text>
      ),
    },
    {
      title: '业主',
      dataIndex: 'owner_name',
      key: 'owner_name',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'owner_phone',
      key: 'owner_phone',
      width: 130,
    },
    {
      title: '竣工日期',
      dataIndex: 'end_date',
      key: 'end_date',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '质保到期日',
      dataIndex: 'warranty_expire',
      key: 'warranty_expire',
      width: 110,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '剩余天数',
      dataIndex: 'days_remaining',
      key: 'days_remaining',
      width: 100,
      render: (days: number) => {
        const daysNum = Math.floor(days || 0);
        const isUrgent = daysNum < 365;
        return (
          <Space>
            <Progress
              type="circle"
              percent={Math.min(100, Math.max(0, daysNum / 36.5))}
              size={40}
              strokeColor={isUrgent ? '#ff4d4f' : '#52c41a'}
              format={() => ''}
            />
            <Text strong style={{ color: isUrgent ? '#ff4d4f' : '#52c41a' }}>
              {daysNum} 天
            </Text>
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          管理数据看板
        </Title>
        <Text type="secondary">
          实时监控业务运营数据，辅助决策分析
        </Text>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              style={{
                borderRadius: 12,
                border: 'none',
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: 0 }}
            >
              <div
                style={{
                  background: card.gradient,
                  padding: 24,
                  color: '#fff',
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{card.title}</Text>
                    <div style={{ fontSize: 32, fontWeight: 700, marginTop: 8 }}>
                      {card.isMoney
                        ? `¥${card.value?.toLocaleString() || 0}`
                        : card.value?.toLocaleString() || 0}
                      <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4 }}>{card.suffix}</span>
                    </div>
                  </div>
                  <div style={{ opacity: 0.9 }}>{card.icon}</div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {warrantyTracking.some((w) => Math.floor(w.days_remaining || 0) < 365) && (
        <Alert
          message="质保预警"
          description={
            <span>
              <WarningOutlined style={{ marginRight: 8 }} />
              有 {warrantyTracking.filter((w) => Math.floor(w.days_remaining || 0) < 365).length} 个项目的十年质保即将在1年内到期，请及时处理
            </span>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            title="需求状态分布"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <ReactECharts
              option={demandPieOption}
              style={{ height: 300 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card
            title="近6个月合同签约趋势"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <ReactECharts
              option={contractTrendOption}
              style={{ height: 300 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="材料BOM成本分析 TOP10"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 16 }}
          >
            <ReactECharts
              option={bomCostOption}
              style={{ height: 350 }}
              opts={{ renderer: 'svg' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="设计师与门店经理业绩排行"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              rowKey="real_name"
              columns={performanceColumns}
              dataSource={performance}
              loading={loading}
              pagination={false}
              scroll={{ y: 320 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="十年质保即将到期项目"
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              rowKey="id"
              columns={warrantyColumns}
              dataSource={warrantyTracking}
              loading={loading}
              pagination={false}
              scroll={{ y: 320, x: 800 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
