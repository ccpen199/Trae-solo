import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card, Tabs, Row, Col, Button, Modal, Form, Input, InputNumber, Select,
  Table, Tag, Space, Spin, Statistic, message, Divider, Empty
} from 'antd';
import { DollarOutlined, PlusOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons';
import request from '../utils/request';

const { Option } = Select;

const mockCreditProducts = [
  { id: 1, name: '农e贷', rate: '4.35%', term: '12个月', maxAmount: 20, desc: '面向信用良好农户的纯信用贷款，无需抵押' },
  { id: 2, name: '惠农信用贷', rate: '4.5%', term: '24个月', maxAmount: 30, desc: '政府贴息农业信用贷款' },
  { id: 3, name: '乡村振兴贷', rate: '3.85%', term: '36个月', maxAmount: 50, desc: '乡村振兴专项扶持贷款' },
];

const mockMachineProducts = [
  { id: 4, name: '农机购置贷', rate: '3.5%', term: '36个月', maxAmount: 100, desc: '用于购买农业机械设备的专项贷款' },
  { id: 5, name: '养殖设备贷', rate: '4.0%', term: '24个月', maxAmount: 50, desc: '用于购买养殖设备的贷款' },
];

const mockInsuranceProducts = [
  { id: 6, name: '水稻种植保险', rate: '保费: 20元/亩', term: '1年', maxAmount: 1000, desc: '水稻种植自然灾害保险，最高赔付1000元/亩' },
  { id: 7, name: '生猪养殖保险', rate: '保费: 60元/头', term: '1年', maxAmount: 800, desc: '生猪死亡保险，最高赔付800元/头' },
];

const mockApplications = [
  { id: 'LOAN202501001', productName: '农e贷', farmerName: '张三', amount: 5, purpose: '购买种子化肥', status: '已通过', applyDate: '2025-01-15' },
  { id: 'LOAN202502002', productName: '农机购置贷', farmerName: '李四', amount: 12, purpose: '购买收割机', status: '审核中', applyDate: '2025-02-20' },
  { id: 'LOAN202503003', productName: '水稻种植保险', farmerName: '王五', amount: 0.02, purpose: '100亩水稻投保', status: '已拒绝', applyDate: '2025-03-10' },
];

const mockFarmers = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
  { id: 4, name: '赵六' },
];

const purposes = ['购买种子化肥', '购买农机设备', '农田灌溉设施', '养殖投入', '其他'];

