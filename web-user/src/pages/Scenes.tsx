import { useState } from 'react';
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
  CheckCircle,
  XCircle,
  Check,
  X,
} from 'lucide-react';
import type { Scene, SceneAction } from '@/types';

const { Option } = Select;

interface AuditLogItem {
  id: string;
  action: string;
  deviceId?: string;
  deviceName?: string;
  ip: string;
  timestamp: string;
  details: string;
  operator: string;
  operatorAvatar?: string;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  detail?: string;
  icon?: React.ReactNode;
}

interface CreatedSceneInfo {
  scene: Scene;
  triggerLabel: string;
  actionLabels: string[];
  deviceCount: number;
}

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

const deviceNameMap: Record<string, string> = {
  '1': '客厅摄像头',
  '2': '门口摄像头',
  '3': '卧室摄像头',
  '4': '厨房摄像头',
  '5': '车库摄像头',
};

const getActionResult = (action: SceneAction): { success: boolean; detail: string } => {
  const random = Math.random();
  switch (action.type) {
    case 'record':
      if (random > 0.1) {
        return { success: true, detail: `已开始录像${action.params?.duration || 30}秒，保存至云端` };
      }
      return { success: false, detail: '设备离线，录像失败' };
    case 'push_notification':
      if (random > 0.15) {
        return { success: true, detail: '微信消息已推送至家庭成员' };
      }
      return { success: false, detail: '推送服务未配置' };
    case 'light_on':
      return { success: true, detail: `客厅灯光已开启，亮度${action.params?.brightness || 80}%` };
    case 'siren':
      return { success: true, detail: `警笛已鸣响${action.params?.duration || 5}秒` };
    case 'privacy_mode':
      return { success: true, detail: action.params?.enabled ? '摄像头已切换至隐私模式' : '摄像头已退出隐私模式' };
    default:
      return { success: true, detail: '动作执行完成' };
  }
};

