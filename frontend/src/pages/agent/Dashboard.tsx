import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Table, Button, Tag, Modal, Form, Input, Select, DatePicker, message, Space } from 'antd';
import { HomeOutlined, UserOutlined, BankOutlined, ScheduleOutlined, PhoneOutlined, TeamOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import api from '../../utils/request';

const { Option } = Select;

export default function AgentDashboard() {
  const [stats, setStats] = useState<any>({});
  const [recentViewings, setRecentViewings] = useState<any[]>([]);
  const [recentFollowups, setRecentFollowups] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [viewings, setViewings] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [followupVisible, setFollowupVisible] = useState(false);
  const [viewingVisible, setViewingVisible] = useState(false);
  const [form] = Form.useForm();
  const [viewingForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'viewings') loadViewings();
    if (activeTab === 'customers') loadCustomers();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res: any = await api.get('/agent/dashboard');
      setStats(res.stats || {});
      setRecentViewings(res.recentViewings || []);
      setRecentFollowups(res.recentFollowups || []);
      setMonthlyData(res.monthlyData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadViewings = async () => {
    try {
      const res: any = await api.get('/agent/viewings');
      setViewings(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCustomers = async () => {
    try {
      const res: any = await api.get('/agent/customers');
      setCustomers(res.list || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFollowup = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/agent/followups', {
        customerId: values.customerId,
        type: values.type,
        content: values.content,
        nextFollowTime: values.nextFollowTime?.format?.('YYYY-MM-DD HH:mm:ss') || null,
      });
      message.success('跟进记录已添加');
      setFollowupVisible(false);
      form.resetFields();
      loadDashboard();
      loadCustomers();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const handleAddViewing = async () => {
    try {
      const values = await viewingForm.validateFields();
      await api.post('/agent/viewings', {
        customerId: values.customerId,
        propertyId: values.propertyId,
        viewTime: values.viewTime.format('YYYY-MM-DD HH:mm:ss'),
        feedback: values.feedback,
        rating: values.rating,
      });
      message.success('带看记录已添加');
      setViewingVisible(false);
      viewingForm.resetFields();
      loadViewings();
    } catch (e: any) {
      message.error(e.message || '操作失败');
    }
  };

  const chartOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: monthlyData.map((d: any) => d.month?.slice(0, 7) || ''),
    },
    yAxis: { type: 'value' },
    series: [{
      name: '成交量',
      type: 'bar',
      data: monthlyData.map((d: any) => d.count || 0),
      itemStyle: { color: '#1890ff' },
    }],
  };

  const viewingColumns = [
    { title: '客户', dataIndex: 'customer_name' },
    { title: '客户电话', dataIndex: 'customer_phone' },
    { title: '房源', dataIndex: 'property_title' },
    { title: '带看时间', dataIndex: 'view_time' },
    { title: '评分', dataIndex: 'rating', render: (r: number) => r ? `${r}分` : '-' },
  ];

  return (
    <div className="page-container">
      <Card 
        style={{ borderRadius: 8 }}
        tabList={[
          { key: 'overview', tab: '工作台概览' },
          { key: 'viewings', tab: '带看记录' },
          { key: 'customers', tab: '客户管理' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'overview' && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={4}>
                <Card>
                  <Statistic title="在售房源" value={stats.totalProperties || 0} prefix={<HomeOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="客户数量" value={stats.totalCustomers || 0} prefix={<UserOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="成交套数" value={stats.totalDeals || 0} prefix={<BankOutlined />} valueStyle={{ color: '#52c41a' }} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="累计佣金" value={stats.totalCommission || 0} suffix="万元" precision={2} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="今日带看" value={stats.todayViewings || 0} prefix={<ScheduleOutlined />} />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic title="待跟进" value={stats.pendingFollowups || 0} prefix={<PhoneOutlined />} valueStyle={{ color: '#faad14' }} />
                </Card>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={16}>
                <Card title="月度成交趋势" style={{ borderRadius: 8 }}>
                  <ReactECharts option={chartOption} style={{ height: 300 }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card 
                  title="快捷操作" 
                  style={{ borderRadius: 8 }}
                  extra={<Button type="link" onClick={() => setFollowupVisible(true)}>+ 添加跟进</Button>}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button block onClick={() => setViewingVisible(true)}>
                      新增带看记录
                    </Button>
                    <Button block>
                      发布新房源
                    </Button>
                    <Button block>
                      客户跟进
                    </Button>
                    <Button block>
                      业绩报表
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Card title="最近带看" extra={<Button type="link" onClick={() => setActiveTab('viewings')}>更多</Button>}>
                  <List
                    dataSource={recentViewings}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.customer_name}
                          description={`${item.property_title} · ${item.view_time}`}
                        />
                        {item.rating && <Tag color="blue">{item.rating}分</Tag>}
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="最近跟进" extra={<Button type="link" onClick={() => setActiveTab('customers')}>更多</Button>}>
                  <List
                    dataSource={recentFollowups}
                    renderItem={(item: any) => (
                      <List.Item>
                        <List.Item.Meta
                          title={item.customer_name}
                          description={`${item.type} · ${item.created_at}`}
                        />
                        <Tag color="green">{item.type}</Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </div>
        )}

        {activeTab === 'viewings' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={() => setViewingVisible(true)}>+ 新增带看</Button>
            </div>
            <Table columns={viewingColumns} dataSource={viewings} rowKey="id" />
          </div>
        )}

        {activeTab === 'customers' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={() => setFollowupVisible(true)}>+ 添加跟进</Button>
            </div>
            <Table
              columns={[
                { title: '客户姓名', dataIndex: 'real_name' },
                { title: '联系电话', dataIndex: 'phone' },
                { title: '带看次数', dataIndex: 'view_count' },
                { title: '跟进次数', dataIndex: 'follow_count' },
                { title: '最后跟进', dataIndex: 'last_follow' },
              ]}
              dataSource={customers}
              rowKey="id"
            />
          </div>
        )}
      </Card>

      <Modal
        title="添加客户跟进"
        open={followupVisible}
        onOk={handleAddFollowup}
        onCancel={() => setFollowupVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select placeholder="选择客户">
              {customers.map((c: any) => (
                <Option key={c.id} value={c.id}>{c.real_name} - {c.phone}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="跟进类型" rules={[{ required: true }]}>
            <Select>
              <Option value="phone">电话跟进</Option>
              <Option value="wechat">微信跟进</Option>
              <Option value="visit">上门拜访</Option>
              <Option value="viewing">带看</Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="跟进内容">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="nextFollowTime" label="下次跟进时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新增带看记录"
        open={viewingVisible}
        onOk={handleAddViewing}
        onCancel={() => setViewingVisible(false)}
      >
        <Form form={viewingForm} layout="vertical">
          <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
            <Select placeholder="选择客户">
              {customers.map((c: any) => (
                <Option key={c.id} value={c.id}>{c.real_name} - {c.phone}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="propertyId" label="房源ID" rules={[{ required: true }]}>
            <Input placeholder="请输入房源ID" />
          </Form.Item>
          <Form.Item name="viewTime" label="带看时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="feedback" label="客户反馈">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="rating" label="意向评分">
            <Select>
              <Option value={1}>1分 - 无意向</Option>
              <Option value={2}>2分 - 一般</Option>
              <Option value={3}>3分 - 考虑中</Option>
              <Option value={4}>4分 - 较有意向</Option>
              <Option value={5}>5分 - 强烈意向</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