export default function Finance() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('credit');
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdmin, setIsAdmin] = useState(true);
  const [products, setProducts] = mockCreditProducts;
  const [applications, setApplications] = useState(mockApplications);
  const [manageProducts, setManageProducts] = useState([
    ...mockCreditProducts,
    ...mockMachineProducts,
    ...mockInsuranceProducts
  ]);
  const [form] = Form.useForm();
  const [productForm] = Form.useForm();
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const location = useLocation();
  const [prefillFarmer, setPrefillFarmer] = useState(null);

  useEffect(() => {
    if (location.state?.action === 'apply') {
      const farmer = {
        id: location.state.farmerId,
        name: location.state.farmerName,
        landArea: location.state.landArea,
        product: location.state.product,
      };
      setPrefillFarmer(farmer);
      if (farmer.product) {
        const typeMap = { credit: 'credit', machine: 'machine', insurance: 'insurance' };
        if (typeMap[farmer.product.type]) {
          setActiveTab(typeMap[farmer.product.type]);
        }
        setSelectedProduct({
          id: Date.now(),
          name: farmer.product.name,
          maxAmount: farmer.product.maxAmount,
          rate: '3.85%',
          term: '12个月',
        });
        form.setFieldsValue({
          productName: farmer.product.name,
          farmerName: farmer.name,
          idCard: '360121199001011234',
          amount: Math.min(farmer.product.maxAmount, 10),
          purpose: '购买种子化肥',
          landArea: farmer.landArea,
        });
      }
      setApplyModalOpen(true);
      setTimeout(() => {
        window.history.replaceState({}, document.title);
      }, 100);
    }
  }, [location.state]);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const typeMap = {
        credit: 'credit_loan',
        machine: 'machinery_loan',
        insurance: 'insurance',
      };
      const apiType = typeMap[activeTab];
      const res = await request.get('/finance/products').catch(() => ({ data: [] }));
      if (res && res.data && res.data.length) {
        const filtered = apiType ? res.data.filter((p) => p.type === apiType) : res.data;
        const mapped = filtered.map((p) => ({
          id: p.id,
          name: p.name,
          rate: p.rate,
          term: p.term,
          maxAmount: Math.round(parseFloat(p.max_amount) / 10000),
          desc: p.params ? `${p.name}，${Object.entries(p.params).map(([k, v]) => `${k}: ${v}`).join('，')}` : '政府推荐普惠金融产品',
        }));
        setProducts(mapped.length ? mapped : (activeTab === 'credit' ? mockCreditProducts : activeTab === 'machine' ? mockMachineProducts : mockInsuranceProducts));
      } else {
        await new Promise((r) => setTimeout(r, 300));
        if (activeTab === 'credit') setProducts(mockCreditProducts);
        else if (activeTab === 'machine') setProducts(mockMachineProducts);
        else if (activeTab === 'insurance') setProducts(mockInsuranceProducts);
      }
    } finally {
      setLoading(false);
    }
  };

  const openApplyModal = (product) => {
    setSelectedProduct(product);
    setApplyModalOpen(true);
  };

  const handleApply = async (values) => {
    try {
      await request.post('/finance/applications', {
        ...values,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        id: `LOAN${Date.now().toString().slice(-8)}`,
        status: '审核中',
        applyDate: new Date().toISOString().slice(0, 10),
      }).catch(() => {});
      message.success('申请提交成功');
      setApplyModalOpen(false);
      form.resetFields();
      setApplications((prev) => [{
        id: `LOAN${Date.now().toString().slice(-8)}`,
        productName: selectedProduct.name,
        farmerName: mockFarmers.find((f) => f.id === values.farmerId)?.name || '农户',
        amount: values.amount,
        purpose: values.purpose,
        status: '审核中',
        applyDate: new Date().toISOString().slice(0, 10),
      }, ...prev]);
    } catch {
      message.error('提交失败');
    }
  };

  const handleSaveProduct = async (values) => {
    try {
      if (editingProduct) {
        setManageProducts((prev) => prev.map((p) => p.id === editingProduct.id ? { ...editingProduct, ...values } : p));
        message.success('更新成功');
      } else {
        const newProduct = { ...values, id: Date.now() };
        setManageProducts((prev) => [...prev, newProduct]);
        message.success('创建成功');
      }
      setProductModalOpen(false);
      setEditingProduct(null);
      productForm.resetFields();
    } catch {
      message.error('操作失败');
    }
  };

  const handleDeleteProduct = (id) => {
    setManageProducts((prev) => prev.filter((p) => p.id !== id));
    message.success('删除成功');
  };

  const appColumns = [
    { title: '申请单号', dataIndex: 'id', key: 'id', width: 140 },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '申请人', dataIndex: 'farmerName', key: 'farmerName', width: 80 },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v) => `${v}万元` },
    { title: '用途', dataIndex: 'purpose', key: 'purpose', width: 150 },
    { title: '申请日期', dataIndex: 'applyDate', key: 'applyDate', width: 100 },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v) => {
        const color = v === '已通过' ? 'green' : v === '审核中' ? 'orange' : 'red';
        const icon = v === '已通过' ? <CheckOutlined /> : v === '审核中' ? <ClockCircleOutlined /> : null;
        return <Tag color={color} icon={icon}>{v}</Tag>;
      }
    },
  ];

  const productMgmtColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: '利率/保费', dataIndex: 'rate', key: 'rate' },
    { title: '期限', dataIndex: 'term', key: 'term' },
    { title: '最高额度', dataIndex: 'maxAmount', key: 'maxAmount', render: (v) => `${v}万元` },
    {
      title: '操作', key: 'actions', width: 140,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditingProduct(record);
            productForm.setFieldsValue(record);
            setProductModalOpen(true);
          }}>编辑</Button>
          <Button size="small" danger onClick={() => handleDeleteProduct(record.id)}>删除</Button>
        </Space>
      )
    },
  ];

  const productCard = (p) => (
    <Col xs={24} sm={12} md={8} lg={8} key={p.id}>
      <Card
        size="small"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        actions={[
          <Button type="primary" block icon={<DollarOutlined />} onClick={() => openApplyModal(p)}>
            立即申请
          </Button>
        ]}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>{p.name}</h3>
        </div>
        <Row gutter={8} style={{ marginBottom: 8 }}>
          <Col span={12}>
            <Statistic title="年利率" value={p.rate} valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          </Col>
          <Col span={12}>
            <Statistic title="最高额度" value={p.maxAmount} suffix="万元" valueStyle={{ fontSize: 16, color: '#52c41a' }} />
          </Col>
        </Row>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
          期限：{p.term}
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: 0, flex: 1 }}>{p.desc}</p>
      </Card>
    </Col>
  );

  const tabItems = [
    {
      key: 'credit',
      label: '信用贷',
      children: loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载中..." /></div>
      ) : (
        <Row gutter={[16, 16]}>{products.map(productCard)}</Row>
      ),
    },
    {
      key: 'machine',
      label: '农机贷',
      children: loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载中..." /></div>
      ) : (
        <Row gutter={[16, 16]}>{products.map(productCard)}</Row>
      ),
    },
    {
      key: 'insurance',
      label: '保险产品',
      children: loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="加载中..." /></div>
      ) : (
        <Row gutter={[16, 16]}>{products.map(productCard)}</Row>
      ),
    },
    {
      key: 'applications',
      label: '申请记录',
      children: (
        <Table
          size="small"
          rowKey="id"
          columns={appColumns}
          dataSource={applications}
          scroll={{ x: 700 }}
          pagination={{ pageSize: 8 }}
        />
      ),
    },
  ];

  if (isAdmin) {
    tabItems.push({
      key: 'manage',
      label: '产品管理',
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingProduct(null);
                productForm.resetFields();
                setProductModalOpen(true);
              }}
            >
              新增产品
            </Button>
          </div>
          <Table
            size="small"
            rowKey="id"
            columns={productMgmtColumns}
            dataSource={manageProducts}
            scroll={{ x: 800 }}
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    });
  }

  return (
    <div>
      <Card title="普惠金融超市" size="small" style={{ marginBottom: 16 }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={`申请 - ${selectedProduct?.name || ''}`}
        open={applyModalOpen}
        onCancel={() => setApplyModalOpen(false)}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 560}
      >
        {selectedProduct && (
          <Form form={form} layout="vertical" onFinish={handleApply} size="middle">
            <div style={{ background: '#f6ffed', padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <div style={{ fontWeight: 500 }}>{selectedProduct.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                年利率 {selectedProduct.rate} | 期限 {selectedProduct.term} | 最高 {selectedProduct.maxAmount}万元
              </div>
            </div>

            {prefillFarmer && (
              <div style={{ marginBottom: 16, padding: 12, background: '#e6f7ff', borderRadius: 6, border: '1px solid #91d5ff' }}>
                <div style={{ fontSize: 12, color: '#1890ff', fontWeight: 500, marginBottom: 8 }}>
                  ✓ 信息已从农户档案自动带入
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
                  <div><span style={{ color: '#888' }}>申请人：</span>{prefillFarmer.name}</div>
                  <div><span style={{ color: '#888' }}>确权面积：</span>{prefillFarmer.landArea} 亩</div>
                  <div><span style={{ color: '#888' }}>推荐产品：</span>{prefillFarmer.product?.name}</div>
                  <div><span style={{ color: '#888' }}>授信额度：</span>{prefillFarmer.product?.maxAmount} 万元</div>
                </div>
              </div>
            )}

            <Form.Item name="farmerId" label="选择农户" rules={[{ required: true }]}>
              <Select placeholder="请选择申请人">
                {mockFarmers.map((f) => (
                  <Option key={f.id} value={f.id}>{f.name}（{f.landArea}亩）</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="farmerName" label="农户姓名" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="idCard" label="身份证号" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="productName" label="产品名称" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="landArea" label="土地面积" hidden>
              <Input />
            </Form.Item>
            <Form.Item name="amount" label="申请金额(万元)" rules={[
              { required: true, message: '请输入金额' },
              { type: 'number', min: 0.1, max: selectedProduct.maxAmount, message: `额度不超过${selectedProduct.maxAmount}万元` }
            ]}>
              <InputNumber style={{ width: '100%' }} min={0.1} max={selectedProduct.maxAmount} step={0.1} />
            </Form.Item>
            <Form.Item name="purpose" label="贷款用途" rules={[{ required: true }]}>
              <Select placeholder="请选择用途">
                {purposes.map((p) => (
                  <Option key={p} value={p}>{p}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={3} placeholder="可选" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button onClick={() => setApplyModalOpen(false)}>取消</Button>
                <Button type="primary" htmlType="submit">提交申请</Button>
              </div>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={editingProduct ? '编辑产品' : '新增产品'}
        open={productModalOpen}
        onCancel={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
        footer={null}
        destroyOnClose
        width={window.innerWidth < 768 ? '100%' : 560}
      >
        <Form form={productForm} layout="vertical" onFinish={handleSaveProduct} size="middle">
          <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="rate" label="利率/保费" rules={[{ required: true }]}>
            <Input placeholder="如: 4.35% 或 20元/亩" />
          </Form.Item>
          <Form.Item name="term" label="期限" rules={[{ required: true }]}>
            <Input placeholder="如: 12个月" />
          </Form.Item>
          <Form.Item name="maxAmount" label="最高额度(万元)" rules={[{ required: true, type: 'number' }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="desc" label="产品描述" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setProductModalOpen(false);
                setEditingProduct(null);
              }}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
