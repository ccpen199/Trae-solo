import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Modal, Form, Select, Input, 
  message, Space, Avatar, Drawer, Descriptions
} from 'antd';
import { 
  ExclamationCircleOutlined, CheckOutlined, CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import api from '../../api';
import type { Dispute } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const data: any = await api.get('/disputes', { params: { limit: 50 } });
      setDisputes(data.disputes);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待处理', color: 'orange' },
      processing: { text: '处理中', color: 'blue' },
      resolved: { text: '已解决', color: 'green' },
      rejected: { text: '已驳回', color: 'red' },
      auto_review: { text: '自动审核', color: 'purple' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const handleViewDetail = (record: Dispute) => {
    setCurrentDispute(record);
    setDetailVisible(true);
  };

  const handleResolve = (record: Dispute) => {
    setCurrentDispute(record);
    setResolveModalVisible(true);
  };

  const handleSubmitResolve = async (values: any) => {
    try {
      await api.post(`/disputes/${currentDispute?.id}/resolve`, values);
      message.success('纠纷处理成功');
      setResolveModalVisible(false);
      form.resetFields();
      fetchDisputes();
    } catch (error: any) {
      message.error(error.response?.data?.error || '处理失败');
    }
  };

  const columns = [
    {
      title: '纠纷原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (text: string, record: Dispute) => (
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          <span>{text}</span>
          {record.status === 'auto_review' && <Tag color="purple">自动触发</Tag>}
        </Space>
      ),
    },
    {
      title: '投诉人',
      dataIndex: 'complainant_name',
      key: 'complainant_name',
      render: (text: string, record: Dispute) => (
        <Space>
          <Avatar size="small" src={record.complainant_avatar} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '被投诉人',
      dataIndex: 'respondent_name',
      key: 'respondent_name',
      render: (text: string, record: Dispute) => (
        <Space>
          <Avatar size="small" src={record.respondent_avatar} />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          labor: '用工订单',
          delivery: '找车订单',
          moving: '搬家订单',
        };
        return <Tag>{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = getStatusText(status);
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Dispute) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {(record.status === 'pending' || record.status === 'auto_review') && (
            <Button size="small" type="primary" onClick={() => handleResolve(record)}>
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: 16 }}>⚖️ 纠纷仲裁工作台</h2>

      <Card style={{ marginBottom: 16 }} size="small">
        <Space size="large">
          <div>
            <span style={{ color: '#8c8c8c' }}>待处理:</span>
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {disputes.filter(d => d.status === 'pending' || d.status === 'auto_review').length} 件
            </Tag>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>今日新增:</span>
            <Tag color="blue" style={{ marginLeft: 8 }}>3 件</Tag>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>已解决:</span>
            <Tag color="green" style={{ marginLeft: 8 }}>
              {disputes.filter(d => d.status === 'resolved').length} 件
            </Tag>
          </div>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={disputes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title="纠纷详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentDispute && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="纠纷原因">{currentDispute.reason}</Descriptions.Item>
              <Descriptions.Item label="详细描述">{currentDispute.description || '无'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusText(currentDispute.status).color}>
                  {getStatusText(currentDispute.status).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="订单类型">
                {currentDispute.order_type === 'labor' ? '用工订单' : 
                 currentDispute.order_type === 'delivery' ? '找车订单' : '搬家订单'}
              </Descriptions.Item>
              <Descriptions.Item label="投诉人">
                <Space>
                  <Avatar size="small" src={currentDispute.complainant_avatar} />
                  {currentDispute.complainant_name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="被投诉人">
                <Space>
                  <Avatar size="small" src={currentDispute.respondent_avatar} />
                  {currentDispute.respondent_name}
                </Space>
              </Descriptions.Item>
              {currentDispute.arbitrator_name && (
                <Descriptions.Item label="仲裁员">{currentDispute.arbitrator_name}</Descriptions.Item>
              )}
              <Descriptions.Item label="提交时间">{currentDispute.created_at}</Descriptions.Item>
              {currentDispute.resolution && (
                <Descriptions.Item label="处理结果">{currentDispute.resolution}</Descriptions.Item>
              )}
            </Descriptions>

            {currentDispute.evidence_photos && currentDispute.evidence_photos.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>现场照片</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {currentDispute.evidence_photos.map((photo, index) => (
                    <div key={index} style={{ width: 80, height: 80, background: '#f0f0f0', borderRadius: 4 }}>
                      📷
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentDispute.call_recordings && currentDispute.call_recordings.length > 0 && (
              <div>
                <div style={{ marginBottom: 8, fontWeight: 500 }}>通话录音</div>
                {currentDispute.call_recordings.map((rec, index) => (
                  <div key={index} style={{ padding: 8, background: '#f5f5f5', borderRadius: 4, marginBottom: 4 }}>
                    🎵 {rec}
                  </div>
                ))}
              </div>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="处理纠纷"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmitResolve} layout="vertical">
          <Form.Item label="处理结果" name="status" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Select>
              <Option value="resolved">解决</Option>
              <Option value="rejected">驳回</Option>
              <Option value="processing">处理中</Option>
            </Select>
          </Form.Item>
          <Form.Item label="处理说明" name="resolution" rules={[{ required: true, message: '请输入处理说明' }]}>
            <TextArea rows={4} placeholder="请输入处理说明" />
          </Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">提交处理</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminDisputes;
