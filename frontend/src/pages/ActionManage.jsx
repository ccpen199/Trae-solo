import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  message,
  Space,
  Row,
  Col,
  Statistic,
  Popconfirm,
} from 'antd';
import {
  ReloadOutlined,
  UnlockOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { actionApi } from '../services/api';

function ActionManage() {
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState({ ips: [], accounts: [], devices: [] });
  const [actions, setActions] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blockedRes, actionsRes] = await Promise.all([
        actionApi.getBlocked(),
        actionApi.getAll({ limit: 50 }),
      ]);
      setBlocked(blockedRes.data.data || { ips: [], accounts: [], devices: [] });
      setActions(actionsRes.data.data || []);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnblockIp = async (ip) => {
    try {
      await actionApi.unblockIp(ip);
      message.success('IP 已解封');
      loadData();
    } catch (error) {
      message.error('解封失败');
      console.error(error);
    }
  };

  const handleUnblockAccount = async (userId) => {
    try {
      await actionApi.unblockAccount(userId);
      message.success('账户已解封');
      loadData();
    } catch (error) {
      message.error('解封失败');
      console.error(error);
    }
  };

  const actionTypeText = (type) => {
    switch (type) {
      case 'block_ip':
        return '封禁IP';
      case 'block_account':
        return '封禁账户';
      case 'block_device':
        return '封禁设备';
      case 'challenge':
        return '二次验证';
      case 'alert':
        return '发送告警';
      default:
        return type;
    }
  };

  const actionStatusColor = (status) => {
    switch (status) {
      case 'executed':
        return 'green';
      case 'pending':
        return 'orange';
      case 'failed':
        return 'red';
      default:
        return 'default';
    }
  };

  const actionStatusText = (status) => {
    switch (status) {
      case 'executed':
        return '已执行';
      case 'pending':
        return '待执行';
      case 'failed':
        return '失败';
      default:
        return status;
    }
  };

  const actionColumns = [
    {
      title: '动作类型',
      dataIndex: 'action_type',
      key: 'action_type',
      render: (type) => <Tag color="blue">{actionTypeText(type)}</Tag>,
    },
    {
      title: '目标',
      dataIndex: 'action_target',
      key: 'action_target',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={actionStatusColor(status)}>{actionStatusText(status)}</Tag>
      ),
    },
    {
      title: '执行时间',
      dataIndex: 'executed_at',
      key: 'executed_at',
      render: (time) => time || '-',
      width: 180,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
  ];

  const ipColumns = [
    {
      title: 'IP 地址',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip) => <Tag color="red">{ip}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定要解封这个IP吗？"
          onConfirm={() => handleUnblockIp(record.ip)}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<UnlockOutlined />} size="small" type="primary">
            解封
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const accountColumns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      render: (userId) => <Tag color="red">{userId}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="确定要解封这个账户吗？"
          onConfirm={() => handleUnblockAccount(record.userId)}
          okText="确定"
          cancelText="取消"
        >
          <Button icon={<UnlockOutlined />} size="small" type="primary">
            解封
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2 style={{ margin: 0 }}>处置管理</h2>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          刷新
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="已封禁IP"
              value={blocked.ips?.length || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已封禁账户"
              value={blocked.accounts?.length || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已封禁设备"
              value={blocked.devices?.length || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="封禁IP列表">
            {blocked.ips && blocked.ips.length > 0 ? (
              <Table
                columns={ipColumns}
                dataSource={blocked.ips.map((ip) => ({ ip, key: ip }))}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无封禁的IP
              </div>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="封禁账户列表">
            {blocked.accounts && blocked.accounts.length > 0 ? (
              <Table
                columns={accountColumns}
                dataSource={blocked.accounts.map((userId) => ({ userId, key: userId }))}
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无封禁的账户
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="处置历史记录">
            <Table
              columns={actionColumns}
              dataSource={actions}
              rowKey="id"
              size="small"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ActionManage;
