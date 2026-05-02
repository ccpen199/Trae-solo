import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Descriptions,
  Divider,
  Empty
} from 'antd';
import {
  PlusOutlined,
  SafetyCertificateOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { sealApi } from '../utils/api';
import dayjs from 'dayjs';

const Seals = () => {
  const [seals, setSeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSeal, setSelectedSeal] = useState(null);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchSeals();
  }, []);

  const fetchSeals = async () => {
    try {
      setLoading(true);
      const response = await sealApi.list();
      if (response.data.success) {
        setSeals(response.data.data.seals || []);
      }
    } catch (error) {
      message.error('获取印章列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSeal = async (values) => {
    try {
      setCreating(true);
      const response = await sealApi.create({
        sealName: values.sealName,
        sealType: values.sealType
      });
      
      if (response.data.success) {
        message.success('印章创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchSeals();
      }
    } catch (error) {
      message.error('创建印章失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateSeal = async (sealId) => {
    try {
      const response = await sealApi.deactivate(sealId);
      if (response.data.success) {
        message.success('印章已停用');
        fetchSeals();
      }
    } catch (error) {
      message.error('停用印章失败');
    }
  };

  const handleViewSeal = (seal) => {
    setSelectedSeal(seal);
    setDetailModalVisible(true);
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">我的印章</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建印章
        </Button>
      </div>

      <div className="card-container">
        {seals.length > 0 ? (
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
            dataSource={seals}
            loading={loading}
            renderItem={(seal) => (
              <List.Item>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  cover={
                    <div style={{ padding: 24, background: '#fafafa' }}>
                      <SafetyCertificateOutlined 
                        style={{ fontSize: 80, color: seal.isActive ? '#C41E3A' : '#ccc' }} 
                      />
                    </div>
                  }
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewSeal(seal)}
                    >
                      详情
                    </Button>,
                    seal.isActive && (
                      <Popconfirm
                        title="确定要停用此印章吗？"
                        description="停用后将无法使用此印章进行签署"
                        onConfirm={() => handleDeactivateSeal(seal.sealId)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          停用
                        </Button>
                      </Popconfirm>
                    )
                  ]}
                >
                  <Card.Meta
                    title={
                      <span>
                        {seal.sealName}
                        <span style={{ marginLeft: 8 }}>
                          {seal.isActive ? (
                            <Tag color="success"><CheckCircleOutlined /> 可用</Tag>
                          ) : (
                            <Tag color="default"><CloseCircleOutlined /> 已停用</Tag>
                          )}
                        </span>
                      </span>
                    }
                    description={
                      <div style={{ marginTop: 8 }}>
                        <Tag>{seal.sealType === 'personal' ? '个人印章' : '公章'}</Tag>
                        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                          创建于 {dayjs(seal.createdAt).format('YYYY-MM-DD')}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={<SafetyCertificateOutlined style={{ fontSize: 64, color: '#ccc' }} />}
            description="暂无印章"
            style={{ padding: '60px 0' }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              创建第一个印章
            </Button>
          </Empty>
        )}
      </div>

      <Modal
        title="创建印章"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={480}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSeal}
        >
          <Form.Item
            name="sealName"
            label="印章名称"
            rules={[{ required: true, message: '请输入印章名称' }]}
          >
            <Input placeholder="例如：个人合同专用章" />
          </Form.Item>

          <Form.Item
            name="sealType"
            label="印章类型"
            initialValue="personal"
            rules={[{ required: true, message: '请选择印章类型' }]}
          >
            <Select>
              <Select.Option value="personal">个人印章</Select.Option>
              <Select.Option value="organization">公章</Select.Option>
              <Select.Option value="official">法人章</Select.Option>
            </Select>
          </Form.Item>

          <Alert
            message="说明"
            description="创建印章后，系统将自动生成一个SVG格式的印章图像。您可以在签署合同时选择使用此印章。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={creating}>
                创建印章
              </Button>
              <Button onClick={() => {
                setCreateModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="印章详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedSeal(null);
        }}
        footer={null}
        width={520}
      >
        {selectedSeal && (
          <div>
            <div style={{ textAlign: 'center', padding: 24, background: '#fafafa', borderRadius: 8, marginBottom: 24 }}>
              <SafetyCertificateOutlined 
                style={{ fontSize: 120, color: selectedSeal.isActive ? '#C41E3A' : '#ccc' }} 
              />
            </div>

            <Descriptions bordered column={1}>
              <Descriptions.Item label="印章名称">
                {selectedSeal.sealName}
              </Descriptions.Item>
              <Descriptions.Item label="印章ID">
                <div className="hash-display">{selectedSeal.sealId}</div>
              </Descriptions.Item>
              <Descriptions.Item label="印章类型">
                <Tag>
                  {selectedSeal.sealType === 'personal' ? '个人印章' : 
                   selectedSeal.sealType === 'organization' ? '公章' : '法人章'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedSeal.isActive ? (
                  <Tag color="success"><CheckCircleOutlined /> 可用</Tag>
                ) : (
                  <Tag color="default"><CloseCircleOutlined /> 已停用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedSeal.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Seals;
