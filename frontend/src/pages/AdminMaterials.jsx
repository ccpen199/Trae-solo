import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, InputNumber, DatePicker, message, Card, Row, Col } from 'antd';
import { TagOutlined, PlusOutlined, RiseOutlined, FallOutlined, LineChartOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { getMaterialPrices, getMaterialPriceTrend, createMaterialPrice } from '../api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const AdminMaterials = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [regionFilter, setRegionFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [trendVisible, setTrendVisible] = useState(false);
  const [trendData, setTrendData] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [form] = Form.useForm();

  const trendColors = {
    up: '#f5222d',
    down: '#52c41a',
    stable: '#8c8c8c'
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, regionFilter, materialFilter]);

  const loadData = async () => {
    setLoading(true);
    const res = await getMaterialPrices({
      page: pagination.current,
      pageSize: pagination.pageSize,
      region: regionFilter,
      material_name: materialFilter
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const payload = {
      ...values,
      price_date: values.price_date.format('YYYY-MM-DD')
    };

    const res = await createMaterialPrice(payload);
    if (res.code === 200) {
      message.success('价格录入成功');
      setModalVisible(false);
      form.resetFields();
      loadData();
    }
  };

  const handleViewTrend = async (materialName) => {
    setSelectedMaterial(materialName);
    const res = await getMaterialPriceTrend({ material_name: materialName, days: 30 });
    if (res.code === 200) {
      setTrendData(res.data);
      setTrendVisible(true);
    }
  };

  const columns = [
    { title: '材料名称', dataIndex: 'material_name', key: 'material_name', ellipsis: true },
    { title: '规格', dataIndex: 'specification', key: 'specification', width: 120 },
    { title: '品牌', dataIndex: 'brand', key: 'brand', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '地区', dataIndex: 'region', key: 'region', width: 100 },
    { 
      title: '价格(元)', 
      dataIndex: 'price', 
      key: 'price', 
      width: 110,
      render: v => <span style={{ color: '#f5222d', fontWeight: 500 }}>{v?.toFixed(2)}</span>
    },
    { 
      title: '走势', 
      dataIndex: 'trend', 
      key: 'trend', 
      width: 80,
      render: (v, record) => {
        const color = v === 'up' ? '#f5222d' : v === 'down' ? '#52c41a' : '#8c8c8c';
        const icon = v === 'up' ? <RiseOutlined /> : v === 'down' ? <FallOutlined /> : '-';
        return <span style={{ color }}>{icon} {record.change_rate || 0}%</span>;
      }
    },
    { title: '数据日期', dataIndex: 'price_date', key: 'price_date', width: 110 },
    { title: '来源', dataIndex: 'source', key: 'source', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<LineChartOutlined />} onClick={() => handleViewTrend(record.material_name)}>
          趋势
        </Button>
      )
    }
  ];

  const trendChart = trendData.length > 0 ? {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: trendData.map(d => d.price_date) },
    yAxis: { type: 'value' },
    series: [{
      name: selectedMaterial,
      type: 'line',
      data: trendData.map(d => d.price),
      smooth: true,
      areaStyle: {},
      itemStyle: { color: '#1890ff' },
      lineStyle: { color: '#1890ff' }
    }]
  } : {};

  const priceStats = data.reduce((acc, item) => {
    if (!acc[item.material_name]) {
      acc[item.material_name] = { count: 0, avg: 0, total: 0, latest: item };
    }
    acc[item.material_name].count++;
    acc[item.material_name].total += item.price;
    acc[item.material_name].avg = acc[item.material_name].total / acc[item.material_name].count;
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <TagOutlined style={{ marginRight: 8 }} />
          建材价格监测
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          录入价格
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {Object.entries(priceStats).slice(0, 4).map(([name, stats]) => (
          <Col xs={24} sm={12} lg={6} key={name}>
            <Card size="small">
              <div style={{ fontSize: 12, color: '#888' }}>{name}</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>¥{stats.avg.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#888' }}>{stats.count}条记录</div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          placeholder="搜索材料名称"
          style={{ width: 200 }}
          value={materialFilter}
          onChange={e => setMaterialFilter(e.target.value)}
          allowClear
        />
        <Select
          placeholder="地区"
          allowClear
          style={{ width: 160 }}
          value={regionFilter || undefined}
          onChange={v => setRegionFilter(v || '')}
        >
          <Select.Option value="北京市">北京市</Select.Option>
          <Select.Option value="上海市">上海市</Select.Option>
          <Select.Option value="广州市">广州市</Select.Option>
          <Select.Option value="深圳市">深圳市</Select.Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="录入建材价格"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="material_name" label="材料名称" rules={[{ required: true }]}>
                <Input placeholder="如: PPR水管" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="specification" label="规格" rules={[{ required: true }]}>
                <Input placeholder="如: Dn25" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="brand" label="品牌">
                <Input placeholder="品牌名称" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
                <Input placeholder="如: 米、个、桶" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="region" label="地区" rules={[{ required: true }]}>
                <Input placeholder="如: 北京市" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="price" label="价格(元)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} precision={2} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price_date" label="价格日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="source" label="数据来源">
            <Input placeholder="如: 建材市场、官方报价" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedMaterial} - 价格走势`}
        open={trendVisible}
        onCancel={() => setTrendVisible(false)}
        footer={null}
        width={800}
      >
        {trendData.length > 0 ? (
          <ReactECharts option={trendChart} style={{ height: 300 }} />
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>暂无趋势数据</div>
        )}
      </Modal>
    </div>
  );
};

export default AdminMaterials;
