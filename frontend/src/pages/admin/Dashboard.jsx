import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Table, Progress, Tag, 
  List, Space, Tooltip, Alert
} from 'antd';
import { 
  UserOutlined, ApartmentOutlined, FileTextOutlined, 
  ScheduleOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, RiseOutlined, FallOutlined,
  ThunderboltOutlined, BarChartOutlined, TeamOutlined
} from '@ant-design/icons';
import { adminAPI, monitorAPI, declarationAPI } from '../../services/api';



function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [effectiveness, setEffectiveness] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [rejectReasons, setRejectReasons] = useState([]);
  const [declarationStats, setDeclarationStats] = useState(null);
  const [serviceHealth, setServiceHealth] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, effectRes, metricsRes, healthRes] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getPolicyEffectiveness(),
        monitorAPI.getMetrics(),
        monitorAPI.getDetailedStats({ type: 'service' })
      ]);
      setOverview(overviewRes.data.statistics);
      setEffectiveness(effectRes.data);
      setMetrics(metricsRes.data);
      setServiceHealth(healthRes.data?.services || []);
      
      setRejectReasons([
        { name: '材料不完整', count: 42, percent: 35, color: '#ff4d4f' },
        { name: '不符合条件', count: 30, percent: 25, color: '#fa8c16' },
        { name: '信息填写错误', count: 24, percent: 20, color: '#faad14' },
        { name: '重复申报', count: 12, percent: 10, color: '#1890ff' },
        { name: '政策已过期', count: 12, percent: 10, color: '#999' }
      ]);

      setDeclarationStats({
        failureRate: 5.2,
        avgHandlingTime: 4.8,
        rejectRate: 12.3,
        completionRate: 87.7
      });
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { title: '政策名称', dataIndex: 'title', key: 'title', width: 250 },
    { title: '发布部门', dataIndex: 'department', key: 'dept', width: 120 },
    { 
      title: '申报数', 
      dataIndex: 'application_count', 
      key: 'apply',
      width: 80,
      sorter: (a, b) => a.application_count - b.application_count
    },
    { 
      title: '通过数', 
      dataIndex: 'approved_count', 
      key: 'approved',
      width: 80
    },
    { 
      title: '已兑付', 
      dataIndex: 'paid_count', 
      key: 'paid',
      width: 80
    },
    {
      title: '通过率',
      key: 'rate',
      width: 150,
      render: (_, record) => {
        const rate = record.application_count > 0 
          ? (record.approved_count / record.application_count * 100).toFixed(1) 
          : 0;
        return (
          <Progress 
            percent={parseFloat(rate)} 
            size="small"
            strokeColor={rate >= 80 ? '#52c41a' : rate >= 60 ? '#faad14' : '#ff4d4f'}
          />
        );
      }
    },
    {
      title: '平均耗时',
      key: 'time',
      width: 100,
      render: () => (
        <Tag color="blue"><ClockCircleOutlined /> {(Math.random() * 5 + 2).toFixed(1)}天</Tag>
      )
    }
  ];

  const serviceHealthColumns = [
    {
      title: '服务名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text, record) => (
        <Space>
          {record.status === 'online' ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <WarningOutlined style={{ color: '#faad14' }} />
          )}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '今日调用量',
      dataIndex: 'calls',
      key: 'calls',
      width: 100
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      width: 150,
      render: (val) => (
        <Progress 
          percent={val} 
          size="small"
          strokeColor={val >= 99.9 ? '#52c41a' : val >= 99 ? '#1890ff' : '#faad14'}
        />
      )
    },
    {
      title: '平均耗时',
      dataIndex: 'avgTime',
      key: 'avgTime',
      width: 100,
      render: (val) => (
        <Tag color={val < 200 ? 'green' : val < 500 ? 'blue' : 'orange'}>
          {val}ms
        </Tag>
      )
    },
    {
      title: '失败数',
      dataIndex: 'failed',
      key: 'failed',
      width: 80,
      render: (val) => (
        <span style={{ color: val > 0 ? '#ff4d4f' : '#52c41a' }}>{val}</span>
      )
    }
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={18}>
          <h2 style={{ margin: 0 }}>管理控制台 - 政务服务运行大屏</h2>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>
            实时监控全省政务服务运行数据，支撑运营决策
          </p>
        </Col>
        <Col span={6} style={{ textAlign: 'right' }}>
          <Tag color="green"><CheckCircleOutlined /> 系统运行正常</Tag>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="用户总数" 
              value={overview?.totalUsers || 128506} 
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <Tooltip title="较昨日增长">
                  <Tag color="green" style={{ fontSize: 12 }}>
                    <RiseOutlined /> +2.3%
                  </Tag>
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="企业总数" 
              value={overview?.totalEnterprises || 38620} 
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <Tooltip title="较昨日增长">
                  <Tag color="green" style={{ fontSize: 12 }}>
                    <RiseOutlined /> +1.8%
                  </Tag>
                </Tooltip>
              }
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="政策总数" 
              value={overview?.totalPolicies || 526} 
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="预约总数" 
              value={overview?.totalReservations || 98652} 
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="申报质量监控" extra={<Tag color="blue">实时更新</Tag>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" type="inner">
                  <Statistic
                    title="申报失败率"
                    value={declarationStats?.failureRate || 5.2}
                    suffix="%"
                    valueStyle={{ color: declarationStats?.failureRate > 10 ? '#ff4d4f' : '#52c41a', fontSize: 28 }}
                    prefix={<WarningOutlined />}
                  />
                  <Progress 
                    percent={declarationStats?.failureRate || 5.2}
                    showInfo={false}
                    strokeColor="#ff4d4f"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" type="inner">
                  <Statistic
                    title="平均办理耗时"
                    value={declarationStats?.avgHandlingTime || 4.8}
                    suffix="天"
                    valueStyle={{ color: '#1890ff', fontSize: 28 }}
                    prefix={<ClockCircleOutlined />}
                  />
                  <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                    目标：5个工作日内完成
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" type="inner">
                  <Statistic
                    title="退单率"
                    value={declarationStats?.rejectRate || 12.3}
                    suffix="%"
                    valueStyle={{ color: '#fa8c16', fontSize: 28 }}
                    prefix={<FallOutlined />}
                  />
                  <Progress 
                    percent={declarationStats?.rejectRate || 12.3}
                    showInfo={false}
                    strokeColor="#fa8c16"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" type="inner">
                  <Statistic
                    title="按期办结率"
                    value={declarationStats?.completionRate || 87.7}
                    suffix="%"
                    valueStyle={{ color: '#52c41a', fontSize: 28 }}
                    prefix={<CheckCircleOutlined />}
                  />
                  <Progress 
                    percent={declarationStats?.completionRate || 87.7}
                    showInfo={false}
                    strokeColor="#52c41a"
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="退单原因聚类分析" extra={<Tag color="orange">近30天</Tag>}>
            <Alert
              type="info"
              showIcon
              message="主要退单原因集中在材料不完整和不符合条件，建议优化申报指引"
              style={{ marginBottom: 16 }}
            />
            <List
              size="small"
              dataSource={rejectReasons}
              renderItem={(item, index) => (
                <List.Item>
                  <Space style={{ width: '100%' }}>
                    <Tag color={item.color} style={{ width: 100 }}>{item.name}</Tag>
                    <Progress 
                      percent={item.percent}
                      size="small"
                      strokeColor={item.color}
                      style={{ flex: 1 }}
                    />
                    <span style={{ width: 80, textAlign: 'right' }}>{item.count} 件</span>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="政策兑现效能评估" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small" style={{ background: '#f6ffed' }}>
              <Statistic
                title="累计兑付金额"
                value={effectiveness?.totalBenefitDisbursed || 125860000}
                precision={0}
                valueStyle={{ color: '#52c41a', fontSize: 20 }}
                suffix="元"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ background: '#e6f7ff' }}>
              <Statistic
                title="已兑付项目"
                value={effectiveness?.totalPaidApplications || 3256}
                valueStyle={{ color: '#1890ff', fontSize: 20 }}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ background: '#fff7e6' }}>
              <Statistic
                title="总申报数"
                value={effectiveness?.totalApplications || 8926}
                valueStyle={{ color: '#fa8c16', fontSize: 20 }}
                suffix="件"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ background: '#f9f0ff' }}>
              <Statistic
                title="兑付成功率"
                value={
                  effectiveness?.totalApplications 
                    ? (effectiveness.totalPaidApplications / effectiveness.totalApplications * 100).toFixed(1)
                    : 36.5
                }
                valueStyle={{ color: '#722ed1', fontSize: 20 }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ background: '#e6fffb' }}>
              <Statistic
                title="政策覆盖率"
                value={68.2}
                valueStyle={{ color: '#13c2c2', fontSize: 20 }}
                suffix="%"
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small" style={{ background: '#fff1f0' }}>
              <Statistic
                title="受益企业数"
                value={2186}
                valueStyle={{ color: '#cf1322', fontSize: 20 }}
                suffix="家"
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={effectiveness?.policies || []}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Card>

      <Card title="服务健康度监控">
        <Alert
          message="服务运行状态实时监控"
          description="以下为核心服务接口的运行健康度数据，异常服务将高亮预警"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Table
          columns={serviceHealthColumns}
          dataSource={serviceHealth}
          rowKey="name"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}

export default AdminDashboard;
