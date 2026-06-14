import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, InputNumber, message, Card, Row, Col, Descriptions } from 'antd';
import { BookOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { getProcessKnowledge, getProcessCategories, createProcessKnowledge } from '../api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminProcess = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentProcess, setCurrentProcess] = useState(null);
  const [form] = Form.useForm();

  const categoryColors = {
    '拆改工程': 'red',
    '水电工程': 'orange',
    '泥瓦工程': 'yellow',
    '木工工程': 'green',
    '油漆工程': 'cyan',
    '安装工程': 'blue',
    '竣工验收': 'purple'
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, categoryFilter]);

  const loadCategories = async () => {
    const res = await getProcessCategories();
    if (res.code === 200) {
      setCategories(res.data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getProcessKnowledge({
      page: pagination.current,
      pageSize: pagination.pageSize,
      category: categoryFilter
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const res = await createProcessKnowledge(values);
    if (res.code === 200) {
      message.success('创建成功');
      setModalVisible(false);
      form.resetFields();
      loadCategories();
      loadData();
    }
  };

  const columns = [
    { title: '分类', dataIndex: 'category', key: 'category', width: 120, render: v => <Tag color={categoryColors[v] || 'blue'}>{v}</Tag> },
    { title: '工艺名称', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '规范标准', dataIndex: 'standard', key: 'standard', ellipsis: true },
    { title: '工期标准(天)', dataIndex: 'duration_standard', key: 'duration', width: 110, render: v => v ? `${v}天` : '-' },
    { title: '浏览量', dataIndex: 'view_count', key: 'view_count', width: 90 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentProcess(record); setDetailVisible(true); }}>
          查看
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <BookOutlined style={{ marginRight: 8 }} />
          工艺工法知识库
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          添加工艺
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {categories.map(cat => (
          <Col xs={12} sm={6} md={4} lg={3} key={cat.name}>
            <Card
              size="small"
              hoverable
              onClick={() => setCategoryFilter(categoryFilter === cat.name ? '' : cat.name)}
              style={{
                borderColor: categoryFilter === cat.name ? '#1890ff' : '#d9d9d9',
                background: categoryFilter === cat.name ? '#e6f7ff' : '#fff'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Tag color={categoryColors[cat.name] || 'blue'}>{cat.name}</Tag>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{cat.count}</div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

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
        title="添加工艺标准"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="所属分类" rules={[{ required: true }]}>
                <Select options={Object.keys(categoryColors).map(c => ({ label: c, value: c }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="duration_standard" label="标准工期(天)">
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="工艺名称" rules={[{ required: true }]}>
            <Input placeholder="如: 墙体拆除、水路改造等" />
          </Form.Item>
          <Form.Item name="content" label="施工流程">
            <TextArea rows={3} placeholder="请详细描述施工流程和步骤" />
          </Form.Item>
          <Form.Item name="standard" label="质量标准" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="请描述质量验收标准" />
          </Form.Item>
          <Form.Item name="acceptance_criteria" label="验收规范">
            <TextArea rows={2} placeholder="请描述验收方法和合格标准" />
          </Form.Item>
          <Form.Item name="safety_notes" label="安全注意事项">
            <TextArea rows={2} placeholder="请描述施工安全注意事项" />
          </Form.Item>
          <Form.Item name="video_url" label="教学视频链接">
            <Input placeholder="视频URL地址" />
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
        title="工艺详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentProcess && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Tag color={categoryColors[currentProcess.category] || 'blue'}>{currentProcess.category}</Tag>
                  <span style={{ fontSize: 16, fontWeight: 500, marginLeft: 8 }}>{currentProcess.title}</span>
                </div>
                <Text type="secondary">标准工期: {currentProcess.duration_standard || '-'}天</Text>
              </div>
            </Card>

            <div className="detail-section">
              <div className="detail-section-title">施工流程</div>
              <Paragraph>{currentProcess.content || '暂无详细说明'}</Paragraph>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">质量标准</div>
              <Paragraph>{currentProcess.standard || '暂无详细说明'}</Paragraph>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">验收规范</div>
              <Paragraph>{currentProcess.acceptance_criteria || '暂无详细说明'}</Paragraph>
            </div>

            <div className="detail-section">
              <div className="detail-section-title">安全注意事项</div>
              <Paragraph>{currentProcess.safety_notes || '暂无详细说明'}</Paragraph>
            </div>

            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 16 }}>
              浏览 {currentProcess.view_count || 0} 次
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminProcess;
