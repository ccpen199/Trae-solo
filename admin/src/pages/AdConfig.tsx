import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, Form, Input, Select, Switch, App, Card, Row, Col, Statistic, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAdList, createAd, updateAd, deleteAd, getAdStats } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const platforms = [
  { value: 'pangle', label: '穿山甲' },
  { value: '优量汇', label: '优量汇' },
];

const positions = [
  { value: 'splash', label: '开屏广告' },
  { value: 'banner', label: 'Banner广告' },
  { value: 'reward', label: '激励视频' },
  { value: 'interstitial', label: '插屏广告' },
  { value: 'native', label: '信息流' },
];

const AdConfig: React.FC = () => {
  const [list, setList] = useState<any[]>([]);
  const [adStats, setAdStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const loadData = async () => {
    setLoading(true);
    try {
      const [l, s] = await Promise.all([getAdList(), getAdStats(7)]);
      setList(l || []);
      setAdStats(s || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpen = (record?: any) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateAd(editing.id, values);
        message.success('更新成功');
      } else {
        await createAd(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData();
    } catch (e) {}
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAd(id);
      message.success('删除成功');
      loadData();
    } catch (e) {}
  };

  const totalImpressions = adStats.reduce((s, i) => s + (i.impressions || 0), 0);
  const totalClicks = adStats.reduce((s, i) => s + (i.clicks || 0), 0);
  const totalRevenue = adStats.reduce((s, i) => s + (i.revenue || 0), 0);

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '平台', dataIndex: 'platform', render: (v: string) => platforms.find(p => p.value === v)?.label || v },
    { title: '广告位', dataIndex: 'position', render: (v: string) => positions.find(p => p.value === v)?.label || v },
    { title: '广告位ID', dataIndex: 'ad_unit_id' },
    { title: '排序', dataIndex: 'sort_order' },
    {
      title: '状态',
      dataIndex: 'is_active',
      render: (v: number) => v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpen(r)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>📢 广告SDK配置</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>新增广告位</Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="7日展示量" value={totalImpressions.toLocaleString()} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="7日点击量" value={totalClicks.toLocaleString()} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="7日CTR" value={totalImpressions ? ((totalClicks / totalImpressions) * 100).toFixed(2) + '%' : '0%'} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="7日收益(元)" value={totalRevenue.toFixed(2)} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Card title="📈 近7日广告数据趋势" size="small" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={adStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="impressions" name="展示量" stroke="#667eea" strokeWidth={2} />
            <Line type="monotone" dataKey="clicks" name="点击量" stroke="#11998e" strokeWidth={2} />
            <Line type="monotone" dataKey="revenue" name="收益(元)" stroke="#f5576c" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Table rowKey="id" loading={loading} columns={columns} dataSource={list} pagination={false} />

      <Modal title={editing ? '编辑广告位' : '新增广告位'} open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleSubmit} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="platform" label="广告平台" rules={[{ required: true }]}>
            <Select options={platforms} />
          </Form.Item>
          <Form.Item name="position" label="广告位类型" rules={[{ required: true }]}>
            <Select options={positions} />
          </Form.Item>
          <Form.Item name="ad_unit_id" label="广告位ID" rules={[{ required: true }]}>
            <Input placeholder="请输入SDK后台分配的广告位ID" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="sort_order" label="排序权重" initialValue={0}>
              <Input style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="is_active" label="启用状态" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdConfig;