export default function Scenes() {
  const [scenes, setScenes] = useState<Scene[]>(mockScenes);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [form] = Form.useForm();

  const currentUser = '张三';

  const generateRandomIP = () => {
    const lastOctet = Math.floor(Math.random() * 255) + 1;
    return `192.168.1.${lastOctet}`;
  };

  const addAuditLog = (log: Omit<AuditLogItem, 'id' | 'timestamp'>) => {
    const newLog: AuditLogItem = {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    const existingLogs = localStorage.getItem('auditLogs');
    let logs: AuditLogItem[] = [];
    if (existingLogs) {
      try {
        logs = JSON.parse(existingLogs);
      } catch {
        logs = [];
      }
    }
    const updated = [newLog, ...logs];
    localStorage.setItem('auditLogs', JSON.stringify(updated));
  };

  const [executionModalVisible, setExecutionModalVisible] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);
  const [executionResult, setExecutionResult] = useState<'success' | 'failed' | null>(null);
  const [executionSceneName, setExecutionSceneName] = useState('');
  const [currentExecutionScene, setCurrentExecutionScene] = useState<Scene | null>(null);

  const [createResultModalVisible, setCreateResultModalVisible] = useState(false);
  const [createdSceneInfo, setCreatedSceneInfo] = useState<CreatedSceneInfo | null>(null);

  const [toggleConfirmModalVisible, setToggleConfirmModalVisible] = useState(false);
  const [toggleScene, setToggleScene] = useState<Scene | null>(null);
  const [toggleTargetState, setToggleTargetState] = useState(false);

  const handleToggle = (scene: Scene, checked: boolean) => {
    setToggleScene(scene);
    setToggleTargetState(checked);
    setToggleConfirmModalVisible(true);
  };

  const confirmToggle = () => {
    if (!toggleScene) return;
    setScenes(scenes.map(s => s.id === toggleScene.id ? { ...s, enabled: toggleTargetState } : s));
    setToggleConfirmModalVisible(false);
    message.success(toggleTargetState ? `场景「${toggleScene.name}」已启用` : `场景「${toggleScene.name}」已禁用`);

    const deviceIds = toggleScene.trigger.deviceIds;
    const deviceId = deviceIds[0] || '';
    const deviceNames = deviceIds.map(id => deviceNameMap[id] || id).join('、');

    addAuditLog({
      action: '场景配置',
      deviceId: deviceId,
      deviceName: deviceNames,
      ip: generateRandomIP(),
      operator: currentUser,
      details: `${toggleTargetState ? '启用' : '禁用'}场景「${toggleScene.name}」`,
    });

    setToggleScene(null);
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
    setExecutionSceneName(scene.name);
    setExecutionResult(null);
    setCurrentExecutionScene(scene);

    const actionSteps: ExecutionStep[] = scene.actions.map((action, index) => ({
      id: `action-${index}`,
      name: actionTypeMap[action.type]?.label || '执行动作',
      status: 'pending' as const,
      icon: actionTypeMap[action.type]?.icon,
    }));
    const initialSteps: ExecutionStep[] = [
      {
        id: 'trigger',
        name: '触发条件检测',
        status: 'pending',
        icon: <Zap size={16} />,
      },
      ...actionSteps,
    ];
    setExecutionSteps(initialSteps);
    setExecutionModalVisible(true);

    let currentStep = 0;
    const runNextStep = () => {
      if (currentStep >= initialSteps.length) {
        const allSuccess = initialSteps.every(s => s.status === 'success');
        setExecutionResult(allSuccess ? 'success' : 'failed');

        const actionNames = scene.actions.map(a => actionTypeMap[a.type]?.label || a.type).join('、');
        const deviceIds = scene.trigger.deviceIds;
        const deviceId = deviceIds[0] || '';
        const deviceNames = deviceIds.map(id => deviceNameMap[id] || id).join('、');

        addAuditLog({
          action: '场景联动执行',
          deviceId: deviceId,
          deviceName: deviceNames,
          ip: generateRandomIP(),
          operator: currentUser,
          details: `手动触发场景「${scene.name}」，执行${scene.actions.length}个动作：${actionNames}`,
        });
        return;
      }

      setExecutionSteps(prev => prev.map((s, idx) =>
        idx === currentStep ? { ...s, status: 'running' } : s
      ));

      setTimeout(() => {
        if (currentStep === 0) {
          setExecutionSteps(prev => prev.map((s, idx) =>
            idx === currentStep ? { ...s, status: 'success', detail: '触发条件满足' } : s
          ));
        } else {
          const actionIndex = currentStep - 1;
          const action = scene.actions[actionIndex];
          const result = getActionResult(action);
          setExecutionSteps(prev => prev.map((s, idx) =>
            idx === currentStep ? {
              ...s,
              status: result.success ? 'success' : 'failed',
              detail: result.detail,
            } : s
          ));
        }
        currentStep++;
        setTimeout(runNextStep, 500);
      }, 800);
    };

    setTimeout(runNextStep, 300);
  };

  const handleRetryFailed = () => {
    if (!currentExecutionScene) return;

    const failedSteps = executionSteps.filter(s => s.status === 'failed');
    if (failedSteps.length === 0) return;

    const resetSteps = executionSteps.map(s => {
      if (s.status === 'failed') {
        return { ...s, status: 'pending' as const };
      }
      return s;
    });
    setExecutionSteps(resetSteps);
    setExecutionResult(null);

    let currentStep = 0;
    const runNextStep = () => {
      if (currentStep >= resetSteps.length) {
        const allSuccess = resetSteps.every(s => s.status === 'success');
        setExecutionResult(allSuccess ? 'success' : 'failed');
        return;
      }

      if (resetSteps[currentStep].status !== 'pending') {
        currentStep++;
        setTimeout(runNextStep, 100);
        return;
      }

      setExecutionSteps(prev => prev.map((s, idx) =>
        idx === currentStep ? { ...s, status: 'running' } : s
      ));

      setTimeout(() => {
        if (currentStep === 0) {
          setExecutionSteps(prev => prev.map((s, idx) =>
            idx === currentStep ? { ...s, status: 'success', detail: '触发条件满足' } : s
          ));
        } else {
          const actionIndex = currentStep - 1;
          const action = currentExecutionScene.actions[actionIndex];
          const result = getActionResult(action);
          setExecutionSteps(prev => prev.map((s, idx) =>
            idx === currentStep ? {
              ...s,
              status: result.success ? 'success' : 'failed',
              detail: result.detail,
            } : s
          ));
        }
        currentStep++;
        setTimeout(runNextStep, 500);
      }, 800);
    };

    setTimeout(runNextStep, 300);
  };

  const handleSubmit = (values: any) => {
    if (editingScene) {
      setScenes(scenes.map(s => s.id === editingScene.id ? { ...s, ...values } : s));
      message.success('场景已更新');
      setModalVisible(false);
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

      const triggerLabel = triggerTypeMap[values.triggerType]?.label || values.triggerType;
      const actionLabels = (values.actions || []).map((a: SceneAction) =>
        actionTypeMap[a.type]?.label || a.type
      );
      const deviceIds = values.deviceIds || [];
      const deviceId = deviceIds[0] || '';
      const deviceNames = deviceIds.map((id: string) => deviceNameMap[id] || id).join('、');

      addAuditLog({
        action: '创建场景',
        deviceId: deviceId,
        deviceName: deviceNames,
        ip: generateRandomIP(),
        operator: currentUser,
        details: `创建场景「${values.name}」，触发类型：${triggerLabel}，联动动作：${actionLabels.join('、')}`,
      });

      setCreatedSceneInfo({
        scene: newScene,
        triggerLabel: triggerLabel,
        actionLabels: actionLabels,
        deviceCount: deviceIds.length,
      });
      setModalVisible(false);
      setCreateResultModalVisible(true);
    }
  };

  const enableCreatedScene = () => {
    if (createdSceneInfo) {
      setScenes(scenes.map(s =>
        s.id === createdSceneInfo.scene.id ? { ...s, enabled: true } : s
      ));
      message.success(`场景「${createdSceneInfo.scene.name}」已启用`);
    }
    setCreateResultModalVisible(false);
  };

  const disableCreatedScene = () => {
    if (createdSceneInfo) {
      setScenes(scenes.map(s =>
        s.id === createdSceneInfo.scene.id ? { ...s, enabled: false } : s
      ));
    }
    setCreateResultModalVisible(false);
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-primary-500" />
            <span>场景执行结果</span>
          </div>
        }
        open={executionModalVisible}
        onCancel={() => setExecutionModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setExecutionModalVisible(false)}>
            关闭
          </Button>,
          executionResult === 'failed' && (
            <Button key="retry" type="primary" onClick={handleRetryFailed} icon={<Play size={14} />}>
              重试失败动作
            </Button>
          ),
        ]}
        width={520}
        maskClosable={false}
      >
        <div className="text-center mb-6">
          <div className="text-lg font-medium text-gray-800 mb-2">
            场景「{executionSceneName}」
          </div>
          {executionResult === null ? (
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <Spin size="small" />
              <span>正在执行...</span>
            </div>
          ) : executionResult === 'success' ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={48} className="text-green-500" />
              <span className="text-green-600 font-medium text-lg">
                场景执行成功，共执行{executionSteps.length - 1}个动作
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <XCircle size={48} className="text-red-500" />
              <span className="text-red-600 font-medium text-lg">
                部分动作执行失败
              </span>
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mt-2 text-left w-full">
                <div className="text-sm text-red-600 font-medium mb-1">警告：以下动作执行失败</div>
                {executionSteps.filter(s => s.status === 'failed').map((s, idx) => (
                  <div key={idx} className="text-sm text-red-500 flex items-center gap-2">
                    <XCircle size={12} />
                    {s.name}: {s.detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Divider className="my-4" />

        <div className="space-y-4">
          {executionSteps.map((step, index) => (
            <div key={step.id} className={`flex items-start gap-3 ${step.status === 'failed' ? 'bg-red-50 p-3 rounded-lg -mx-3' : ''}`}>
              <div className="relative">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.status === 'success'
                      ? 'bg-green-100 text-green-600'
                      : step.status === 'failed'
                      ? 'bg-red-100 text-red-600'
                      : step.status === 'running'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step.status === 'success' ? (
                    <Check size={16} />
                  ) : step.status === 'failed' ? (
                    <X size={16} />
                  ) : step.status === 'running' ? (
                    <Spin size="small" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < executionSteps.length - 1 && (
                  <div className={`absolute left-1/2 top-8 w-px h-6 -translate-x-1/2 ${
                    step.status === 'success' || step.status === 'failed'
                      ? 'bg-gray-200'
                      : 'bg-gray-100'
                  }`}></div>
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${
                    step.status === 'success'
                      ? 'text-gray-800'
                      : step.status === 'failed'
                      ? 'text-red-600'
                      : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {step.status === 'running' && (
                    <Tag color="processing" className="border-0">执行中</Tag>
                  )}
                  {step.status === 'success' && (
                    <Tag color="success" className="border-0">成功</Tag>
                  )}
                  {step.status === 'failed' && (
                    <Tag color="error" className="border-0">失败</Tag>
                  )}
                  {step.status === 'failed' && executionResult === 'failed' && (
                    <Button type="link" size="small" danger onClick={handleRetryFailed} icon={<Play size={12} />}>
                      重试
                    </Button>
                  )}
                </div>
                {step.detail && (
                  <p className={`text-sm mt-1 ${
                    step.status === 'failed' ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    {step.detail}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
            <span>场景创建成功</span>
          </div>
        }
        open={createResultModalVisible}
        onCancel={() => setCreateResultModalVisible(false)}
        footer={[
          <Button key="later" onClick={disableCreatedScene}>
            稍后再说
          </Button>,
          <Button key="enable" type="primary" onClick={enableCreatedScene}>
            立即启用
          </Button>,
        ]}
        width={480}
        maskClosable={false}
      >
        {createdSceneInfo && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mb-3">
                <Zap size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                场景「{createdSceneInfo.scene.name}」创建成功
              </h3>
              <p className="text-gray-500 mt-1">{createdSceneInfo.scene.description}</p>
            </div>

            <Card className="bg-gray-50 border-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    {triggerTypeMap[createdSceneInfo.scene.trigger.type]?.icon || <Zap size={16} />}
                    触发条件
                  </span>
                  <Tag color="blue">{createdSceneInfo.triggerLabel}</Tag>
                </div>
                <Divider className="my-2" />
                <div className="flex items-start justify-between">
                  <span className="text-gray-500 flex items-center gap-2 pt-1">
                    <Settings size={16} />
                    联动动作
                  </span>
                  <div className="flex-1 text-right">
                    <Space size={[4, 4]} wrap>
                      {createdSceneInfo.actionLabels.map((label, idx) => (
                        <Tag key={idx} color="green">{label}</Tag>
                      ))}
                    </Space>
                  </div>
                </div>
                <Divider className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Video size={16} />
                    关联设备
                  </span>
                  <span className="text-gray-800 font-medium">{createdSceneInfo.deviceCount} 台设备</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="确认操作"
        open={toggleConfirmModalVisible}
        onCancel={() => setToggleConfirmModalVisible(false)}
        onOk={confirmToggle}
        okText="确认"
        cancelText="取消"
      >
        {toggleScene && (
          <p className="text-gray-600">
            确定要{toggleTargetState ? '启用' : '禁用'}场景「{toggleScene.name}」吗？
          </p>
        )}
      </Modal>
    </div>
  );
}
