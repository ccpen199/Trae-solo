import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Descriptions, Tag, Button, Select, Input, message, Card, Timeline, Space, Row, Col } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../utils/api';

function WorkOrderDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [comment, setComment] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchWorkOrder();
    fetchUsers();
  }, [id]);

  const fetchWorkOrder = async () => {
    try {
      const response = await api.get(`/workorders/${id}`);
      setWorkOrder(response.data);
    } catch (error) {
      message.error('获取工单详情失败');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.filter(u => u.role === 'repair' || u.role === 'patrol'));
    } catch (error) {
      console.error('获取用户列表失败');
    }
  };

  const handleProcess = async () => {
    if (!newStatus) {
      message.warning('请选择状态');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/workorders/${id}/process`, {
        status: newStatus,
        comment
      });
      message.success('操作成功');
      setNewStatus('');
      setComment('');
      fetchWorkOrder();
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!selectedUser) {
      message.warning('请选择处理人');
      return;
    }
    try {
      await api.put(`/workorders/${id}`, {
        assigned_user_id: selectedUser,
        status: 'assigned'
      });
      message.success('分配成功');
      setSelectedUser(null);
      fetchWorkOrder();
    } catch (error) {
      message.error('分配失败');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '待分配' },
      assigned: { color: 'blue', text: '已分配' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'green', text: '已完成' },
      verified: { color: 'success', text: '已验证' },
      closed: { color: 'gray', text: '已关闭' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getTypeTag = (type) => {
    const typeMap = {
      repair: { color: 'blue', text: '维修' },
      cleaning: { color: 'green', text: '保洁' },
      security: { color: 'orange', text: '安保' }
    };
    const info = typeMap[type] || { color: 'default', text: type };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      low: { color: 'default', text: '低' },
      normal: { color: 'blue', text: '普通' },
      high: { color: 'orange', text: '高' },
      urgent: { color: 'red', text: '紧急' }
    };
    const info = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const getAvailableStatuses = () => {
    if (!workOrder) return [];
    const statusFlow = {
      pending: ['assigned'],
      assigned: ['processing'],
      processing: ['completed'],
      completed: ['verified', 'closed'],
      verified: ['closed'],
      closed: []
    };
    return statusFlow[workOrder.status] || [];
  };

  const getActionText = (action) => {
    const actionMap = {
      create: '创建工单',
      assign: '分配工单',
      start: '开始处理',
      complete: '完成处理',
      verify: '验证通过',
      close: '关闭工单',
      status_change: '状态变更',
      reassign: '重新分配',
      update: '更新信息'
    };
    return actionMap[action] || action;
  };

  if (!workOrder) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/workorders')}>
          返回列表
        </Button>
        <h2 style={{ margin: 0 }}>工单详情 #{workOrder.id}</h2>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="基本信息">
            <Descriptions column={2}>
              <Descriptions.Item label="标题">{workOrder.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{getTypeTag(workOrder.type)}</Descriptions.Item>
              <Descriptions.Item label="优先级">{getPriorityTag(workOrder.priority)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(workOrder.status)}</Descriptions.Item>
              <Descriptions.Item label="点位">{workOrder.checkpoint_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="楼栋">{workOrder.building_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{workOrder.assigned_user_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建人">{workOrder.creator_name}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(workOrder.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="完成时间">
                {workOrder.completed_time ? dayjs(workOrder.completed_time).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>
            {workOrder.description && (
              <div style={{ marginTop: 16 }}>
                <h4>问题描述</h4>
                <p style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                  {workOrder.description}
                </p>
              </div>
            )}
          </Card>

          <Card title="处理记录" style={{ marginTop: 16 }}>
            <Timeline
              items={workOrder.logs?.map(log => ({
                color: 'blue',
                children: (
                  <div>
                    <p style={{ margin: 0 }}>
                      <strong>{log.user_name}</strong> {getActionText(log.action)}
                    </p>
                    {log.comment && <p style={{ margin: 0, color: '#666' }}>{log.comment}</p>}
                    <p style={{ margin: 0, color: '#999', fontSize: 12 }}>
                      {dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </p>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card title="操作">
            {workOrder.status === 'pending' && (
              <div style={{ marginBottom: 16 }}>
                <h4>分配处理人</h4>
                <Space.Compact style={{ width: '100%', marginBottom: 8 }}>
                  <Select
                    style={{ flex: 1 }}
                    placeholder="选择处理人"
                    value={selectedUser}
                    onChange={setSelectedUser}
                  >
                    {users.map(u => (
                      <Select.Option key={u.id} value={u.id}>{u.name}</Select.Option>
                    ))}
                  </Select>
                  <Button type="primary" onClick={handleReassign}>分配</Button>
                </Space.Compact>
              </div>
            )}

            {getAvailableStatuses().length > 0 && (
              <div>
                <h4>变更状态</h4>
                <Select
                  style={{ width: '100%', marginBottom: 8 }}
                  placeholder="选择新状态"
                  value={newStatus}
                  onChange={setNewStatus}
                >
                  {getAvailableStatuses().map(s => (
                    <Select.Option key={s} value={s}>
                      {s === 'assigned' ? '分配' : 
                       s === 'processing' ? '开始处理' :
                       s === 'completed' ? '完成处理' :
                       s === 'verified' ? '验证通过' : '关闭工单'}
                    </Select.Option>
                  ))}
                </Select>
                <Input.TextArea
                  rows={3}
                  placeholder="添加备注（可选）"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ marginBottom: 8 }}
                />
                <Button 
                  type="primary" 
                  block 
                  loading={loading}
                  onClick={handleProcess}
                >
                  提交
                </Button>
              </div>
            )}

            {workOrder.status === 'closed' && (
              <Tag color="gray" style={{ width: '100%', textAlign: 'center', padding: '8px 0' }}>
                工单已关闭
              </Tag>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default WorkOrderDetail;
