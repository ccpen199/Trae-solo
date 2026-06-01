import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, message, Modal, Select } from 'antd';
import { SendOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { notificationsApi, schedulesApi } from '../api';

const { Option } = Select;

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [filterStatus, setFilterStatus] = useState(null);

  useEffect(() => {
    loadNotifications();
    loadSchedules();
  }, [filterStatus]);

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.getAll(filterStatus ? { status: filterStatus } : {});
      setNotifications(res.data);
    } catch (error) {
      message.error('加载通知失败');
    }
  };

  const loadSchedules = async () => {
    try {
      const res = await schedulesApi.getAll();
      setSchedules(res.data);
    } catch (error) {
      message.error('加载排期失败');
    }
  };

  const handleUpdateStatus = async (id, status, failureReason = null) => {
    try {
      await notificationsApi.updateStatus(id, { status, failure_reason: failureReason });
      message.success('状态更新成功');
      loadNotifications();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  const handleSend = (record) => {
    Modal.confirm({
      title: '发送通知',
      content: `确定要向 ${record.recipient_name} 发送${record.notification_type === 'scheduling' ? '排期' : '改期'}通知吗？`,
      onOk: () => handleUpdateStatus(record.id, 'sent'),
    });
  };

  const handleMarkFailed = (record) => {
    Modal.confirm({
      title: '标记发送失败',
      content: `确定要将 ${record.recipient_name} 的通知标记为发送失败吗？请注明失败原因。`,
      onOk: async () => {
        await handleUpdateStatus(record.id, 'failed', '收件人无法联系');
      },
    });
  };

  const columns = [
    {
      title: '通知类型',
      dataIndex: 'notification_type',
      key: 'notification_type',
      render: (type) => {
        const typeMap = {
          scheduling: { color: 'blue', text: '排期通知' },
          reminder: { color: 'orange', text: '提醒通知' },
          change: { color: 'purple', text: '改期通知' },
          cancellation: { color: 'red', text: '取消通知' },
        };
        const t = typeMap[type] || { color: 'default', text: type };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '收件人类型',
      dataIndex: 'recipient_type',
      key: 'recipient_type',
      render: (type) => {
        const typeMap = {
          party: { color: 'green', text: '当事人' },
          lawyer: { color: 'blue', text: '律师' },
          judge: { color: 'purple', text: '法官' },
          clerk: { color: 'orange', text: '书记员' },
          internal: { color: 'default', text: '内部人员' },
        };
        const t = typeMap[type] || { color: 'default', text: type };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    { title: '收件人', dataIndex: 'recipient_name', key: 'recipient_name' },
    { title: '联系方式', dataIndex: 'recipient_contact', key: 'recipient_contact' },
    { title: '通知内容', dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          pending: { color: 'orange', text: '待发送' },
          sent: { color: 'green', text: '已发送' },
          failed: { color: 'red', text: '发送失败' },
          read_receipt: { color: 'blue', text: '已读回执' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '发送时间', dataIndex: 'send_time', key: 'send_time' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                icon={<SendOutlined />}
                onClick={() => handleSend(record)}
              >
                发送
              </Button>
              <Button
                type="link"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleMarkFailed(record)}
              >
                标记失败
              </Button>
            </>
          )}
          {record.status === 'failed' && (
            <Button
              type="link"
              icon={<SyncOutlined />}
              onClick={() => handleSend(record)}
            >
              重试
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const stats = {
    total: notifications.length,
    pending: notifications.filter(n => n.status === 'pending').length,
    sent: notifications.filter(n => n.status === 'sent').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>通知管理</h2>
        <Space>
          <Select
            placeholder="筛选状态"
            style={{ width: 150 }}
            allowClear
            onChange={setFilterStatus}
          >
            <Option value="pending">待发送</Option>
            <Option value="sent">已发送</Option>
            <Option value="failed">发送失败</Option>
          </Select>
          <Button icon={<SyncOutlined />} onClick={loadNotifications}>刷新</Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={async () => {
              const pending = notifications.filter(n => n.status === 'pending');
              for (const n of pending) {
                await handleUpdateStatus(n.id, 'sent');
              }
              message.success(`已批量发送 ${pending.length} 条通知`);
            }}
            disabled={stats.pending === 0}
          >
            批量发送
          </Button>
        </Space>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <span style={{ fontSize: 14, color: '#666' }}>通知总数：</span>
            <span style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 8 }}>{stats.total}</span>
          </div>
          <div>
            <Tag color="orange">待发送：{stats.pending}</Tag>
          </div>
          <div>
            <Tag color="green">已发送：{stats.sent}</Tag>
          </div>
          <div>
            <Tag color="red">发送失败：{stats.failed}</Tag>
          </div>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={notifications.map(n => ({ ...n, key: n.id }))}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default Notifications;
