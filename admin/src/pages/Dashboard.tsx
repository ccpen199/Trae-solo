import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Empty } from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, RiseOutlined, TeamOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import { http } from '../utils/request';
import {
  Column, Column as ColumnChart, ColumnConfig, Area, Area as AreaChart, Pie, Pie as PieChart,
  ColumnConfig as ColumnType
} from '@ant-design/charts';
import dayjs from 'dayjs';

interface DashboardData {
  totalApplies: number;
  reviewings: number;
  approved: number;
  rejected: number;
  todayNew: number;
  avgDuration: number;
  dailyTrend: { date: string; newApplies: number; approved: number; rejected: number }[];
  categoryDist: { category: string; count: number }[];
  workload: { reviewer: string; processing: number; done: number }[];
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  const mockData = (): DashboardData => ({
    totalApplies: 2846, reviewings: 142, approved: 2621, rejected: 83, todayNew: 38,
    avgDuration: 2.3,
    dailyTrend: Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day').format('MM-DD');
      return { date: d, newApplies: 30 + Math.floor(Math.random() * 25), approved: 25 + Math.floor(Math.random() * 20), rejected: Math.floor(Math.random() * 5) };
    }),
    categoryDist: [
      { category: '市场主体登记', count: 1423 }, { category: '行政许可', count: 569 },
      { category: '变更登记', count: 427 }, { category: '注销登记', count: 285 },
      { category: '年度报告', count: 142 }
    ],
    workload: [
      { reviewer: '王审核', processing: 32, done: 456 },
      { reviewer: '赵复审', processing: 28, done: 398 },
      { reviewer: '孙受理', processing: 45, done: 721 },
      { reviewer: '管理员', processing: 37, done: 518 }
    ]
  });

  useEffect(() => {
    (async () => {
      try {
        const d = await http.get<DashboardData>('/admin/dashboard');
        setData(d);
      } catch {
        setData(mockData());
      }
    })();
  }, []);

  if (!data) return <Empty description="加载中..." />;

  const statCards = [
    { title: '累计申请总数', value: data.totalApplies, icon: <FileTextOutlined />, color: '#1E5DAB', bg: '#e8f1fb' },
    { title: '待审核中', value: data.reviewings, icon: <ClockCircleOutlined />, color: '#faad14', bg: '#fffbe6' },
    { title: '已审批通过', value: data.approved, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: '已驳回', value: data.rejected, icon: <CloseCircleOutlined />, color: '#ff4d4f', bg: '#fff1f0' },
    { title: '今日新增', value: data.todayNew, icon: <ThunderboltOutlined />, color: '#eb2f96', bg: '#fff0f6' },
    { title: '平均审批时长', value: data.avgDuration, icon: <RiseOutlined />, color: '#722ed1', bg: '#f9f0ff', suffix: '天' },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} md={8} lg={4} key={i}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Row gutter={12} align="middle">
                <Col>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, background: s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: s.color
                  }}>{s.icon}</div>
                </Col>
                <Col flex="auto">
                  <Statistic title={s.title} value={s.value} valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                    suffix={s.suffix as any} />
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 七日申请与审批趋势" bordered={false} style={{ borderRadius: 10 }}>
            <AreaChart
              data={data.dailyTrend}
              xField="date"
              yField={['newApplies', 'approved']}
              color={['#1E5DAB', '#52c41a']}
              legend={{ position: 'top' }}
              smooth
              height={300}
              areaStyle={{ fillOpacity: 0.15 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="🥧 业务类别分布" bordered={false} style={{ borderRadius: 10 }}>
            <PieChart
              data={data.categoryDist}
              angleField="count"
              colorField="category"
              radius={0.85}
              height={300}
              legend={{ position: 'bottom', layout: 'vertical' }}
              label={{ text: 'category', content: '{name}\n{d}件' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="👥 审核人员工作量" bordered={false} style={{ borderRadius: 10 }}>
            <ColumnChart
              data={data.workload}
              xField="reviewer"
              yField={['processing', 'done']}
              isGroup
              height={280}
              color={['#faad14', '#52c41a']}
              label={{ position: 'top' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="🎯 最近受理的申请" bordered={false} style={{ borderRadius: 10 }}>
            <Table
              size="small" pagination={false}
              columns={[
                { title: '申请ID', dataIndex: 'id', width: 110 },
                { title: '事项名称', dataIndex: 'name', ellipsis: true },
                { title: '申请人', dataIndex: 'applicant', width: 70 },
                {
                  title: '状态', dataIndex: 'status', width: 80,
                  render: (v: string) => {
                    const map: any = {
                      submitted: <Tag color="orange">待受理</Tag>,
                      reviewing: <Tag color="blue">审核中</Tag>,
                      approved: <Tag color="green">已通过</Tag>,
                      rejected: <Tag color="red">驳回</Tag>
                    };
                    return map[v] || v;
                  }
                }
              ]}
              dataSource={[
                { id: 'APP20240515001', name: '个体工商户设立登记', applicant: '张**', status: 'reviewing' },
                { id: 'APP20240515002', name: '食品经营许可证核发', applicant: '李**', status: 'submitted' },
                { id: 'APP20240515003', name: '有限公司设立', applicant: '王**', status: 'reviewing' },
                { id: 'APP20240515004', name: '变更登记-经营范围', applicant: '赵**', status: 'approved' },
                { id: 'APP20240515005', name: '年度报告公示', applicant: '孙**', status: 'rejected' }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, borderRadius: 10, border: '1px solid #e0e7ff', background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}
        bordered={false}>
        <Row gutter={24} align="middle">
          <Col>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#1E5DAB', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
            }}>🔒</div>
          </Col>
          <Col flex="auto">
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
              合规安全保障
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
              • 符合《电子签名法》《密码法》《政务云安全规范》&nbsp;&nbsp;
              • 全程使用 SM2/SM3/SM4 国家商用密码算法&nbsp;&nbsp;
              • 对接省级可信时间戳 (TSA)，签署证据可固化&nbsp;&nbsp;
              • 审计日志全量保留，支持司法举证
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DashboardPage;
