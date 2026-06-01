import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Space, Tabs, Tag, Alert } from 'antd';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../utils/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TabPane } = Tabs;

function Inventory({ storeId }) {
  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [expired, setExpired] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadInventory();
    loadBatches();
    loadMaterials();
    loadWarnings();
    loadExpired();
  }, [storeId]);

  const loadInventory = async () => {
    const res = await api.get(`/materials/inventory?store_id=${storeId}`);
    if (res.success) {
      setInventory(res.data);
    }
  };

  const loadBatches = async () => {
    const res = await api.get(`/materials/batches?store_id=${storeId}`);
    if (res.success) {
      setBatches(res.data);
    }
  };

  const loadMaterials = async () => {
    const res = await api.get('/materials');
    if (res.success) {
      setMaterials(res.data);
    }
  };

  const loadWarnings = async () => {
    const res = await api.get(`/materials/batches/warning?store_id=${storeId}`);
    if (res.success) {
      setWarnings(res.data);
    }
  };

  const loadExpired = async () => {
    const res = await api.get(`/materials/batches/expired?store_id=${storeId}`);
    if (res.success) {
      setExpired(res.data);
    }
  };

  const handleAddBatch = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const res = await api.post('/materials/batches', {
        ...values,
        store_id: storeId
      });
      if (res.success) {
        message.success('批次添加成功');
        setModalVisible(false);
        loadBatches();
        loadInventory();
        loadWarnings();
        loadExpired();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReportExpired = async (batch) => {
    const res = await api.post('/loss', {
      material_id: batch.material_id,
      store_id: storeId,
      batch_id: batch.id,
      loss_date: dayjs().format('YYYY-MM-DD'),
      quantity: batch.quantity,
      loss_type: 'expired',
      reason: '原料过期报损',
      is_abnormal: 0
    });
    if (res.success) {
      message.success('过期报损已记录');
      loadExpired();
      loadBatches();
    }
  };

  const inventoryColumns = [
    { title: '原料名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '总库存', dataIndex: 'total_quantity', key: 'total_quantity',
      render: (v, r) => `${v || 0} ${r.unit}`
    },
    { title: '最早过期', dataIndex: 'earliest_expiry', key: 'earliest_expiry',
      render: (v) => {
        if (!v) return '-';
        const days = dayjs(v).diff(dayjs(), 'day');
        let color = 'green';
        if (days <= 7) color = 'red';
        else if (days <= 30) color = 'orange';
        return <Tag color={color}>{v}</Tag>;
      }
    }
  ];

  const batchColumns = [
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', render: (v) => v ? `¥${v}` : '-' },
    { title: '生产日期', dataIndex: 'production_date', key: 'production_date' },
    { title: '过期日期', dataIndex: 'expiry_date', key: 'expiry_date',
      render: (v, r) => {
        const days = r.days_to_expiry;
        if (days < 0) return <Tag color="red">已过期</Tag>;
        if (days <= 7) return <Tag color="orange">{v}</Tag>;
        return v;
      }
    },
    { title: '状态', dataIndex: 'status', key: 'status',
      render: (v) => {
        const map = { normal: '正常', warning: '临期', expired: '过期' };
        return <Tag>{map[v] || v}</Tag>;
      }
    }
  ];

  const warningColumns = [
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '剩余数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
    { title: '距过期天数', dataIndex: 'days_to_expiry', key: 'days_to_expiry',
      render: (v) => <Tag color="orange">{Math.round(v)}天</Tag>
    }
  ];

  const expiredColumns = [
    { title: '原料', dataIndex: 'material_name', key: 'material_name' },
    { title: '批次号', dataIndex: 'batch_no', key: 'batch_no' },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v, r) => `${v} ${r.unit}` },
    { title: '过期天数', dataIndex: 'days_expired', key: 'days_expired',
      render: (v) => <Tag color="red">{Math.round(v)}天</Tag>
    },
    { title: '操作', key: 'action',
      render: (_, record) => (
        <Button type="primary" size="small" danger onClick={() => handleReportExpired(record)}>
          报损处理
        </Button>
      )
    }
  ];

  return (
    <div>
      {warnings.length > 0 && (
        <Alert
          message="原料临期预警"
          description={`有 ${warnings.length} 批原料即将过期，请优先使用或及时处理`}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs defaultActiveKey="inventory">
        <TabPane tab="库存总览" key="inventory">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>原料库存</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBatch}>入库批次</Button>
          </div>
          <Table dataSource={inventory} columns={inventoryColumns} rowKey="material_id" />
        </TabPane>

        <TabPane tab="批次管理" key="batches">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2>批次列表</h2>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBatch}>入库批次</Button>
          </div>
          <Table dataSource={batches} columns={batchColumns} rowKey="id" />
        </TabPane>

        <TabPane tab={`临期预警 (${warnings.length})`} key="warnings">
          <h2 style={{ marginBottom: 16 }}>临期原料</h2>
          <Table dataSource={warnings} columns={warningColumns} rowKey="id" />
        </TabPane>

        <TabPane tab={`过期原料 (${expired.length})`} key="expired">
          <h2 style={{ marginBottom: 16 }}>过期原料</h2>
          <Table dataSource={expired} columns={expiredColumns} rowKey="id" />
        </TabPane>
      </Tabs>

      <Modal
        title="原料入库"
        open={modalVisible}
        onOk={handleOk}
        onCancel={() => setModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="material_id" label="原料" rules={[{ required: true }]}>
            <Select>
              {materials.map(m => (
                <Option key={m.id} value={m.id}>{m.name} ({m.category})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="batch_no" label="批次号" rules={[{ required: true }]}>
            <Input placeholder="例如：BATCH202405001" />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="unit_price" label="单价">
            <Input type="number" step="0.01" />
          </Form.Item>
          <Form.Item name="production_date" label="生产日期">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="expiry_date" label="过期日期" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Inventory;
