import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Menu,
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  message,
  Space,
  Avatar,
  Row,
  Col,
  Statistic,
  Tabs,
  List,
  Rate,
  Divider,
  Descriptions,
  Progress,
  Alert,
  Empty,
} from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileProtectOutlined,
  HistoryOutlined,
  RiseOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { providerAPI } from '../../services/api';

const { Header, Sider, Content } = Layout;
const { Option } = Select;
const { TextArea } = Input;

const AdminProviders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const [providersRes, statsRes] = await Promise.all([
        providerAPI.getList(params),
        providerAPI.getStats(),
      ]);
      setProviders(providersRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderDetail = async (provider: any) => {
    try {
      const [reviewsRes, settlementsRes] = await Promise.all([
        providerAPI.getReviews(provider.id),
        providerAPI.getSettlements(provider.id),
      ]);
      setReviews(reviewsRes.data || []);
      setSettlements(settlementsRes.data || []);
    } catch (error) {
      console.error('加载详情失败:', error);
    }
  };

  const menuItems = [
    { key: '/admin/dashboard', label: '运营仪表盘', icon: <DashboardOutlined /> },
    { key: '/admin/providers', label: '服务商管理', icon: <ShopOutlined /> },
    { key: '/admin/settlement', label: '团长激励结算', icon: <DollarOutlined /> },
  ];

  const handleAdd = () => {
    setEditingProvider(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingProvider(record);
    form.setFieldsValue({
      ...record,
      annualReviewDate: record.annual_review_date ? dayjs(record.annual_review_date) : null,
      streetCertified: !!record.street_certified,
    });
    setModalVisible(true);
  };

  const handleViewDetail = async (record: any) => {
    setSelectedProvider(record);
    await loadProviderDetail(record);
    setDetailVisible(true);
  };

  const handleRenew = async (record: any) => {
    try {
      const newDate = dayjs().add(1, 'year').format('YYYY-MM-DD');
      await providerAPI.renew(record.id, newDate);
      message.success('年审更新成功，有效期延长至 ' + newDate);
      loadData();
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handleSendRemind = async (record: any) => {
    try {
      await providerAPI.sendRemind(record.id, {
        remindType: 'renewal',
        message: `【年审提醒】您的服务商资质将于${record.annual_review_date}到期，请及时办理年审手续。`,
      });
      message.success('年审提醒已发送');
      loadData();
    } catch (error) {
      message.error('发送失败');
    }
  };

  const handleAddReview = async (provider: any) => {
    setSelectedProvider(provider);
    reviewForm.resetFields();
    setReviewModalVisible(true);
  };

  const submitReview = async (values: any) => {
    try {
      await providerAPI.addReview(selectedProvider.id, {
        reviewerName: '社区管理员',
        ...values,
      });
      message.success('复查记录已添加');
      setReviewModalVisible(false);
      await loadProviderDetail(selectedProvider);
      loadData();
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        annualReviewDate: values.annualReviewDate?.format('YYYY-MM-DD'),
        gridCode: values.gridCode || '37010101001',
      };

      if (editingProvider) {
        await providerAPI.update(editingProvider.id, data);
        message.success('更新成功');
      } else {
        await providerAPI.create(data);
        message.success('添加成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const getRegistrationStatus = (record: any) => {
    if (record.street_certified && record.certification_no) {
      return { color: 'success', text: '已备案', icon: <CheckCircleOutlined /> };
    } else if (record.certification_no) {
      return { color: 'warning', text: '待审核', icon: <ClockCircleOutlined /> };
    }
    return { color: 'error', text: '未备案', icon: <ExclamationCircleOutlined /> };
  };

  const getReviewStatus = (status: string) => {
    const colorMap: Record<string, string> = {
      approved: 'success',
      pending: 'warning',
      expired: 'error',
    };
    const textMap: Record<string, string> = {
      approved: '正常',
      pending: '待审核',
      expired: '已过期',
    };
    return { color: colorMap[status] || 'default', text: textMap[status] || status };
  };

  const getReviewTypeText = (type: string) => {
    const map: Record<string, string> = {
      annual: '年审复查',
      spot: '抽查检查',
      complaint: '投诉处理',
      reminder: '系统提醒',
    };
    return map[type] || type;
  };

  const getDaysUntilExpiry = (date: string | null | undefined) => {
    if (!date) return null;
    const expiry = dayjs(date);
    const now = dayjs();
    return expiry.diff(now, 'day');
  };

  const columns = [
    {
      title: '服务商名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<ShopOutlined />} className="bg-gradient-to-br from-orange-400 to-orange-600" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    { title: '服务类型', dataIndex: 'service_type', key: 'service_type', width: 120 },
    {
      title: '备案状态',
      key: 'registration',
      width: 100,
      render: (_: any, record: any) => {
        const status = getRegistrationStatus(record);
        return <Tag color={status.color} icon={status.icon}>{status.text}</Tag>;
      },
    },
    {
      title: '年审状态',
      dataIndex: 'review_status',
      key: 'review_status',
      width: 100,
      render: (status: string) => {
        const s = getReviewStatus(status);
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '年审到期',
      dataIndex: 'annual_review_date',
      key: 'annual_review_date',
      width: 140,
      render: (date: string) => {
        const days = getDaysUntilExpiry(date);
        if (days === null) return <span className="text-gray-400">未设置</span>;
        let color = 'text-gray-700';
        if (days <= 0) color = 'text-red-600 font-medium';
        else if (days <= 30) color = 'text-orange-600 font-medium';
        return (
          <div>
            <div className={color}>{date}</div>
            <div className="text-xs text-gray-400">
              {days > 0 ? `剩余 ${days} 天` : `已过期 ${Math.abs(days)} 天`}
            </div>
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleAddReview(record)}>
            复查
          </Button>
          {(record.review_status === 'expired' || (getDaysUntilExpiry(record.annual_review_date) !== null && getDaysUntilExpiry(record.annual_review_date)! <= 30)) && (
            <Button type="link" size="small" danger onClick={() => handleSendRemind(record)}>
              提醒
            </Button>
          )}
          {record.review_status === 'expired' && (
            <Button size="small" type="primary" onClick={() => handleRenew(record)}>
              年审
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const settlementColumns = [
    {
      title: '结算周期',
      dataIndex: 'period',
      key: 'period',
      width: 120,
    },
    {
      title: '关联需求',
      dataIndex: 'demand_title',
      key: 'demand_title',
      render: (title: string, record: any) => (
        <div>
          <div>{title}</div>
          <Tag color="blue" style={{ fontSize: '12px' }}>{record.demand_type}</Tag>
        </div>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => <span className="font-medium text-orange-600">¥{amount}</span>,
    },
    {
      title: '团长分成',
      dataIndex: 'leader_commission',
      key: 'leader_commission',
      width: 100,
      render: (amount: number) => <span className="text-green-600">¥{amount || 0}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'warning',
          paid: 'success',
          settled: 'success',
        };
        const textMap: Record<string, string> = {
          pending: '待结算',
          paid: '已支付',
          settled: '已结算',
        };
        return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>;
      },
    },
    {
      title: '结算时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
    },
  ];

  const certifiedCount = stats.certifiedCount || 0;
  const pendingRenewal = stats.pendingRenewal || 0;
  const totalProviders = providers.length;
  const certificationRate = totalProviders > 0 ? Math.round((certifiedCount / totalProviders) * 100) : 0;

  return (
    <Layout className="min-h-screen">
      <Sider width={240} theme="light" className="border-r">
        <div className="h-16 flex items-center justify-center border-b">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center mr-2">
            <ShopOutlined className="text-white" />
          </div>
          <span className="font-bold text-gray-800">运营后台</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={['/admin/providers']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="border-none"
        />
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Menu
            mode="inline"
            items={[{ key: 'logout', label: '退出登录', icon: <LogoutOutlined /> }]}
            onClick={() => navigate('/')}
            className="border-none"
          />
        </div>
      </Sider>

      <Layout>
        <Header className="bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">服务商资质库</h2>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              size="small"
            >
              <Option value="all">全部状态</Option>
              <Option value="approved">年审正常</Option>
              <Option value="pending">待审核</Option>
              <Option value="expired">已过期</Option>
            </Select>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加服务商
          </Button>
        </Header>

        <Content className="p-6 bg-gray-50">
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="服务商总数"
                  value={totalProviders}
                  prefix={<ShopOutlined className="text-orange-500" />}
                  valueStyle={{ color: '#FF7A45' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="已备案认证"
                  value={certifiedCount}
                  prefix={<SafetyCertificateOutlined className="text-green-500" />}
                  valueStyle={{ color: '#22C55E' }}
                />
                <div className="mt-2">
                  <Progress percent={certificationRate} size="small" strokeColor="#22C55E" />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="待年审提醒"
                  value={pendingRenewal}
                  prefix={<ClockCircleOutlined className="text-orange-500" />}
                  valueStyle={{ color: '#F59E0B' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="年审通过率"
                  value={95}
                  suffix="%"
                  prefix={<RiseOutlined className="text-blue-500" />}
                  valueStyle={{ color: '#3B82F6' }}
                />
              </Card>
            </Col>
          </Row>

          {pendingRenewal > 0 && (
            <Alert
              message={`有 ${pendingRenewal} 家服务商需要年审提醒`}
              description="请及时处理过期和即将过期的服务商资质，保障服务合规性"
              type="warning"
              showIcon
              className="mb-6"
            />
          )}

          <Card>
            <Table
              columns={columns}
              dataSource={providers}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Content>
      </Layout>

      <Modal
        title={editingProvider ? '编辑服务商' : '添加服务商'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="name" label="服务商名称" rules={[{ required: true }]}>
            <Input placeholder="请输入服务商名称" />
          </Form.Item>

          <Form.Item name="serviceType" label="服务类型" rules={[{ required: true }]}>
            <Select placeholder="请选择服务类型">
              <Option value="家政服务">家政服务</Option>
              <Option value="家电维修">家电维修</Option>
              <Option value="拼车出行">拼车出行</Option>
              <Option value="餐饮外卖">餐饮外卖</Option>
              <Option value="二手交易">二手交易</Option>
              <Option value="求职招聘">求职招聘</Option>
              <Option value="快递服务">快递服务</Option>
              <Option value="便民市场">便民市场</Option>
            </Select>
          </Form.Item>

          <Form.Item name="gridCode" label="服务网格" rules={[{ required: true }]}>
            <Input placeholder="请输入社区网格编码" prefix={<EnvironmentOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactName" label="联系人" rules={[{ required: true }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <FileProtectOutlined className="text-orange-500" />
              备案资质信息
            </h4>
            <Form.Item name="certificationNo" label="备案编号">
              <Input placeholder="请输入街道备案编号" />
            </Form.Item>
            <Form.Item name="streetCertified" label="街道备案认证" valuePropName="checked">
              <Switch checkedChildren="已认证" unCheckedChildren="未认证" />
            </Form.Item>
          </div>

          <Form.Item name="annualReviewDate" label="年审日期">
            <DatePicker style={{ width: '100%' }} placeholder="请选择年审有效期截止日期" />
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-4">
              <Button onClick={() => setModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                {editingProvider ? '保存' : '添加'}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${selectedProvider?.name} - 资质详情`}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={900}
      >
        {selectedProvider && (
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <>
                    <Descriptions column={2} bordered size="small" className="mb-6">
                      <Descriptions.Item label="服务商名称">
                        {selectedProvider.name}
                      </Descriptions.Item>
                      <Descriptions.Item label="服务类型">
                        <Tag color="orange">{selectedProvider.service_type}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="服务网格">
                        <Tag color="blue" icon={<EnvironmentOutlined />}>
                          {selectedProvider.grid_code}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="联系人">
                        {selectedProvider.contact_name}
                      </Descriptions.Item>
                      <Descriptions.Item label="联系电话">
                        {selectedProvider.phone}
                      </Descriptions.Item>
                      <Descriptions.Item label="备案状态">
                        {(() => {
                          const s = getRegistrationStatus(selectedProvider);
                          return <Tag color={s.color} icon={s.icon}>{s.text}</Tag>;
                        })()}
                      </Descriptions.Item>
                      <Descriptions.Item label="备案编号">
                        {selectedProvider.certification_no || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="年审状态">
                        {(() => {
                          const s = getReviewStatus(selectedProvider.review_status);
                          return <Tag color={s.color}>{s.text}</Tag>;
                        })()}
                      </Descriptions.Item>
                      <Descriptions.Item label="年审有效期" span={2}>
                        {selectedProvider.annual_review_date || '未设置'}
                        {(() => {
                          const days = getDaysUntilExpiry(selectedProvider.annual_review_date);
                          if (days === null) return null;
                          return (
                            <span className="ml-2 text-sm text-gray-500">
                              （{days > 0
                                ? `剩余 ${days} 天`
                                : `已过期 ${Math.abs(days)} 天`}）
                            </span>
                          );
                        })()}
                      </Descriptions.Item>
                    </Descriptions>

                    {selectedProvider.review_note && (
                      <Alert
                        message="最新审核意见"
                        description={selectedProvider.review_note}
                        type="info"
                        showIcon
                      />
                    )}
                  </>
                ),
              },
              {
                key: 'reviews',
                label: `复查记录 (${reviews.length})`,
                children: (
                  <div>
                    {reviews.length === 0 ? (
                      <Empty description="暂无复查记录" />
                    ) : (
                      <List
                        dataSource={reviews}
                        renderItem={(review) => (
                          <List.Item key={review.id}>
                            <List.Item.Meta
                              avatar={
                                <Avatar icon={<HistoryOutlined />} className="bg-blue-500" />
                              }
                              title={
                                <div className="flex items-center gap-2">
                                  <span>{getReviewTypeText(review.review_type)}</span>
                                  <Tag color={review.status === 'approved' ? 'success' : 'warning'} style={{ fontSize: '12px' }}>
                                    {review.status === 'approved' ? '已通过' : '待处理'}
                                  </Tag>
                                  {review.rating && <Rate disabled value={review.rating} />}
                                </div>
                              }
                              description={
                                <div>
                                  <p className="text-gray-700">{review.comment}</p>
                                  <div className="text-xs text-gray-400 mt-1">
                                    <span>操作人：{review.reviewer_name || '系统'}</span>
                                    <span className="ml-4">{review.created_at}</span>
                                  </div>
                                </div>
                              }
                            />
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: 'settlements',
                label: `团长结算 (${settlements.length})`,
                children: (
                  <div>
                    {settlements.length === 0 ? (
                      <Empty description="暂无结算记录" />
                    ) : (
                      <Table
                        columns={settlementColumns}
                        dataSource={settlements}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </Modal>

      <Modal
        title="添加复查记录"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={reviewForm.submit}
        okText="提交复查"
      >
        <Form
          form={reviewForm}
          layout="vertical"
          onFinish={submitReview}
        >
          <Form.Item name="reviewType" label="复查类型" rules={[{ required: true }]}>
            <Select placeholder="请选择复查类型">
              <Option value="annual">年审复查</Option>
              <Option value="spot">抽查检查</Option>
              <Option value="complaint">投诉处理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="rating" label="服务评分">
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="复查意见" rules={[{ required: true }]}>
            <TextArea
              rows={4}
              placeholder="请填写复查意见，如资质审核情况、服务质量评价等"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AdminProviders;
