import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Row,
  Col,
  Statistic,
  Tabs,
  Tag,
  Space,
  message,
  DatePicker,
} from 'antd';
import {
  ReloadOutlined,
  ExportOutlined,
  BarChartOutlined,
  UserOutlined,
  WarningOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { reportApi } from '../services/api';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState('statistics');
  const [stats, setStats] = useState<any>({});
  const [userEfficiency, setUserEfficiency] = useState<any[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [riskCustomers, setRiskCustomers] = useState<any[]>([]);
  const [riskTotal, setRiskTotal] = useState(0);
  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [dateRange, setDateRange] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    } else if (activeTab === 'userEfficiency') {
      fetchUserEfficiency();
    } else if (activeTab === 'riskCustomers') {
      fetchRiskCustomers();
    } else if (activeTab === 'daily') {
      fetchDailyReports();
    }
  }, [activeTab, page, pageSize]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await reportApi.getStatistics(params);
      setStats(response.data.data);
    } catch (error: any) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEfficiency = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await reportApi.getUserEfficiency(params);
      const { statistics, total } = response.data.data;
      setUserEfficiency(statistics);
      setUserTotal(total);
    } catch (error: any) {
      message.error('获取人员效率数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiskCustomers = async () => {
    setLoading(true);
    try {
      const response = await reportApi.getRiskCustomers({ page, pageSize });
      const { customers, total } = response.data.data;
      setRiskCustomers(customers);
      setRiskTotal(total);
    } catch (error: any) {
      message.error('获取风险客户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReports = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await reportApi.getDailyReports(params);
      const { reports, total } = response.data.data;
      setDailyReports(reports);
      setDailyTotal(total);
    } catch (error: any) {
      message.error('获取日报数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExportRiskCustomers = async () => {
    try {
      const response = await reportApi.exportRiskCustomers();
      const { exportCount } = response.data.data;
      message.success(`成功导出 ${exportCount} 条风险客户数据`);
    } catch (error: any) {
      message.error('导出失败');
    }
  };

  const handleGenerateDailyReport = async () => {
    try {
      const response = await reportApi.generateDailyReport({});
      message.success('日报生成成功');
      fetchDailyReports();
    } catch (error: any) {
      message.error('生成日报失败');
    }
  };

  const riskLevelColors: Record<number, string> = {
    1: 'blue',
    2: 'green',
    3: 'orange',
    4: 'red',
    5: 'magenta',
  };

  const statsColumns = [
    {
      title: '指标',
      key: 'metric',
      render: (_: any, record: any) => record.metric,
    },
    {
      title: '数值',
      key: 'value',
      render: (_: any, record: any) => record.value,
    },
  ];

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (val: string) => (
        <Tag color={val === 'admin' ? 'blue' : 'green'}>
          {val === 'admin' ? '管理员' : '调度员'}
        </Tag>
      ),
    },
    {
      title: '完成订单数',
      dataIndex: 'totalCompleted',
      key: 'totalCompleted',
    },
    {
      title: '平均处理时间(秒)',
      dataIndex: 'avgProcessingTime',
      key: 'avgProcessingTime',
    },
    {
      title: '恶意拒收数',
      dataIndex: 'maliciousRejects',
      key: 'maliciousRejects',
      render: (val: number) => (
        <Tag color={val > 0 ? 'red' : 'default'}>{val}</Tag>
      ),
    },
    {
      title: '最后登录时间',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
  ];

  const riskColumns = [
    {
      title: '手机号',
      dataIndex: 'receiverPhone',
      key: 'receiverPhone',
    },
    {
      title: '拒收次数',
      dataIndex: 'rejectCount',
      key: 'rejectCount',
    },
    {
      title: '恶意拒收次数',
      dataIndex: 'maliciousRejectCount',
      key: 'maliciousRejectCount',
      render: (val: number) => (
        <Tag color={val > 0 ? 'red' : 'default'}>{val}</Tag>
      ),
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      render: (val: number) => (
        <Tag color={riskLevelColors[val] || 'default'}>
          L{val} - {val >= 3 ? '高风险' : val >= 2 ? '中风险' : '低风险'}
        </Tag>
      ),
    },
    {
      title: '是否风险客户',
      dataIndex: 'isRiskCustomer',
      key: 'isRiskCustomer',
      render: (val: boolean) => (
        <Tag color={val ? 'red' : 'green'}>{val ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '最后拒收时间',
      dataIndex: 'lastRejectTime',
      key: 'lastRejectTime',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
  ];

  const dailyColumns = [
    {
      title: '报表日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '总订单数',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
    },
    {
      title: '已调度',
      dataIndex: 'scheduledOrders',
      key: 'scheduledOrders',
    },
    {
      title: '已完成',
      dataIndex: 'completedOrders',
      key: 'completedOrders',
    },
    {
      title: '已过期',
      dataIndex: 'expiredOrders',
      key: 'expiredOrders',
    },
    {
      title: '平均处理时间(秒)',
      dataIndex: 'avgProcessingTime',
      key: 'avgProcessingTime',
    },
    {
      title: '恶意拒收',
      dataIndex: 'maliciousRejects',
      key: 'maliciousRejects',
      render: (val: number) => (
        <Tag color={val > 0 ? 'red' : 'default'}>{val}</Tag>
      ),
    },
  ];

  const createPagination = (total: number) => ({
    current: page,
    pageSize,
    total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条`,
    onChange: (p: number, ps: number) => {
      setPage(p);
      setPageSize(ps);
    },
  });

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">报表统计</h2>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={<span><BarChartOutlined /> 统计概览</span>}
          key="statistics"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['开始日期', '结束日期']}
                />
                <Button icon={<ReloadOutlined />} onClick={fetchStatistics}>
                  刷新
                </Button>
              </Space>
            </div>

            <Row gutter={16} className="stats-row">
              <Col span={4}>
                <Card>
                  <Statistic
                    title="总订单数"
                    value={stats.totalOrders || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="待调度"
                    value={stats.waitingOrders || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<BarChartOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="已调度"
                    value={stats.scheduledOrders || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={stats.completedOrders || 0}
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="已拒绝"
                    value={stats.rejectedOrders || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                    prefix={<StopOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="处理中"
                    value={stats.activeSchedules || 0}
                    valueStyle={{ color: '#1890ff' }}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Card title="处理时效">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="平均处理时间"
                        value={stats.avgProcessingTime || 0}
                        suffix="秒"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="恶意拒收"
                        value={stats.maliciousRejects || 0}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane
          tab={<span><UserOutlined /> 人员效率</span>}
          key="userEfficiency"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['开始日期', '结束日期']}
                />
                <Button icon={<ReloadOutlined />} onClick={fetchUserEfficiency}>
                  刷新
                </Button>
              </Space>
            </div>

            <Table
              columns={userColumns}
              dataSource={userEfficiency}
              rowKey="userId"
              loading={loading}
              pagination={createPagination(userTotal)}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span><WarningOutlined /> 风险客户</span>}
          key="riskCustomers"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={handleExportRiskCustomers}
              >
                导出风险客户
              </Button>
            </div>

            <Table
              columns={riskColumns}
              dataSource={riskCustomers}
              rowKey="id"
              loading={loading}
              pagination={createPagination(riskTotal)}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={<span><FileTextOutlined /> 日报统计</span>}
          key="daily"
        >
          <Card>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder={['开始日期', '结束日期']}
                />
                <Button type="primary" onClick={handleGenerateDailyReport}>
                  生成今日报表
                </Button>
                <Button icon={<ReloadOutlined />} onClick={fetchDailyReports}>
                  刷新
                </Button>
              </Space>
            </div>

            <Table
              columns={dailyColumns}
              dataSource={dailyReports}
              rowKey="id"
              loading={loading}
              pagination={createPagination(dailyTotal)}
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Reports;
