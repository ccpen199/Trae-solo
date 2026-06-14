import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Space, Select, List, Switch,
  Divider, Tag, InputNumber, TimePicker, Modal, App,
  Row, Col, Empty, Radio,
} from 'antd';
import {
  PlusOutlined, SaveOutlined, ArrowLeftOutlined,
  ThunderboltOutlined, BulbOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sceneAPI, deviceAPI } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const categoryLabels: Record<string, string> = {
  light: '灯光', switch: '开关', plug: '插座', curtain: '窗帘',
  air_conditioner: '空调', thermostat: '温控器', camera: '摄像头',
  door_lock: '门锁', sensor: '传感器', speaker: '音箱',
  humidifier: '加湿器', purifier: '净化器', tv: '电视',
  fan: '风扇', gateway: '网关', other: '其他',
};

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

  const getTriggerDesc = (t: any) => {
    if (t.type === 'manual') return '手动点击或语音触发';
    if (t.type === 'voice') return `语音关键词："${t.config?.keyword || ''}"`;
    if (t.type === 'time') {
      const days = t.config?.days || [];
      const dayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const dayStr = days.length === 7 ? '每天' : days.sort().map((d: number) => dayLabels[d]).join('、');
      return `${dayStr || '每天'} ${t.config?.time || '--:--'} 执行`;
    }
    if (t.type === 'condition') {
      const dev = devices.find((d) => d.id === t.config?.deviceId);
      const propMap: Record<string, string> = { temperature: '温度', humidity: '湿度', battery: '电量', motion: '人体感应', door: '门磁', pm25: 'PM2.5', brightness: '亮度', current: '电流', voltage: '电压' };
      const opMap: Record<string, string> = { gt: '>', lt: '<', eq: '=', gte: '≥', lte: '≤', ne: '≠' };
      return `${dev?.name || '设备'} · ${propMap[t.config?.property] || t.config?.property || ''} ${opMap[t.config?.operator] || t.config?.operator} ${t.config?.value ?? ''}`;
    }
    return '';
  };

  const getActionDesc = (a: any) => {
    const dev = devices.find((d) => d.id === a.deviceId);
    const cmdMap: Record<string, string> = { onoff: '开关', brightness: '亮度', temperature: '温度', mode: '模式', color: '颜色' };
    const params = a.params || {};
    const paramStr = Object.entries(params)
      .map(([k, v]) => {
        if (k === 'on') return v ? '开' : '关';
        if (k === 'brightness') return `${v}%`;
        if (k === 'temperature') return `${v}°C`;
        return `${v}`;
      })
      .join(' ');
    const delayStr = a.delayMs ? `（延迟 ${a.delayMs / 1000}s）` : '';
    return `${dev?.name || a.deviceName} · ${cmdMap[a.command] || a.command} ${paramStr}${delayStr}`;
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
                      description={getTriggerDesc(item)}
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
                        description={getActionDesc(item)}
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
                <div key={t.id} style={{
                  padding: '8px 12px', background: '#f0f5ff', borderRadius: 6,
                  border: '1px solid #bae0ff',
                }}>
                  <div style={{ fontWeight: 500, color: '#1677ff' }}>
                    {triggerTypes.find((x) => x.type === t.type)?.icon || '⚙️'} {triggerTypes.find((x) => x.type === t.type)?.label || t.type}
                  </div>
                  <div style={{ fontSize: 12, color: '#595959', marginTop: 4, wordBreak: 'break-all' }}>
                    {getTriggerDesc(t)}
                  </div>
                </div>
              ))}
              {triggers.length === 0 && <Tag color="default">暂无触发条件</Tag>}
            </Space>

            <Divider>THEN - 执行动作</Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {actions.map((a, idx) => {
                const device = devices.find((d) => d.id === a.deviceId);
                return (
                  <div key={a.id} style={{
                    padding: '8px 12px', background: '#f6ffed', borderRadius: 6,
                    border: '1px solid #b7eb8f',
                  }}>
                    <div style={{ fontWeight: 500, color: '#389e0d' }}>
                      动作 {idx + 1}: {device?.name || a.deviceName}
                    </div>
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 4, wordBreak: 'break-all' }}>
                      {getActionDesc(a)}
                    </div>
                  </div>
                );
              })}
              {actions.length === 0 && <Tag color="default">暂无动作</Tag>}
              {actions.length >= 2 && (
                <Tag color="purple" style={{ marginTop: 8 }}>
                  💡 已配置 {actions.length} 个设备组合动作
                </Tag>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal title="添加触发条件" open={triggerModal} onCancel={() => setTriggerModal(false)} footer={null} width={640}>
        <Form form={triggerForm} layout="vertical" onFinish={handleAddTrigger}>
          <Form.Item name="type" label="触发类型" rules={[{ required: true }]} initialValue="manual">
            <Radio.Group style={{ width: '100%' }}>
              <Row gutter={12}>
                {triggerTypes.map((t) => (
                  <Col span={12} key={t.type}>
                    <Radio.Button value={t.type} style={{
                      height: 'auto', padding: '12px 16px', lineHeight: 1.4,
                      width: '100%', border: '1px solid #d9d9d9', borderRadius: 8, marginRight: 0,
                      alignItems: 'flex-start', justifyContent: 'flex-start',
                      display: 'flex', gap: 8,
                    }}>
                      <div>
                        <div style={{ fontSize: 24, lineHeight: 1 }}>{t.icon}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{t.label}</div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>{t.desc}</div>
                      </div>
                    </Radio.Button>
                  </Col>
                ))}
              </Row>
            </Radio.Group>
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
                    <Form.Item name={['config', 'deviceId']} label="触发设备" rules={[{ required: true }]}>
                      <Select
                        placeholder="选择带有可监控属性的设备"
                        showSearch
                        optionFilterProp="children"
                        onChange={() => triggerForm.setFieldsValue({ config: { property: undefined, operator: undefined, value: undefined } })}
                      >
                        {devices.filter((d) => {
                          const props = d.properties || {};
                          return Object.keys(props).some((k) =>
                            ['temperature', 'humidity', 'battery', 'motion', 'door', 'pm25', 'brightness', 'current', 'voltage'].includes(k)
                          );
                        }).map((d) => (
                          <Option key={d.id} value={d.id}>
                            <Space>
                              <span>{d.name}</span>
                              <Tag color="blue">{categoryLabels[d.category] || d.category}</Tag>
                              {Object.entries(d.properties || {})
                                .filter(([k]) => ['temperature', 'humidity', 'battery', 'pm25', 'brightness'].includes(k))
                                .slice(0, 2)
                                .map(([k, v]: any) => (
                                  <Tag key={k} style={{ margin: 0 }}>
                                    {k === 'temperature' ? '温度' : k === 'humidity' ? '湿度' : k === 'battery' ? '电量' : k === 'pm25' ? 'PM2.5' : '亮度'}:{v}
                                  </Tag>
                                ))}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate={(prev: any, cur: any) => prev?.config?.deviceId !== cur?.config?.deviceId}>
                      {() => {
                        const deviceId = triggerForm.getFieldValue(['config', 'deviceId']);
                        const device = devices.find((d) => d.id === deviceId);
                        if (!device) return null;
                        const availableProps = Object.keys(device.properties || {}).filter((k) =>
                          ['temperature', 'humidity', 'battery', 'motion', 'door', 'pm25', 'brightness', 'current', 'voltage'].includes(k)
                        );
                        const propLabels: Record<string, string> = {
                          temperature: '温度 (°C)', humidity: '湿度 (%)', battery: '电量 (%)',
                          motion: '人体感应', door: '门磁状态', pm25: 'PM2.5 (μg/m³)',
                          brightness: '亮度 (%)', current: '电流 (A)', voltage: '电压 (V)',
                        };
                        return (
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Form.Item name={['config', 'property']} label="监控属性" rules={[{ required: true }]}>
                              <Select placeholder="选择要监控的属性">
                                {availableProps.map((k) => (
                                  <Option key={k} value={k}>{propLabels[k] || k}</Option>
                                ))}
                              </Select>
                            </Form.Item>
                            <Form.Item name={['config', 'operator']} label="比较条件" rules={[{ required: true }]} initialValue="gt">
                              <Select>
                                <Option value="gt">大于 {'(>'}</Option>
                                <Option value="lt">小于 {'(<)'}</Option>
                                <Option value="eq">等于 (=)</Option>
                                <Option value="gte">大于等于 (≥)</Option>
                                <Option value="lte">小于等于 (≤)</Option>
                                <Option value="ne">不等于 (≠)</Option>
                              </Select>
                            </Form.Item>
                            <Form.Item noStyle shouldUpdate={(p: any, c: any) => p?.config?.property !== c?.config?.property}>
                              {() => {
                                const prop = triggerForm.getFieldValue(['config', 'property']);
                                const boolProps = ['motion', 'door'];
                                if (boolProps.includes(prop)) {
                                  return (
                                    <Form.Item name={['config', 'value']} label="触发值" rules={[{ required: true }]}>
                                      <Select>
                                        <Option value={true}>开启/有人/开</Option>
                                        <Option value={false}>关闭/无人/关</Option>
                                      </Select>
                                    </Form.Item>
                                  );
                                }
                                let min = 0, max = 100, step = 1;
                                if (prop === 'temperature') { min = -20; max = 60; }
                                if (prop === 'voltage') { min = 0; max = 400; step = 0.1; }
                                if (prop === 'current') { min = 0; max = 30; step = 0.1; }
                                if (prop === 'pm25') { min = 0; max = 500; }
                                const defaults: Record<string, number> = { temperature: 26, humidity: 60, battery: 15, brightness: 50, pm25: 75 };
                                return (
                                  <Form.Item name={['config', 'value']} label="阈值" rules={[{ required: true }]} initialValue={defaults[prop] || 50}>
                                    <InputNumber min={min} max={max} step={step} style={{ width: '100%' }} />
                                  </Form.Item>
                                );
                              }}
                            </Form.Item>
                          </Space>
                        );
                      }}
                    </Form.Item>
                  </Space>
                );
              }
              if (type === 'voice') {
                return (
                  <Form.Item name={['config', 'keyword']} label="语音关键词" rules={[{ required: true }]}>
                    <Input placeholder="例如：打开回家模式、我要睡觉了" />
                  </Form.Item>
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
