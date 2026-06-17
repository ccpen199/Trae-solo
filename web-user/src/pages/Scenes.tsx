import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Switch,
  Dropdown,
  MenuProps,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Divider,
} from 'antd';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Plus,
  User,
  Eye,
  Clock,
  Hand,
  Video,
  Bell,
  Lightbulb,
  Volume2,
  EyeOff,
  Zap,
  Settings,
} from 'lucide-react';
import type { Scene, SceneAction } from '@/types';

const { Option } = Select;

const mockScenes: Scene[] = [
  {
    id: '1',
    name: '离家布防',
    description: '检测到人形移动时，自动录像并推送告警消息',
    enabled: true,
    trigger: {
      type: 'person_detect',
      deviceIds: ['1', '2', '5'],
    },
    actions: [
      { type: 'record', params: { duration: 30 } },
      { type: 'push_notification', params: { urgency: 'high' } },
    ],
  },
  {
    id: '2',
    name: '夜间警戒',
    description: '晚上10点到早上6点，移动侦测自动开启警戒模式',
    enabled: true,
    trigger: {
      type: 'schedule',
      deviceIds: ['1', '4'],
      condition: { startTime: '22:00', endTime: '06:00' },
    },
    actions: [
      { type: 'siren', params: { duration: 10 } },
      { type: 'light_on', params: { brightness: 100 } },
      { type: 'push_notification', params: { urgency: 'normal' } },
    ],
  },
  {
    id: '3',
    name: '回家模式',
    description: '手动触发后，关闭所有摄像头隐私模式，开启灯光',
    enabled: false,
    trigger: {
      type: 'manual',
      deviceIds: ['1', '2', '3', '4', '5'],
    },
    actions: [
      { type: 'privacy_mode', params: { enabled: false } },
      { type: 'light_on', params: { brightness: 80 } },
    ],
  },
  {
    id: '4',
    name: '门口欢迎',
    description: '门口检测到人时，自动录像并推送消息',
    enabled: true,
    trigger: {
      type: 'person_detect',
      deviceIds: ['2'],
    },
    actions: [
      { type: 'record', params: { duration: 15 } },
      { type: 'push_notification', params: { urgency: 'normal' } },
    ],
  },
  {
    id: '5',
    name: '睡眠模式',
    description: '手动触发后，卧室摄像头开启隐私模式，其他设备正常',
    enabled: false,
    trigger: {
      type: 'manual',
      deviceIds: ['3'],
    },
    actions: [
      { type: 'privacy_mode', params: { enabled: true } },
    ],
  },
  {
    id: '6',
    name: '车库警戒',
    description: '车库检测到移动目标时，自动录像并开启警笛',
    enabled: true,
    trigger: {
      type: 'motion',
      deviceIds: ['5'],
    },
    actions: [
      { type: 'record', params: { duration: 60 } },
      { type: 'siren', params: { duration: 5 } },
      { type: 'push_notification', params: { urgency: 'high' } },
    ],
  },
];

const triggerTypeMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  person_detect: { label: '人形识别', icon: <User size={16} />, color: 'text-orange-500' },
  motion: { label: '移动侦测', icon: <Eye size={16} />, color: 'text-blue-500' },
  schedule: { label: '定时触发', icon: <Clock size={16} />, color: 'text-purple-500' },
  manual: { label: '手动触发', icon: <Hand size={16} />, color: 'text-gray-500' },
};

const actionTypeMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  record: { label: '录像', icon: <Video size={16} />, color: 'text-primary-500' },
  push_notification: { label: '消息推送', icon: <Bell size={16} />, color: 'text-warning-500' },
  light_on: { label: '灯光', icon: <Lightbulb size={16} />, color: 'text-yellow-500' },
  siren: { label: '警笛', icon: <Volume2 size={16} />, color: 'text-danger-500' },
  privacy_mode: { label: '隐私模式', icon: <EyeOff size={16} />, color: 'text-gray-500' },
};

