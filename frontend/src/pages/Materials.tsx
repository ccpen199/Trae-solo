import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Form, Input, InputNumber, Modal, Radio, Row, Select, Space, Table, Tabs, Tag, Timeline, message, Image, Divider, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, WarningOutlined, UndoOutlined, EyeOutlined, ShoppingOutlined, TruckOutlined, CheckCircleOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '@/utils/api';

type BatchQcReport = {
  batch_number: string;
  inspection_date: string;
  inspection_result: string;
  report_url: string;
};

type Material = {
  id: number;
  name: string;
  brand?: string;
  category?: string;
  unit_price: number;
  stock: number;
  min_stock: number;
  status?: string;
  supplier_name?: string;
  specification?: string;
  image_url?: string;
  brand_authorization?: string;
  batch_qc_reports?: BatchQcReport[];
};

type LogisticsTimeline = {
  time: string;
  status: string;
  location?: string;
};

type LogisticsInfo = {
  company: string;
  tracking_number: string;
  current_status: string;
  timeline: LogisticsTimeline[];
};

type Order = {
  id: number;
  material_id: number;
  material_name?: string;
  project_id: number;
  project_title?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  logistics_info?: string;
  created_at: string;
  tracking_number?: string;
  return_reason?: string;
  quality_check_pass?: boolean;
  return_images?: string[];
  quality_images?: string[];
  quality_result?: string;
  is_exchange?: boolean;
};

type Project = {
  id: number;
  title: string;
};

type Supplier = {
  id: number;
  name: string;
  contact?: string;
  phone?: string;
  address?: string;
  qualification_status: 'verified' | 'pending' | 'rejected';
  brand_authorization_count: number;
  qualification_files?: { name: string; url: string }[];
  created_at: string;
};

const categoryOptions = [
  { value: '瓷砖', label: '瓷砖' },
  { value: '地板', label: '地板' },
  { value: '涂料', label: '涂料' },
  { value: '卫浴', label: '卫浴' },
  { value: '五金', label: '五金' },
  { value: '灯具', label: '灯具' },
  { value: '板材', label: '板材' },
  { value: '管材', label: '管材' },
];

const orderStatusColors: Record<string, string> = {
  pending: 'blue',
  confirmed: 'cyan',
  shipped: 'orange',
  delivered: 'green',
  returned: 'red',
  cancelled: 'default',
  quality_checking: 'purple',
  exchanged: 'geekblue',
};

const orderStatusLabels: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  shipped: '已发货',
  delivered: '已到货',
  returned: '已退货',
  cancelled: '已取消',
  quality_checking: '质检中',
  exchanged: '已换货',
};

const qualificationStatusColors: Record<string, string> = {
  verified: 'green',
  pending: 'orange',
  rejected: 'red',
};

const qualificationStatusLabels: Record<string, string> = {
  verified: '已认证',
  pending: '待审核',
  rejected: '未通过',
};

