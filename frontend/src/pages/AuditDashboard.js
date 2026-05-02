import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  message,
  Typography,
  Alert,
  Button,
  Space,
  Descriptions,
  Modal,
  Tabs
} from 'antd';
import {
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { auditApi, projectApi } from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const riskColors = {
  high: 'red',
  medium: 'orange',
  low: 'green',
  normal: 'default'
};

const riskLabels = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
  normal: '正常'
};

const operationLabels = {
  user_login: '用户登录',
  user_register: '用户注册',
  project_create: '创建项目',
  project_publish: '发布项目',
  project_start_bidding: '开始竞价',
  project_end_bidding: '结束竞价',
  registration_create: '报名项目',
  deposit_lock: '锁定保证金',
  deposit_activate: '激活竞价权',
  deposit_refund: '退回保证金',
  bid_submit: '提交竞价',
  bid_abnormal: '异常竞价',
  confirmation_generate: '生成确认书',
  status_update: '状态更新'
};

const AuditDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [traceModalVisible, setTraceModalVisible] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, projectsRes] = await Promise.all([
        auditApi.getDashboardStats(),
        auditApi.getAuditLogs({ limit: 100 }),
        projectApi.getProjects()
      ]);

      if (statsRes.data.success) {
        setDashboardData(statsRes.data.data);
      }
      if (logsRes.data.success) {
        setAuditLogs(logsRes.data.data || []);
      }
      if (projectsRes.data.success) {
        setProjects(projectsRes.data.data || []);
      }
    } catch (error) {
      message.error('获取审计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTrace = async (projectId) => {
    try {
      const response = await auditApi.getBidTrace(projectId);
      if (response.data.success) {
        setTraceData(response.data.data);
        const project = projects.find(p => p.id === projectId);
        setSelectedProject(project);
        setTraceModalVisible(true);
      }
    } catch (error) {
      message.error('获取轨迹数据失败');
    }
  };

  const handleVerifySignature = async (logId) => {
    try {
      const response = await auditApi.verifySignature(logId);
      if (response.data.success) {
        message.success('签名验证通过，数据未被篡改');
      } else {
        message.error('签名验证失败，数据可能已被篡改');
      }
    } catch (error) {
      message.error('签名验证失败');
    }
  };

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'time',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作类型',
      dataIndex: 'operation',
      key: 'operation',
      width: 150,
      render: (op) => (
        <Tag color="blue">
          {operationLabels[op] || op}
        </Tag>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level) => (
        <Tag color={riskColors[level]}>
          {riskLabels[level]}
        </Tag>
      )
    },
    {
      title: '操作用户',
      dataIndex: ['User', 'realName'],
      key: 'user',
      width: 100,
      render: (name, record) => name || record.User?.username || '系统'
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ip',
      width: 120,
      render: (ip) => ip || '-'
    },
    {
      title: '签名状态',
      dataIndex: 'signature',
      key: 'signature',
      width: 120,
      render: (sig, record) => sig ? (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          已签名
        </Tag>
      ) : (
        <Tag color="orange">未签名</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleVerifySignature(record.id)}
          >
            验证签名
          </Button>
        </Space>
      )
    }
  ];

  const projectColumns = [
    {
      title: '项目编号',
      dataIndex: 'projectNumber',
      key: 'number',
      width: 140
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const colors = {
          draft: 'default',
          announcing: 'blue',
          registration: 'cyan',
          bidding: 'orange',
          completed: 'green',
          finished: 'purple'
        };
        const labels = {
          draft: '草稿',
          announcing: '公告中',
          registration: '报名中',
          bidding: '竞价中',
          completed: '已成交',
          finished: '已完成'
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      }
    },
    {
      title: '竞价次数',
      dataIndex: 'bidCount',
      key: 'bidCount',
      width: 100
    },
    {
      title: '异常出价',
      dataIndex: 'abnormalCount',
      key: 'abnormalCount',
      width: 100,
      render: (count) => count > 0 ? (
        <Tag color="red" icon={<WarningOutlined />}>{count}</Tag>
      ) : <Tag color="green">0</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => handleViewTrace(record.id)}
        >
          查看轨迹
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        <Space>
          <SafetyOutlined style={{ color: '#722ed1' }} />
          审计监管中心
        </Space>
      </Title>

      {dashboardData && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="今日操作日志"
                  value={dashboardData.todayLogs || 0}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="高风险操作"
                  value={dashboardData.highRiskLogs || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="异常出价"
                  value={dashboardData.abnormalBids || 0}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="在途保证金"
                  value={dashboardData.pendingDeposits || 0}
                  prefix={<SafetyOutlined />}
                  suffix="笔"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

          {dashboardData.depositStats && (
            <Card title="保证金托管统计" style={{ marginBottom: 24 }}>
              <Row gutter={[16, 16]}>
                <Col span={4}>
                  <Statistic title="待锁定" value={dashboardData.depositStats.pending} />
                </Col>
                <Col span={4}>
                  <Statistic title="已锁定" value={dashboardData.depositStats.locked} />
                </Col>
                <Col span={4}>
                  <Statistic title="已激活" value={dashboardData.depositStats.activated} />
                </Col>
                <Col span={4}>
                  <Statistic title="已退回" value={dashboardData.depositStats.refunded} />
                </Col>
                <Col span={4}>
                  <Statistic title="已扣除" value={dashboardData.depositStats.deducted} />
                </Col>
                <Col span={4}>
                  <Statistic title="总计" value={dashboardData.depositStats.total} />
                </Col>
              </Row>
            </Card>
          )}
        </>
      )}

      <Card>
        <Tabs defaultActiveKey="logs">
          <TabPane tab="操作日志" key="logs">
            <Alert
              message="操作日志防篡改说明：所有操作记录均使用 HMAC-SHA256 签名，并采用链式哈希确保完整性。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={logColumns}
              dataSource={auditLogs}
              rowKey="id"
              loading={loading}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>
          
          <TabPane tab="项目监控" key="projects">
            <Alert
              message="实时监控项目竞价状态，异常价格波动将自动标记并推送到监管端。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={projectColumns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 个项目`
              }}
            />
          </TabPane>

          <TabPane tab="风险报告" key="risk">
            <Card title="风险评估统计">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="高风险操作"
                      value={auditLogs.filter(l => l.riskLevel === 'high').length}
                      valueStyle={{ color: '#ff4d4f' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="中风险操作"
                      value={auditLogs.filter(l => l.riskLevel === 'medium').length}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card>
                    <Statistic
                      title="正常操作"
                      value={auditLogs.filter(l => l.riskLevel === 'normal' || l.riskLevel === 'low').length}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={
          <Space>
            <HistoryOutlined />
            竞价轨迹图 - {selectedProject?.name}
          </Space>
        }
        open={traceModalVisible}
        onCancel={() => setTraceModalVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setTraceModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {traceData && (
          <>
            <Descriptions bordered size="small" column={3} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="项目编号">
                {traceData.projectInfo?.projectNumber}
              </Descriptions.Item>
              <Descriptions.Item label="总出价次数">
                {traceData.bidCounts?.total}
              </Descriptions.Item>
              <Descriptions.Item label="参与人数">
                {traceData.bidCounts?.uniqueBidders}
              </Descriptions.Item>
              <Descriptions.Item label="异常出价">
                <Tag color={traceData.bidCounts?.abnormal > 0 ? 'red' : 'green'}>
                  {traceData.bidCounts?.abnormal}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最高出价">
                ¥{traceData.bidCounts?.highestAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="最低出价">
                ¥{traceData.bidCounts?.lowestAmount?.toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>竞价轨迹列表（按时间排序）</Title>
            <Table
              columns={[
                {
                  title: '时间',
                  dataIndex: 'createdAt',
                  key: 'time',
                  width: 180,
                  render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
                },
                {
                  title: '竞买人',
                  dataIndex: ['Bidder', 'realName'],
                  key: 'bidder',
                  render: (name, record) => name || record.Bidder?.username
                },
                {
                  title: '出价金额',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (val) => `¥${val.toLocaleString()}`
                },
                {
                  title: '状态',
                  dataIndex: 'isAbnormal',
                  key: 'status',
                  render: (abnormal) => abnormal ? (
                    <Tag color="red" icon={<WarningOutlined />}>异常</Tag>
                  ) : (
                    <Tag color="green">正常</Tag>
                  )
                },
                {
                  title: '签名',
                  dataIndex: 'signature',
                  key: 'signature',
                  render: (sig) => sig ? (
                    <Text type="secondary" copyable={{ text: sig }}>
                      {sig.substring(0, 20)}...
                    </Text>
                  ) : '-'
                }
              ]}
              dataSource={traceData.traceGraph || []}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default AuditDashboard;
