import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Typography, Select, Modal, Form, Input, message, Card, Descriptions, Timeline, Badge, Row, Col } from 'antd';
import { AlertOutlined, CheckCircleOutlined, EyeOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getComplaints, handleComplaint } from '../api';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminComplaints = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [handleVisible, setHandleVisible] = useState(false);
  const [currentComplaint, setCurrentComplaint] = useState(null);
  const [form] = Form.useForm();

  const statusMap = {
    pending: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
    processing: { color: 'blue', text: '处理中', icon: <ClockCircleOutlined /> },
    resolved: { color: 'green', text: '已解决', icon: <CheckCircleOutlined /> },
    closed: { color: 'default', text: '已关闭', icon: <CheckCircleOutlined /> }
  };

  const typeColors = {
    quality: 'red',
    schedule: 'orange',
    price: 'yellow',
    material: 'blue',
    service: 'purple',
    other: 'default'
  };

  const typeLabels = {
    quality: '质量问题',
    schedule: '工期延误',
    price: '价格纠纷',
    material: '材料问题',
    service: '服务态度',
    other: '其他问题'
  };

  useEffect(() => {
    loadData();
  }, [pagination.current, pagination.pageSize, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    const res = await getComplaints({
      page: pagination.current,
      pageSize: pagination.pageSize,
      status: statusFilter
    });
    if (res.code === 200) {
      setData(res.data.list);
      setPagination(prev => ({ ...prev, total: res.data.total }));
    }
    setLoading(false);
  };

  const handleSubmit = async (values) => {
    const res = await handleComplaint(currentComplaint.id, {
      handle_result: values.handle_result
    });
    if (res.code === 200) {
      message.success('处理完成');
      setHandleVisible(false);
      setCurrentComplaint(null);
      form.resetFields();
      loadData();
    }
  };

  const columns = [
    { title: '提交时间', dataIndex: 'created_at', key: 'created_at', width: 160, render: v => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '投诉类型', dataIndex: 'type', key: 'type', width: 120, render: v => <Tag color={typeColors[v]}>{typeLabels[v] || v}</Tag> },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '投诉人', dataIndex: 'complainant_name', key: 'complainant', width: 100 },
    { title: '涉事公司', dataIndex: 'company_name', key: 'company', width: 150, ellipsis: true },
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
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => { setCurrentComplaint(record); setDetailVisible(true); }}>
            溯源
          </Button>
          {record.status === 'pending' && (
            <Button type="primary" size="small" onClick={() => { setCurrentComplaint(record); form.resetFields(); setHandleVisible(true); }}>
              处理
            </Button>
          )}
        </Space>
      )
    }
  ];

  const traceData = [
    { color: 'blue', title: '投诉提交', desc: '业主提交投诉', time: '2026-06-15 10:30' },
    { color: 'blue', title: '平台受理', desc: '客服人员受理投诉', time: '2026-06-15 10:45' },
    { color: 'orange', title: '公司反馈', desc: '装修公司提交反馈材料', time: '2026-06-15 14:20' },
    { color: 'orange', title: '双方举证', desc: '业主和装修公司分别举证', time: '2026-06-16 09:00' },
    { color: 'green', title: '仲裁处理', desc: '平台仲裁员给出处理结果', time: '2026-06-17 15:30' }
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={4} style={{ margin: 0 }}>
          <AlertOutlined style={{ marginRight: 8 }} />
          投诉溯源分析
        </Title>
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
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`
        }}
        onChange={(p) => setPagination(prev => ({ ...prev, current: p.current, pageSize: p.pageSize }))}
      />

      <Modal
        title="投诉溯源详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentComplaint && (
          <div>
            <Card size="small" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Tag color={typeColors[currentComplaint.type]}>{typeLabels[currentComplaint.type]}</Tag>
                  <span style={{ fontSize: 16, fontWeight: 500, marginLeft: 8 }}>{currentComplaint.title}</span>
                </div>
                <Tag color={statusMap[currentComplaint.status]?.color}>
                  {statusMap[currentComplaint.status]?.icon} {statusMap[currentComplaint.status]?.text}
                </Tag>
              </div>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="投诉人">{currentComplaint.complainant_name}</Descriptions.Item>
                  <Descriptions.Item label="涉事公司">{currentComplaint.company_name}</Descriptions.Item>
                  <Descriptions.Item label="提交时间">{dayjs(currentComplaint.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="处理人">{currentComplaint.handler_id ? '平台仲裁员' : '-'}</Descriptions.Item>
                  <Descriptions.Item label="处理时间">{currentComplaint.handle_time ? dayjs(currentComplaint.handle_time).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                  <Descriptions.Item label="关联项目">{currentComplaint.project_title || '-'}</Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <div className="detail-section">
              <div className="detail-section-title">投诉内容</div>
              <Paragraph>{currentComplaint.content}</Paragraph>
            </div>

            {currentComplaint.handle_result && (
              <div className="detail-section">
                <div className="detail-section-title">处理结果</div>
                <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                  <Paragraph style={{ margin: 0 }}>{currentComplaint.handle_result}</Paragraph>
                </Card>
              </div>
            )}

            <div className="detail-section">
              <div className="detail-section-title">全链路溯源</div>
              <Timeline
                items={traceData.map(item => ({
                  color: item.color,
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.title}</div>
                      <div style={{ color: '#888', fontSize: 12 }}>{item.desc}</div>
                      <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{item.time}</div>
                    </div>
                  )
                }))}
              />
            </div>

            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 16 }}>
              全链路埋点数据已记录，支持完整溯源
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="处理投诉"
        open={handleVisible}
        onCancel={() => setHandleVisible(false)}
        footer={null}
        width={600}
      >
        {currentComplaint && (
          <Card size="small" style={{ marginBottom: 16, background: '#fff7e6' }}>
            <div style={{ fontWeight: 500 }}>{currentComplaint.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              投诉人: {currentComplaint.complainant_name} | 类型: {typeLabels[currentComplaint.type]}
            </div>
          </Card>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="handle_result" label="处理结果" rules={[{ required: true }]}>
            <TextArea rows={5} placeholder="请详细描述处理结果，包括解决方案、赔偿方案、责任认定等" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交处理结果</Button>
              <Button onClick={() => setHandleVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminComplaints;
