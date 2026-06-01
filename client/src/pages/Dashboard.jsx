import { useCallback, useEffect, useState } from 'react';
import { Card, Col, Row, Space, Statistic, Table, Tag, message, Progress, Timeline, Alert, Tabs, Badge } from 'antd';
import { SafetyCertificateOutlined, WarningOutlined, CheckCircleOutlined, StopOutlined, RollbackOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { getDashboardStats } from '../api';
import dayjs from 'dayjs';

const statCardStyle = { height: '100%' };

const RISK_LEVEL_MAP = {
  high: { color: 'red', text: '高风险' },
  medium: { color: 'orange', text: '中风险' },
  low: { color: 'green', text: '低风险' },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const animalColumns = [
    { title: '动物种类', dataIndex: 'animal_type' },
    { title: '入场批次', dataIndex: 'count', width: 120 },
  ];

  const abnormalColumns = [
    { title: '批次号', dataIndex: 'batch_no', width: 180, ellipsis: true },
    { title: '养殖场', dataIndex: 'farm_name', ellipsis: true },
    { title: '动物种类', dataIndex: 'animal_type', width: 90 },
    { title: '无害化处理', dataIndex: 'harmless_treatment', ellipsis: true },
    { title: '状态', dataIndex: 'status', width: 90, render: () => <Tag color="red">不合格</Tag> },
  ];

  const sourceRiskColumns = [
    { title: '来源地区', dataIndex: 'farm_address', ellipsis: true },
    { title: '总批次', dataIndex: 'total', width: 80 },
    { title: '不合格批次', dataIndex: 'disqualified', width: 100, render: (v) => <Tag color="red">{v}</Tag> },
    {
      title: '风险率',
      dataIndex: 'risk_rate',
      width: 120,
      render: (v, record) => {
        const rate = record.total > 0 ? (record.disqualified / record.total * 100) : 0;
        const color = rate >= 20 ? 'red' : rate >= 10 ? 'orange' : 'green';
        return (
          <Space>
            <Progress percent={rate.toFixed(1)} size="small" strokeColor={color} />
          </Space>
        );
      },
    },
    {
      title: '风险等级',
      width: 100,
      render: (_, record) => {
        const rate = record.total > 0 ? (record.disqualified / record.total * 100) : 0;
        const level = rate >= 20 ? 'high' : rate >= 10 ? 'medium' : 'low';
        const info = RISK_LEVEL_MAP[level];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  const enterpriseComplianceColumns = [
    { title: '排名', dataIndex: 'rank', width: 70, render: (v) => v === 1 ? <Badge color="gold" text={`第${v}名`} /> : `第${v}名` },
    { title: '养殖场', dataIndex: 'farm_name', ellipsis: true },
    { title: '总批次', dataIndex: 'total', width: 80 },
    { title: '合格批次', dataIndex: 'qualified', width: 90, render: (v) => <Tag color="green">{v}</Tag> },
    {
      title: '合规率',
      dataIndex: 'compliance_rate',
      width: 140,
      render: (v) => (
        <Space>
          <Progress percent={v} size="small" strokeColor={v >= 90 ? '#52c41a' : v >= 70 ? '#faad14' : '#ff4d4f'} />
          <span style={{ color: v >= 90 ? '#52c41a' : v >= 70 ? '#faad14' : '#ff4d4f', fontWeight: 600 }}>{v}%</span>
        </Space>
      ),
    },
    {
      title: '趋势',
      width: 80,
      render: (_, record) => {
        if (record.trend === 'up') return <Tag color="green" icon={<RiseOutlined />}>上升</Tag>;
        if (record.trend === 'down') return <Tag color="red" icon={<FallOutlined />}>下降</Tag>;
        return <Tag>稳定</Tag>;
      },
    },
  ];

  const recallStatsColumns = [
    { title: '时间', dataIndex: 'period', width: 120 },
    { title: '召回次数', dataIndex: 'count', width: 90, render: (v) => <Tag color="red">{v}</Tag> },
    { title: '影响重量(kg)', dataIndex: 'affected_weight', width: 120 },
    { title: '完成率', dataIndex: 'completion_rate', width: 140, render: (v) => <Progress percent={v} size="small" /> },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} loading={loading}>
            <Statistic title="入场总批次" value={stats?.total_entries || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} loading={loading}>
            <Statistic title="入场合格率" value={stats?.compliance_rate || 0} precision={2} suffix="%" prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} loading={loading}>
            <Statistic title="召回总数" value={stats?.total_recalls || 0} prefix={<RollbackOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={statCardStyle} loading={loading}>
            <Statistic title="异常处置" value={stats?.total_harmless_treatments || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'overview',
            label: '总体概览',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                  <Card title="动物种类分布" loading={loading}>
                    <Table
                      rowKey="animal_type"
                      size="small"
                      columns={animalColumns}
                      dataSource={stats?.animal_type_distribution || []}
                      pagination={false}
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="证书状态" loading={loading}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Statistic title="有效证书" value={stats?.valid_certificates || 0} valueStyle={{ color: '#3f8600' }} />
                      <Statistic title="召回证书" value={stats?.recalled_certificates || 0} valueStyle={{ color: '#cf1322' }} />
                      <Statistic title="检疫证书总数" value={stats?.total_certificates || 0} />
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card title="召回统计概览" loading={loading}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Statistic title="进行中召回" value={stats?.active_recalls || 0} valueStyle={{ color: '#cf1322' }} prefix={<StopOutlined />} />
                      <Statistic title="召回完成率" value={stats?.recall_completion_rate || 0} precision={1} suffix="%" valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
                      <Statistic title="召回影响总重量(kg)" value={stats?.total_recall_affected_weight || 0} precision={1} />
                    </Space>
                  </Card>
                </Col>
              </Row>
            ),
          },
          {
            key: 'source-risk',
            label: '来源风险分析',
            children: (
              <Card title="按来源地区风险分析" loading={loading} extra={<Alert type="info" showIcon message="风险率 = 不合格批次 / 总批次 × 100%" size="small" />}>
                <Table
                  rowKey="farm_address"
                  size="small"
                  columns={sourceRiskColumns}
                  dataSource={stats?.source_risk_analysis || []}
                  scroll={{ x: 800 }}
                  pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个来源地` }}
                />
              </Card>
            ),
          },
          {
            key: 'enterprise',
            label: '企业合规表现',
            children: (
              <Card title="养殖场合规率排名" loading={loading} extra={<Alert type="info" showIcon message="合规率 = 合格批次 / 总批次 × 100%，按合规率降序排列" size="small" />}>
                <Table
                  rowKey="farm_name"
                  size="small"
                  columns={enterpriseComplianceColumns}
                  dataSource={(stats?.enterprise_compliance || []).map((item, idx) => ({ ...item, rank: idx + 1 }))}
                  scroll={{ x: 900 }}
                  pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 家养殖场` }}
                />
              </Card>
            ),
          },
          {
            key: 'recall-stats',
            label: '召回统计闭环',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title="召回有效性分析" loading={loading}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={8}>
                      <Alert
                        type="success"
                        showIcon
                        icon={<CheckCircleOutlined />}
                        message={`召回完成率：${stats?.recall_effectiveness?.completion_rate || 0}%`}
                        description={`已完成 ${stats?.recall_effectiveness?.completed || 0} 起，共 ${stats?.recall_effectiveness?.total || 0} 起`}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Alert
                        type="warning"
                        showIcon
                        icon={<WarningOutlined />}
                        message={`平均召回响应时间：${stats?.recall_effectiveness?.avg_response_time || 0} 小时`}
                        description="从发现问题到启动召回的平均时间"
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Alert
                        type="info"
                        showIcon
                        icon={<RollbackOutlined />}
                        message={`平均召回完成时间：${stats?.recall_effectiveness?.avg_completion_time || 0} 天`}
                        description="从启动召回到完成的平均时间"
                      />
                    </Col>
                  </Row>
                </Card>
                <Card title="召回趋势统计" loading={loading}>
                  <Table
                    rowKey="period"
                    size="small"
                    columns={recallStatsColumns}
                    dataSource={stats?.recall_statistics || []}
                    pagination={false}
                  />
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <Card title="近期异常屠宰批次" loading={loading}>
        <Table
          rowKey="id"
          columns={abnormalColumns}
          dataSource={stats?.recent_abnormal_batches || []}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      {stats?.recent_audit_logs && stats.recent_audit_logs.length > 0 && (
        <Card title="近期审计记录" loading={loading}>
          <Timeline
            size="small"
            items={stats.recent_audit_logs.slice(0, 10).map((log, idx) => ({
              color: log.type === 'block' ? 'red' : log.type === 'recall' ? 'red' : log.type === 'disposal' ? 'orange' : 'blue',
              children: (
                <div>
                  <Space>
                    <span style={{ fontWeight: 600 }}>{log.action}</span>
                    {log.module && <Tag color="blue">{log.module}</Tag>}
                  </Space>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{log.detail}</div>
                  <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                    {log.operator && `操作人：${log.operator}，`}
                    {log.time && dayjs(log.time).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      )}
    </Space>
  );
}
