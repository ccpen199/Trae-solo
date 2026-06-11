import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Typography, Spin, message, Button, 
  Modal, Form, Input, Select, InputNumber, Space, Avatar, Empty,
  Row, Col
} from 'antd';
import { 
  PlusOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  EnvironmentOutlined, CrownOutlined, TeamOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../api/index.js';

const { Title, Text } = Typography;
const { Option } = Select;

const AdminManagers = () => {
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [form] = Form.useForm();

  const CITIES = ['上海', '北京', '广州', '深圳', '杭州', '成都', '武汉', '南京', '苏州', '重庆', '天津', '西安'];
  
  const LEVEL_MAP = {
    1: { label: '初级站长', color: 'blue', icon: '🥉' },
    2: { label: '中级站长', color: 'gold', icon: '🥈' },
    3: { label: '高级站长', color: 'red', icon: '🥇' }
  };

  const fetchManagers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getCityManagers();
      setManagers(response.data);
    } catch (error) {
      message.error('获取城市站长列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleAdd = () => {
    form.resetFields();
    form.setFieldsValue({ level: 1 });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setActionLoading(true);
      await adminAPI.createCityManager(values);
      message.success('站长创建成功');
      setModalVisible(false);
      fetchManagers();
    } catch (error) {
      if (error.errorFields) return;
      message.error(error.response?.data?.error || '创建失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '站长信息',
      key: 'manager',
      render: (_, record) => (
        <Space>
          <Avatar 
            size={48} 
            src={record.avatar}
            icon={<UserOutlined />}
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          />
          <div>
            <Text strong style={{ fontSize: 15 }}>
              {record.real_name || record.username}
            </Text>
            <div>
              <Text type="secondary" style={{ fontSize: 13 }}>
                @{record.username}
              </Text>
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 120,
      render: (level) => {
        const info = LEVEL_MAP[level] || LEVEL_MAP[1];
        return (
          <Tag color={info.color} style={{ fontSize: 13, padding: '4px 10px' }}>
            <span style={{ marginRight: 4 }}>{info.icon}</span>
            {info.label}
          </Tag>
        );
      }
    },
    {
      title: '负责城市',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      render: (city) => (
        <Tag icon={<EnvironmentOutlined />} color="geekblue">
          {city}
        </Tag>
      )
    },
    {
      title: '联系方式',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <PhoneOutlined style={{ color: '#999', marginRight: 6 }} />
            <Text>{record.phone || '-'}</Text>
          </div>
          <div>
            <MailOutlined style={{ color: '#999', marginRight: 6 }} />
            <Text type="secondary">{record.email || '-'}</Text>
          </div>
        </div>
      )
    },
    {
      title: '用户ID',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 100,
      render: (id) => <Text type="secondary">#{id}</Text>
    },
    {
      title: '任命时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    }
  ];

  const statsCards = [
    {
      title: '总站长数',
      value: managers.length,
      icon: <TeamOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
      color: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    {
      title: '覆盖城市',
      value: [...new Set(managers.map(m => m.city))].length,
      icon: <EnvironmentOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    {
      title: '高级站长',
      value: managers.filter(m => m.level === 3).length,
      icon: <CrownOutlined style={{ fontSize: 28, color: '#faad14' }} />,
      color: '#fffbe6',
      borderColor: '#ffe58f'
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
            站长管理
          </Title>
          <Text type="secondary">管理各城市站长，负责当地商家审核和运营</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{
            background: 'linear-gradient(135deg, #ff4d6d 0%, #ff7875 100%)',
            border: 'none'
          }}
        >
          任命站长
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card
              style={{
                background: card.color,
                borderRadius: 12,
                border: `1px solid ${card.borderColor}`,
                height: '100%'
              }}
              bodyStyle={{ padding: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {card.icon}
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{card.title}</Text>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#333', lineHeight: 1.2 }}>
                    {card.value}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          {managers.length > 0 ? (
            <Table
              columns={columns}
              dataSource={managers}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                showTotal: (total) => `共 ${total} 位站长`
              }}
              size="middle"
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty 
              description="暂无站长数据"
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
            任命城市站长
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={actionLoading}
        okText="确认任命"
        okButtonProps={{ 
          style: { 
            background: 'linear-gradient(135deg, #722ed1 0%, #9254de 100%)',
            border: 'none' 
          } 
        }}
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="user_id"
            label="用户ID"
            rules={[
              { required: true, message: '请输入用户ID' },
              { type: 'number', message: '请输入有效的数字ID' }
            ]}
            extra="请输入要任命为站长的用户ID"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={1}
              placeholder="请输入用户ID"
            />
          </Form.Item>

          <Form.Item
            name="city"
            label="负责城市"
            rules={[{ required: true, message: '请选择负责城市' }]}
          >
            <Select placeholder="请选择城市">
              {CITIES.map(city => (
                <Option key={city} value={city}>
                  {city}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="level"
            label="站长等级"
            rules={[{ required: true, message: '请选择站长等级' }]}
          >
            <Select>
              {Object.entries(LEVEL_MAP).map(([level, info]) => (
                <Option key={level} value={parseInt(level)}>
                  <Space>
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ 
            padding: 16, 
            background: '#f9f0ff', 
            borderRadius: 8,
            border: '1px dashed #d3adf7'
          }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 6 }} />
              任命后，该用户将获得站长权限，可以审核当地商家入驻申请、管理本地运营活动。
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminManagers;