export default function Scenes() {
  const [scenes, setScenes] = useState<Scene[]>(mockScenes);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [form] = Form.useForm();

  const handleToggle = (scene: Scene, checked: boolean) => {
    setScenes(scenes.map(s => s.id === scene.id ? { ...s, enabled: checked } : s));
    message.success(checked ? `场景「${scene.name}」已启用` : `场景「${scene.name}」已禁用`);
  };

  const handleAdd = () => {
    setEditingScene(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (scene: Scene) => {
    setEditingScene(scene);
    form.setFieldsValue({
      name: scene.name,
      description: scene.description,
      triggerType: scene.trigger.type,
      deviceIds: scene.trigger.deviceIds,
      actions: scene.actions,
    });
    setModalVisible(true);
  };

  const handleDelete = (scene: Scene) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除场景「${scene.name}」吗？`,
      onOk: () => {
        setScenes(scenes.filter(s => s.id !== scene.id));
        message.success('场景已删除');
      },
    });
  };

  const handleTrigger = (scene: Scene) => {
    message.success(`场景「${scene.name}」已立即执行`);
  };

  const handleSubmit = (values: any) => {
    if (editingScene) {
      setScenes(scenes.map(s => s.id === editingScene.id ? { ...s, ...values } : s));
      message.success('场景已更新');
    } else {
      const newScene: Scene = {
        id: Date.now().toString(),
        name: values.name,
        description: values.description,
        enabled: true,
        trigger: {
          type: values.triggerType,
          deviceIds: values.deviceIds || [],
        },
        actions: values.actions || [],
      };
      setScenes([...scenes, newScene]);
      message.success('场景创建成功');
    }
    setModalVisible(false);
  };

  const getMenuItems = (scene: Scene): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <Edit size={14} />,
      label: '编辑场景',
      onClick: () => handleEdit(scene),
    },
    {
      key: 'trigger',
      icon: <Play size={14} />,
      label: '立即执行',
      onClick: () => handleTrigger(scene),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      danger: true,
      icon: <Trash2 size={14} />,
      label: '删除场景',
      onClick: () => handleDelete(scene),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">场景联动</h1>
          <p className="text-gray-500 mt-1">共 {scenes.length} 个场景，{scenes.filter(s => s.enabled).length} 个已启用</p>
        </div>
        <Button type="primary" icon={<Plus size={16} />} onClick={handleAdd}>
          添加场景
        </Button>
      </div>

      <Spin spinning={loading}>
        {scenes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenes.map((scene) => (
              <Card
                key={scene.id}
                className="rounded-xl border-0 shadow-sm hover:shadow-md transition-shadow"
                title={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                        scene.enabled ? 'from-primary-400 to-primary-600' : 'from-gray-300 to-gray-400'
                      } flex items-center justify-center`}>
                        <Zap size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{scene.name}</h3>
                      </div>
                    </div>
                    <Switch
                      checked={scene.enabled}
                      onChange={(checked) => handleToggle(scene, checked)}
                      size="small"
                    />
                  </div>
                }
                extra={
                  <Dropdown menu={{ items: getMenuItems(scene) }} trigger={['click']}>
                    <Button type="text" icon={<MoreHorizontal size={18} />} />
                  </Dropdown>
                }
              >
                <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{scene.description}</p>

                <Divider className="my-3" />

                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 ${triggerTypeMap[scene.trigger.type]?.color}`}>
                      {triggerTypeMap[scene.trigger.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">触发条件</div>
                      <Tag color="blue">{triggerTypeMap[scene.trigger.type]?.label}</Tag>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 text-success-500">
                      <Settings size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">联动动作</div>
                      <Space size={[4, 4]} wrap>
                        {scene.actions.map((action, index) => (
                          <Tag key={index} color="green">
                            {actionTypeMap[action.type]?.label}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="mt-0.5 text-gray-400">
                      <Video size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-400 mb-1">关联设备</div>
                      <div className="text-sm text-gray-600">{scene.trigger.deviceIds.length} 台设备</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button block icon={<Play size={14} />} onClick={() => handleTrigger(scene)}>
                    立即执行
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="暂无场景" className="py-16" />
        )}
      </Spin>

      <Modal
        title={editingScene ? '编辑场景' : '添加场景'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="场景名称" rules={[{ required: true, message: '请输入场景名称' }]}>
            <Input placeholder="请输入场景名称" />
          </Form.Item>

          <Form.Item name="description" label="场景描述">
            <Input.TextArea rows={2} placeholder="请输入场景描述" />
          </Form.Item>

          <Divider orientation="left" plain>触发条件</Divider>

          <Form.Item name="triggerType" label="触发类型" rules={[{ required: true, message: '请选择触发类型' }]}>
            <Select placeholder="请选择触发类型">
              <Option value="person_detect">人形识别</Option>
              <Option value="motion">移动侦测</Option>
              <Option value="schedule">定时触发</Option>
              <Option value="manual">手动触发</Option>
            </Select>
          </Form.Item>

          <Form.Item name="deviceIds" label="选择设备" rules={[{ required: true, message: '请选择设备' }]}>
            <Select mode="multiple" placeholder="请选择触发设备">
              <Option value="1">客厅摄像头</Option>
              <Option value="2">门口摄像头</Option>
              <Option value="3">卧室摄像头</Option>
              <Option value="4">厨房摄像头</Option>
              <Option value="5">车库摄像头</Option>
            </Select>
          </Form.Item>

          <Divider orientation="left" plain>联动动作</Divider>

          <Form.List name="actions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'type']}
                      rules={[{ required: true, message: '请选择动作类型' }]}
                      style={{ width: 200 }}
                    >
                      <Select placeholder="动作类型">
                        <Option value="record">录像</Option>
                        <Option value="push_notification">消息推送</Option>
                        <Option value="light_on">开启灯光</Option>
                        <Option value="siren">警笛</Option>
                        <Option value="privacy_mode">隐私模式</Option>
                      </Select>
                    </Form.Item>
                    <Button type="text" danger onClick={() => remove(name)} icon={<Trash2 size={14} />} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<Plus size={14} />}>
                    添加动作
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingScene ? '保存修改' : '创建场景'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
