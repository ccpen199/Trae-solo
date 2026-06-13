import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Modal,
  Form, App, Avatar, DatePicker, Tooltip, Empty,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, ShareAltOutlined,
  ReloadOutlined, UserOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shareAPI, deviceAPI } from '../../services/api';
import { SharePermission } from '@iot/shared';

const { Search } = Input;
const { Option } = Select;

const permissionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  [SharePermission.VIEW_ONLY]: { label: '仅查看', color: 'default', icon: <EyeOutlined /> },
  [SharePermission.CONTROLLABLE]: { label: '可操作', color: 'blue', icon: <ThunderboltOutlined /> },
  [SharePermission.FULL_SHARE]: { label: '可分享', color: 'purple', icon: <ShareAltOutlined /> },
};

const ShareManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [tab, setTab] = useState<'my-shares' | 'shared-with-me'>('my-shares');
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [permFilter, setPermFilter] = useState<string>();
  const [shareModal, setShareModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentShare, setCurrentShare] = useState<any>(null);
  const [shareForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    loadShares();
    loadDevices();
  }, [tab, page, pageSize, keyword, permFilter]);

  const loadShares = async () => {
    try {
      setLoading(true);
      let result: any;
      if (tab === 'my-shares') {
        result = { items: [] };
        const res = await deviceAPI.getList({ pageSize: 200 });
        const myDevices = (res as any).items || [];
        const allShares: any[] = [];
        for (const d of myDevices) {
          try {
            const ds: any = await shareAPI.getDeviceShares(d.id);
            (Array.isArray(ds) ? ds : []).forEach((s) => allShares.push({ ...s, deviceName: d.name }));
          } catch {}
        }
        result = { items: allShares, total: allShares.length };
      } else {
        result = await shareAPI.getSharedWithMe();
      }
      const items = result.items || [];
      setShares(keyword
        ? items.filter((s: any) =>
            s.deviceName?.toLowerCase().includes(keyword.toLowerCase()) ||
            s.shareeEmail?.toLowerCase().includes(keyword.toLowerCase()) ||
            s.sharerEmail?.toLowerCase().includes(keyword.toLowerCase()),
          )
        : items,
      );
      setTotal(items.length);
    } catch {
      setShares([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async () => {
    try {
      const res: any = await deviceAPI.getList({ pageSize: 200 });
      setDevices(res.items || []);
    } catch {}
  };

  const handleShare = async (values: any) => {
    try {
      await shareAPI.shareDevice({
        deviceId: values.deviceId,
        shareeIdOrEmail: values.sharee,
        permission: values.permission,
        expiredAt: values.expiredAt?.toISOString(),
      });
      message.success('分享成功');
      setShareModal(false);
      shareForm.resetFields();
      loadShares();
    } catch (err: any) {
      message.error(err.message || '分享失败');
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await shareAPI.updatePermission(currentShare.id, {
        permission: values.permission,
        expiredAt: values.expiredAt?.toISOString(),
      });
      message.success('权限已更新');
      setEditModal(false);
      loadShares();
    } catch (err: any) {
      message.error(err.message || '更新失败');
    }
  };

  const handleRevoke = (record: any) => {
    modal.confirm({
      title: '确认撤销分享？',
      content: '对方将不再能访问此设备',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await shareAPI.revokeShare(record.id);
          message.success('已撤销分享');
          loadShares();
        } catch (err: any) {
          message.error(err.message || '撤销失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '设备',
      dataIndex: 'deviceName',
      render: (n: string, r: any) => (
        <Space>
          <Avatar style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }} icon={<ThunderboltOutlined />} />
          <a onClick={() => navigate(`/devices/${r.deviceId}`)}>{n || r.deviceId}</a>
        </Space>
      ),
    },
    {
      title: tab === 'my-shares' ? '分享给' : '分享人',
      dataIndex: tab === 'my-shares' ? 'shareeEmail' : 'sharerEmail',
      render: (email: string, r: any) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{email || tab === 'my-shares' ? r.shareeId : r.sharerId}</span>
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permission',
      render: (p: string) => {
        const cfg = permissionConfig[p] || permissionConfig.view_only;
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '有效期',
      dataIndex: 'expiredAt',
      render: (t: string) => t ? (
        <Tag color={new Date(t) < new Date() ? 'red' : 'green'}>
          {new Date(t).toLocaleDateString()}
        </Tag>
      ) : <Tag color="default">永久</Tag>,
    },
    {
      title: '分享时间',
      dataIndex: 'createdAt',
      render: (t: string) => t ? new Date(t).toLocaleDateString() : '-',
    },
    ...(tab === 'my-shares' ? [{
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="修改权限">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentShare(record);
                editForm.setFieldsValue({
                  permission: record.permission,
                  expiredAt: record.expiredAt ? new Date(record.expiredAt) : null,
                });
                setEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title="撤销分享">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleRevoke(record)} />
          </Tooltip>
        </Space>
      ),
    }] : []),
  ];

  return (
    <div>
      <Card
        tabList={[
          { key: 'my-shares', tab: '我分享的' },
          { key: 'shared-with-me', tab: '分享给我的' },
        ]}
        activeTabKey={tab}
        onTabChange={(k) => { setTab(k as any); setPage(1); }}
        extra={
          <Space>
            <Search
              placeholder="搜索设备或用户"
              allowClear
              style={{ width: 200 }}
              onSearch={(v) => { setKeyword(v); setPage(1); }}
            />
            <Select
              placeholder="权限筛选"
              allowClear
              style={{ width: 120 }}
              value={permFilter}
              onChange={(v) => { setPermFilter(v); setPage(1); }}
            >
              {Object.entries(permissionConfig).map(([key, cfg]) => (
                <Option key={key} value={key}>{cfg.label}</Option>
              ))}
            </Select>
            {tab === 'my-shares' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setShareModal(true)}>
                分享设备
              </Button>
            )}
            <Button icon={<ReloadOutlined />} onClick={loadShares}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={shares}
          loading={loading}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条分享`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
          locale={{ emptyText: <Empty description={tab === 'my-shares' ? '还没有分享设备' : '暂无分享给您的设备'} /> }}
        />
      </Card>

      <Modal title="分享设备" open={shareModal} onCancel={() => setShareModal(false)} footer={null}>
        <Form form={shareForm} layout="vertical" onFinish={handleShare}>
          <Form.Item name="deviceId" label="选择设备" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择要分享的设备" optionFilterProp="children">
              {devices.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="sharee" label="分享给" rules={[{ required: true, message: '请输入用户名、邮箱或手机号' }]}>
            <Input placeholder="用户名 / 邮箱 / 手机号" />
          </Form.Item>
          <Form.Item name="permission" label="权限" rules={[{ required: true }]} initialValue={SharePermission.VIEW_ONLY}>
            <Select>
              {Object.entries(permissionConfig).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Space>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="expiredAt" label="有效期（可选）">
            <DatePicker showTime style={{ width: '100%' }} placeholder="不设置则永久有效" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认分享</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="修改分享权限" open={editModal} onCancel={() => setEditModal(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="permission" label="权限" rules={[{ required: true }]}>
            <Select>
              {Object.entries(permissionConfig).map(([key, cfg]) => (
                <Option key={key} value={key}>
                  <Space>
                    {cfg.icon}
                    <span>{cfg.label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="expiredAt" label="有效期（可选）">
            <DatePicker showTime style={{ width: '100%' }} placeholder="不设置则永久有效" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShareManagementPage;
