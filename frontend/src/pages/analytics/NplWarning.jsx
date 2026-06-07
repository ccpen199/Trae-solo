import React, { useEffect, useState } from 'react';
import { Typography, Spin, Row, Col, Card, Statistic, Tag, Table, Alert, message, Progress, Result, Button, Space } from 'antd';
import { AlertOutlined, WarningOutlined, CheckCircleOutlined, RiseOutlined, EyeOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const { Title } = Typography;

export default function NplWarning() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/npl-warning').then(r => setData(r.data)).catch(e => message.error(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!data) return <div>暂无数据</div>;

  const levelConfig = {
    red: { icon: <AlertOutlined />, color: '#ff4d4f', text: '高风险', desc: '不良率超过5%，需立即采取风险缓释措施' },
    yellow: { icon: <WarningOutlined />, color: '#faad14', text: '关注', desc: '不良率3%-5%，需加强贷后管理' },
    green: { icon: <CheckCircleOutlined />, color: '#52c41a', text: '正常', desc: '不良率低于3%，整体风险可控' },
  };

  const cfg = levelConfig[data.warningLevel] || levelConfig.green;

  const columns = [
    { title: '产品名称', dataIndex: 'name', width: 140 },
    { title: '贷款笔数', dataIndex: 'loan_count', width: 100 },
    { title: '贷款总额(万)', dataIndex: 'total_amount', width: 130, render: v => (v / 10000).toLocaleString() },
    { title: '平均单笔(万)', dataIndex: 'avg_amount', width: 120, render: v => (v / 10000).toFixed(1) },
    { title: '不良笔数', width: 100, render: (_, r) => Math.round(r.loan_count * r.npl_rate / 100) },
    { title: '不良金额(万)', width: 120, render: (_, r) => Math.round(r.total_amount * r.npl_rate / 1000000) },
    { title: '不良率(%)', dataIndex: 'npl_rate', width: 120, render: v => {
      const c = v >= 5 ? 'red' : v >= 3 ? 'orange' : 'green';
      return <Tag color={c} style={{ fontWeight: 600, fontSize: 14 }}>{v.toFixed(2)}%</Tag>;
    } },
    { title: '预警等级', dataIndex: 'npl_rate', width: 100, render: v => {
      const lvl = v >= 5 ? 'red' : v >= 3 ? 'yellow' : 'green';
      const icon = lvl === 'red' ? <AlertOutlined /> : lvl === 'yellow' ? <WarningOutlined /> : <CheckCircleOutlined />;
      return <Tag color={lvl} icon={icon}>{levelConfig[lvl].text}</Tag>;
    } },
    { title: '风险明细', width: 150, render: (_, r) => (
      <Space>
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => navigate('/finance/loans')}>查看明细</Button>
      </Space>
    ) },
  ];

  const mockTrend = [
    { month: '2026-01', rate: 2.1 },
    { month: '2026-02', rate: 2.3 },
    { month: '2026-03', rate: 2.2 },
    { month: '2026-04', rate: 2.5 },
    { month: '2026-05', rate: 2.35 },
    { month: '2026-06', rate: data.nplRate },
  ];

  const highRiskProducts = (data.byProduct || []).filter(p => p.npl_rate >= 3);

  return (
    <div>
      <Title level={4}>涉农贷款不良率预警看板</Title>

      <Alert
        message={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, color: cfg.color }}>{cfg.icon}</span>
            <span>当前整体不良率 <b style={{ fontSize: 20, color: cfg.color }}>{data.nplRate.toFixed(2)}%</b> - <span style={{ fontWeight: 600 }}>{cfg.text}</span></span>
          </div>
        }
        description={cfg.desc}
        type={data.warningLevel === 'red' ? 'error' : data.warningLevel === 'yellow' ? 'warning' : 'success'}
        showIcon={false}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card size="small" bordered style={{ borderLeft: `4px solid ${cfg.color}` }}>
            <Statistic title="总贷款笔数" value={data.totalLoans} suffix="笔" />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" bordered style={{ borderLeft: '4px solid #388E3C' }}>
            <Statistic title="总贷款余额" value={data.totalLoanAmount} suffix="元" precision={0} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" bordered style={{ borderLeft: `4px solid ${cfg.color}` }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>不良率(警戒线 5%)</div>
            <Progress percent={Math.round(data.nplRate * 20)} status={data.warningLevel === 'red' ? 'exception' : data.warningLevel === 'yellow' ? 'normal' : 'success'} strokeColor={{ '0%': '#52c41a', '50%': '#faad14', '100%': '#ff4d4f' }} />
            <div style={{ fontSize: 20, fontWeight: 700, color: cfg.color }}>{data.nplRate.toFixed(2)}%</div>
          </Card>
        </Col>
      </Row>

      {highRiskProducts.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {highRiskProducts.map(p => (
            <Col xs={24} md={12} key={p.name}>
              <Result
                status="warning"
                title={`${p.name} - 关注预警`}
                subTitle={`不良率 ${p.npl_rate.toFixed(2)}%，超过关注阈值3%，涉及余额 ${Math.round(p.total_amount / 10000)}万元`}
                extra={<Button type="primary" size="small">查看风险缓释建议</Button>}
              />
            </Col>
          ))}
        </Row>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="不良率趋势" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 6]} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#ff4d4f" name="不良率(%)" strokeWidth={2} dot={{ fill: '#ff4d4f' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="各产品不良率" size="small">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.byProduct || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 6]} />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="npl_rate" name="不良率(%)" radius={[0, 4, 4, 0]}>
                  {(data.byProduct || []).map((p, i) => (
                    <rect key={i} fill={p.npl_rate >= 5 ? '#ff4d4f' : p.npl_rate >= 3 ? '#faad14' : '#52c41a'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card title="按产品风险明细" size="small" style={{ marginTop: 16 }}>
        <Table rowKey="name" columns={columns} dataSource={data.byProduct || []} pagination={false} size="small" />
      </Card>

      <Card title="预警处置建议" size="small" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Alert
              message="加强贷后管理"
              description="对逾期超过30天的贷款，逐户制定催收方案，落实客户经理包片责任"
              type="warning"
              showIcon
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="优化风控模型"
              description="结合人行征信、农业农村部确权数据，调整信用评分阈值，提高风控精准度"
              type="info"
              showIcon
            />
          </Col>
          <Col xs={24} md={8}>
            <Alert
              message="风险缓释"
              description="对活体抵押贷款，落实畜禽保险和耳标追踪；对土地经营权抵押，办理确权登记"
              type="warning"
              showIcon
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}
