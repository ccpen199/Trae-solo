import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, Select, List, Switch,
  Divider, Tag, InputNumber, TimePicker, Modal, App,
  Row, Col, Empty,
} from 'antd';
import {
  PlusOutlined, SaveOutlined, ArrowLeftOutlined,
  ThunderboltOutlined, ClockCircleOutlined, BulbOutlined,
  DeleteOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sceneAPI, deviceAPI } from '../../services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const triggerTypes = [
  { type: 'manual', label: '手动触发', icon: '👆', desc: '点击或语音触发' },
  { type: 'time', label: '定时触发', icon: '⏰', desc: '每天/周固定时间执行' },
  { type: 'condition', label: '条件触发', icon: '📡', desc: '传感器数值变化触发' },
  { type: 'voice', label: '语音触发', icon: '🎙️', desc: '语音指令触发' },
];

const actionCommands = [
  { value: 'onoff', label: '开关' },
  { value: 'brightness', label: '亮度' },
  { value: 'temperature', label: '温度' },
  { value: 'mode', label: '模式' },
  { value: 'color', label: '颜色' },
];

const SceneBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const template = searchParams.get('template');
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [triggers, setTriggers] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [triggerModal, setTriggerModal] = useState(false);
  const [actionModal, setActionModal] = useState(false);
  const [triggerForm] = Form.useForm();
  const [actionForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDevices();
    if (id) {
      loadScene();
    } else if (template) {
      applyTemplate(template);
    }
  }, [id, template]);

  const loadDevices = async () => {
    try {
      const res: any = await deviceAPI.getList({ pageSize: 100 });
      setDevices(res.items || []);
    } catch {}
  };

  const loadScene = async () => {
    try {
      setLoading(true);
      const scene: any = await sceneAPI.getDetail(id!);
      form.setFieldsValue(scene);
      setTriggers(scene.triggers || []);
      setActions(scene.actions || []);
    } catch (err: any) {
      message.error(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (tpl: string) => {
    const templates: Record<string, any> = {
      home: {
        name: '回家模式',
        description: '到家时自动开启常用设备',
        triggers: [{ type: 'manual' }],
        actions: [],
      },
      away: {
        name: '离家模式',
        description: '离家时关闭所有电器',
        triggers: [{ type: 'manual' }],
        actions: [],
      },
      sleep: {
        name: '睡眠模式',
        description: '准备睡眠时自动调节',
        triggers: [{ type: 'time', config: { time: '23:00', days: [1, 2, 3, 4, 5, 6, 0] } }],
        actions: [],
      },
      morning: {
        name: '早晨模式',
        description: '早晨自动唤醒',
        triggers: [{ type: 'time', config: { time: '07:00', days: [1, 2, 3, 4, 5] } }],
        actions: [],
      },
      movie: { name: '观影模式', description: '家庭影院模式', triggers: [{ type: 'manual' }], actions: [] },
      dining: { name: '用餐模式', description: '用餐时的灯光氛围', triggers: [{ type: 'manual' }], actions: [] },
    };
    const t = templates[tpl];
    if (t) {
      form.setFieldsValue({ name: t.name, description: t.description });
      setTriggers(t.triggers || []);
      setActions(t.actions || []);
    }
  };

  const handleAddTrigger = (values: any) => {
    const newTrigger = { ...values, id: Date.now().toString() };
    setTriggers([...triggers, newTrigger]);
    setTriggerModal(false);
    triggerForm.resetFields();
  };

  const handleAddAction = (values: any) => {
    const device = devices.find((d) => d.id === values.deviceId);
    const newAction = {
      ...values,
      deviceName: device?.name,
      id: Date.now().toString(),
    };
    setActions([...actions, newAction]);
    setActionModal(false);
    actionForm.resetFields();
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        triggers,
        actions,
      };
      if (id) {
        await sceneAPI.update(id, data);
        message.success('场景已更新');
      } else {
        await sceneAPI.create(data);
        message.success('场景已创建');
      }
      navigate('/scenes');
    } catch (err: any) {
      message.error(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const removeTrigger = (id: string) => {
    setTriggers(triggers.filter((t) => t.id !== id));
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/scenes')}>返回</Button>
          <span style={{ fontSize: 18, fontWeight: 500 }}>
            {id ? '编辑场景' : '新建场景'}
          </span>
        </Space>
        <Space>
          <Button onClick={() => navigate('/scenes')}>取消</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => form.submit()}>
            保存场景
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="基础信息" style={{ marginBottom: 16 }}>
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Form.Item name="name" label="场景名称" rules={[{ required: true, message: '请输入场景名称' }]}>
                <Input placeholder="例如：回家模式" />
              </Form.Item>
              <Form.Item name="description" label="场景描述">
                <TextArea rows={2} placeholder="简单描述这个场景的作用" />
              </Form.Item>
              <Form.Item name="enabled" label="是否启用" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card
            title="触发条件"
            style={{ marginBottom: 16 }}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setTriggerModal(true)}>
                添加触发
              </Button>
            }
          >
            {triggers.length === 0 ? (
              <Empty description="还没有触发条件，添加一个吧" image={null} style={{ padding: '24px 0' }} />
            ) : (
              <List
                dataSource={triggers}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeTrigger(item.id)} />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40, height: 40, borderRadius: 8,
                          background: '#e6f4ff', color: '#1677ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>
                          {triggerTypes.find((t) => t.type === item.type)?.icon || '⚙️'}
                        </div>
                      }
                      title={triggerTypes.find((t) => t.type === item.type)?.label || item.type}
                      description={
                        item.type === 'time' && item.config?.time
                          ? `每天 ${item.config.time} 执行`
                          : triggerTypes.find((t) => t.type === item.type)?.desc
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title="执行动作"
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setActionModal(true)}>
                添加动作
              </Button>
            }
          >
            {actions.length === 0 ? (
              <Empty description="还没有动作，添加一个设备动作吧" image={null} style={{ padding: '24px 0' }} />
            ) : (
              <List
                dataSource={actions}
                renderItem={(item) => {
                  const device = devices.find((d) => d.id === item.deviceId);
                  return (
                    <List.Item
                      actions={[
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeAction(item.id)} />,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: '#f6ffed', color: '#52c41a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                          }}>
                            <BulbOutlined />
                          </div>
                        }
                        title={device?.name || item.deviceName || item.deviceId}
                        description={`${item.command}${item.params ? ` - ${JSON.stringify(item.params)}` : ''}`}
                      />
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="场景预览">
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                background: 'linear-gradient(135deg, #1677ff, #69b1ff)',
                margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 28,
              }}>
                <ThunderboltOutlined />
              </div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>
                {form.getFieldValue('name') || '场景名称'}
              </div>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                {form.getFieldValue('description') || '场景描述'}
              </div>
            </div>

            <Divider>IF - 触发条件</Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {triggers.map((t) => (
                <Tag key={t.id} color="blue" style={{ margin: 0 }}>
                  {triggerTypes.find((x) => x.type === t.type)?.label || t.type}
                </Tag>
              ))}
              {triggers.length === 0 && <Tag color="default">暂无触发条件</Tag>}
            </Space>

            <Divider>THEN - 执行动作</Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {actions.map((a) => {
                const device = devices.find((d) => d.id === a.deviceId);
                return (
                  <Tag key={a.id} color="green" style={{ margin: 0 }}>
                    {device?.name || a.deviceName} - {a.command}
                  </Tag>
                );
              })}
              {actions.length === 0 && <Tag color="default">暂无动作</Tag>}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="添加触发条件" open={triggerModal} onCancel={() => setTriggerModal(false)} footer={null}>
        <Form form={triggerForm} layout="vertical" onFinish={handleAddTrigger}>
          <Form.Item name="type" label="触发类型" rules={[{ required: true }]} initialValue="manual">
            <Select>
              {triggerTypes.map((t) => (
                <Option key={t.type} value={t.type}>
                  <Space>
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    <span style={{ color: '#8c8c8c', fontSize: 12 }}>{t.desc}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {() => {
              const type = triggerForm.getFieldValue('type');
              if (type === 'time') {
                return (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name={['config', 'time']} label="触发时间" rules={[{ required: true }]}>
                      <TimePicker format="HH:mm" style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name={['config', 'days']} label="重复周期" initialValue={[1, 2, 3, 4, 5]}>
                      <Select mode="multiple" placeholder="选择星期">
                        <Option value={1}>周一</Option>
                        <Option value={2}>周二</Option>
                        <Option value={3}>周三</Option>
                        <Option value={4}>周四</Option>
                        <Option value={5}>周五</Option>
                        <Option value={6}>周六</Option>
                        <Option value={0}>周日</Option>
                      </Select>
                    </Form.Item>
                  </Space>
                );
              }
              if (type === 'condition') {
                return (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item name={['config', 'deviceId']} label="传感器设备" rules={[{ required: true }]}>
                      <Select>
                        {devices.filter((d) => d.category === 'sensor').map((d) => (
                          <Option key={d.id} value={d.id}>{d.name}</Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name={['config', 'property']} label="属性">
                      <Select>
                        <Option value="temperature">温度</Option>
                        <Option value="humidity">湿度</Option>
                        <Option value="battery">电量</Option>
                        <Option value="motion">人体感应</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name={['config', 'operator']} label="比较符">
                      <Select>
                        <Option value="gt">大于</Option>
                        <Option value="lt">小于</Option>
                        <Option value="eq">等于</Option>
                        <Option value="gte">大于等于</Option>
                        <Option value="lte">小于等于</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name={['config', 'value']} label="阈值">
                      <InputNumber style={{ width: '100%' }} />
                    </Form.Item>
                  </Space>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认添加</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="添加设备动作" open={actionModal} onCancel={() => setActionModal(false)} footer={null}>
        <Form form={actionForm} layout="vertical" onFinish={handleAddAction}>
          <Form.Item name="deviceId" label="选择设备" rules={[{ required: true }]}>
            <Select placeholder="选择要控制的设备" showSearch optionFilterProp="children">
              {devices.map((d) => (
                <Option key={d.id} value={d.id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="command" label="命令" rules={[{ required: true }]}>
            <Select>
              {actionCommands.map((c) => (
                <Option key={c.value} value={c.value}>{c.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const cmd = actionForm.getFieldValue('command');
              if (cmd === 'onoff') {
                return (
                  <Form.Item name={['params', 'on']} label="状态" valuePropName="checked" initialValue={true}>
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                );
              }
              if (cmd === 'brightness') {
                return (
                  <Form.Item name={['params', 'brightness']} label="亮度 (%)" initialValue={80}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                );
              }
              if (cmd === 'temperature') {
                return (
                  <Form.Item name={['params', 'temperature']} label="温度 (°C)" initialValue={26}>
                    <InputNumber min={16} max={30} style={{ width: '100%' }} />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
          <Form.Item name="delayMs" label="延迟执行 (毫秒)" initialValue={0}>
            <InputNumber min={0} step={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认添加</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SceneBuilderPage;
