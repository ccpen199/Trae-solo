import React, { useState, useEffect } from 'react';
import { Table, Form, Input, Select, Button, Card, Space, Tag, message, Modal } from 'antd';
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getPolicies, payPolicy, getFarmers, getCrops } from '../../utils/api.js';

const statusColors = { active: 'green', expired: 'default', cancelled: 'red', unpaid: 'red', paid: 'green', refunded: 'orange' };
const statusLabels = { active: '有效', expired: '已过期', cancelled: '已注销', unpaid: '未支付', paid: '已支付', refunded: '已退款' };
const cropLabels = { RICE: '水稻', WHEAT: '小麦', CORN: '玉米', SOYBEAN: '大豆', COTTON: '棉花', VEGETABLE: '蔬菜', FRUIT: '果树', OTHER: '其他' };

const { Option } = Select;

function PolicyList() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [farmers, setFarmers] = useState([]);
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    loadDict();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize]);

  const loadDict = async () => {
    try {
      const [farmersRes, cropsRes] = await Promise.all([getFarmers(), getCrops()]);
      setFarmers(farmersRes.data || []);
      setCrops(cropsRes.data || []);
    } catch (e) {
      console.error('Load dict failed:', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue();
      const params = {
        limit: pagination.pageSize,
        offset: (pagination.current - 1) * pagination.pageSize,
        ...values
      };
      const res = await getPolicies(params);
      setData(res.data.data || []);
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }));
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    setTimeout(() => loadData(), 0);
  };

  const handleReset = () => {
    form.resetFields();
    handleSearch();
  };

  const handlePay = (record) => {
    Modal.confirm({
      title: '确认支付',
      content: `确认支付保单 ${record.policy_no} 的保费 ¥${record.premium}？`,
      onOk: async () => {
        try {
          await payPolicy(record.id);
          message.success('支付成功');
          loadData();
        } catch (e) {
          message.error('支付失败');
        }
      }
    });
  };

  const columns = [
    { title: '保单号', dataIndex: 'policy_no', key: 'policy_no', width: 140 },
    { title: '农户', dataIndex: 'farmer_name', key: 'farmer_name', width: 100 },
    { title: '作物类型', dataIndex: 'crop_type', key: 'crop_type', width: 100, render: v => cropLabels[v] || v },
    { title: '面积(亩)', dataIndex: 'area', key: 'area', width: 90 },
    { title: '保险金额(元)', dataIndex: 'insurance_amount', key: 'insurance_amount', width: 120, render: v => `¥${v?.toLocaleString() || 0}` },
    { title: '保费(元)', dataIndex: 'premium', key: 'premium', width: 100, render: v => `¥${v?.toLocaleString() || 0}` },
    { title: '起期', dataIndex: 'start_date', key: 'start_date', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '止期', dataIndex: 'end_date', key: 'end_date', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    { title: '保费状态', dataIndex: 'payment_status', key: 'payment_status', width: 100, render: s => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    { title: '保单状态', dataIndex: 'status', key: 'status', width: 100, render: s => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/policies/${record.id}`)}>详情</Button>
          {record.payment_status === 'unpaid' && (
            <Button type="link" onClick={() => handlePay(record)}>支付保费</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <div className="page-title">保单管理</div>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="policy_no" label="保单号">
            <Input placeholder="请输入保单号" allowClear style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="farmer_id" label="农户">
            <Select placeholder="请选择农户" allowClear style={{ width: 160 }}>
              {farmers.map(f => <Option key={f.id} value={f.id}>{f.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 140 }}>
              <Option value="active">有效</Option>
              <Option value="expired">已过期</Option>
              <Option value="cancelled">已注销</Option>
            </Select>
          </Form.Item>
          <Form.Item name="crop_type" label="作物类型">
            <Select placeholder="请选择作物类型" allowClear style={{ width: 140 }}>
              {crops.map(c => <Option key={c.code} value={c.code}>{c.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/policies/create')}>
            新增保单
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize }))
          }}
        />
      </Card>
    </div>
  );
}

export default PolicyList;
