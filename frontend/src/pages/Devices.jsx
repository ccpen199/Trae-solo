import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Modal, Form, Input, Select, Switch, Tag, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, PoweroffOutlined, BulbOutlined, ThunderboltOutlined, SettingOutlined, DeleteOutlined } from '@ant-design/icons';
import { getDevices, createDevice, updateDevice, deleteDevice, controlDevice, getUsers } from '../api';

const { Option } = Select;

const deviceIcons = {
  tv: <BulbOutlined />,
  ac: <ThunderboltOutlined />,
  fridge: <SettingOutlined />,
  washer: <SettingOutlined />
};

const deviceTypeNames = {
  tv: '电视',
  ac: '空调',
  fridge: '冰箱',
  washer: '洗衣机'
};

function Devices() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [controlModalVisible, setControlModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [form] = Form.useForm();
  const [controlForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [devicesRes, usersRes] = await Promise.all([
        getDevices(),
        getUsers()
      ]);
      setDevices(devicesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      await createDevice(values);
      message.success('设备添加成功');
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDevice(id);
      message.success('删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleControl = (device) => {
    setSelectedDevice(device);
    controlForm.setFieldsValue({
      action: device.power_state,
      mode: device.running_mode
    });
    setControlModalVisible(true);
  };

  const handleControlSubmit = async (values) => {
    try {
      await controlDevice(selectedDevice.id, values.action === 'on' ? 'on' : 'off', { mode: values.mode });
      message.success('控制命令已发送');
      setControlModalVisible(false);
      loadData();
    } catch (error) {
      message.error('控制失败');
    }
  };

  const togglePower = async (device) => {
    try {
      const newState = device.power_state === 'on' ? 'off' : 'on';
      await controlDevice(device.id, newState, {});
      message.success(`设备已${newState === 'on' ? '开启' : '关闭'}`);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  return (
    <div>
      <Card
        title="设备管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加设备
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {devices.map((device) => (
            <Col span={6} key={device.id}>
              <Card
                className="device-card"
                loading={loading}
                actions={[
                  <Button
                    type="text"
                    icon={<PoweroffOutlined />}
                    onClick={() => togglePower(device)}
                    danger={device.power_state === 'on'}
                  >
                    {device.power_state === 'on' ? '关机' : '开机'}
                  </Button>,
                  <Button type="text" onClick={() => handleControl(device)}>
                    控制
                  </Button>,
                  <Popconfirm title="确认删除?" onConfirm={() => handleDelete(device.id)}>
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <Card.Meta
                  avatar={<div style={{ fontSize: 32 }}>{deviceIcons[device.type] || <SettingOutlined />}</div>}
                  title={
                    <Space>
                      {device.name}
                      <Tag color={device.status === 'online' ? 'success' : 'error'}>
                        {device.status === 'online' ? '在线' : '离线'}
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <p>型号: {device.model}</p>
                      <p>类型: {deviceTypeNames[device.type]}</p>
                      <p>归属: {device.user_name || '未绑定'}</p>
                      <p>固件: {device.firmware_version}</p>
                      {device.power_state === 'on' && (
                        <p>能耗: {device.energy_consumption}W</p>
                      )}
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title="添加设备"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="device_id" label="设备编号" rules={[{ required: true }]}>
            <Input placeholder="如: TV003" />
          </Form.Item>
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
            <Input placeholder="如: 书房电视" />
          </Form.Item>
          <Form.Item name="type" label="设备类型" rules={[{ required: true }]}>
            <Select>
              <Option value="tv">电视</Option>
              <Option value="ac">空调</Option>
              <Option value="fridge">冰箱</Option>
              <Option value="washer">洗衣机</Option>
            </Select>
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input />
          </Form.Item>
          <Form.Item name="user_id" label="绑定用户">
            <Select>
              {users.map((u) => (
                <Option key={u.id} value={u.id}>{u.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确定添加
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`控制设备 - ${selectedDevice?.name}`}
        open={controlModalVisible}
        onCancel={() => setControlModalVisible(false)}
        footer={null}
      >
        <Form form={controlForm} layout="vertical" onFinish={handleControlSubmit}>
          <Form.Item name="action" label="电源状态">
            <Select>
              <Option value="on">开机</Option>
              <Option value="off">关机</Option>
            </Select>
          </Form.Item>
          <Form.Item name="mode" label="运行模式">
            <Select>
              <Option value="standard">标准</Option>
              <Option value="eco">节能</Option>
              <Option value="sleep">睡眠</Option>
              <Option value="cool_26">制冷26℃</Option>
              <Option value="heat_24">制热24℃</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              发送控制命令
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Devices;
