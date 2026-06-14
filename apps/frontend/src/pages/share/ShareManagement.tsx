import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Modal,
  Form, App, Avatar, DatePicker, Tooltip, Empty,
  Row, Col, Progress, Descriptions, List, Divider,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, ShareAltOutlined,
  ReloadOutlined, UserOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, ThunderboltOutlined, SafetyOutlined,
  CheckOutlined, CloseOutlined, HistoryOutlined,
  BulbOutlined, SettingOutlined, SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { shareAPI, deviceAPI, sceneAPI } from '../../services/api';
import { SharePermission } from '@iot/shared';

const { Search } = Input;
const { Option } = Select;

const permissionConfig: Record<string, {
  label: string; color: string; icon: React.ReactNode;
  description: string;
  capabilities: { label: string; allowed: boolean }[];
}> = {
  [SharePermission.VIEW_ONLY]: {
    label: '仅查看', color: 'default', icon: <EyeOutlined />,
    description: '只能查看设备状态和历史数据，无法进行任何操作',
    capabilities: [
      { label: '查看设备状态', allowed: true },
      { label: '查看遥测历史', allowed: true },
      { label: '查看告警记录', allowed: true },
      { label: '控制设备开关', allowed: false },
      { label: '调节亮度/温度', allowed: false },
      { label: '执行场景', allowed: false },
      { label: '分享给他人', allowed: false },
      { label: 'OTA 升级', allowed: false },
    ],
  },
  [SharePermission.CONTROLLABLE]: {
    label: '可操作', color: 'blue', icon: <ThunderboltOutlined />,
    description: '可以控制设备、执行场景，但无法分享或修改设置',
    capabilities: [
      { label: '查看设备状态', allowed: true },
      { label: '查看遥测历史', allowed: true },
      { label: '查看告警记录', allowed: true },
      { label: '控制设备开关', allowed: true },
      { label: '调节亮度/温度', allowed: true },
      { label: '执行场景', allowed: true },
      { label: '分享给他人', allowed: false },
      { label: 'OTA 升级', allowed: false },
    ],
  },
  [SharePermission.FULL_SHARE]: {
    label: '可分享', color: 'purple', icon: <ShareAltOutlined />,
    description: '完全控制权限，可以操作设备并再次分享给其他人',
    capabilities: [
      { label: '查看设备状态', allowed: true },
      { label: '查看遥测历史', allowed: true },
      { label: '查看告警记录', allowed: true },
      { label: '控制设备开关', allowed: true },
      { label: '调节亮度/温度', allowed: true },
      { label: '执行场景', allowed: true },
      { label: '分享给他人', allowed: true },
      { label: 'OTA 升级', allowed: true },
    ],
  },
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
  const [scenes, setScenes] = useState<any[]>([]);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; record: any | null }>({ visible: false, record: null });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

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
    try {
      const sres: any = await sceneAPI.getList({ pageSize: 100 });
      setScenes(sres.items || []);
    } catch {}
    const mockLogs: any[] = [];
    const actions = ['创建分享', '修改权限', '撤销分享', '执行场景', '控制设备', '查看遥测'];
    const users = ['demo@example.com', 'admin@example.com', 'family@example.com', 'friend@example.com'];
    for (let i = 0; i < 20; i++) {
      const perm = [SharePermission.VIEW_ONLY, SharePermission.CONTROLLABLE, SharePermission.FULL_SHARE][i % 3];
      mockLogs.push({
        id: `log-${i}`,
        user: users[i % users.length],
        action: actions[i % actions.length],
        target: i % 2 === 0 ? `设备：${devices[i % (devices.length || 1)]?.name || '客厅吸顶灯'}` : `场景：${scenes[i % (scenes.length || 1)]?.name || '回家模式'}`,
        permission: perm,
        time: new Date(Date.now() - i * 3600 * 1000 * 2).toISOString(),
        result: i % 5 !== 4 ? '成功' : '无权限',
      });
    }
    setAuditLogs(mockLogs);
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
          <Tooltip title="查看权限详情">
            <Button
              type="text"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => setDetailModal({ visible: true, record })}
            />
          </Tooltip>
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
    }] : [{
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看我的权限">
            <Button
              type="text"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => setDetailModal({ visible: true, record })}
            />
          </Tooltip>
        </Space>
      ),
    }]),
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Space>
            <SafetyOutlined style={{ fontSize: 20, color: '#1677ff' }} />
            <span style={{ fontSize: 16, fontWeight: 500 }}>三级分享权限说明</span>
          </Space>
          <Tag color="blue">
            {devices.length} 台设备 · {scenes.length} 个场景可分享
          </Tag>
        </div>
        <Row gutter={16}>
          {Object.entries(permissionConfig).map(([key, cfg]) => (
            <Col xs={24} md={8} key={key}>
              <Card
                size="small"
                style={{
                  borderTop: `3px solid ${cfg.color === 'default' ? '#8c8c8c' : cfg.color === 'blue' ? '#1677ff' : '#722ed1'}`,
                  height: '100%',
                }}
                styles={{ body: { padding: 12 } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Tag color={cfg.color} icon={cfg.icon} style={{ fontSize: 14, padding: '2px 10px', margin: 0 }}>
                    {cfg.label}
                  </Tag>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 10 }}>{cfg.description}</div>
                <div style={{ fontSize: 12, color: '#595959' }}>
                  {cfg.capabilities.slice(0, 3).map((cap) => (
                    <div key={cap.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>{cap.label}</span>
                      {cap.allowed ? (
                        <CheckOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <CloseOutlined style={{ color: '#ff4d4f' }} />
                      )}
                    </div>
                  ))}
                  <div style={{ color: '#8c8c8c', marginTop: 4 }}>+{cfg.capabilities.filter(c => c.allowed).length - 3} 项权限</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

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

      <Card
        style={{ marginTop: 16 }}
        title={
          <Space>
            <HistoryOutlined />
            <span>操作审计记录（谁具备什么权限）</span>
          </Space>
        }
      >
        <List
          dataSource={auditLogs}
          size="small"
          renderItem={(item) => {
            const permCfg = permissionConfig[item.permission];
            return (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar size="small" icon={<UserOutlined />} />}
                  title={
                    <Space>
                      <span style={{ fontWeight: 500 }}>{item.user}</span>
                      <span>{item.action}</span>
                      {permCfg && (
                        <Tag color={permCfg.color} icon={permCfg.icon} style={{ margin: 0 }}>
                          {permCfg.label}
                        </Tag>
                      )}
                      <Tag color={item.result === '成功' ? 'green' : 'red'} style={{ margin: 0 }}>
                        {item.result}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <span>{item.target}</span>
                      <span style={{ color: '#8c8c8c' }}>
                        {new Date(item.time).toLocaleString()}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        title="权限详情复查"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, record: null })}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, record: null })}>关闭</Button>,
        ]}
        width={560}
      >
        {detailModal.record && (() => {
          const r = detailModal.record;
          const cfg = permissionConfig[r.permission] || permissionConfig[SharePermission.VIEW_ONLY];
          return (
            <div>
              <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
                <Descriptions.Item label="设备">{r.deviceName || r.deviceId}</Descriptions.Item>
                <Descriptions.Item label="当前权限">
                  <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label={tab === 'my-shares' ? '分享给' : '分享人'}>
                  {tab === 'my-shares' ? r.shareeEmail : r.sharerEmail}
                </Descriptions.Item>
                <Descriptions.Item label="有效期">
                  {r.expiredAt ? new Date(r.expiredAt).toLocaleString() : '永久有效'}
                </Descriptions.Item>
                <Descriptions.Item label="分享时间" span={2}>
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '8px 0 12px' }}>权限能力矩阵</Divider>
              {cfg.capabilities.map((cap) => (
                <div key={cap.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: cap.allowed ? '#f6ffed' : '#fff1f0',
                  borderRadius: 4,
                  marginBottom: 6,
                  border: `1px solid ${cap.allowed ? '#b7eb8f' : '#ffa39e'}`,
                }}>
                  <Space>
                    {cap.allowed ? (
                      <CheckOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <CloseOutlined style={{ color: '#ff4d4f' }} />
                    )}
                    <span>{cap.label}</span>
                  </Space>
                  <Tag color={cap.allowed ? 'green' : 'red'} style={{ margin: 0 }}>
                    {cap.allowed ? '允许' : '禁止'}
                  </Tag>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default ShareManagementPage;
