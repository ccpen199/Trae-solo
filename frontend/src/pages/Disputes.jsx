import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Descriptions, Empty, Spin, Divider, Modal, Form, Input, Radio, message, Table } from 'antd';
import { 
  WarningOutlined, 
  EyeOutlined, 
  CheckCircleOutlined,
  FileTextOutlined,
  MessageOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RadioGroup } = Radio;

const Disputes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [handling, setHandling] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/disputes/pending?limit=50');
      if (response.success) {
        setDisputes(response.disputes || []);
      }
    } catch (error) {
      console.error('获取争议列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputeDetail = async (disputeId) => {
    try {
      const response = await api.get(`/api/disputes/${disputeId}`);
      if (response.success) {
        setSelectedDispute(response);
      }
    } catch (error) {
      console.error('获取争议详情失败:', error);
    }
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { text: '待处理', color: 'orange' },
      resolved: { text: '已解决', color: 'green' },
      closed: { text: '已关闭', color: 'default' }
    };
    return config[status] || { text: status, color: 'default' };
  };

  const getInitiatorRoleText = (role) => {
    const roleMap = {
      client: '咨询用户',
      lawyer: '律师',
      support: '平台客服'
    };
    return roleMap[role] || role;
  };

  const handleDispute = async (values) => {
    setHandling(true);
    try {
      const response = await api.post(`/api/disputes/${selectedDispute.dispute.id}/handle`, {
        resolution: values.resolution,
        shouldRefund: values.shouldRefund === 'yes',
        refundAmount: values.refundAmount || 0
      });

      if (response.success) {
        message.success('争议处理成功');
        setShowHandleModal(false);
        form.resetFields();
        fetchDisputes();
        if (selectedDispute?.dispute?.id) {
          fetchDisputeDetail(selectedDispute.dispute.id);
        }
      }
    } catch (error) {
      console.error('处理争议失败:', error);
    } finally {
      setHandling(false);
    }
  };

  const columns = [
    {
      title: '争议ID',
      dataIndex: ['dispute', 'id'],
      key: 'id',
      width: 200,
      render: (text) => <code style={{ fontSize: '12px' }}>{text}</code>
    },
    {
      title: '咨询标题',
      dataIndex: ['dispute', 'consultation_title'],
      key: 'title',
      ellipsis: true
    },
    {
      title: '发起方',
      key: 'initiator',
      render: (_, record) => (
        <div>
          <p style={{ margin: 0 }}>{record.dispute.initiator_name || record.dispute.initiator_real_name}</p>
          <Tag>{getInitiatorRoleText(record.dispute.initiator_role)}</Tag>
        </div>
      ),
      width: 120
    },
    {
      title: '争议原因',
      dataIndex: ['dispute', 'reason'],
      key: 'reason',
      width: 150
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => {
        const statusConfig = getStatusConfig(record.dispute.status);
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
      },
      width: 100
    },
    {
      title: '发起时间',
      dataIndex: ['dispute', 'created_at'],
      key: 'created_at',
      width: 160,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            type="link" 
            size="small"
            icon={<EyeOutlined />}
            onClick={() => fetchDisputeDetail(record.dispute.id)}
          >
            查看
          </Button>
          {record.dispute.status === 'pending' && (
            <Button 
              type="primary" 
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                fetchDisputeDetail(record.dispute.id);
                setShowHandleModal(true);
              }}
            >
              处理
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <Card title="争议处理中心">
        <Spin spinning={loading}>
          {disputes.length > 0 ? (
            <Table
              dataSource={disputes.map(d => ({ dispute: d, key: d.id }))}
              columns={columns}
              rowKey={(record) => record.dispute.id}
              pagination={{
                pageSize: 20,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          ) : (
            <Empty description="暂无待处理的争议" style={{ padding: '40px' }} />
          )}
        </Spin>
      </Card>

      <Modal
        title="争议详情"
        open={!!selectedDispute}
        onCancel={() => setSelectedDispute(null)}
        footer={
          selectedDispute?.dispute?.status === 'pending' ? [
            <Button key="close" onClick={() => setSelectedDispute(null)}>
              关闭
            </Button>,
            <Button 
              key="handle" 
              type="primary" 
              onClick={() => setShowHandleModal(true)}
            >
              处理争议
            </Button>
          ] : [
            <Button key="close" onClick={() => setSelectedDispute(null)}>
              关闭
            </Button>
          ]
        }
        width={900}
      >
        {selectedDispute && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="争议ID">
                <code>{selectedDispute.dispute.id}</code>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const statusConfig = getStatusConfig(selectedDispute.dispute.status);
                  return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="咨询单标题">
                {selectedDispute.dispute.consultation_title}
              </Descriptions.Item>
              <Descriptions.Item label="咨询分类">
                {selectedDispute.dispute.category}
              </Descriptions.Item>
              <Descriptions.Item label="发起方">
                {selectedDispute.dispute.initiator_name || selectedDispute.dispute.initiator_real_name}
                <Tag style={{ marginLeft: '8px' }}>
                  {getInitiatorRoleText(selectedDispute.dispute.initiator_role)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发起时间">
                {dayjs(selectedDispute.dispute.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>

            <Divider>争议原因</Divider>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <p><strong>原因类型：</strong>{selectedDispute.dispute.reason}</p>
              <p><strong>详细描述：</strong>{selectedDispute.dispute.description || '无'}</p>
            </Card>

            {selectedDispute.dispute.status === 'resolved' && (
              <>
                <Divider>处理结果</Divider>
                <Card size="small" style={{ marginBottom: '16px', background: '#f6ffed' }}>
                  <p><strong>处理人：</strong>{selectedDispute.dispute.handler_name || '平台客服'}</p>
                  <p><strong>处理结果：</strong>{selectedDispute.dispute.resolution}</p>
                  <p><strong>处理时间：</strong>{dayjs(selectedDispute.dispute.resolved_at).format('YYYY-MM-DD HH:mm:ss')}</p>
                  {selectedDispute.dispute.refund_amount > 0 && (
                    <p><strong>退款金额：</strong>¥{selectedDispute.dispute.refund_amount}</p>
                  )}
                  {selectedDispute.dispute.original_rating && (
                    <p>
                      <strong>评分调整：</strong>
                      原评分 {selectedDispute.dispute.original_rating?.toFixed(1)} → 
                      调整后 {selectedDispute.dispute.recalculated_rating?.toFixed(1)}
                    </p>
                  )}
                </Card>
              </>
            )}

            <Divider>咨询单信息</Divider>
            {selectedDispute.consultation && (
              <Card size="small" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="咨询单ID">
                    <code>{selectedDispute.consultation.id}</code>
                  </Descriptions.Item>
                  <Descriptions.Item label="当前状态">
                    {selectedDispute.consultation.status}
                  </Descriptions.Item>
                  <Descriptions.Item label="预算金额">
                    ¥{selectedDispute.consultation.budget_amount}
                  </Descriptions.Item>
                  <Descriptions.Item label="是否有争议">
                    {selectedDispute.consultation.is_disputed === 1 ? '是' : '否'}
                  </Descriptions.Item>
                </Descriptions>
                <Divider>咨询描述</Divider>
                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedDispute.consultation.description}</p>
              </Card>
            )}

            {selectedDispute.messages?.length > 0 && (
              <>
                <Divider>沟通记录（{selectedDispute.messages.length}条）</Divider>
                <Card size="small" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedDispute.messages.map((msg, index) => (
                    <div key={msg.id || index} style={{ marginBottom: '12px', padding: '8px', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 'bold' }}>
                          {msg.sender_name || msg.sender_real_name || '用户'}
                          <Tag style={{ marginLeft: '8px' }}>
                            {msg.sender_role === 'lawyer' ? '律师' : msg.sender_role === 'client' ? '用户' : msg.sender_role}
                          </Tag>
                        </span>
                        <span style={{ color: '#999', fontSize: '12px' }}>
                          {dayjs(msg.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </span>
                      </div>
                      <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                    </div>
                  ))}
                </Card>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="处理争议"
        open={showHandleModal}
        onCancel={() => setShowHandleModal(false)}
        onOk={() => form.submit()}
        confirmLoading={handling}
        okText="确认处理"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleDispute}
        >
          <Form.Item
            name="resolution"
            label="处理结果说明"
            rules={[{ required: true, message: '请填写处理结果说明' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细说明争议处理结果和依据"
            />
          </Form.Item>

          <Form.Item
            name="shouldRefund"
            label="是否需要退款"
            rules={[{ required: true, message: '请选择是否退款' }]}
          >
            <RadioGroup>
              <Radio value="no">不需要退款</Radio>
              <Radio value="yes">需要退款</Radio>
            </RadioGroup>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.shouldRefund !== currentValues.shouldRefund}
          >
            {({ getFieldValue }) => 
              getFieldValue('shouldRefund') === 'yes' ? (
                <Form.Item
                  name="refundAmount"
                  label="退款金额（元）"
                  rules={[
                    { required: true, message: '请输入退款金额' },
                    { type: 'number', min: 0, message: '退款金额不能为负数' }
                  ]}
                >
                  <Input.Number 
                    style={{ width: '100%' }} 
                    placeholder="请输入退款金额"
                    min={0}
                    precision={2}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <div style={{ padding: '12px', background: '#fffbe6', borderRadius: '4px', fontSize: '12px', color: '#8c8c00' }}>
            <p style={{ margin: 0 }}>
              <strong>注意：</strong>
            </p>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              <li>如果选择退款，系统将自动将指定金额退还至用户账户</li>
              <li>处理完成后，律师评分可能会根据争议情况进行调整</li>
              <li>请确保处理结果公平合理，符合平台规则</li>
            </ul>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Disputes;
