import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card, Tabs, Row, Col, Statistic, Table, Tag, Button, Modal, Form, Input,
  Select, Space, Typography, message, theme
} from 'antd';
import {
  DashboardOutlined,
  HeatMapOutlined,
  MenuOutlined,
  AuditOutlined,
  PayCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import request from '../utils/request';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const mockStats = {
  totalFarmers: 1258,
  totalFinance: 1865.5,
  totalApplications: 324,
  approvalRate: 87.5,
  villageCount: 12,
  userActivity: 5823,
};

const monthlyStats = [
  { month: '1月', farmers: 85, finance: 120, applications: 18 },
  { month: '2月', farmers: 92, finance: 145, applications: 22 },
  { month: '3月', farmers: 108, finance: 180, applications: 28 },
  { month: '4月', farmers: 115, finance: 210, applications: 32 },
  { month: '5月', farmers: 128, finance: 245, applications: 38 },
  { month: '6月', farmers: 142, finance: 280, applications: 45 },
];

const mockHeatmap = [
  { village: '和平村', 水稻: 85, 小麦: 45, 玉米: 60, 蔬菜: 30, 生猪: 120, 鸡: 500, 鱼: 25 },
  { village: '幸福村', 水稻: 120, 小麦: 80, 玉米: 40, 茶叶: 45, 牛: 35, 羊: 80, 鱼: 60 },
  { village: '民主村', 水稻: 70, 玉米: 95, 水果: 50, 药材: 30, 生猪: 80, 鸭: 200, 水产: 45 },
  { village: '团结村', 小麦: 110, 大豆: 75, 蔬菜: 55, 水果: 40, 牛: 45, 生猪: 95, 鸡: 350 },
  { village: '光明村', 水稻: 95, 茶叶: 60, 药材: 45, 水果: 35, 羊: 120, 牛: 28, 蜂: 80 },
];

const mockMenuItems = [
  { id: 1, name: '办事指南', icon: 'FileTextOutlined', town: 'A镇', sort: 1 },
  { id: 2, name: '惠农补贴', icon: 'DollarOutlined', town: 'A镇', sort: 2 },
  { id: 3, name: '政务服务', icon: 'BankOutlined', town: 'A镇', sort: 3 },
  { id: 4, name: '农业技术', icon: 'ExperimentOutlined', town: 'A镇', sort: 4 },
  { id: 5, name: '办事指南', icon: 'FileTextOutlined', town: 'B镇', sort: 1 },
  { id: 6, name: '村情介绍', icon: 'HomeOutlined', town: 'B镇', sort: 2 },
];

const mockPendingContent = [
  { id: 1, title: '关于2025年中稻种植补贴的通知', type: '政策公告', submitter: '李主任', submitTime: '2025-06-05 09:30' },
  { id: 2, title: '幸福村一组土地确权公示', type: '三资管理', submitter: '王会计', submitTime: '2025-06-04 14:20' },
  { id: 3, title: '和平村林场租赁招标公告', type: '项目招标', submitter: '张副主任', submitTime: '2025-06-03 11:15' },
  { id: 4, title: '关于5月份低保发放名单的公示', type: '低保公示', submitter: '赵民政', submitTime: '2025-06-02 16:45' },
  { id: 5, title: '2025年第二季度财务收支明细', type: '三资管理', submitter: '王会计', submitTime: '2025-06-01 10:00' },
];

const mockPayments = [
  { id: 1, orderNo: 'PAY20250601001', item: '农机购置补贴', payer: '张三', amount: 12500.00, status: '已支付', payTime: '2025-06-05 10:30:25', channel: '社保卡' },
  { id: 2, orderNo: 'PAY20250601002', item: '种粮一次性补贴', payer: '李四', amount: 1260.00, status: '已支付', payTime: '2025-06-04 15:20:10', channel: '社保卡' },
  { id: 3, orderNo: 'PAY20250601003', item: '低保金(5月)', payer: '王五', amount: 580.00, status: '支付中', payTime: '-', channel: '社保卡' },
  { id: 4, orderNo: 'PAY20250601004', item: '农村养老保险', payer: '赵六', amount: 300.00, status: '已支付', payTime: '2025-06-03 09:15:40', channel: '微信' },
  { id: 5, orderNo: 'PAY20250601005', item: '新农合医疗保险', payer: '孙七', amount: 380.00, status: '待支付', payTime: '-', channel: '-' },
  { id: 6, orderNo: 'PAY20250601006', item: '农机贷款还款', payer: '周八', amount: 3520.50, status: '支付失败', payTime: '2025-06-02 12:00:00', channel: '银行卡' },
];

const industries = ['水稻', '小麦', '玉米', '大豆', '蔬菜', '水果', '茶叶', '药材', '生猪', '牛', '羊', '鸡', '鸭', '鱼', '蜂', '水产'];
const towns = ['A镇', 'B镇', 'C镇'];
const iconOptions = ['FileTextOutlined', 'DollarOutlined', 'BankOutlined', 'ExperimentOutlined', 'HomeOutlined', 'UserOutlined', 'BookOutlined'];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuItems, setMenuItems] = useState(mockMenuItems);
  const [selectedTown, setSelectedTown] = useState('A镇');
  const [pendingContent, setPendingContent] = useState(mockPendingContent);
  const [payments, setPayments] = useState(mockPayments);
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [menuForm] = Form.useForm();
  const { token } = theme.useToken();
  const location = useLocation();

  const tabMap = {
    stats: 'dashboard',
    heatmap: 'heatmap',
    menu: 'menu',
    review: 'review',
    payments: 'payments',
  };

  useEffect(() => {
    if (location.state?.tab) {
      const mappedTab = tabMap[location.state.tab] || location.state.tab;
      setActiveTab(mappedTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const maxFarmers = Math.max(...monthlyStats.map((s) => s.farmers));
  const maxFinance = Math.max(...monthlyStats.map((s) => s.finance));
  const maxApplications = Math.max(...monthlyStats.map((s) => s.applications));

  const maxHeatValue = Math.max(...mockHeatmap.flatMap((h) => industries.map((i) => h[i] || 0).filter(Boolean)));

  const getHeatColor = (value) => {
    if (!value) return 'transparent';
    const ratio = value / maxHeatValue;
    if (ratio > 0.7) return '#52c41a';
    if (ratio > 0.4) return '#95de64';
    if (ratio > 0.2) return '#d9f7be';
    return '#f6ffed';
  };

  const getHeatTextColor = (value) => {
    if (!value) return '#999';
    const ratio = value / maxHeatValue;
    return ratio > 0.4 ? '#fff' : '#333';
  };

  const heatColumns = [
    { title: '行政村', dataIndex: 'village', key: 'village', fixed: 'left', width: 100 },
    ...industries.slice(0, 10).map((i) => ({
      title: i,
      dataIndex: i,
      key: i,
      width: 70,
      align: 'center',
      render: (v) => v ? (
        <div style={{
          background: getHeatColor(v),
          color: getHeatTextColor(v),
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          fontWeight: 500,
        }}>
          {v}
        </div>
      ) : <span style={{ color: '#ccc' }}>-</span>,
    })),
  ];

  const reviewColumns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100, render: (v) => <Tag color="blue">{v}</Tag> },
    { title: '提交人', dataIndex: 'submitter', key: 'submitter', width: 80 },
    { title: '提交时间', dataIndex: 'submitTime', key: 'submitTime', width: 160 },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              setPendingContent((prev) => prev.filter((p) => p.id !== record.id));
              message.success('审核通过');
            }}
          >
            通过
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setPendingContent((prev) => prev.filter((p) => p.id !== record.id));
              message.success('已拒绝');
            }}
          >
            拒绝
          </Button>
        </Space>
      )
    },
  ];

  const paymentColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo', width: 160 },
    { title: '支付项目', dataIndex: 'item', key: 'item' },
    { title: '收款人', dataIndex: 'payer', key: 'payer', width: 80 },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', width: 100, render: (v) => `¥${v.toFixed(2)}` },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => {
        const colors = {
          '已支付': 'green',
          '支付中': 'orange',
          '待支付': 'default',
          '支付失败': 'red',
        };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      }
    },
    { title: '支付时间', dataIndex: 'payTime', key: 'payTime', width: 170 },
    { title: '渠道', dataIndex: 'channel', key: 'channel', width: 80 },
  ];

  const filteredPayments = paymentFilter === 'all'
    ? payments
    : payments.filter((p) => p.status === paymentFilter);

  const filteredMenuItems = menuItems.filter((m) => m.town === selectedTown).sort((a, b) => a.sort - b.sort);

  const handleDragStart = (item) => {
    setDraggedItem(item);
  };

  const handleDrop = (targetItem) => {
    if (!draggedItem || draggedItem.id === targetItem.id) return;
    const newItems = [...filteredMenuItems];
    const dragIdx = newItems.findIndex((i) => i.id === draggedItem.id);
    const targetIdx = newItems.findIndex((i) => i.id === targetItem.id);
    const [removed] = newItems.splice(dragIdx, 1);
    newItems.splice(targetIdx, 0, removed);
    const reIndexed = newItems.map((item, idx) => ({ ...item, sort: idx + 1 }));
    setMenuItems((prev) => [
      ...prev.filter((m) => m.town !== selectedTown),
      ...reIndexed,
    ]);
    setDraggedItem(null);
    message.success('排序已更新');
  };

  const handleSaveMenuItem = async (values) => {
    try {
      const newItem = {
        ...values,
        id: Date.now(),
        town: selectedTown,
        sort: filteredMenuItems.length + 1,
      };
      await request.post('/admin/menu', newItem).catch(() => {});
      setMenuItems((prev) => [...prev, newItem]);
      message.success('菜单添加成功');
      setMenuModalVisible(false);
      menuForm.resetFields();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteMenuItem = (id) => {
    setMenuItems((prev) => prev.filter((m) => m.id !== id));
    message.success('已删除');
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: '数据概览',
      icon: <DashboardOutlined />,
      children: (
        <div>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="农户总数" value={mockStats.totalFarmers} valueStyle={{ color: '#52c41a' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="累计发放贷款" value={mockStats.totalFinance} suffix="万元" valueStyle={{ color: '#1890ff' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="贷款申请数" value={mockStats.totalApplications} valueStyle={{ color: '#722ed1' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="审批通过率" value={mockStats.approvalRate} suffix="%" valueStyle={{ color: '#fa8c16' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="行政村数" value={mockStats.villageCount} valueStyle={{ color: '#13c2c2' }} />
              </Card>
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Card size="small">
                <Statistic title="今日活跃" value={mockStats.userActivity} valueStyle={{ color: '#eb2f96' }} />
              </Card>
            </Col>
          </Row>

          <Card title="近6个月数据趋势" size="small">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Title level={5} style={{ marginBottom: 12 }}>新增农户</Title>
                {monthlyStats.map((s) => (
                  <div key={s.month} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 36, fontSize: 12, color: '#666' }}>{s.month}</span>
                    <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(s.farmers / maxFarmers) * 100}%`,
                        height: '100%',
                        background: token.colorPrimary,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#333' }}>{s.farmers}</span>
                  </div>
                ))}
              </Col>
              <Col xs={24} md={8}>
                <Title level={5} style={{ marginBottom: 12 }}>金融发放(万元)</Title>
                {monthlyStats.map((s) => (
                  <div key={s.month} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 36, fontSize: 12, color: '#666' }}>{s.month}</span>
                    <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(s.finance / maxFinance) * 100}%`,
                        height: '100%',
                        background: '#1890ff',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#333' }}>{s.finance}</span>
                  </div>
                ))}
              </Col>
              <Col xs={24} md={8}>
                <Title level={5} style={{ marginBottom: 12 }}>贷款申请</Title>
                {monthlyStats.map((s) => (
                  <div key={s.month} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 36, fontSize: 12, color: '#666' }}>{s.month}</span>
                    <div style={{ flex: 1, height: 20, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${(s.applications / maxApplications) * 100}%`,
                        height: '100%',
                        background: '#722ed1',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#333' }}>{s.applications}</span>
                  </div>
                ))}
              </Col>
            </Row>
          </Card>
        </div>
      ),
    },
    {
      key: 'heatmap',
      label: '产业热力图',
      icon: <HeatMapOutlined />,
      children: (
        <Card title="各村产业分布热力图" size="small" extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
            <span>热度：</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#f6ffed', border: '1px solid #d9d9d9' }} /> 低
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#d9f7be' }} /> 中低
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#95de64' }} /> 中
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ display: 'inline-block', width: 16, height: 16, background: '#52c41a' }} /> 高
            </span>
          </div>
        }>
          <Table
            size="small"
            rowKey="village"
            columns={heatColumns}
            dataSource={mockHeatmap}
            pagination={false}
            scroll={{ x: 900 }}
          />
        </Card>
      ),
    },
    {
      key: 'menu',
      label: '服务菜单',
      icon: <MenuOutlined />,
      children: (
        <Card
          title="服务菜单配置"
          size="small"
          extra={
            <Space>
              <Select value={selectedTown} onChange={setSelectedTown} style={{ width: 140 }}>
                {towns.map((t) => (
                  <Option key={t} value={t}>{t}</Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  menuForm.resetFields();
                  setMenuModalVisible(true);
                }}
              >
                添加菜单
              </Button>
            </Space>
          }
        >
          <div style={{ color: '#888', fontSize: 12, marginBottom: 16 }}>
            拖动菜单项调整排序顺序
          </div>
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(item)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginBottom: 8,
                background: draggedItem?.id === item.id ? '#e6f7ff' : '#fff',
                border: '1px solid #f0f0f0',
                borderRadius: 6,
                cursor: 'move',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#999', width: 24 }}>{item.sort}.</span>
                <MenuOutlined style={{ color: '#ccc' }} />
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                <Tag color="blue" style={{ fontSize: 11 }}>{item.icon}</Tag>
              </div>
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteMenuItem(item.id)}
              >
                删除
              </Button>
            </div>
          ))}
          {filteredMenuItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
              暂无菜单配置
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'review',
      label: '内容审核',
      icon: <AuditOutlined />,
      children: (
        <Card title="待审核内容" size="small">
          <Table
            size="small"
            rowKey="id"
            columns={reviewColumns}
            dataSource={pendingContent}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 600 }}
          />
        </Card>
      ),
    },
    {
      key: 'payment',
      label: '支付管理',
      icon: <PayCircleOutlined />,
      children: (
        <Card
          title="支付记录管理"
          size="small"
          extra={
            <Select value={paymentFilter} onChange={setPaymentFilter} style={{ width: 140 }}>
              <Option value="all">全部</Option>
              <Option value="已支付">已支付</Option>
              <Option value="支付中">支付中</Option>
              <Option value="待支付">待支付</Option>
              <Option value="支付失败">支付失败</Option>
            </Select>
          }
        >
          <Table
            size="small"
            rowKey="id"
            columns={paymentColumns}
            dataSource={filteredPayments}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 800 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Card title="运营管理后台" size="small" style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title="添加服务菜单"
        open={menuModalVisible}
        onCancel={() => setMenuModalVisible(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 520}
      >
        <Form form={menuForm} layout="vertical" onFinish={handleSaveMenuItem} size="middle">
          <Form.Item name="name" label="菜单名称" rules={[{ required: true }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item name="icon" label="图标" rules={[{ required: true }]}>
            <Select placeholder="请选择图标">
              {iconOptions.map((i) => (
                <Option key={i} value={i}>{i}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => setMenuModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
