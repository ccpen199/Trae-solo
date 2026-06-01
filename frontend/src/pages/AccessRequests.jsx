import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Space, Button, Modal, Form, Input, message, Tabs, Select
} from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { accessApi } from '../services/api';
import dayjs from 'dayjs';

const { TabPane } = Tabs;
const { TextArea } = Input;

function AccessRequests({ user }) {
  const [myRequests, setMyRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [grants, setGrants] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [myRes, pendingRes, grantsRes] = await Promise.all([
        accessApi.getRequests(),
        accessApi.getPendingRequests(),
        accessApi.getGrants(),
      ]);
      setMyRequests(myRes.data.requests);
      setPendingRequests(pendingRes.data.requests);
      setGrants(grantsRes.data.grants);
    } catch (err) {
      message.error('加载失败');
    }
  };

  const handleApprove = async (id) => {
    try {
      await accessApi.approveRequest(id);
      message.success('已批准');
      loadData();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleDeny = async (id) => {
    Modal.confirm({
      title: '拒绝申请',
      content: (
        <Form id="denyForm">
        <Form.Item name="deny_reason" label="拒绝原因" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>
      </Form>
      ),
      onOk: async () => {
        const form = Form.useFormInstance('denyForm');
        const values = form.getFieldsValue();
        try {
          await accessApi.denyRequest(id, values);
          message.success('已拒绝');
          loadData();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  const handleRevoke = async (id) => {
    Modal.confirm({
      title: '确认撤销',
      content: '确定要撤销该授权吗？',
      onOk: async () => {
        try {
          await accessApi.revokeGrant(id);
          message.success('已撤销');
          loadData();
        } catch (err) {
          message.error('操作失败');
        }
      },
    });
  };

  const requestColumns = [
    { title: '凭据', dataIndex: 'credential_title', key: 'credential' },
    { title: '申请理由', dataIndex: 'reason', key: 'reason' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => (
      <Tag color={s === 'approved' ? 'green' : s === 'denied' ? 'red' : s === 'pending' ? 'orange' : 'default'}>
        {s === 'approved' ? '已批准' : s === 'denied' ? '已拒绝' : '待审批'}
      </Tag>
    )},
    { title: '到期时间', dataIndex: 'expires_at', key: 'expires', render: d => dayjs(d).format('YYYY-MM-DD HH:mm') },
    { title: '申请时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('YYYY-MM-DD') },
  ];

  const pendingColumns = [
    ...requestColumns,
    { title: '申请人', dataIndex: 'requester_name', key: 'requester' },
    { title: '操作', key: 'actions', render: (_, r) => (
      <Space>
        <Button type="text" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)} />
        <Button type="text" danger icon={<CloseOutlined />} onClick={() => handleDeny(r.id)} />
      </Space>
    )},
  ];

  const grantColumns = [
    { title: '凭据', dataIndex: 'credential_title', key: 'credential' },
    { title: '用户', dataIndex: 'user_name', key: 'user' },
    { title: '授权者', dataIndex: 'granted_by_name', key: 'granted_by' },
    { title: '角色', dataIndex: 'role', key: 'role', render: r => <Tag>{r}</Tag> },
    { title: '到期时间', dataIndex: 'expires_at', key: 'expires', render: d => d ? dayjs(d).format('YYYY-MM-DD') : '永久' },
    { title: '授权时间', dataIndex: 'created_at', key: 'created', render: d => dayjs(d).format('YYYY-MM-DD') },
    { title: '操作', key: 'actions', render: (_, r) => (
      (r.granted_by === user?.id || user?.role === 'admin') && (
        <Button type="text" danger onClick={() => handleRevoke(r.id)}>撤销</Button>
      )
    )},
  ];

  return (
    <Card title="访问授权">
      <Tabs defaultActiveKey="my">
        <TabPane tab="我的申请" key="my">
          <Table
            columns={requestColumns}
            dataSource={myRequests}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab={`待审批 (${pendingRequests.length})`} key="pending">
          <Table
            columns={pendingColumns}
            dataSource={pendingRequests}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
        <TabPane tab="授权列表" key="grants">
          <Table
            columns={grantColumns}
            dataSource={grants}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </TabPane>
      </Tabs>
    </Card>
  );
}

export default AccessRequests;
