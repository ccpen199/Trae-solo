import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Switch,
  Modal, Form, Image, Badge, App, Drawer, Tooltip, Empty,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, FilterOutlined,
  BulbOutlined, PoweroffOutlined, MoreOutlined,
  ReloadOutlined, ThunderboltOutlined, CloudUploadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deviceAPI, controlAPI } from '../../services/api';
import { DeviceCategory, DeviceStatus } from '@iot/shared';

const { Search } = Input;
const { Option } = Select;

const categoryLabels: Record<string, string> = {
  light: '灯光', switch: '开关', plug: '插座', curtain: '窗帘',
  air_conditioner: '空调', thermostat: '温控器', camera: '摄像头',
  door_lock: '门锁', sensor: '传感器', speaker: '音箱',
  humidifier: '加湿器', purifier: '净化器', tv: '电视',
  fan: '风扇', gateway: '网关', other: '其他',
};

const categoryIcons: Record<string, React.ReactNode> = {
  light: <BulbOutlined />,
  switch: <PoweroffOutlined />,
  plug: <PoweroffOutlined />,
  curtain: <span>🪟</span>,
  air_conditioner: <span>❄️</span>,
  thermostat: <span>🌡️</span>,
  camera: <span>📷</span>,
  door_lock: <span>🔒</span>,
  sensor: <span>📡</span>,
  speaker: <span>🔊</span>,
  other: <span>📦</span>,
};

