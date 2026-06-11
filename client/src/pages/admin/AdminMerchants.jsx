import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Typography, Spin, message, Button, 
  Modal, Form, Input, InputNumber, Space, Avatar, Descriptions,
  Divider, Empty
} from 'antd';
import { 
  CheckOutlined, CloseOutlined, ShopOutlined, UserOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, IdcardOutlined,
  FileTextOutlined, SafetyCertificateOutlined
} from '@ant-design/icons';
import { adminAPI } from '../../api/index.js';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AdminMerchants = () => {
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState([]);
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const CATEGORY_MAP = {
    photography: '婚纱摄影',
    emcee: '司仪主持',
    hotel: '婚宴酒店',
    wedding_dress: '婚纱礼服'
  };

  const fetchPendingMerchants = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPendingMerchants();
      setMerchants(response.data);
    } catch (error) {
      message.error('获取待审核商家失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingMerchants();
  }, []);

  const handleViewDetail = (merchant) => {
    setSelectedMerchant(merchant);
    setDetailModalVisible(true);
  };

  const handleApprove = (merchant) => {
    setSelectedMerchant(merchant);
    approveForm.resetFields();
    approveForm.setFieldsValue({ deposit_amount: 50000 });
    setApproveModalVisible(true);
  };

  const handleReject = (merchant) => {
    setSelectedMerchant(merchant);
    rejectForm.resetFields();
    setRejectModalVisible(true);
  };

  const submitApprove = async () => {
    try {
      const values = await approveForm.validateFields();
      setActionLoading(true);
      await adminAPI.approveMerchant(selectedMerchant.id, values);
      message.success('审核通过，商家已成功入驻');
      setApproveModalVisible(false);
      fetchPendingMerchants();
    } catch (error) {
      if (error.errorFields) return;
      message.error('审核失败');
    } finally {
      setActionLoading(false);
    }
  };

  const submitReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setActionLoading(true);
      await adminAPI.rejectMerchant(selectedMerchant.id, values);
      message.success('已拒绝该商家入驻');
      setRejectModalVisible(false);
      fetchPendingMerchants();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      title: '商家信息',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (name, record) => (
        <Space>
          <Avatar 
            size={48} 
            src={record.logo} 
            icon={<ShopOutlined />}
            style={{ 
              background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
            }}
          />
          <div>
            <Text strong style={{ fontSize: 15 }}>{name}</Text>
            <div>
              <Tag color="blue" style={{ marginTop: 4 }}>
                {CATEGORY_MAP[record.category] || record.category}
              </Tag>
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '联系人',
      key: 'contact',
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <UserOutlined style={{ color: '#999', marginRight: 6 }} />
            <Text>{record.contact_name || '-'}</Text>
          </div>
          <div style={{ marginBottom: 4 }}>
            <PhoneOutlined style={{ color: '#999', marginRight: 6 }} />
            <Text>{record.contact_phone || record.phone || '-'}</Text>
          </div>
          <div>
            <MailOutlined style={{ color: '#999', marginRight: 6 }} />
            <Text type="secondary">{record.email || '-'}</Text>
          </div>
        </div>
      )
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      render: (city) => (
        <Tag icon={<EnvironmentOutlined />} color="geekblue">
          {city || '-'}
        </Tag>
      )
    },
    {
      title: '入驻时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => handleViewDetail(record)}
          >
            查看详情
          </Button>
          <Button 
            type="primary" 
            size="small"
            icon={<CheckOutlined />}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button 
            type="primary" 
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ marginBottom: 8, color: '#ff4d6d' }}>
            商家审核
          </Title>
          <Text type="secondary">审核商家入驻申请，确保平台商家质量</Text>
        </div>
        <Tag 
          color="orange" 
          style={{ fontSize: 14, padding: '4px 12px' }}
        >
          待审核 {merchants.length} 家
        </Tag>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          {merchants.length > 0 ? (
            <Table
              columns={columns}
              dataSource={merchants}
              rowKey="id"
              pagination={false}
              size="middle"
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '16px 24px', background: '#fafafa', borderRadius: 8 }}>
                    <Descriptions column={3} size="small">
                      <Descriptions.Item label="公司地址">
                        {record.address || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="营业执照">
                        {record.business_license ? (
                          <Tag color="green">已上传</Tag>
                        ) : (
                          <Tag color="red">未上传</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="服务区域">
                        {record.service_area || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="商家介绍" span={3}>
                        <Paragraph style={{ margin: 0 }}>
                          {record.description || '暂无介绍'}
                        </Paragraph>
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )
              }}
            />
          ) : (
            <Empty 
              description="暂无待审核的商家"
              style={{ padding: '60px 0' }}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={<Space><FileTextOutlined />商家详情</Space>}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          selectedMerchant && (
            <Space key="actions">
              <Button 
                type="primary" 
                icon={<CloseOutlined />}
                danger
                onClick={() => {
                  setDetailModalVisible(false);
                  handleReject(selectedMerchant);
                }}
              >
                拒绝入驻
              </Button>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => {
                  setDetailModalVisible(false);
                  handleApprove(selectedMerchant);
                }}
              >
                审核通过
              </Button>
            </Space>
          )
        ]}
        width={800}
      >
        {selectedMerchant && (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <Avatar 
                size={80} 
                src={selectedMerchant.logo} 
                icon={<ShopOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
                }}
              />
              <div style={{ flex: 1 }}>
                <Title level={4} style={{ margin: '0 0 8px 0' }}>
                  {selectedMerchant.company_name}
                </Title>
                <Space style={{ marginBottom: 8 }}>
                  <Tag color="blue">
                    {CATEGORY_MAP[selectedMerchant.category] || selectedMerchant.category}
                  </Tag>
                  <Tag icon={<EnvironmentOutlined />} color="geekblue">
                    {selectedMerchant.city}
                  </Tag>
                </Space>
                <Text type="secondary">
                  申请入驻时间：{selectedMerchant.created_at}
                </Text>
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions title="基本信息" column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="联系人">
                <Space><UserOutlined />{selectedMerchant.contact_name || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space><PhoneOutlined />{selectedMerchant.contact_phone || selectedMerchant.phone || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                <Space><MailOutlined />{selectedMerchant.email || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="身份证">
                <Space><IdcardOutlined />{selectedMerchant.id_card || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="公司地址" span={2}>
                <Space><EnvironmentOutlined />{selectedMerchant.address || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="服务区域" span={2}>
                {selectedMerchant.service_area || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="营业执照">
                {selectedMerchant.business_license ? (
                  <Tag color="green">已上传</Tag>
                ) : (
                  <Tag color="red">未上传</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="资质认证">
                {selectedMerchant.certification ? (
                  <Tag color="green">已认证</Tag>
                ) : (
                  <Tag color="orange">待认证</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions title="商家介绍" column={1} size="small">
              <Descriptions.Item label="商家简介">
                <Paragraph style={{ margin: 0 }}>
                  {selectedMerchant.description || '暂无商家介绍'}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="服务特色">
                <Paragraph style={{ margin: 0 }}>
                  {selectedMerchant.features || '暂无特色说明'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={<Space><SafetyCertificateOutlined style={{ color: '#52c41a' }} />审核通过 - 设置保证金</Space>}
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        onOk={submitApprove}
        confirmLoading={actionLoading}
        okText="确认通过"
        okButtonProps={{ style: { background: '#52c41a', borderColor: '#52c41a' } }}
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="deposit_amount"
            label="保证金额度（元）"
            rules={[{ required: true, message: '请输入保证金额度' }]}
            extra="商家入驻需缴纳保证金，用于保障消费者权益"
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={10000}
              step={10000}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\¥\s?|(,*)/g, '')}
            />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注（可选）"
          >
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<Space><CloseOutlined style={{ color: '#ff4d4d' }} />拒绝入驻</Space>}
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onOk={submitReject}
        confirmLoading={actionLoading}
        okText="确认拒绝"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="拒绝原因"
            rules={[{ required: true, message: '请填写拒绝原因' }]}
            extra="拒绝原因将通知给商家，请详细说明"
          >
            <TextArea 
              rows={4} 
              placeholder="请详细说明拒绝入驻的原因，如：资质不全、资料不符合要求等"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminMerchants;