export default function Materials() {
  const [activeTab, setActiveTab] = useState('catalog');

  const [materials, setMaterials] = useState<Material[]>([]);
  const [matTotal, setMatTotal] = useState(0);
  const [matPage, setMatPage] = useState(1);
  const [matPageSize, setMatPageSize] = useState(10);
  const [matLoading, setMatLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [filterStockWarning, setFilterStockWarning] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(10);
  const [orderLoading, setOrderLoading] = useState(false);
  const [filterOrderStatus, setFilterOrderStatus] = useState<string | undefined>();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierTotal, setSupplierTotal] = useState(0);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierPageSize, setSupplierPageSize] = useState(10);
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([]);

  const [matEditOpen, setMatEditOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [orderCreateOpen, setOrderCreateOpen] = useState(false);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState<number | null>(null);
  const [qualificationOpen, setQualificationOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);
  const [logisticsOpen, setLogisticsOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [qualityCheckOpen, setQualityCheckOpen] = useState(false);
  const [qcOrderId, setQcOrderId] = useState<number | null>(null);
  const [supplierDetailOpen, setSupplierDetailOpen] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [purchaseSuggestOpen, setPurchaseSuggestOpen] = useState(false);
  const [suggestedMaterials, setSuggestedMaterials] = useState<Material[]>([]);

  const [matForm] = Form.useForm();
  const [orderForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [logisticsForm] = Form.useForm<LogisticsInfo>();
  const [qualityForm] = Form.useForm();

  const fetchMaterials = useCallback(async () => {
    setMatLoading(true);
    try {
      const params: Record<string, unknown> = { page: matPage, pageSize: matPageSize };
      if (filterCategory) params.category = filterCategory;
      if (filterStockWarning) params.stock_warning = true;
      const res = await api.get('/materials', { params });
      const data = res.data.data;
      setMaterials(data.list || []);
      setMatTotal(data.total || 0);
    } catch {
      message.error('获取建材列表失败');
    } finally {
      setMatLoading(false);
    }
  }, [matPage, matPageSize, filterCategory, filterStockWarning]);

  const fetchOrders = useCallback(async () => {
    setOrderLoading(true);
    try {
      const params: Record<string, unknown> = { page: orderPage, pageSize: orderPageSize };
      if (filterOrderStatus) params.status = filterOrderStatus;
      const res = await api.get('/orders', { params });
      const data = res.data.data;
      setOrders(data.list || []);
      setOrderTotal(data.total || 0);
    } catch {
      message.error('获取订单列表失败');
    } finally {
      setOrderLoading(false);
    }
  }, [orderPage, orderPageSize, filterOrderStatus]);

  const fetchSuppliers = useCallback(async () => {
    setSupplierLoading(true);
    try {
      const res = await api.get('/suppliers', { params: { page: supplierPage, pageSize: supplierPageSize } });
      const data = res.data.data;
      setSuppliers(data.list || []);
      setSupplierTotal(data.total || 0);
    } catch {
      message.error('获取供应商列表失败');
    } finally {
      setSupplierLoading(false);
    }
  }, [supplierPage, supplierPageSize]);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get('/projects', { params: { pageSize: 100 } });
      setProjects(res.data.data.list || []);
    } catch {
      // silent
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    try {
      const res = await api.get('/materials', { params: { stock_warning: true, pageSize: 100 } });
      const data = res.data.data.list || [];
      setLowStockMaterials(data);
      const previouslyShown = sessionStorage.getItem('purchaseSuggestShown');
      if (data.length > 0 && !previouslyShown) {
        setSuggestedMaterials(data);
        setPurchaseSuggestOpen(true);
        sessionStorage.setItem('purchaseSuggestShown', 'true');
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchLowStock();
  }, [fetchProjects, fetchLowStock]);

  useEffect(() => {
    if (activeTab === 'catalog') fetchMaterials();
  }, [activeTab, fetchMaterials]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === 'suppliers') fetchSuppliers();
  }, [activeTab, fetchSuppliers]);

  async function handleSaveMaterial(values: Omit<Material, 'id'> & { id?: number }) {
    try {
      if (editingMaterial?.id) {
        await api.patch(`/materials/${editingMaterial.id}`, values);
      } else {
        await api.post('/materials', values);
      }
      message.success('保存成功');
      setMatEditOpen(false);
      setEditingMaterial(null);
      matForm.resetFields();
      fetchMaterials();
      fetchLowStock();
    } catch {
      message.error('保存失败');
    }
  }

  async function handleDeleteMaterial(id: number) {
    try {
      await api.delete(`/materials/${id}`);
      message.success('删除成功');
      fetchMaterials();
      fetchLowStock();
    } catch {
      message.error('删除失败');
    }
  }

  async function handleCreateOrder(values: { material_id: number; project_id: number; quantity: number }) {
    try {
      const mat = materials.find((m) => m.id === values.material_id);
      await api.post('/orders', { ...values, unit_price: mat?.unit_price || 0 });
      message.success('下单成功');
      setOrderCreateOpen(false);
      orderForm.resetFields();
      fetchOrders();
      fetchMaterials();
      fetchLowStock();
    } catch {
      message.error('下单失败');
    }
  }

  async function handleOrderStatusChange(orderId: number, status: string) {
    try {
      const payload: Record<string, unknown> = { status };
      if (status === 'delivered') {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          payload.quality_check_pass = null;
        }
      }
      await api.patch(`/orders/${orderId}`, payload);
      message.success('状态更新成功');
      fetchOrders();
      fetchMaterials();
      fetchLowStock();
    } catch {
      message.error('状态更新失败');
    }
  }

  function handleQuickPurchase(material: Material) {
    orderForm.setFieldsValue({
      material_id: material.id,
      quantity: Math.max(material.min_stock - material.stock + 10, 10),
    });
    setOrderCreateOpen(true);
  }

  function handleViewQualification(material: Material) {
    setViewingMaterial(material);
    setQualificationOpen(true);
  }

  function handleViewLogistics(order: Order) {
    setViewingOrder(order);
    let logisticsInfo: LogisticsInfo;
    if (order.logistics_info) {
      try {
        logisticsInfo = JSON.parse(order.logistics_info);
      } catch {
        logisticsInfo = {
          company: '',
          tracking_number: order.tracking_number || '',
          current_status: '',
          timeline: [],
        };
      }
    } else {
      logisticsInfo = {
        company: '',
        tracking_number: order.tracking_number || '',
        current_status: '',
        timeline: [],
      };
    }
    logisticsForm.setFieldsValue(logisticsInfo);
    setLogisticsOpen(true);
  }

  async function handleSaveLogistics(values: LogisticsInfo) {
    if (!viewingOrder) return;
    try {
      await api.patch(`/orders/${viewingOrder.id}`, {
        logistics_info: JSON.stringify(values),
        tracking_number: values.tracking_number,
      });
      message.success('物流信息保存成功');
      setLogisticsOpen(false);
      setViewingOrder(null);
      logisticsForm.resetFields();
      fetchOrders();
    } catch {
      message.error('保存失败');
    }
  }

  function handleQualityCheck(orderId: number) {
    setQcOrderId(orderId);
    qualityForm.resetFields();
    setQualityCheckOpen(true);
  }

  async function handleSaveQualityCheck(values: { quality_result: string; quality_check_pass: boolean; quality_images?: string }) {
    if (!qcOrderId) return;
    try {
      const payload: Record<string, unknown> = {
        quality_check_pass: values.quality_check_pass,
        quality_result: values.quality_result,
        status: values.quality_check_pass ? 'delivered' : 'quality_checking',
      };
      if (values.quality_images) {
        payload.quality_images = values.quality_images.split(',').map((s) => s.trim()).filter(Boolean);
      }
      await api.patch(`/orders/${qcOrderId}`, payload);
      message.success(values.quality_check_pass ? '质检通过，订单已完成' : '质检不通过，请发起退货或换货');
      setQualityCheckOpen(false);
      setQcOrderId(null);
      qualityForm.resetFields();
      fetchOrders();
      if (values.quality_check_pass) {
        fetchMaterials();
        fetchLowStock();
      }
    } catch {
      message.error('保存失败');
    }
  }

  async function handleReturn(orderId: number, values: { return_reason: string; return_images?: string; is_exchange?: boolean }) {
    try {
      const payload: Record<string, unknown> = {
        status: values.is_exchange ? 'exchanged' : 'returned',
        return_reason: values.return_reason,
        is_exchange: values.is_exchange || false,
      };
      if (values.return_images) {
        payload.return_images = values.return_images.split(',').map((s) => s.trim()).filter(Boolean);
      }
      await api.patch(`/orders/${orderId}`, payload);
      message.success(values.is_exchange ? '换货申请已提交' : '退货成功，库存已恢复');
      setReturnConfirmOpen(false);
      setReturnOrderId(null);
      returnForm.resetFields();
      fetchOrders();
      fetchMaterials();
      fetchLowStock();
    } catch {
      message.error('操作失败');
    }
  }

  function handleViewSupplierDetail(supplier: Supplier) {
    setViewingSupplier(supplier);
    setSupplierDetailOpen(true);
  }

  function parseLogisticsInfo(info?: string): LogisticsInfo | null {
    if (!info) return null;
    try {
      return JSON.parse(info);
    } catch {
      return null;
    }
  }

  const materialColumns: ColumnsType<Material> = [
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 80, render: (v) => v || '-' },
    { title: '分类', dataIndex: 'category', key: 'category', width: 80, render: (v) => v ? <Tag>{v}</Tag> : '-' },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120, render: (v) => v || '-' },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v) => `¥${Number(v).toLocaleString()}` },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
      render: (v, r) => (
        <span style={{ color: v <= r.min_stock ? '#ff4d4f' : undefined, fontWeight: v <= r.min_stock ? 'bold' : undefined }}>
          {v}
        </span>
      ),
    },
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock', width: 80 },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, r) => (
        <Space>
          {r.stock <= r.min_stock ? <Tag color="red">库存不足</Tag> : <Tag color="green">正常</Tag>}
          {r.brand_authorization && <Tag color="blue">有授权</Tag>}
        </Space>
      ),
    },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name', width: 100, render: (v) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingMaterial(record); matForm.setFieldsValue(record); setMatEditOpen(true); }}>编辑</Button>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewQualification(record)}>查看资质</Button>
          {record.stock <= record.min_stock && (
            <Button type="primary" size="small" icon={<ShoppingOutlined />} onClick={() => handleQuickPurchase(record)}>一键采购</Button>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteMaterial(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  const orderColumns: ColumnsType<Order> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '建材名称', dataIndex: 'material_name', key: 'material_name', width: 120, render: (v, r) => v || `建材#${r.material_id}` },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', width: 120, render: (v, r) => v || `项目#${r.project_id}` },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 70 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, render: (v) => `¥${Number(v).toLocaleString()}` },
    { title: '总价', dataIndex: 'total_price', key: 'total_price', width: 100, render: (v) => `¥${Number(v).toLocaleString()}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v) => <Tag color={orderStatusColors[v] || 'default'}>{orderStatusLabels[v] || v}</Tag>,
    },
    {
      title: '质检状态',
      key: 'qc_status',
      width: 90,
      render: (_, r) => {
        if (r.quality_check_pass === true) return <Tag color="green">质检合格</Tag>;
        if (r.quality_check_pass === false) return <Tag color="red">质检不合格</Tag>;
        return <Tag color="default">待质检</Tag>;
      },
    },
    {
      title: '物流跟踪',
      key: 'logistics',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleViewLogistics(record)}>
          {parseLogisticsInfo(record.logistics_info)?.tracking_number || '录入物流'}
        </Button>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          <Select
            size="small"
            value={record.status}
            style={{ width: 100 }}
            onChange={(val) => handleOrderStatusChange(record.id, val)}
            options={Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))}
          />
          {record.status === 'delivered' && record.quality_check_pass == null && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleQualityCheck(record.id)}>质检确认</Button>
          )}
          {record.status !== 'returned' && record.status !== 'cancelled' && record.status !== 'exchanged' && (
            <Button type="link" size="small" danger icon={<UndoOutlined />} onClick={() => { setReturnOrderId(record.id); returnForm.resetFields(); setReturnConfirmOpen(true); }}>退货</Button>
          )}
        </Space>
      ),
    },
  ];

  const supplierColumns: ColumnsType<Supplier> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '供应商名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 80, render: (v) => v || '-' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 120, render: (v) => v || '-' },
    { title: '地址', dataIndex: 'address', key: 'address', width: 150, ellipsis: true, render: (v) => v || '-' },
    {
      title: '资质状态',
      dataIndex: 'qualification_status',
      key: 'qualification_status',
      width: 100,
      render: (v) => <Tag color={qualificationStatusColors[v]}>{qualificationStatusLabels[v]}</Tag>,
    },
    { title: '品牌授权数', dataIndex: 'brand_authorization_count', key: 'brand_authorization_count', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleViewSupplierDetail(record)}>查看详情</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {lowStockMaterials.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`库存预警: ${lowStockMaterials.length} 种建材库存不足`}
          description={
            <Space wrap>
              {lowStockMaterials.slice(0, 5).map((m) => (
                <Space key={m.id}>
                  <Tag color="red">{m.name} (库存: {m.stock}/{m.min_stock})</Tag>
                  <Button type="primary" size="small" icon={<ShoppingOutlined />} onClick={() => handleQuickPurchase(m)}>快捷采购</Button>
                </Space>
              ))}
              {lowStockMaterials.length > 5 && <Tag>+{lowStockMaterials.length - 5} 更多</Tag>}
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title="建材供应链管理">
        <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); if (key === 'suppliers') fetchSuppliers(); }} items={[
          {
            key: 'catalog',
            label: '建材目录',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col>
                    <Select
                      placeholder="分类筛选"
                      allowClear
                      style={{ width: 140 }}
                      value={filterCategory}
                      onChange={(v) => { setFilterCategory(v); setMatPage(1); }}
                      options={categoryOptions}
                    />
                  </Col>
                  <Col>
                    <Select
                      placeholder="库存预警"
                      allowClear
                      style={{ width: 140 }}
                      value={filterStockWarning || undefined}
                      onChange={(v) => { setFilterStockWarning(v === true); setMatPage(1); }}
                      options={[{ value: true, label: '仅显示库存不足' }]}
                    />
                  </Col>
                  <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingMaterial(null); matForm.resetFields(); setMatEditOpen(true); }}>新增建材</Button>
                  </Col>
                </Row>
                <Table
                  rowKey="id"
                  columns={materialColumns}
                  dataSource={materials}
                  loading={matLoading}
                  rowClassName={(r) => r.stock <= r.min_stock ? 'low-stock-row' : ''}
                  pagination={{
                    current: matPage,
                    pageSize: matPageSize,
                    total: matTotal,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条`,
                    onChange: (p, ps) => { setMatPage(p); setMatPageSize(ps); },
                  }}
                />
              </>
            ),
          },
          {
            key: 'orders',
            label: '采购订单',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col>
                    <Select
                      placeholder="状态筛选"
                      allowClear
                      style={{ width: 140 }}
                      value={filterOrderStatus}
                      onChange={(v) => { setFilterOrderStatus(v); setOrderPage(1); }}
                      options={Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))}
                    />
                  </Col>
                  <Col>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOrderCreateOpen(true)}>新建订单</Button>
                  </Col>
                </Row>
                <Table
                  rowKey="id"
                  columns={orderColumns}
                  dataSource={orders}
                  loading={orderLoading}
                  pagination={{
                    current: orderPage,
                    pageSize: orderPageSize,
                    total: orderTotal,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条`,
                    onChange: (p, ps) => { setOrderPage(p); setOrderPageSize(ps); },
                  }}
                />
              </>
            ),
          },
          {
            key: 'suppliers',
            label: '供应商管理',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col>
                    <Button type="primary" icon={<PlusOutlined />}>新增供应商</Button>
                  </Col>
                </Row>
                <Table
                  rowKey="id"
                  columns={supplierColumns}
                  dataSource={suppliers}
                  loading={supplierLoading}
                  pagination={{
                    current: supplierPage,
                    pageSize: supplierPageSize,
                    total: supplierTotal,
                    showSizeChanger: true,
                    showTotal: (t) => `共 ${t} 条`,
                    onChange: (p, ps) => { setSupplierPage(p); setSupplierPageSize(ps); },
                  }}
                />
              </>
            ),
          },
        ]} />
      </Card>

      <Modal
        title={editingMaterial ? '编辑建材' : '新增建材'}
        open={matEditOpen}
        onCancel={() => { setMatEditOpen(false); setEditingMaterial(null); matForm.resetFields(); }}
        onOk={() => matForm.submit()}
        width={700}
      >
        <Form form={matForm} layout="vertical" onFinish={handleSaveMaterial}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入建材名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="请输入品牌" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="请选择分类" options={categoryOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格">
                <Input placeholder="请输入规格型号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="unit_price" label="单价" rules={[{ required: true, message: '请输入单价' }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入单价" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="image_url" label="商品图片URL">
                <Input placeholder="请输入商品图片URL" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="stock" label="库存" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_stock" label="最低库存" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="supplier_name" label="供应商">
            <Input placeholder="请输入供应商名称" />
          </Form.Item>
          <Form.Item name="brand_authorization" label="品牌授权书">
            <Input.TextArea rows={3} placeholder="请输入授权书编号或URL" />
          </Form.Item>
          <Divider orientation="left" plain>批次质检报告</Divider>
          <Form.List name="batch_qc_reports">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 8 }} bodyStyle={{ padding: 12 }}>
                    <Row gutter={8}>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'batch_number']} label="批次号" rules={[{ required: true }]}>
                          <Input placeholder="批次号" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'inspection_date']} label="检测日期" rules={[{ required: true }]}>
                          <Input placeholder="YYYY-MM-DD" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item {...restField} name={[name, 'inspection_result']} label="检测结果" rules={[{ required: true }]}>
                          <Select placeholder="选择结果">
                            <Select.Option value="合格">合格</Select.Option>
                            <Select.Option value="不合格">不合格</Select.Option>
                            <Select.Option value="待检测">待检测</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item {...restField} name={[name, 'report_url']} label="报告URL">
                          <Input placeholder="报告链接" />
                        </Form.Item>
                      </Col>
                      <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 28 }}>
                        <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加质检报告
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      <Modal title="新建采购订单" open={orderCreateOpen} onCancel={() => { setOrderCreateOpen(false); orderForm.resetFields(); }} onOk={() => orderForm.submit()}>
        <Form form={orderForm} layout="vertical" onFinish={handleCreateOrder}>
          <Form.Item name="material_id" label="选择建材" rules={[{ required: true, message: '请选择建材' }]}>
            <Select
              placeholder="请选择建材"
              showSearch
              optionFilterProp="label"
              options={materials.map((m) => ({ value: m.id, label: `${m.name} - ¥${m.unit_price} (库存: ${m.stock})` }))}
            />
          </Form.Item>
          <Form.Item name="project_id" label="选择项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projects.map((p) => ({ value: p.id, label: p.title }))} />
          </Form.Item>
          <Form.Item name="quantity" label="采购数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认退货"
        open={returnConfirmOpen}
        onCancel={() => { setReturnConfirmOpen(false); setReturnOrderId(null); returnForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={returnForm} layout="vertical" onFinish={(values) => returnOrderId && handleReturn(returnOrderId, values)}>
          <p>订单 #{returnOrderId} {viewingOrder?.material_name ? `(${viewingOrder.material_name})` : ''}</p>
          <Form.Item name="is_exchange" label="处理方式" initialValue={false}>
            <Radio.Group>
              <Radio value={false}>退货退款</Radio>
              <Radio value={true}>换货</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="return_reason" label="退货原因" rules={[{ required: true, message: '请填写退货原因' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述退货原因，如：质量问题、型号不符、破损等" />
          </Form.Item>
          <Form.Item name="return_images" label="问题图片URL">
            <Input.TextArea rows={2} placeholder="请上传问题图片，多个URL用逗号分隔" />
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setReturnConfirmOpen(false); setReturnOrderId(null); returnForm.resetFields(); }}>取消</Button>
            <Button type="primary" danger htmlType="submit">确认提交</Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="资质文件查看"
        open={qualificationOpen}
        onCancel={() => { setQualificationOpen(false); setViewingMaterial(null); }}
        footer={[
          <Button key="close" onClick={() => { setQualificationOpen(false); setViewingMaterial(null); }}>关闭</Button>,
        ]}
        width={700}
      >
        {viewingMaterial && (
          <div>
            <h4>{viewingMaterial.name} - {viewingMaterial.brand}</h4>
            {viewingMaterial.image_url && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ marginBottom: 8 }}><strong>商品图片：</strong></p>
                <Image width={200} src={viewingMaterial.image_url} />
              </div>
            )}
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <p style={{ marginBottom: 8 }}><strong>品牌授权书：</strong></p>
              {viewingMaterial.brand_authorization ? (
                <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {viewingMaterial.brand_authorization}
                </div>
              ) : (
                <span style={{ color: '#999' }}>暂无品牌授权书</span>
              )}
            </div>
            <Divider />
            <div>
              <p style={{ marginBottom: 8 }}><strong>批次质检报告：</strong></p>
              {viewingMaterial.batch_qc_reports && viewingMaterial.batch_qc_reports.length > 0 ? (
                <Table
                  size="small"
                  dataSource={viewingMaterial.batch_qc_reports}
                  rowKey="batch_number"
                  pagination={false}
                  columns={[
                    { title: '批次号', dataIndex: 'batch_number', key: 'batch_number' },
                    { title: '检测日期', dataIndex: 'inspection_date', key: 'inspection_date' },
                    {
                      title: '检测结果',
                      dataIndex: 'inspection_result',
                      key: 'inspection_result',
                      render: (v) => (
                        <Tag color={v === '合格' ? 'green' : v === '不合格' ? 'red' : 'orange'}>{v}</Tag>
                      ),
                    },
                    {
                      title: '报告',
                      key: 'report',
                      render: (_, r) => r.report_url ? <a href={r.report_url} target="_blank" rel="noreferrer">查看报告</a> : '-',
                    },
                  ]}
                />
              ) : (
                <span style={{ color: '#999' }}>暂无质检报告</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="物流跟踪"
        open={logisticsOpen}
        onCancel={() => { setLogisticsOpen(false); setViewingOrder(null); logisticsForm.resetFields(); }}
        onOk={() => logisticsForm.submit()}
        width={600}
      >
        <Form form={logisticsForm} layout="vertical" onFinish={handleSaveLogistics}>
          <Row gutter={8}>
            <Col span={12}>
              <Form.Item name="company" label="物流公司" rules={[{ required: true, message: '请输入物流公司' }]}>
                <Select placeholder="请选择或输入物流公司">
                  <Select.Option value="顺丰速运">顺丰速运</Select.Option>
                  <Select.Option value="京东物流">京东物流</Select.Option>
                  <Select.Option value="圆通速递">圆通速递</Select.Option>
                  <Select.Option value="中通快递">中通快递</Select.Option>
                  <Select.Option value="申通快递">申通快递</Select.Option>
                  <Select.Option value="韵达快递">韵达快递</Select.Option>
                  <Select.Option value="极兔速递">极兔速递</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tracking_number" label="运单号" rules={[{ required: true, message: '请输入运单号' }]}>
                <Input placeholder="请输入运单号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="current_status" label="当前状态">
            <Select placeholder="请选择当前状态">
              <Select.Option value="已下单">已下单</Select.Option>
              <Select.Option value="已揽收">已揽收</Select.Option>
              <Select.Option value="运输中">运输中</Select.Option>
              <Select.Option value="派送中">派送中</Select.Option>
              <Select.Option value="已签收">已签收</Select.Option>
              <Select.Option value="异常">异常</Select.Option>
            </Select>
          </Form.Item>
          <Divider orientation="left" plain>物流时间线</Divider>
          <Form.List name="timeline">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} align="baseline" style={{ marginBottom: 8 }}>
                    <Form.Item {...restField} name={[name, 'time']} rules={[{ required: true }]} noStyle>
                      <Input style={{ width: 160 }} placeholder="时间" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'status']} rules={[{ required: true }]} noStyle>
                      <Input style={{ width: 180 }} placeholder="状态描述" />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'location']} noStyle>
                      <Input style={{ width: 150 }} placeholder="地点" />
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)}>删除</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加物流节点
                </Button>
              </>
            )}
          </Form.List>
        </Form>
        {viewingOrder && parseLogisticsInfo(viewingOrder.logistics_info)?.timeline && (
          <>
            <Divider />
            <p style={{ marginBottom: 8 }}><strong>物流轨迹：</strong></p>
            <Timeline
              items={parseLogisticsInfo(viewingOrder.logistics_info)!.timeline!.map((t) => ({
                color: t.status.includes('签收') ? 'green' : t.status.includes('异常') ? 'red' : 'blue',
                children: (
                  <div>
                    <div>{t.time} - {t.status}</div>
                    {t.location && <div style={{ color: '#999', fontSize: 12 }}>{t.location}</div>}
                  </div>
                ),
              }))}
            />
          </>
        )}
      </Modal>

      <Modal
        title="质检确认"
        open={qualityCheckOpen}
        onCancel={() => { setQualityCheckOpen(false); setQcOrderId(null); qualityForm.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={qualityForm} layout="vertical" onFinish={handleSaveQualityCheck}>
          <Form.Item name="quality_result" label="质检结果描述" rules={[{ required: true, message: '请填写质检结果' }]}>
            <Input.TextArea rows={4} placeholder="请详细描述质检结果，如：外观完好、数量正确、质量合格等" />
          </Form.Item>
          <Form.Item name="quality_images" label="质检图片URL">
            <Input.TextArea rows={2} placeholder="请上传质检图片，多个URL用逗号分隔" />
          </Form.Item>
          <Form.Item name="quality_check_pass" label="是否合格" rules={[{ required: true, message: '请选择质检结果' }]}>
            <Radio.Group>
              <Radio value={true}>合格</Radio>
              <Radio value={false}>不合格</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.quality_check_pass !== curr.quality_check_pass}>
            {({ getFieldValue }) => getFieldValue('quality_check_pass') === false && (
              <Alert
                type="warning"
                showIcon
                message="质检不合格提示"
                description="质检不通过的订单可发起退货或换货流程，库存将自动恢复。"
                style={{ marginBottom: 16 }}
              />
            )}
          </Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => { setQualityCheckOpen(false); setQcOrderId(null); qualityForm.resetFields(); }}>取消</Button>
            <Button type="primary" htmlType="submit">确认提交</Button>
          </Space>
        </Form>
      </Modal>

      <Modal
        title="供应商详情"
        open={supplierDetailOpen}
        onCancel={() => { setSupplierDetailOpen(false); setViewingSupplier(null); }}
        footer={[
          <Button key="close" onClick={() => { setSupplierDetailOpen(false); setViewingSupplier(null); }}>关闭</Button>,
        ]}
        width={600}
      >
        {viewingSupplier && (
          <div>
            <Space align="center" style={{ marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{viewingSupplier.name}</h3>
              <Badge status={viewingSupplier.qualification_status === 'verified' ? 'success' : viewingSupplier.qualification_status === 'pending' ? 'warning' : 'error'} text={qualificationStatusLabels[viewingSupplier.qualification_status]} />
            </Space>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>联系人：</strong>{viewingSupplier.contact || '-'}</p>
              </Col>
              <Col span={12}>
                <p><strong>联系电话：</strong>{viewingSupplier.phone || '-'}</p>
              </Col>
            </Row>
            <p><strong>地址：</strong>{viewingSupplier.address || '-'}</p>
            <p><strong>品牌授权数量：</strong>{viewingSupplier.brand_authorization_count} 个</p>
            <p><strong>创建时间：</strong>{dayjs(viewingSupplier.created_at).format('YYYY-MM-DD HH:mm')}</p>
            <Divider />
            <p style={{ marginBottom: 8 }}><strong>资质文件：</strong></p>
            {viewingSupplier.qualification_files && viewingSupplier.qualification_files.length > 0 ? (
              <Table
                size="small"
                dataSource={viewingSupplier.qualification_files}
                rowKey="name"
                pagination={false}
                columns={[
                  { title: '文件名称', dataIndex: 'name', key: 'name' },
                  {
                    title: '操作',
                    key: 'action',
                    render: (_, r) => <a href={r.url} target="_blank" rel="noreferrer">查看</a>,
                  },
                ]}
              />
            ) : (
              <span style={{ color: '#999' }}>暂无资质文件</span>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="采购建议"
        open={purchaseSuggestOpen}
        onCancel={() => { setPurchaseSuggestOpen(false); setSuggestedMaterials([]); }}
        footer={[
          <Button key="later" onClick={() => { setPurchaseSuggestOpen(false); setSuggestedMaterials([]); }}>稍后再说</Button>,
        ]}
        width={600}
      >
        <Alert
          type="info"
          showIcon
          message="系统检测到以下建材库存不足，建议及时采购"
          style={{ marginBottom: 16 }}
        />
        <Table
          size="small"
          dataSource={suggestedMaterials}
          rowKey="id"
          pagination={false}
          columns={[
            { title: '建材名称', dataIndex: 'name', key: 'name' },
            { title: '品牌', dataIndex: 'brand', key: 'brand' },
            { title: '当前库存', dataIndex: 'stock', key: 'stock' },
            { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock' },
            { title: '建议采购量', key: 'suggest', render: (_, r) => Math.max(r.min_stock - r.stock + 10, 10) },
            {
              title: '操作',
              key: 'action',
              render: (_, r) => (
                <Button
                  type="primary"
                  size="small"
                  icon={<ShoppingOutlined />}
                  onClick={() => {
                    handleQuickPurchase(r);
                    setPurchaseSuggestOpen(false);
                    setSuggestedMaterials([]);
                  }}
                >
                  立即采购
                </Button>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
}
