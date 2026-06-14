import React, { useState, useEffect } from 'react';
import {
  Table, Card, Input, Select, Button, Space, Tag, Switch,
  Modal, Form, Image, Badge, App, Drawer, Tooltip, Empty,
  Slider, Row, Col, Progress, InputNumber,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, FilterOutlined,
  BulbOutlined, PoweroffOutlined, MoreOutlined,
  ReloadOutlined, ThunderboltOutlined, CloudUploadOutlined,
  SafetyCertificateOutlined, ShopOutlined, ApiOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { deviceAPI, controlAPI, vendorAPI } from '../../services/api';
import { DeviceCategory, DeviceStatus } from '@iot/shared';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

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

const propertyLabels: Record<string, string> = {
  power: '电源', onoff: '开关', brightness: '亮度', color_temp: '色温',
  temperature: '温度', humidity: '湿度', battery: '电量',
  mode: '模式', fan_speed: '风速', lock: '门锁状态',
  current: '电流', voltage: '电压', pm25: 'PM2.5',
  motion: '人体感应', door: '门磁', color: '颜色',
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
  const [vendors, setVendors] = useState<any[]>([]);
  const [claimStep, setClaimStep] = useState<'bind' | 'register'>('bind');
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    loadDevices();
    loadVendors();
  }, [page, pageSize, keyword, category, statusFilter]);

  const loadVendors = async () => {
    try {
      const res: any = await vendorAPI.getList({ pageSize: 100 });
      setVendors(res.items || []);
    } catch {}
  };

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
      setClaimLoading(true);
      if (claimStep === 'bind') {
        await deviceAPI.claim(values);
        message.success('设备绑定成功');
      } else {
        await deviceAPI.registerByVendor(values);
        message.success('设备注册成功，已自动绑定');
      }
      setClaimModal(false);
      claimForm.resetFields();
      setClaimStep('bind');
      loadDevices();
    } catch (err: any) {
      message.error(err.message || (claimStep === 'bind' ? '绑定失败' : '注册失败'));
    } finally {
      setClaimLoading(false);
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
      width: 220,
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
              {categoryLabels[record.category] || record.category} · {record.model || '-'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '品牌厂商',
      dataIndex: 'vendor',
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <ShopOutlined style={{ color: '#1677ff' }} />
          <span>{record.vendor?.name || '-'}</span>
        </Space>
      ),
    },
    {
      title: '白名单认证',
      dataIndex: 'vendor.whitelistEnabled',
      width: 110,
      render: (_: any, record: any) => record.vendor?.whitelistEnabled ? (
        <Tag color="green" icon={<SafetyCertificateOutlined />}>已认证</Tag>
      ) : (
        <Tag color="default">未启用</Tag>
      ),
    },
    { title: '状态', dataIndex: 'status', width: 90, render: (s: string) => statusTag(s) },
    {
      title: '通用属性',
      dataIndex: 'properties',
      width: 260,
      render: (_: any, record: any) => {
        const props = record.properties || {};
        const items = Object.entries(props)
          .filter(([k]) => ['brightness', 'temperature', 'humidity', 'battery', 'pm25', 'color_temp'].includes(k))
          .slice(0, 4);
        if (items.length === 0) return <span style={{ color: '#bfbfbf' }}>-</span>;
        return (
          <Space size={[8, 4]} wrap>
            {items.map(([k, v]) => {
              const label = propertyLabels[k] || k;
              let suffix = '';
              if (k === 'temperature') suffix = '°C';
              else if (k === 'humidity' || k === 'brightness' || k === 'battery') suffix = '%';
              else if (k === 'pm25') suffix = 'μg/m³';
              else if (k === 'color_temp') suffix = 'K';
              const isLow = k === 'battery' && typeof v === 'number' && v <= 15;
              return (
                <Tag key={k} color={isLow ? 'red' : 'blue'}>
                  {label}: {v}{suffix}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '开关',
      dataIndex: 'properties.power',
      width: 80,
      render: (_: any, record: any) => {
        const power = record.properties?.power ?? record.properties?.onoff;
        return record.status === 'online' ? (
          <Switch checked={power} onChange={(v) => togglePower(record, v)} size="small" />
        ) : <Tag color="default">无法操作</Tag>;
      },
    },
    { title: '固件版本', dataIndex: 'firmwareVersion', width: 100, render: (v: string) => v || '-' },
    { title: '最后在线', dataIndex: 'lastSeen', width: 150, render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/devices/${record.id}`)}>详情</Button>
          <Button type="link" size="small" onClick={() => openControl(record)}>控制</Button>
          <Button type="link" size="small" onClick={() => navigate('/ota')}>升级</Button>
          <Button type="link" size="small" onClick={() => navigate(`/share?deviceId=${record.id}`)}>分享</Button>
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {devices.length === 0 && !loading && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0' }}>
                <Empty description="暂无设备" />
              </div>
            )}
            {devices.map((device) => {
              const props = device.properties || {};
              const battery = props.battery;
              const keyProps = Object.entries(props)
                .filter(([k]) => ['brightness', 'temperature', 'humidity', 'battery', 'pm25'].includes(k))
                .slice(0, 3);
              return (
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
                    <Space direction="vertical" size={4} align="end">
                      <Badge status={device.status === 'online' ? 'success' : 'default'} text={statusTag(device.status)} />
                      {device.vendor?.whitelistEnabled && (
                        <Tag icon={<SafetyCertificateOutlined />} color="green" style={{ margin: 0, fontSize: 11 }}>
                          白名单认证
                        </Tag>
                      )}
                    </Space>
                  </div>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{device.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                    <Space size={4}>
                      <ShopOutlined />
                      <span>{device.vendor?.name || '未知厂商'}</span>
                    </Space>
                    <span style={{ marginLeft: 8 }}>{categoryLabels[device.category] || device.category}</span>
                  </div>

                  {keyProps.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <Space size={[6, 4]} wrap>
                        {keyProps.map(([k, v]: any) => {
                          let suffix = '';
                          if (k === 'temperature') suffix = '°C';
                          else if (k === 'humidity' || k === 'brightness' || k === 'battery') suffix = '%';
                          else if (k === 'pm25') suffix = 'μg';
                          const isLow = k === 'battery' && v <= 15;
                          return (
                            <Tag key={k} color={isLow ? 'red' : 'blue'} style={{ fontSize: 11, margin: 0 }}>
                              {propertyLabels[k] || k}: {v}{suffix}
                            </Tag>
                          );
                        })}
                      </Space>
                    </div>
                  )}

                  {typeof battery === 'number' && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>
                        <span>电量</span>
                        <span>{battery}%</span>
                      </div>
                      <Progress
                        percent={battery}
                        size="small"
                        showInfo={false}
                        strokeColor={battery <= 15 ? '#ff4d4f' : battery <= 30 ? '#faad14' : '#52c41a'}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag color={device.status === 'online' ? 'green' : 'default'}>
                      {device.status === 'online' ? '在线' : device.status === 'sleeping' ? '休眠' : '离线'}
                    </Tag>
                    {device.status === 'online' && (props.power !== undefined || props.onoff !== undefined) && (
                      <Switch
                        size="small"
                        checked={props.power ?? props.onoff}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(checked) => {
                          event?.stopPropagation?.();
                          togglePower(device, checked);
                        }}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Card>

      <Modal
        title={claimStep === 'bind' ? '添加设备 - 绑定已有设备' : '添加设备 - 注册新设备'}
        open={claimModal}
        onCancel={() => {
          setClaimModal(false);
          claimForm.resetFields();
          setClaimStep('bind');
        }}
        footer={null}
        width={560}
      >
        <Space style={{ marginBottom: 16 }}>
          <Button type={claimStep === 'bind' ? 'primary' : 'default'} onClick={() => setClaimStep('bind')}>
            <ApiOutlined /> 绑定已有设备ID
          </Button>
          <Button type={claimStep === 'register' ? 'primary' : 'default'} onClick={() => setClaimStep('register')}>
            <ShopOutlined /> 厂商注册新设备
          </Button>
        </Space>

        <Form form={claimForm} layout="vertical" onFinish={handleClaim}>
          {claimStep === 'bind' ? (
            <>
              <Form.Item name="deviceId" label="设备ID" rules={[{ required: true, message: '请输入设备ID' }]}>
                <Input placeholder="请输入设备ID或扫描二维码" />
              </Form.Item>
              <Form.Item name="name" label="设备名称">
                <Input placeholder="给设备起个名字（可选）" />
              </Form.Item>
              <Form.Item name="roomId" label="房间">
                <Select placeholder="选择房间（可选）" allowClear>
                  <Option value="living_room">客厅</Option>
                  <Option value="bedroom">主卧</Option>
                  <Option value="kitchen">厨房</Option>
                  <Option value="study">书房</Option>
                </Select>
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item name="vendorId" label="品牌厂商" rules={[{ required: true, message: '请选择厂商' }]}>
                <Select placeholder="选择设备所属厂商" showSearch optionFilterProp="children">
                  {vendors.map((v) => (
                    <Option key={v.id} value={v.id}>
                      <Space>
                        <span style={{ color: v.status === 'active' ? '#52c41a' : '#bfbfbf' }}>●</span>
                        <span>{v.name}</span>
                        {v.whitelistEnabled && (
                          <Tag icon={<SafetyCertificateOutlined />} color="green" style={{ marginLeft: 8 }}>白名单认证</Tag>
                        )}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="vendorDeviceId" label="厂商设备编号" rules={[{ required: true, message: '请输入厂商侧的设备编号' }]}>
                <Input placeholder="厂商内部设备唯一标识" />
              </Form.Item>
              <Form.Item name="name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
                <Input placeholder="例如：客厅吸顶灯" />
              </Form.Item>
              <Form.Item name="model" label="设备型号">
                <Input placeholder="例如：Mi-Light-RGBW-001" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="category" label="设备类型" rules={[{ required: true, message: '请选择设备类型' }]}>
                    <Select placeholder="选择设备类型">
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <Option key={key} value={key}>{label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="firmwareVersion" label="固件版本" initialValue="1.0.0">
                    <Input placeholder="例如：1.0.0" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label="通用属性（初始值）">
                <Row gutter={[16, 8]}>
                  <Col span={8}>
                    <Form.Item name={['properties', 'power']} label="电源" valuePropName="checked" initialValue={false}>
                      <Switch checkedChildren="开" unCheckedChildren="关" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['properties', 'brightness']} label="亮度 (%)" initialValue={80}>
                      <Slider min={0} max={100} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['properties', 'temperature']} label="温度 (°C)" initialValue={26}>
                      <InputNumber min={16} max={35} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name={['properties', 'battery']} label="电量 (%)" initialValue={100}>
                      <Slider min={0} max={100} />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item name="connectivity" label="连接方式" initialValue={['wifi', 'ble']}>
                      <Select mode="multiple" placeholder="选择连接协议">
                        <Option value="wifi">Wi-Fi</Option>
                        <Option value="ble">蓝牙 BLE</Option>
                        <Option value="zigbee">Zigbee</Option>
                        <Option value="mqtt">MQTT</Option>
                        <Option value="thread">Thread</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
              <Form.Item name="description" label="设备备注">
                <TextArea rows={2} placeholder="可选：设备安装位置、备注信息等" />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={claimLoading}>
              {claimStep === 'bind' ? '绑定设备' : '注册并绑定设备'}
            </Button>
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