const DeviceListPage: React.FC = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<string>();
  const [statusFilter, setStatusFilter] = useState<string>();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
  const [controlDrawer, setControlDrawer] = useState<{ visible: boolean; device: any | null }>({ visible: false, device: null });
  const [claimModal, setClaimModal] = useState(false);
  const [claimForm] = Form.useForm();

  useEffect(() => {
    loadDevices();
  }, [page, pageSize, keyword, category, statusFilter]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;
      if (statusFilter) params.status = statusFilter;
      const result: any = await deviceAPI.getList(params);
      setDevices(result.items || []);
      setTotal(result.total || 0);
    } finally {
      setLoading(false);
    }
  };

  const togglePower = async (device: any, checked: boolean) => {
    try {
      await controlAPI.sendCommand(device.id, {
        command: 'onoff',
        params: { on: checked },
      });
      message.success(`已${checked ? '开启' : '关闭'} ${device.name}`);
      loadDevices();
    } catch (err) {
      message.error('操作失败');
    }
  };

  const handleClaim = async (values: any) => {
    try {
      await deviceAPI.claim(values);
      message.success('设备绑定成功');
      setClaimModal(false);
      claimForm.resetFields();
      loadDevices();
    } catch (err: any) {
      message.error(err.message || '绑定失败');
    }
  };

  const openControl = (device: any) => {
    setControlDrawer({ visible: true, device });
  };

  const statusTag = (status: string) => {
    const colors: Record<string, string> = {
      online: 'green', offline: 'default', sleeping: 'gold', updating: 'blue', fault: 'red',
    };
    const labels: Record<string, string> = {
      online: '在线', offline: '离线', sleeping: '休眠', updating: '升级中', fault: '故障',
    };
    return <Tag color={colors[status] || 'default'}>{labels[status] || status}</Tag>;
  };

  const columns = [
    {
      title: '设备',
      dataIndex: 'name',
      render: (_: any, record: any) => (
        <Space>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: '#f0f5ff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: '#1677ff',
          }}>
            {categoryIcons[record.category] || categoryIcons.other}
          </div>
          <div>
            <div style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => navigate(`/devices/${record.id}`)}>
              {record.name}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              {record.vendor?.name} · {categoryLabels[record.category] || record.category}
            </div>
          </div>
        </Space>
      ),
    },
    { title: '状态', dataIndex: 'status', render: (s: string) => statusTag(s) },
    {
      title: '开关',
      dataIndex: 'properties.power',
      render: (_: any, record: any) => {
        const power = record.properties?.power;
        return record.status === 'online' ? (
          <Switch checked={power} onChange={(v) => togglePower(record, v)} />
        ) : <Tag color="default">无法操作</Tag>;
      },
    },
    { title: '固件版本', dataIndex: 'firmwareVersion', render: (v: string) => v || '-' },
    { title: '最后在线', dataIndex: 'lastSeen', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/devices/${record.id}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => openControl(record)}>控制</Button>
          <Button type="link" size="small" onClick={() => navigate('/ota')}>升级</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="设备列表"
        extra={
          <Space>
            <Search
              placeholder="搜索设备"
              allowClear
              style={{ width: 200 }}
              onSearch={(v) => { setKeyword(v); setPage(1); }}
            />
            <Select
              placeholder="设备类型"
              allowClear
              style={{ width: 120 }}
              value={category}
              onChange={(v) => { setCategory(v); setPage(1); }}
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 100 }}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <Option value="online">在线</Option>
              <Option value="offline">离线</Option>
              <Option value="fault">故障</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={loadDevices}>刷新</Button>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setClaimModal(true)}>
              添加设备
            </Button>
            <Button icon={<FilterOutlined />} onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}>
              {viewMode === 'table' ? '卡片' : '列表'}
            </Button>
          </Space>
        }
      >
        {viewMode === 'table' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={devices}
            loading={loading}
            pagination={{
              current: page, pageSize, total,
              showSizeChanger: true, showQuickJumper: true,
              showTotal: (t) => `共 ${t} 台设备`,
              onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            }}
          />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}>
            {devices.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
                <Empty description="暂无设备" />
              </div>
            )}
            {devices.map((device) => (
              <Card
                key={device.id}
                size="small"
                hoverable
                onClick={() => navigate(`/devices/${device.id}`)}
                style={{ borderRadius: 8 }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: device.status === 'online' ? '#e6f4ff' : '#f5f5f5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, color: device.status === 'online' ? '#1677ff' : '#bfbfbf',
                  }}>
                    {categoryIcons[device.category] || categoryIcons.other}
                  </div>
                  <Badge status={device.status === 'online' ? 'success' : 'default'} />
                </div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>{device.name}</div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 12 }}>
                  {categoryLabels[device.category] || device.category}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Tag color={device.status === 'online' ? 'green' : 'default'}>
                    {device.status === 'online' ? '在线' : '离线'}
                  </Tag>
                  {device.status === 'online' && device.properties?.power !== undefined && (
                    <Switch
                      size="small"
                      checked={device.properties.power}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(checked) => {
                        event?.stopPropagation?.();
                        togglePower(device, checked);
                      }}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title="添加设备"
        open={claimModal}
        onCancel={() => setClaimModal(false)}
        footer={null}
      >
        <Form form={claimForm} layout="vertical" onFinish={handleClaim}>
          <Form.Item name="deviceId" label="设备ID" rules={[{ required: true, message: '请输入设备ID' }]}>
            <Input placeholder="请输入设备ID或扫描二维码" />
          </Form.Item>
          <Form.Item name="name" label="设备名称">
            <Input placeholder="给设备起个名字" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>绑定设备</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={controlDrawer.device?.name}
        open={controlDrawer.visible}
        onClose={() => setControlDrawer({ visible: false, device: null })}
        width={360}
      >
        {controlDrawer.device && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: '#e6f4ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 12px',
              }}>
                {categoryIcons[controlDrawer.device.category] || categoryIcons.other}
              </div>
              <div style={{ fontSize: 18, fontWeight: 500 }}>{controlDrawer.device.name}</div>
              <div style={{ color: '#8c8c8c' }}>{statusTag(controlDrawer.device.status)}</div>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card size="small" title="电源控制">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>电源开关</span>
                  <Switch
                    checked={controlDrawer.device.properties?.power}
                    onChange={(v) => togglePower(controlDrawer.device, v)}
                    disabled={controlDrawer.device.status !== 'online'}
                  />
                </div>
              </Card>

              {controlDrawer.device.category === 'light' && (
                <Card size="small" title="亮度调节">
                  <InputSlider device={controlDrawer.device} />
                </Card>
              )}

              {controlDrawer.device.category === 'air_conditioner' && (
                <Card size="small" title="温度调节">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>当前温度</span>
                    <span style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>
                      {controlDrawer.device.properties?.temperature || '26'}°C
                    </span>
                  </div>
                </Card>
              )}

              {controlDrawer.device.category === 'door_lock' && (
                <Card size="small" title="门锁状态">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>电池电量</span>
                    <Tag color={
                      (controlDrawer.device.properties?.battery ?? 100) > 20 ? 'green' : 'red'
                    }>
                      {controlDrawer.device.properties?.battery || '?'}%
                    </Tag>
                  </div>
                </Card>
              )}

              <Card size="small" title="快捷操作">
                <Space wrap>
                  <Button icon={<CloudUploadOutlined />} onClick={() => navigate('/ota')}>
                    固件升级
                  </Button>
                  <Button icon={<ThunderboltOutlined />} onClick={() => navigate('/scenes')}>
                    加入场景
                  </Button>
                  <Button type="primary" danger>删除设备</Button>
                </Space>
              </Card>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

const InputSlider: React.FC<{ device: any }> = ({ device }) => {
  const [value, setValue] = useState(device.properties?.brightness || 50);
  const { message } = App.useApp();

  const handleChange = async (e: any) => {
    const v = parseInt(e.target.value, 10);
    setValue(v);
  };

  const applyBrightness = async () => {
    try {
      await controlAPI.sendCommand(device.id, {
        command: 'brightness',
        params: { brightness: value },
      });
      message.success('亮度已调节');
    } catch {
      message.error('调节失败');
    }
  };

  return (
    <div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={handleChange}
        onMouseUp={applyBrightness}
        onTouchEnd={applyBrightness}
        style={{ width: '100%' }}
      />
      <div style={{ textAlign: 'right', color: '#8c8c8c', fontSize: 12 }}>{value}%</div>
    </div>
  );
};

export default DeviceListPage;
