import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Switch, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, PlayCircleOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { getScenes, createScene, updateScene, deleteScene, executeScene, getUsers, getDevices } from '../api';

const { Option } = Select;

function Scenes() {
  const [scenes, setScenes] = useState([]);
  const [users, setUsers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScene, setEditingScene] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scenesRes, usersRes, devicesRes] = await Promise.all([
        getScenes(),
        getUsers(),
        getDevices()
      ]);
      setScenes(scenesRes.data);
      setUsers(usersRes.data);
      setDevices(devicesRes.data);
    } catch (error) {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingScene(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (scene) => {
    setEditingScene(scene);
    form.setFieldsValue({
      name: scene.name,
      description: scene.description,
      trigger_type: JSON.parse(scene.conditions).trigger || 'manual',
      trigger_time: JSON.parse(scene.conditions).time,
      user_id: scene.user_id,
      enabled: scene.enabled
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      const conditions = { trigger: values.trigger_type };
      if (values.trigger_type === 'time' && values.trigger_time) {
        conditions.time = values.trigger_time;
      }
      const actions = { devices: values.devices || [], action: values.action || 'off' };

      if (editingScene) {
        await updateScene(editingScene.id, { ...values, conditions, actions });
        message.success('场景更新成功');
      } else {
        await createScene({ ...values, conditions, actions });
        message.success('场景创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteScene(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleExecute = async (scene) => {
    try {
      await executeScene(scene.id);
      message.success(`场景「${scene.name}」已执行`);
    } catch (error) {
      message.error('执行失败');
    }
  };

  const toggleEnabled = async (scene) => {
    try {
      await updateScene(scene.id, { enabled: scene.enabled ? 0 : 1 });
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getTriggerTypeText = (conditions) => {
    const cond = JSON.parse(conditions);
    const types = { manual: '手动触发', time: '定时触发', location: '位置触发', device: '设备触发' };
    return types[cond.trigger] || cond.trigger;
  };

  return (
    <div>
      <Card
        title="场景编排"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            创建场景
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {scenes.map((scene) => (
            <Col span={6} key={scene.id}>
              <Card
                className="scene-card"
                loading={loading}
                actions={[
                  <Button type="text" icon={<PlayCircleOutlined />} onClick={() => handleExecute(scene)}>
                    执行
                  </Button>,
                  <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(scene)}>
                    编辑
                  </Button>,
                  <Popconfirm title="确认删除?" onConfirm={() => handleDelete(scene.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <Card.Meta
                  avatar={<SettingOutlined style={{ fontSize: 32 }} />}
                  title={
                    <Space>
                      {scene.name}
                      <Tag color={scene.enabled ? 'green' : 'default'}>
                        {scene.enabled ? '已启用' : '已禁用'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p>{scene.description}</p>
                      <p>触发方式: {getTriggerTypeText(scene.conditions)}</p>
                      <p>归属: {scene.user_name || '系统场景'}</p>
                      <p>
                        <Switch
                          checked={!!scene.enabled}
                          onChange={() => toggleEnabled(scene)}
                        />
                      </p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={editingScene ? '编辑场景' : '创建场景'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="场景名称" rules={[{ required: true }]}>
            <Input placeholder="如: 离家模式" />
          </Form.Item>
          <Form.Item name="description" label="场景描述">
            <Input.TextArea rows={2} placeholder="描述场景的功能" />
          </Form.Item>
          <Form.Item name="trigger_type" label="触发方式" rules={[{ required: true }]}>
            <Select>
              <Option value="manual">手动触发</Option>
              <Option value="time">定时触发</Option>
              <Option value="location">位置触发</Option>
              <Option value="device">设备状态触发</Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.trigger_type !== curr.trigger_type}>
            {({ getFieldValue }) =>
              getFieldValue('trigger_type') === 'time' && (
                <Form.Item name="trigger_time" label="触发时间">
                  <Input placeholder="如: 22:00" />
                </Form.Item>
              )
            }
          </Form.Item>
          <Form.Item name="action" label="执行动作">
            <Select>
              <Option value="off">关闭设备</Option>
              <Option value="on">开启设备</Option>
              <Option value="on_26">开启并设置26℃</Option>
              <Option value="sleep">睡眠模式</Option>
            </Select>
          </Form.Item>
          <Form.Item name="devices" label="关联设备">
            <Select mode="multiple" placeholder="选择关联设备">
              {devices.map((d) => (
                <Option key={d.device_id} value={d.device_id}>{d.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="user_id" label="归属用户">
            <Select>
              <Option value="">系统场景</Option>
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
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

export default Scenes;
