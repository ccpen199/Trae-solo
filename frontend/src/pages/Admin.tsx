import { useCallback, useEffect, useState } from 'react';
import {
  Badge, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Progress, Row, Select, Space, Statistic, Table, Tabs, Tag, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, DashboardOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/utils/api';

type DashboardStats = {
  usersCount: number;
  projectsCount: number;
  activeProjects: number;
  pendingInspections: number;
  ownersCount: number;
  designersCount: number;
  companiesCount: number;
  suppliersCount: number;
  completedProjects: number;
  totalRevenue: number;
};

type CityPriceIndex = {
  id: number;
  city: string;
  index_value: number;
  month: string;
  trend?: number;
};

type DesignerHeat = {
  id: number;
  name: string;
  availability: string;
  rating: number;
  experience_years: number;
  active_projects: number;
  load: string;
  specialties: string[];
};

type Complaint = {
  id: number;
  category: string;
  project_id: number;
  project_title?: string;
  root_cause?: string;
  status: string;
  description: string;
  created_at: string;
};

type Transaction = {
  id: number;
  type: string;
  amount: number;
  project_id: number;
  project_title?: string;
  status: string;
  created_at: string;
};

type Reconciliation = {
  total_deposits: number;
  total_payments: number;
  total_refunds: number;
  total_fines: number;
  net_flow: number;
  pending_count: number;
  failed_count: number;
  transactions: Transaction[];
};

const availabilityLabels: Record<string, string> = {
  available: '可接单',
  busy: '忙碌',
  offline: '离线',
};

const loadColors: Record<string, string> = {
  low: 'green',
  medium: 'gold',
  high: 'red',
};

const loadLabels: Record<string, string> = {
  low: '低负载',
  medium: '中负载',
  high: '高负载',
};

const complaintStatusColors: Record<string, string> = {
  open: 'red',
  processing: 'orange',
  resolved: 'green',
  closed: 'default',
};

const complaintStatusLabels: Record<string, string> = {
  open: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);

  const [cityPrices, setCityPrices] = useState<CityPriceIndex[]>([]);
  const [cityPriceLoading, setCityPriceLoading] = useState(false);
  const [cityPriceEditOpen, setCityPriceEditOpen] = useState(false);
  const [editingCityPrice, setEditingCityPrice] = useState<CityPriceIndex | null>(null);
  const [cityPriceForm] = Form.useForm();

  const [designers, setDesigners] = useState<DesignerHeat[]>([]);
  const [designerLoading, setDesignerLoading] = useState(false);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintLoading, setComplaintLoading] = useState(false);

  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
  const [reconLoading, setReconLoading] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setDashboard(res.data.data);
    } catch {
      // silent
    }
  }, []);

  const fetchCityPrices = useCallback(async () => {
    setCityPriceLoading(true);
    try {
      const res = await api.get('/admin/city-price-indices');
      setCityPrices(res.data.data || []);
    } catch {
      // silent
    } finally {
      setCityPriceLoading(false);
    }
  }, []);

  const fetchDesigners = useCallback(async () => {
    setDesignerLoading(true);
    try {
      const res = await api.get('/admin/designer-heatmap');
      setDesigners(res.data.data || []);
    } catch {
      // silent
    } finally {
      setDesignerLoading(false);
    }
  }, []);

  const fetchComplaints = useCallback(async () => {
    setComplaintLoading(true);
    try {
      const res = await api.get('/admin/complaints');
      setComplaints(res.data.data || []);
    } catch {
      // silent
    } finally {
      setComplaintLoading(false);
    }
  }, []);

  const fetchReconciliation = useCallback(async () => {
    setReconLoading(true);
    try {
      const res = await api.get('/admin/reconciliation');
      setReconciliation(res.data.data);
    } catch {
      // silent
    } finally {
      setReconLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (activeTab === 'city-price') fetchCityPrices();
  }, [activeTab, fetchCityPrices]);

  useEffect(() => {
    if (activeTab === 'designer-heatmap') fetchDesigners();
  }, [activeTab, fetchDesigners]);

  useEffect(() => {
    if (activeTab === 'complaints') fetchComplaints();
  }, [activeTab, fetchComplaints]);

  useEffect(() => {
    if (activeTab === 'reconciliation') fetchReconciliation();
  }, [activeTab, fetchReconciliation]);

  async function handleSaveCityPrice(values: Omit<CityPriceIndex, 'id'> & { id?: number }) {
    try {
      if (editingCityPrice?.id) {
        await api.patch(`/admin/city-price-indices/${editingCityPrice.id}`, values);
      } else {
        await api.post('/admin/city-price-indices', values);
      }
      message.success('保存成功');
      setCityPriceEditOpen(false);
      setEditingCityPrice(null);
      cityPriceForm.resetFields();
      fetchCityPrices();
    } catch {
      message.error('保存失败');
    }
  }

  async function handleDeleteCityPrice(id: number) {
    try {
      await api.delete(`/admin/city-price-indices/${id}`);
      message.success('删除成功');
      fetchCityPrices();
    } catch {
      message.error('删除失败');
    }
  }

  const stats = dashboard || {
    usersCount: 0, projectsCount: 0, activeProjects: 0, pendingInspections: 0,
    ownersCount: 0, designersCount: 0, companiesCount: 0, suppliersCount: 0,
    completedProjects: 0, totalRevenue: 0,
  };

  const cityPriceColumns: ColumnsType<CityPriceIndex> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '城市', dataIndex: 'city', key: 'city', width: 100 },
    { title: '指数值', dataIndex: 'index_value', key: 'index_value', width: 100, render: (v) => v.toFixed(2) },
    { title: '月份', dataIndex: 'month', key: 'month', width: 100 },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 80,
      render: (v) => {
        if (v === undefined || v === null) return '-';
        if (v > 0) return <Tag color="red">↑ {v.toFixed(1)}%</Tag>;
        if (v < 0) return <Tag color="green">↓ {Math.abs(v).toFixed(1)}%</Tag>;
        return <Tag>持平</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingCityPrice(record); cityPriceForm.setFieldsValue(record); setCityPriceEditOpen(true); }}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCityPrice(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const designerColumns: ColumnsType<DesignerHeat> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100 },
    {
      title: '状态',
      dataIndex: 'availability',
      key: 'availability',
      width: 90,
      render: (v) => {
        const color = v === 'available' ? 'green' : v === 'busy' ? 'orange' : 'default';
        return <Badge status={color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'default'} text={availabilityLabels[v] || v} />;
      },
    },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 70, render: (v) => v?.toFixed(1) || '-' },
    { title: '经验(年)', dataIndex: 'experience_years', key: 'experience_years', width: 80 },
    { title: '活跃项目', dataIndex: 'active_projects', key: 'active_projects', width: 90 },
    {
      title: '负载',
      dataIndex: 'load',
      key: 'load',
      width: 120,
      render: (v) => (
        <Space>
          <Tag color={loadColors[v] || 'default'}>{loadLabels[v] || v}</Tag>
          <Progress percent={v === 'high' ? 90 : v === 'medium' ? 55 : 25} size="small" strokeColor={loadColors[v] || 'default'} style={{ width: 60 }} />
        </Space>
      ),
    },
    {
      title: '专长',
      dataIndex: 'specialties',
      key: 'specialties',
      render: (v: string[]) => v?.length > 0 ? v.map((s) => <Tag key={s} color="blue">{s}</Tag>) : '-',
    },
  ];

  function buildComplaintAnalysis() {
    const categoryCount: Record<string, number> = {};
    const projectCount: Record<string, number> = {};
    const rootCauseCount: Record<string, number> = {};
    const statusCount: Record<string, number> = {};

    complaints.forEach((c) => {
      categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      projectCount[c.project_title || `项目#${c.project_id}`] = (projectCount[c.project_title || `项目#${c.project_id}`] || 0) + 1;
      if (c.root_cause) rootCauseCount[c.root_cause] = (rootCauseCount[c.root_cause] || 0) + 1;
      statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });

    return { categoryCount, projectCount, rootCauseCount, statusCount };
  }

  const transactionColumns: ColumnsType<Transaction> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (v) => {
        const typeLabels: Record<string, string> = { deposit: '定金', payment: '付款', refund: '退款', fine: '罚款' };
        const typeColors: Record<string, string> = { deposit: 'blue', payment: 'green', refund: 'orange', fine: 'red' };
        return <Tag color={typeColors[v] || 'default'}>{typeLabels[v] || v}</Tag>;
      },
    },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 110, render: (v) => `¥${Number(v).toLocaleString()}` },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true, render: (v, r) => v || `项目#${r.project_id}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v) => {
        const labels: Record<string, string> = { pending: '待处理', completed: '已完成', failed: '失败' };
        const colors: Record<string, string> = { pending: 'orange', completed: 'green', failed: 'red' };
        return <Tag color={colors[v] || 'default'}>{labels[v] || v}</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ];

  function renderOverview() {
    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="注册用户" value={stats.usersCount} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="项目总数" value={stats.projectsCount} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="进行中" value={stats.activeProjects} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="已完工" value={stats.completedProjects} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="待验收" value={stats.pendingInspections} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="总收入" value={stats.totalRevenue} prefix="¥" /></Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="角色分布">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="业主">{stats.ownersCount}</Descriptions.Item>
                <Descriptions.Item label="设计师">{stats.designersCount}</Descriptions.Item>
                <Descriptions.Item label="装企">{stats.companiesCount}</Descriptions.Item>
                <Descriptions.Item label="供应商">{stats.suppliersCount}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="项目状态">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>规划中 → 施工中 → 验收中 → 已完工</div>
                <Progress percent={stats.projectsCount > 0 ? Math.round((stats.completedProjects / stats.projectsCount) * 100) : 0} />
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  function renderCityPrice() {
    const cityMap = new Map<string, CityPriceIndex[]>();
    cityPrices.forEach((cp) => {
      if (!cityMap.has(cp.city)) cityMap.set(cp.city, []);
      cityMap.get(cp.city)!.push(cp);
    });

    return (
      <>
        <Row justify="space-between" style={{ marginBottom: 16 }}>
          <Col><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCityPrice(null); cityPriceForm.resetFields(); setCityPriceEditOpen(true); }}>新增指数</Button></Col>
        </Row>
        <Table rowKey="id" columns={cityPriceColumns} dataSource={cityPrices} loading={cityPriceLoading} pagination={false} />
        {cityMap.size > 0 && (
          <Card title="趋势概览" size="small" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              {Array.from(cityMap.entries()).map(([city, items]) => {
                const sorted = [...items].sort((a, b) => a.month.localeCompare(b.month));
                const latest = sorted[sorted.length - 1];
                return (
                  <Col xs={12} sm={8} lg={6} key={city}>
                    <Card size="small">
                      <Statistic title={city} value={latest?.index_value || 0} suffix={latest?.trend !== undefined ? (latest.trend > 0 ? `↑${latest.trend.toFixed(1)}%` : latest.trend < 0 ? `↓${Math.abs(latest.trend).toFixed(1)}%` : '持平') : ''} valueStyle={{ color: latest?.trend && latest.trend > 0 ? '#cf1322' : latest?.trend && latest.trend < 0 ? '#3f8600' : undefined }} />
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        )}
      </>
    );
  }

  function renderDesignerHeatmap() {
    return <Table rowKey="id" columns={designerColumns} dataSource={designers} loading={designerLoading} pagination={false} />;
  }

  function renderComplaints() {
    const analysis = buildComplaintAnalysis();
    const totalComplaints = complaints.length;

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card><Statistic title="投诉总数" value={totalComplaints} valueStyle={{ color: '#cf1322' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card><Statistic title="待处理" value={analysis.statusCount['open'] || 0} valueStyle={{ color: '#fa8c16' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card><Statistic title="处理中" value={analysis.statusCount['processing'] || 0} valueStyle={{ color: '#1677ff' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card><Statistic title="已解决" value={analysis.statusCount['resolved'] || 0} valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="类别分布" size="small">
              {Object.entries(analysis.categoryCount).map(([cat, count]) => (
                <div key={cat} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{cat}</span><span>{count}</span></div>
                  <Progress percent={totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0} size="small" />
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="项目分布" size="small">
              {Object.entries(analysis.projectCount).slice(0, 5).map(([proj, count]) => (
                <div key={proj} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{proj}</span><span>{count}</span></div>
                  <Progress percent={totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0} size="small" />
                </div>
              ))}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="根因分析" size="small">
              {Object.entries(analysis.rootCauseCount).length > 0 ? Object.entries(analysis.rootCauseCount).map(([cause, count]) => (
                <div key={cause} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{cause}</span><span>{count}</span></div>
                  <Progress percent={totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0} size="small" />
                </div>
              )) : <div style={{ color: '#999' }}>暂无根因数据</div>}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="状态分布" size="small">
              <Space wrap>
                {Object.entries(analysis.statusCount).map(([status, count]) => (
                  <Tag key={status} color={complaintStatusColors[status]} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {complaintStatusLabels[status] || status}: {count}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
    );
  }

  function renderReconciliation() {
    const r = reconciliation || {
      total_deposits: 0, total_payments: 0, total_refunds: 0, total_fines: 0,
      net_flow: 0, pending_count: 0, failed_count: 0, transactions: [],
    };

    return (
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="定金总额" value={r.total_deposits} prefix="¥" valueStyle={{ color: '#1677ff' }} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="付款总额" value={r.total_payments} prefix="¥" valueStyle={{ color: '#52c41a' }} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="退款总额" value={r.total_refunds} prefix="¥" valueStyle={{ color: '#fa8c16' }} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="罚款总额" value={r.total_fines} prefix="¥" valueStyle={{ color: '#ff4d4f' }} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card><Statistic title="净流入" value={r.net_flow} prefix="¥" valueStyle={{ color: r.net_flow >= 0 ? '#52c41a' : '#ff4d4f' }} /></Card>
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Card>
              <Space direction="vertical">
                <Statistic title="待处理" value={r.pending_count} valueStyle={{ color: '#fa8c16' }} />
                <Statistic title="失败" value={r.failed_count} valueStyle={{ color: '#ff4d4f' }} />
              </Space>
            </Card>
          </Col>
        </Row>
        <Card title="交易流水">
          <Table rowKey="id" columns={transactionColumns} dataSource={r.transactions} loading={reconLoading} pagination={{ pageSize: 10 }} />
        </Card>
      </Space>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Space><DashboardOutlined />管理后台</Space>}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'overview', label: '数据概览', children: renderOverview() },
            { key: 'city-price', label: '城市价格指数', children: renderCityPrice() },
            { key: 'designer-heatmap', label: '设计师热力图', children: renderDesignerHeatmap() },
            { key: 'complaints', label: '投诉分析', children: renderComplaints() },
            { key: 'reconciliation', label: '资金对账', children: renderReconciliation() },
          ]}
        />
      </Card>

      <Modal
        title={editingCityPrice ? '编辑价格指数' : '新增价格指数'}
        open={cityPriceEditOpen}
        onCancel={() => { setCityPriceEditOpen(false); setEditingCityPrice(null); cityPriceForm.resetFields(); }}
        onOk={() => cityPriceForm.submit()}
      >
        <Form form={cityPriceForm} layout="vertical" onFinish={handleSaveCityPrice}>
          <Form.Item name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
            <Input placeholder="请输入城市名称" />
          </Form.Item>
          <Form.Item name="index_value" label="指数值" rules={[{ required: true, message: '请输入指数值' }]}>
            <InputNumber style={{ width: '100%' }} min={0} precision={2} />
          </Form.Item>
          <Form.Item name="month" label="月份" rules={[{ required: true, message: '请输入月份' }]}>
            <Input placeholder="如：2024-01" />
          </Form.Item>
          <Form.Item name="trend" label="趋势(%)">
            <InputNumber style={{ width: '100%' }} placeholder="正数为上涨，负数为下跌" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
