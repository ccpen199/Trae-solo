import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, message, Card, Row, Col, Descriptions, List } from 'antd';
import { AlertOutlined, PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons';
import { getDisputes, createDispute, getProjects } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ManagerDisputes = () => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState(null);
  const [form] = Form.useForm();

  const typeOptions = [
    { value: 'quality', label: '质量问题' },
    { value: 'schedule', label: '工期延误' },
    { value: 'price', label: '价格纠纷' },
    { value: 'material', label: '材料问题' },
    { value: 'service', label: '服务态度' },
    { value: 'other', label: '其他问题' }
  ];

  const statusMap = {
    submitted: { color: 'orange', text: '已提交', icon: <ClockCircleOutlined /> },
    processing: { color: 'blue', text: '处理中', icon: <ClockCircleOutlined /> },
    arbitrated: { color: 'purple', text: '已仲裁', icon: <CheckCircleOutlined /> },
    resolved: { color: 'green', text: '已解决', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', text: '已关闭', icon: <CheckCircleOutlined /> }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadProjects = async () => {
    const res = await getProjects({ pageSize: 100 });
    if (res.code === 200) {
      setProjects(res.data.list);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getDisputes({ status: statusFilter });
    if (res.code === 200) {
      setData(res.data);
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const res = await createDispute(values);
    if (res.code === 200) {
      message.success('纠纷已提交，平台将尽快处理');
      setModalVisible(false);
      form.resetFields();
      loadData();
    }
  };

  const columns = [
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '项目', dataIndex: 'project_title', key: 'project_title', ellipsis: true },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      width: 120,
      render: v => {
        const opt = typeOptions.find(o => o.value === v);
        return <Tag color="blue">{opt?.label || v}</Tag>;
      }
    },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '投诉人', dataIndex: 'complainant_name', key: 'complainant_name', width: 100 },
    { title: '仲裁人', dataIndex: 'arbitrator_name', key: 'arbitrator_name', width: 100, render: v => v || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      width: 100,
      render: v => <Tag color={statusMap[v]?.color}>{statusMap[v]?.icon} {statusMap[v]?.text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => { setCurrentDispute(record); setDetailVisible(true); }}>
          详情
        </Button>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <AlertOutlined style={{ marginRight: 8 }} />
          纠纷仲裁
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalVisible(true); }}>
          提交纠纷
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          placeholder="状态筛选"
          allowClear
          style={{ width: 160 }}
          value={statusFilter || undefined}
          onChange={v => setStatusFilter(v || '')}
        >
          {Object.entries(statusMap).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v.text}</Select.Option>
          ))}
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title="提交纠纷仲裁"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="project_id" label="所属项目" rules={[{ required: true }]}>
            <Select options={projects.map(p => ({ label: p.title, value: p.id }))} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="纠纷类型" rules={[{ required: true }]}>
                <Select options={typeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="respondent_id" label="被投诉方">
                <Select>
                  <Select.Option value={1}>装修公司</Select.Option>
                  <Select.Option value={4}>设计师</Select.Option>
                  <Select.Option value={6}>装修管家</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请简要描述问题" maxLength={50} />
          </Form.Item>
          <Form.Item name="description" label="详细描述" rules={[{ required: true }]}>
            <TextArea rows={4} placeholder="请详细描述纠纷情况，包括时间、地点、涉及人员、具体问题等" />
          </Form.Item>
          <Form.Item name="evidence" label="举证材料">
            <TextArea rows={2} placeholder="请提供相关证据，如合同条款、照片、聊天记录等" />
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
        title="纠纷详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentDispute && (
          <div>
            <div style={{ padding: 16, background: '#fff7e6', borderRadius: 8, marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={16}>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{currentDispute.title}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'right' }}>
                  <Tag color={statusMap[currentDispute.status]?.color}>
                    {statusMap[currentDispute.status]?.icon} {statusMap[currentDispute.status]?.text}
                  </Tag>
                </Col>
              </Row>
            </div>

            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="提交时间">{dayjs(currentDispute.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              <Descriptions.Item label="所属项目">{currentDispute.project_title}</Descriptions.Item>
              <Descriptions.Item label="纠纷类型">
                {typeOptions.find(o => o.value === currentDispute.type)?.label}
              </Descriptions.Item>
              <Descriptions.Item label="投诉人">{currentDispute.complainant_name}</Descriptions.Item>
              {currentDispute.arbitrator_name && (
                <Descriptions.Item label="仲裁人">{currentDispute.arbitrator_name}</Descriptions.Item>
              )}
              {currentDispute.arbitration_time && (
                <Descriptions.Item label="仲裁时间">{dayjs(currentDispute.arbitration_time).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
              )}
            </Descriptions>

            <div className="detail-section">
              <div className="detail-section-title">纠纷描述</div>
              <Paragraph>{currentDispute.description}</Paragraph>
            </div>

            {currentDispute.evidence && (
              <div className="detail-section">
                <div className="detail-section-title">举证材料</div>
                <Paragraph>{currentDispute.evidence}</Paragraph>
              </div>
            )}

            {currentDispute.arbitration_result && (
              <div className="detail-section">
                <div className="detail-section-title">仲裁结果</div>
                <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Paragraph style={{ margin: 0 }}>{currentDispute.arbitration_result}</Paragraph>
                </Card>
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 12, color: '#888', textAlign: 'center' }}>
              平台承诺在3个工作日内处理您的纠纷，请保持电话畅通
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagerDisputes;
