import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Switch, Modal, Form, Input,
  Select, App, Drawer, Empty, Badge, Tooltip,
} from 'antd';
import {
  PlusOutlined, ThunderboltOutlined, EditOutlined,
  DeleteOutlined, CopyOutlined, PlayCircleOutlined,
  ClockCircleOutlined, BulbOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sceneAPI } from '../../services/api';

const { Option } = Select;

const SceneListPage: React.FC = () => {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [scenes, setScenes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>();
  const [detailDrawer, setDetailDrawer] = useState<{ visible: boolean; scene: any | null }>({ visible: false, scene: null });
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [currentScene, setCurrentScene] = useState<any>(null);
  const [dupForm] = Form.useForm();

  useEffect(() => {
    loadScenes();
  }, [page, pageSize, statusFilter]);

  const loadScenes = async () => {
    try {
      setLoading(true);
      const params: any = { page, pageSize };
      if (statusFilter) params.status = statusFilter;
      const result: any = await sceneAPI.getList(statusFilter);
      const items = result.items || result || [];
      setScenes(items);
      setTotal(items.length || 0);
    } catch {
      setScenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (scene: any, enabled: boolean) => {
    try {
      await sceneAPI.toggle(scene.id, enabled ? 'enabled' : 'disabled');
      message.success(`已${enabled ? '启用' : '停用'}场景`);
      loadScenes();
    } catch (err: any) {
      message.error(err.message || '操作失败');
    }
  };

  const handleExecute = async (scene: any) => {
    try {
      await sceneAPI.execute(scene.id);
      message.success(`已执行场景: ${scene.name}`);
    } catch (err: any) {
      message.error(err.message || '执行失败');
    }
  };

  const handleDelete = (scene: any) => {
    modal.confirm({
      title: `确认删除场景"${scene.name}"？`,
      content: '删除后不可恢复',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await sceneAPI.delete(scene.id);
          message.success('场景已删除');
          loadScenes();
        } catch (err: any) {
          message.error(err.message || '删除失败');
        }
      },
    });
  };

  const handleDuplicate = async (values: any) => {
    try {
      await sceneAPI.duplicate(currentScene.id, { name: values.name });
      message.success('场景已复制');
      setDuplicateModal(false);
      dupForm.resetFields();
      loadScenes();
    } catch (err: any) {
      message.error(err.message || '复制失败');
    }
  };

  const triggerTypeLabels: Record<string, string> = {
    manual: '手动触发', time: '定时触发', condition: '条件触发', voice: '语音触发',
  };

  const columns = [
    {
      title: '场景名称',
      dataIndex: 'name',
      render: (name: string, record: any) => (
        <Space>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: record.status === 'enabled' ? '#e6f4ff' : '#f5f5f5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: record.status === 'enabled' ? '#1677ff' : '#bfbfbf',
            fontSize: 18,
          }}>
            {record.icon || <ThunderboltOutlined />}
          </div>
          <div>
            <div style={{ fontWeight: 500, cursor: 'pointer' }} onClick={() => setDetailDrawer({ visible: true, scene: record })}>
              {name}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.description || ''}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '触发方式',
      dataIndex: 'triggers',
      render: (triggers: any[]) => (
        <Space wrap>
          {(triggers || []).slice(0, 3).map((t: any, i: number) => (
            <Tag key={i} color="blue">{triggerTypeLabels[t.type] || t.type}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '动作数量',
      dataIndex: 'actions',
      render: (actions: any[]) => `${actions?.length || 0} 个动作`,
    },
    {
      title: '执行次数',
      dataIndex: 'executionCount',
      render: (v: number) => v || 0,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'enabled' ? 'green' : 'default'}>
          {status === 'enabled' ? '已启用' : '已停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="立即执行">
            <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleExecute(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/scenes/edit/${record.id}`)} />
          </Tooltip>
          <Tooltip title="复制">
            <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => { setCurrentScene(record); dupForm.setFieldsValue({ name: record.name + ' - 副本' }); setDuplicateModal(true); }} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const sceneCards = [
    { key: 'home', name: '回家模式', icon: '🏠', desc: '开灯、开空调、拉窗帘', color: '#1677ff' },
    { key: 'away', name: '离家模式', icon: '🚪', desc: '关闭所有电器、安防布防', color: '#52c41a' },
    { key: 'sleep', name: '睡眠模式', icon: '🌙', desc: '关灯、调节空调温度', color: '#722ed1' },
    { key: 'morning', name: '早晨模式', icon: '☀️', desc: '窗帘开启、灯光渐亮', color: '#faad14' },
    { key: 'movie', name: '观影模式', icon: '🎬', desc: '调暗灯光、拉窗帘、开电视', color: '#eb2f96' },
    { key: 'dining', name: '用餐模式', icon: '🍽️', desc: '餐厅灯光调暖', color: '#fa8c16' },
  ];

  return (
    <div>
      <Card
        title="智能场景"
        extra={
          <Space>
            <Select
              placeholder="筛选状态"
              allowClear
              style={{ width: 120 }}
              value={statusFilter}
              onChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <Option value="enabled">已启用</Option>
              <Option value="disabled">已停用</Option>
            </Select>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => navigate('/scenes/builder')}>
              新建场景
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={scenes}
          loading={loading}
          pagination={{
            current: page, pageSize, total,
            showSizeChanger: true, showQuickJumper: true,
            showTotal: (t) => `共 ${t} 个场景`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      <Card title="推荐场景模板" style={{ marginTop: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}>
          {sceneCards.map((scene) => (
            <Card
              key={scene.key}
              size="small"
              hoverable
              style={{ borderRadius: 8 }}
              styles={{ body: { padding: 16 } }}
              onClick={() => navigate('/scenes/builder?template=' + scene.key)}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: scene.color + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, marginBottom: 12,
              }}>
                {scene.icon}
              </div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{scene.name}</div>
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{scene.desc}</div>
              <div style={{ marginTop: 12, color: '#1677ff', fontSize: 12 }}>+ 使用此模板</div>
            </Card>
          ))}
        </div>
      </Card>

      <Drawer
        title="场景详情"
        open={detailDrawer.visible}
        onClose={() => setDetailDrawer({ visible: false, scene: null })}
        width={400}
      >
        {detailDrawer.scene && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>
                {detailDrawer.scene.name}
              </div>
              <div style={{ color: '#8c8c8c' }}>{detailDrawer.scene.description || '暂无描述'}</div>
            </div>

            <Card size="small" title="触发条件" style={{ marginBottom: 16 }}>
              {(detailDrawer.scene.triggers || []).length ? (
                <Space direction="vertical">
                  {(detailDrawer.scene.triggers || []).map((t: any, i: number) => (
                    <Tag key={i} color="blue">{triggerTypeLabels[t.type] || t.type}</Tag>
                  ))}
                </Space>
              ) : <Empty description="无触发条件" image={null} style={{ padding: '12px 0' }} />}
            </Card>

            <Card size="small" title="执行动作" style={{ marginBottom: 16 }}>
              {(detailDrawer.scene.actions || []).length ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {(detailDrawer.scene.actions || []).map((a: any, i: number) => (
                    <div key={i} style={{
                      padding: '8px 12px', background: '#fafafa',
                      borderRadius: 4, fontSize: 13,
                    }}>
                      {a.deviceName || a.deviceId || '设备'} - {a.command || '动作'}
                    </div>
                  ))}
                </Space>
              ) : <Empty description="无动作" image={null} style={{ padding: '12px 0' }} />}
            </Card>

            <Space style={{ width: '100%' }}>
              <Button type="primary" block icon={<PlayCircleOutlined />} onClick={() => handleExecute(detailDrawer.scene)}>
                立即执行
              </Button>
              <Button block icon={<EditOutlined />} onClick={() => navigate(`/scenes/edit/${detailDrawer.scene.id}`)}>
                编辑场景
              </Button>
            </Space>
          </div>
        )}
      </Drawer>

      <Modal title="复制场景" open={duplicateModal} onCancel={() => setDuplicateModal(false)} footer={null}>
        <Form form={dupForm} layout="vertical" onFinish={handleDuplicate}>
          <Form.Item name="name" label="场景名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认复制</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SceneListPage;
