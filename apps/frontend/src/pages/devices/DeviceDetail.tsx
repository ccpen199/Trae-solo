import React, { useState, useEffect } from 'react';
import {
  Card, Descriptions, Tag, Space, Button, Tabs, Statistic,
  Row, Col, Form, Input, Select, Modal, App, Empty,
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, ReloadOutlined,
  ThunderboltOutlined, ShareAltOutlined, CloudUploadOutlined,
  WarningOutlined, BulbOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { deviceAPI, controlAPI, shareAPI, otaAPI } from '../../services/api';
import { SharePermission } from '@iot/shared';

const { Option } = Select;

const categoryLabels: Record<string, string> = {
  light: '灯光', switch: '开关', plug: '插座', curtain: '窗帘',
  air_conditioner: '空调', thermostat: '温控器', camera: '摄像头',
  door_lock: '门锁', sensor: '传感器', speaker: '音箱',
  humidifier: '加湿器', purifier: '净化器', tv: '电视',
  fan: '风扇', gateway: '网关', other: '其他',
};

const DeviceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { message, modal } = App.useApp();
  const [device, setDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [editForm] = Form.useForm();
  const [shareForm] = Form.useForm();
  const [shares, setShares] = useState<any[]>([]);
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [commandHistory, setCommandHistory] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadDevice();
  }, [id]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const [d, t, h, s] = await Promise.all([
        deviceAPI.getDetail(id!),
        deviceAPI.getTelemetry(id!, '24h').catch(() => []),
        controlAPI.getHistory(id!, { pageSize: 10 }).catch(() => ({ items: [] })),
        shareAPI.getDeviceShares(id!).catch(() => []),
      ]);
      setDevice(d);
      setTelemetry(Array.isArray(t) ? t : []);
      setCommandHistory((h as any).items || []);
      setShares(Array.isArray(s) ? s : []);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values: any) => {
    try {
      await deviceAPI.update(id!, values);
      message.success('设备信息已更新');
      setEditModal(false);
      loadDevice();
    } catch (err: any) {
      message.error(err.message || '更新失败');
    }
  };

  const handleShare = async (values: any) => {
    try {
      await shareAPI.shareDevice({
        deviceId: id!,
        shareeIdOrEmail: values.sharee,
        permission: values.permission,
        expiredAt: values.expiredAt,
      });
      message.success('分享成功');
      setShareModal(false);
      shareForm.resetFields();
      loadDevice();
    } catch (err: any) {
      message.error(err.message || '分享失败');
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: '确认删除设备？',
      content: '删除后将解除与设备的绑定，相关配置也会被清除',
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deviceAPI.delete(id!);
          message.success('设备已删除');
          navigate('/devices');
        } catch (err: any) {
          message.error(err.message || '删除失败');
        }
      },
    });
  };

  const telemetryOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 30, bottom: 30 },
    legend: { data: ['温度', '湿度', '电量'] },
    xAxis: {
      type: 'category',
      data: telemetry?.map((t: any) => {
        const d = new Date(t.bucket || Date.now());
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
      }) || [],
    },
    yAxis: [
      { type: 'value', name: '温度/°C' },
      { type: 'value', name: '湿度/%' },
    ],
    series: [
      {
        name: '温度', type: 'line', smooth: true, yAxisIndex: 0,
        data: telemetry?.map((t: any) => t.avg_temp || null) || [],
        itemStyle: { color: '#ff4d4f' },
      },
      {
        name: '湿度', type: 'line', smooth: true, yAxisIndex: 1,
        data: telemetry?.map((t: any) => t.avg_humidity || null) || [],
        itemStyle: { color: '#1677ff' },
      },
      {
        name: '电量', type: 'line', smooth: true, yAxisIndex: 1,
        data: telemetry?.map((t: any) => t.avg_battery || null) || [],
        itemStyle: { color: '#52c41a' },
      },
    ],
  };

  const statusColor = { online: 'green', offline: 'default', fault: 'red', updating: 'blue' };

  if (!device && !loading) {
    return <Empty description="设备不存在" />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/devices')}>返回列表</Button>
          <span style={{ fontSize: 18, fontWeight: 500 }}>{device?.name || '设备详情'}</span>
          <Tag color={statusColor[device?.status as keyof typeof statusColor] || 'default'}>
            {device?.status === 'online' ? '在线' : device?.status === 'offline' ? '离线' : device?.status}
          </Tag>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadDevice}>刷新</Button>
          <Button icon={<ShareAltOutlined />} onClick={() => setShareModal(true)}>分享</Button>
          <Button icon={<EditOutlined />} onClick={() => { editForm.setFieldsValue(device); setEditModal(true); }}>
            编辑
          </Button>
          <Button type="primary" danger onClick={handleDelete}>删除</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card loading={loading}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 16,
                background: '#e6f4ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 40, margin: '0 auto 12px',
              }}>
                <BulbOutlined style={{ color: '#1677ff' }} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 500 }}>{device?.name}</div>
              <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                {device?.vendor?.name || '未知厂商'} · {categoryLabels[device?.category] || device?.category}
              </div>
            </div>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <Statistic title="今日运行时长" value={Math.round((device?.onlineSecondsToday || 0) / 3600 * 10) / 10} suffix="小时" />
              {device?.properties?.battery !== undefined && (
                <Statistic
                  title="电池电量"
                  value={device.properties.battery}
                  suffix="%"
                  valueStyle={{ color: device.properties.battery < 20 ? '#ff4d4f' : '#52c41a' }}
                />
              )}
              {device?.properties?.temperature !== undefined && (
                <Statistic title="当前温度" value={device.properties.temperature} suffix="°C" />
              )}
              {device?.properties?.humidity !== undefined && (
                <Statistic title="当前湿度" value={device.properties.humidity} suffix="%" />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card loading={loading} title="设备属性">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="设备ID">{device?.id}</Descriptions.Item>
              <Descriptions.Item label="设备型号">{device?.model || '-'}</Descriptions.Item>
              <Descriptions.Item label="固件版本">{device?.firmwareVersion || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属房间">{device?.room?.name || '未分配'}</Descriptions.Item>
              <Descriptions.Item label="厂商">{device?.vendor?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="厂商设备ID">{device?.vendorDeviceId}</Descriptions.Item>
              <Descriptions.Item label="连接方式">
                {device?.connectivity?.join(', ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="最后在线">
                {device?.lastSeen ? new Date(device.lastSeen).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="添加时间">
                {device?.createdAt ? new Date(device.createdAt).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="已分享">
                {shares.length} 人
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} loading={loading}>
        <Tabs
          items={[
            {
              key: 'telemetry',
              label: '遥测数据',
              children: (
                <div>
                  <ReactECharts option={telemetryOption} style={{ height: 320 }} />
                </div>
              ),
            },
            {
              key: 'control',
              label: '快捷控制',
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Card size="small" title="电源控制">
                    <Space>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        disabled={device?.status !== 'online'}
                        onClick={async () => {
                          try {
                            await controlAPI.sendCommand(id!, { command: 'onoff', params: { on: true } });
                            message.success('已开启');
                            loadDevice();
                          } catch {}
                        }}
                      >
                        开启
                      </Button>
                      <Button
                        icon={<ThunderboltOutlined />}
                        disabled={device?.status !== 'online'}
                        onClick={async () => {
                          try {
                            await controlAPI.sendCommand(id!, { command: 'onoff', params: { on: false } });
                            message.success('已关闭');
                            loadDevice();
                          } catch {}
                        }}
                      >
                        关闭
                      </Button>
                    </Space>
                  </Card>
                  <Card size="small" title="OTA 升级">
                    <Space>
                      <Button icon={<CloudUploadOutlined />} onClick={() => navigate('/ota')}>
                        检查更新
                      </Button>
                    </Space>
                  </Card>
                </Space>
              ),
            },
            {
              key: 'history',
              label: '操作历史',
              children: commandHistory.length ? (
                <div>
                  {commandHistory.map((cmd: any) => (
                    <div key={cmd.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '12px 0', borderBottom: '1px solid #f0f0f0',
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{cmd.command}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {cmd.source} · {new Date(cmd.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <Tag color={cmd.success ? 'green' : 'red'}>
                        {cmd.success ? '成功' : '失败'}
                      </Tag>
                    </div>
                  ))}
                </div>
              ) : <Empty description="暂无操作记录" />,
            },
          ]}
        />
      </Card>

      <Modal title="编辑设备" open={editModal} onCancel={() => setEditModal(false)} footer={null}>
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="roomId" label="所属房间">
            <Select allowClear>
              <Option value="">未分配</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="分享设备" open={shareModal} onCancel={() => setShareModal(false)} footer={null}>
        <Form form={shareForm} layout="vertical" onFinish={handleShare}>
          <Form.Item name="sharee" label="分享给" rules={[{ required: true, message: '请输入用户名或邮箱' }]}>
            <Input placeholder="用户名 / 邮箱 / 手机号" />
          </Form.Item>
          <Form.Item name="permission" label="权限" rules={[{ required: true }]} initialValue={SharePermission.VIEW_ONLY}>
            <Select>
              <Option value={SharePermission.VIEW_ONLY}>仅查看</Option>
              <Option value={SharePermission.CONTROLLABLE}>可操作</Option>
              <Option value={SharePermission.FULL_SHARE}>可分享</Option>
            </Select>
          </Form.Item>
          <Form.Item name="expiredAt" label="有效期">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认分享</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DeviceDetailPage;
