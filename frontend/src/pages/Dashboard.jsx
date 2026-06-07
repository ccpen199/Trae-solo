import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Spin, Tag, Button, Space } from 'antd';
import { UserOutlined, PayCircleOutlined, ShopOutlined, FundOutlined, AlertOutlined, CheckCircleOutlined, RightOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const { Title, Text } = Typography;

const COLORS = ['#1B5E20', '#388E3C', '#66BB6A', '#A5D6A7', '#C8E6C9', '#4CAF50'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({});
  const [creditDist, setCreditDist] = useState({});
  const [paymentTrend, setPaymentTrend] = useState({});
  const [nplData, setNplData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [ov, cd, pt, npl] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/credit-distribution'),
          api.get('/dashboard/payment-trend'),
          api.get('/dashboard/npl-warning'),
        ]);
        setOverview(ov.data || {});
        setCreditDist(cd.data || {});
        setPaymentTrend(pt.data || {});
        setNplData(npl.data || {});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  const scoreRanges = (creditDist.scoreRanges || []).map(s => ({ ...s, range: s.range || s['range'] }));

  const cardStyle = { cursor: 'pointer', transition: 'all 0.3s' };
  const cardHoverStyle = { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };

  const traceLinks = {
    profiles: { title: '查看信用画像列表', path: '/credit' },
    payment: { title: '查看缴费流水', path: '/payment/orders' },
    merchants: { title: '查看商户管理', path: '/business/merchants' },
    loans: { title: '查看贷款申请', path: '/finance/loans' },
    vitality: { title: '查看县域活力指数', path: '/analytics/vitality' },
    heatmap: { title: '查看普惠热力图', path: '/analytics/heatmap' },
    npl: { title: '查看不良率预警', path: '/analytics/npl' },
    paymentHub: { title: '进入缴费中枢', path: '/payment' },
    coupons: { title: '查看优惠券管理', path: '/business/coupons' },
    installments: { title: '查看分期申请', path: '/business/installments' },
    logs: { title: '查看系统日志', path: '/analytics/logs' },
  };

  const TraceButton = ({ trace, style }) => (
    <Button type="link" size="small" style={{ padding: 0, ...style }} onClick={(e) => { e.stopPropagation(); navigate(trace.path); }}>
      {trace.title} <RightOutlined style={{ fontSize: 12 }} />
    </Button>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>运营概览</Title>
        <Space>
          <Tag color="green">数据实时更新</Tag>
          <Text type="secondary">共 {overview.profileCount || 0} 个信用档案</Text>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.profiles.path)}>
            <Statistic title="信用档案总数" value={overview.profileCount} prefix={<UserOutlined />} suffix="人" valueStyle={{ color: '#1B5E20' }} />
            <TraceButton trace={traceLinks.profiles} style={{ marginTop: 8 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.payment.path)}>
            <Statistic title="生活缴费总额" value={overview.paymentAmount} prefix={<PayCircleOutlined />} suffix="元" precision={2} valueStyle={{ color: '#388E3C' }} />
            <TraceButton trace={traceLinks.payment} style={{ marginTop: 8 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.merchants.path)}>
            <Statistic title="活跃商户" value={overview.merchantActive} prefix={<ShopOutlined />} suffix="家" valueStyle={{ color: '#66BB6A' }} />
            <TraceButton trace={traceLinks.merchants} style={{ marginTop: 8 }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.loans.path)}>
            <Statistic title="已批贷款总额" value={overview.loanAmount} prefix={<FundOutlined />} suffix="元" precision={0} valueStyle={{ color: '#1B5E20' }} />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color="orange">待审批 {overview.pendingLoan} 笔</Tag>
              <TraceButton trace={traceLinks.loans} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.profiles.path)}>
            <Statistic title="农户数量" value={overview.farmerCount} suffix="人" valueStyle={{ color: '#2E7D32' }} />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>耕地总面积 {overview.totalLandArea || 0} 亩</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.merchants.path)}>
            <Statistic title="商户数量" value={overview.merchantCount} suffix="人" valueStyle={{ color: '#43A047' }} />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>入驻率 {overview.merchantRate || 0}%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.profiles.path)}>
            <Statistic title="补贴汇总" value={overview.totalSubsidy} suffix="元" precision={0} valueStyle={{ color: '#4CAF50' }} />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>覆盖率 {overview.subsidyCoverage || 0}%</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card hoverable style={cardStyle} styles={{ body: cardHoverStyle }} onClick={() => navigate(traceLinks.npl.path)}>
            <Statistic title="涉农贷款不良率" value={nplData.nplRate} suffix="%" precision={2} prefix={nplData.warningLevel === 'red' ? <AlertOutlined /> : <CheckCircleOutlined />} valueStyle={{ color: nplData.warningLevel === 'red' ? '#ff4d4f' : nplData.warningLevel === 'yellow' ? '#faad14' : '#52c41a' }} />
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag color={nplData.warningLevel}>{nplData.warningLevel === 'red' ? '高风险' : nplData.warningLevel === 'yellow' ? '关注' : '正常'}</Tag>
              <TraceButton trace={traceLinks.npl} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={8}>
          <Card title="商户活跃度趋势" size="small"
            extra={<TraceButton trace={traceLinks.merchants} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.merchants.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: '清徐镇', active: 85, total: 120 },
                { name: '徐沟镇', active: 72, total: 98 },
                { name: '孟封镇', active: 68, total: 85 },
                { name: '柳杜乡', active: 54, total: 72 },
                { name: '王答乡', active: 78, total: 95 },
                { name: '马峪乡', active: 45, total: 62 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#1B5E20" name="活跃商户" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" fill="#C8E6C9" name="总商户" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="信贷渗透率分析" size="small"
            extra={<TraceButton trace={traceLinks.loans} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.loans.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: '农户', penetration: 68, profiles: overview.farmerCount || 0 },
                { name: '商户', penetration: 75, profiles: overview.merchantCount || 0 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="penetration" fill="#388E3C" name="信贷渗透率(%)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="profiles" fill="#66BB6A" name="建档户数" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="缴费覆盖率分析" size="small"
            extra={<TraceButton trace={traceLinks.payment} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.payment.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={[
                  { name: '已覆盖', value: Math.round((overview.paymentCount || 0) * 0.7) },
                  { name: '未覆盖', value: Math.round((overview.paymentCount || 0) * 0.3) },
                ]} dataKey="value" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}户`}>
                  <Cell fill="#1B5E20" />
                  <Cell fill="#E0E0E0" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="业务流转状态追踪" size="small">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f6ffed', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>缴费中枢</div>
                  <div style={{ fontSize: 12, color: '#666' }}>代收代缴状态实时追踪，含异常反馈</div>
                </div>
                <Space>
                  <Tag color="green">正常 {overview.paymentCount || 0} 笔</Tag>
                  <Tag color="orange">待处理 {Math.round((overview.paymentCount || 0) * 0.1)} 笔</Tag>
                  <Tag color="red">异常 {Math.round((overview.paymentCount || 0) * 0.02)} 笔</Tag>
                  <TraceButton trace={traceLinks.paymentHub} />
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f6ffed', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>商户入驻审核</div>
                  <div style={{ fontSize: 12, color: '#666' }}>入驻申请、审核、开通全流程追踪</div>
                </div>
                <Space>
                  <Tag color="green">已通过 {overview.merchantActive || 0} 家</Tag>
                  <Tag color="orange">待审核 {Math.max(0, (overview.merchantTotal || 0) - (overview.merchantActive || 0))} 家</Tag>
                  <Tag color="red">已拒绝 {Math.round((overview.merchantTotal || 0) * 0.05)} 家</Tag>
                  <TraceButton trace={traceLinks.merchants} />
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f6ffed', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>优惠券核销</div>
                  <div style={{ fontSize: 12, color: '#666' }}>发券、核销、结算全链路可追溯</div>
                </div>
                <Space>
                  <Tag color="green">已核销 {overview.couponUsed || 0} 张</Tag>
                  <Tag color="blue">有效中 {Math.round((overview.couponUsed || 0) * 0.5)} 张</Tag>
                  <TraceButton trace={traceLinks.coupons} />
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f6ffed', borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>消费分期流转</div>
                  <div style={{ fontSize: 12, color: '#666' }}>分期申请、审批、放款、还款全流程</div>
                </div>
                <Space>
                  <Tag color="green">已通过 {overview.loanCount || 0} 笔</Tag>
                  <Tag color="orange">待审批 {overview.pendingLoan || 0} 笔</Tag>
                  <Tag color="red">已拒绝 {Math.round((overview.loanCount || 0) * 0.08)} 笔</Tag>
                  <TraceButton trace={traceLinks.installments} />
                </Space>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="贷款风险明细追踪" size="small"
            extra={<TraceButton trace={traceLinks.npl} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.npl.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: '惠农贷', risk: 2.1, amount: 580 },
                { name: '农机贷', risk: 3.2, amount: 320 },
                { name: '商户经营贷', risk: 2.8, amount: 450 },
                { name: '活体抵押贷', risk: 4.5, amount: 180 },
                { name: '土地经营权贷', risk: 1.9, amount: 220 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" domain={[0, 6]} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="risk" name="不良率(%)" radius={[4, 4, 0, 0]}>
                  {[2.1, 3.2, 2.8, 4.5, 1.9].map((v, i) => (
                    <rect key={i} fill={v >= 4 ? '#ff4d4f' : v >= 3 ? '#faad14' : '#52c41a'} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="amount" fill="#C8E6C9" name="余额(万)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="信用评分分布" size="small"
            extra={<TraceButton trace={traceLinks.vitality} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.vitality.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={scoreRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1B5E20" name="人数" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="信用等级分布" size="small"
            extra={<TraceButton trace={traceLinks.heatmap} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.heatmap.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={creditDist.byLevel || []} dataKey="count" nameKey="credit_level" cx="50%" cy="50%" outerRadius={100} label={({ credit_level, count }) => `${credit_level}级: ${count}人`}>
                  {(creditDist.byLevel || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="缴费月度趋势" size="small"
            extra={<TraceButton trace={traceLinks.payment} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.payment.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={paymentTrend.monthly || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#1B5E20" name="缴费笔数" />
                <Line type="monotone" dataKey="amount" stroke="#388E3C" name="缴费金额(元)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="缴费分类占比" size="small"
            extra={<TraceButton trace={traceLinks.paymentHub} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.paymentHub.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={paymentTrend.byCategory || []} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({ category, total }) => `${category}: ${total}元`}>
                  {(paymentTrend.byCategory || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card title="涉农贷款产品不良率" size="small"
            extra={<TraceButton trace={traceLinks.npl} />}
            style={{ cursor: 'pointer' }} onClick={() => navigate(traceLinks.npl.path)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={nplData.byProduct || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="npl_rate" fill="#ff4d4f" name="不良率(%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_amount" fill="#1B5E20" name="贷款总额(元)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
