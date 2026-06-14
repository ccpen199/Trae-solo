import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Form,
  Modal,
  Descriptions,
  Row,
  Col,
  message,
  Avatar,
  Rate,
  Drawer,
  List,
  Progress,
  Badge,
  Divider,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  UserOutlined,
  FileTextOutlined,
  StarOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { providerApi } from '@/api';
import type { Provider } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const VERIFICATION_STATUS: Record<string, { text: string; color: string }> = {
  unverified: { text: '未认证', color: 'default' },
  pending: { text: '审核中', color: 'processing' },
  verified: { text: '已认证', color: 'success' },
  rejected: { text: '认证失败', color: 'error' },
};

const LEVEL_COLORS: Record<number, string> = {
  1: '#D9D9D9',
  2: '#B7EB8F',
  3: '#95DE64',
  4: '#73D13D',
  5: '#52C41A',
};

const AdminProviderManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [levelForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async (page = 1, pageSize = 10, params?: any) => {
    try {
      setLoading(true);
      const data = await providerApi.getProviders({ page, pageSize, ...params });
      setProviders(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载服务商列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = {};
    if (values.keyword) params.keyword = values.keyword;
    if (values.verificationStatus) params.verificationStatus = values.verificationStatus;
    if (values.level) params.level = values.level;
    loadProviders(1, pagination.pageSize, params);
  };

  const handleReset = () => {
    form.resetFields();
    loadProviders(1, pagination.pageSize);
  };

  const handleViewDetail = (provider: Provider) => {
    setCurrentProvider(provider);
    setDetailVisible(true);
  };

  const handleAdjustLevel = (provider: Provider) => {
    setCurrentProvider(provider);
    levelForm.setFieldsValue({
      level: provider.level,
      reason: '',
    });
    setLevelModalVisible(true);
  };

  const handleVerify = async (provider: Provider, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await providerApi.approveVerification(provider.id);
        message.success('认证已通过');
      } else {
        await providerApi.rejectVerification(provider.id, { reason: '' });
        message.success('已驳回认证');
      }
      loadProviders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmitLevel = async () => {
    try {
      const values = await levelForm.validateFields();
      setSubmitting(true);

      await providerApi.updateLevel(currentProvider!.id, {
        level: values.level,
        reason: values.reason,
      });

      message.success('等级调整成功');
      setLevelModalVisible(false);
      loadProviders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('调整失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '服务商',
      key: 'provider',
      width: 200,
      render: (_: any, record: Provider) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} src={record.avatar} icon={<UserOutlined />} />
          <div>
            <Text strong className="block">{record.nickname}</Text>
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: number) => (
        <Tag color={LEVEL_COLORS[level] || LEVEL_COLORS[1]}>
          <TrophyOutlined className="mr-1" /> L{level}
        </Tag>
      ),
    },
    {
      title: '认证状态',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 100,
      render: (status: string) => {
        const s = VERIFICATION_STATUS[status] || VERIFICATION_STATUS.unverified;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 140,
      render: (rating: number) => (
        <div className="flex items-center gap-2">
          <Rate disabled value={rating || 5} allowHalf />
          <Text strong>{rating?.toFixed(1) || '5.0'}</Text>
        </div>
      ),
    },
    {
      title: '完成任务',
      dataIndex: 'completedTasks',
      key: 'completedTasks',
      width: 100,
      render: (count: number) => <Text strong>{count || 0}</Text>,
    },
    {
      title: '累计收入',
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      width: 120,
      render: (amount: number) => (
        <Text strong type="success">
          ¥{amount?.toLocaleString('zh-CN') || '0'}
        </Text>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Provider) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleAdjustLevel(record)}>
            调级
          </Button>
          {record.verificationStatus === 'pending' && (
            <>
              <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleVerify(record, 'approve')}>
                通过
              </Button>
              <Button type="link" danger icon={<CloseCircleOutlined />} onClick={() => handleVerify(record, 'reject')}>
                驳回
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>服务商管理</Title>
          <Text type="secondary">管理平台服务商，审核资质、调整等级</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>刷新</Button>
      </div>

      <Card className="mb-6">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} lg={7}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="昵称/邮箱" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="verificationStatus" label="认证状态">
                <Select placeholder="全部" allowClear>
                  {Object.entries(VERIFICATION_STATUS).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="level" label="等级">
                <Select placeholder="全部" allowClear>
                  {[1, 2, 3, 4, 5].map(level => (
                    <Option key={level} value={level}>L{level}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={5}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={providers}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadProviders(page, pageSize),
          }}
        />
      </Card>

      <Drawer
        title="服务商详情"
        placement="right"
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentProvider && (
          <div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <Avatar size={80} src={currentProvider.avatar} icon={<UserOutlined />} />
              <div>
                <Title level={4} style={{ margin: 0 }}>{currentProvider.nickname}</Title>
                <div className="flex items-center gap-2 mt-2">
                  <Tag color={LEVEL_COLORS[currentProvider.level] || LEVEL_COLORS[1]}>
                    <TrophyOutlined /> L{currentProvider.level} 服务商
                  </Tag>
                  {currentProvider.verificationStatus === 'verified' && (
                    <Tag color="success" icon={<CheckCircleOutlined />}>已认证</Tag>
                  )}
                  {currentProvider.verificationStatus === 'pending' && (
                    <Tag color="processing" icon={<WarningOutlined />}>认证审核中</Tag>
                  )}
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]} className="mb-6">
              <Col span={8}>
                <Card>
                  <Statistic
                    title="完成任务"
                    value={currentProvider.completedTasks || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="累计收入"
                    value={currentProvider.totalEarnings || 0}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52C41A' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="平均评分"
                    value={currentProvider.rating || 5}
                    precision={1}
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#FAAD14' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions bordered column={2} className="mb-6">
              <Descriptions.Item label="邮箱">{currentProvider.email}</Descriptions.Item>
              <Descriptions.Item label="手机号">{currentProvider.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">
                {currentProvider.gender === 'male' ? '男' : currentProvider.gender === 'female' ? '女' : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所在地区">{currentProvider.location || '-'}</Descriptions.Item>
              <Descriptions.Item label="从业年限">{currentProvider.experienceYears || '-'} 年</Descriptions.Item>
              <Descriptions.Item label="最高学历">
                {currentProvider.education === 'bachelor' ? '本科' :
                 currentProvider.education === 'master' ? '硕士' :
                 currentProvider.education === 'doctor' ? '博士' :
                 currentProvider.education === 'college' ? '大专' : '高中及以下'}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" span={2}>
                {dayjs(currentProvider.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            {currentProvider.bio && (
              <>
                <Divider orientation="left">个人简介</Divider>
                <Paragraph className="mb-6">{currentProvider.bio}</Paragraph>
              </>
            )}

            {currentProvider.categories && currentProvider.categories.length > 0 && (
              <>
                <Divider orientation="left">擅长领域</Divider>
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentProvider.categories.map((cat, index) => (
                    <Tag key={index} color="blue">{cat}</Tag>
                  ))}
                </div>
              </>
            )}

            {currentProvider.skills && currentProvider.skills.length > 0 && (
              <>
                <Divider orientation="left">专业技能</Divider>
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentProvider.skills.map((skill, index) => (
                    <Tag key={index} color="geekblue">{skill}</Tag>
                  ))}
                </div>
              </>
            )}

            <Divider orientation="left">服务数据</Divider>
            <List
             
              dataSource={[
                { label: '响应时间', value: `${currentProvider.responseTime || 24} 小时内` },
                { label: '按时交付率', value: `${currentProvider.onTimeRate || 95}%` },
                { label: '好评率', value: `${currentProvider.goodRate || 98}%` },
                { label: '回头客率', value: `${currentProvider.repeatRate || 45}%` },
                { label: '接单状态', value: currentProvider.available ? '接单中' : '休息中' },
              ]}
              renderItem={item => (
                <List.Item>
                  <span>{item.label}</span>
                  <Text strong>{item.value}</Text>
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      <Modal
        title="调整服务商等级"
        open={levelModalVisible}
        onCancel={() => setLevelModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLevelModalVisible(false)}>取消</Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={handleSubmitLevel}>
            确认调整
          </Button>,
        ]}
        destroyOnClose
      >
        {currentProvider && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar src={currentProvider.avatar} icon={<UserOutlined />} />
                <div>
                  <Text strong>{currentProvider.nickname}</Text>
                  <Text type="secondary" className="block text-sm">
                    当前等级：L{currentProvider.level}
                  </Text>
                </div>
              </div>
            </div>

            <Form form={levelForm} layout="vertical">
              <Form.Item
                name="level"
                label="调整后等级"
                rules={[{ required: true, message: '请选择等级' }]}
              >
                <Select placeholder="请选择等级">
                  {[1, 2, 3, 4, 5].map(level => (
                    <Option key={level} value={level}>
                      <Space>
                        <TrophyOutlined style={{ color: LEVEL_COLORS[level] }} />
                        L{level}
                        {level === 1 && ' - 新手'}
                        {level === 2 && ' - 入门'}
                        {level === 3 && ' - 进阶'}
                        {level === 4 && ' - 资深'}
                        {level === 5 && ' - 专家'}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="reason"
                label="调整原因"
                rules={[{ required: true, message: '请输入调整原因' }]}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="请说明等级调整的原因"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminProviderManagement;
