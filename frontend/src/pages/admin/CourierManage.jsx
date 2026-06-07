import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input,
  Select, message, Descriptions, Badge, Tabs, Avatar,
  Row, Col, Progress, Alert, Timeline, Divider, Statistic,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, EyeOutlined,
  EnvironmentOutlined, SafetyOutlined, UserOutlined,
  CreditCardOutlined, HistoryOutlined, BarChartOutlined,
  IdcardOutlined, ApartmentOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminAPI, courierAPI } from '../../api';

const { TextArea } = Input;
const { TabPane } = Tabs;

export default function CourierManage() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, total: 0, pageSize: 10 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentCourier, setCurrentCourier] = useState(null);
  const [courierDetail, setCourierDetail] = useState(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectCourier, setRejectCourier] = useState(null);
  const [rejectForm] = Form.useForm();

  const fetchCouriers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.getCouriers({ page, pageSize: pagination.pageSize });
      const data = res.data || res;
      const rows = data.couriers || data.list || data.items || [];
      const normalizedRows = rows.map((item) => ({
        ...item,
        online_status: item.online_status || (item.is_online ? 'online' : 'offline'),
        rating: item.rating ?? item.avg_rating,
        total_orders: item.total_orders ?? item.completed_orders ?? 0,
        fulfillment_rate: item.fulfillment_rate > 1 ? item.fulfillment_rate : Math.round((item.fulfillment_rate || 0) * 100),
      }));
      setCouriers(normalizedRows);
      setPagination((prev) => ({ ...prev, current: page, total: data.total || normalizedRows.length }));
    } catch {
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
  }, []);

  const fetchCourierDetail = async (id) => {
    setDetailLoading(true);
    try {
      const res = await adminAPI.getCourierDetail(id);
      setCourierDetail(res.data);
    } catch (e) {
      message.error('获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await courierAPI.approve(id);
      message.success('已通过审核');
      fetchCouriers();
    } catch {}
  };

  const handleReject = async (values) => {
    try {
      await courierAPI.reject(rejectCourier.user_id, values);
      message.success('已拒绝');
      setRejectVisible(false);
      rejectForm.resetFields();
      fetchCouriers();
    } catch {}
  };

  const handleViewDetail = (record) => {
    setCurrentCourier(record);
    setDetailVisible(true);
    setCourierDetail(null);
    fetchCourierDetail(record.user_id || record.id);
  };

  const statusMap = {
    pending: { text: '待审核', status: 'processing' },
    approved: { text: '已通过', status: 'success' },
    rejected: { text: '已拒绝', status: 'error' },
    suspended: { text: '已停用', status: 'warning' },
  };

  const onlineMap = {
    online: { text: '在线', color: 'green' },
    offline: { text: '离线', color: 'default' },
    busy: { text: '忙碌', color: 'orange' },
  };

  const orderStatusMap = {
    pending: { color: 'default', text: '待分配' },
    dispatched: { color: 'processing', text: '已派单' },
    accepted: { color: 'blue', text: '已接单' },
    arrived: { color: 'purple', text: '已到达' },
    in_progress: { color: 'orange', text: '进行中' },
    completed: { color: 'success', text: '已完成' },
    cancelled: { color: 'error', text: '已取消' },
    timeout: { color: 'red', text: '已超时' },
  };

  const getCreditChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const renderRealnameSection = () => {
    const profile = courierDetail?.profile || {};
    const realnameStatus = {
      pending: { text: '待认证', color: 'orange' },
      approved: { text: '已认证', color: 'green' },
      rejected: { text: '认证失败', color: 'red' },
      suspended: { text: '已停用', color: 'default' },
    };

    return (
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="真实姓名">
          <Space>
            <span>{profile.real_name || '-'}</span>
            {profile.real_name && <SafetyOutlined style={{ color: '#52c41a' }} />}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="身份证号">
          {profile.id_number ? `${profile.id_number.slice(0, 6)}********${profile.id_number.slice(-4)}` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="认证状态" span={2}>
          <Tag color={realnameStatus[profile.status]?.color}>
            {realnameStatus[profile.status]?.text}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="认证材料" span={2}>
          {profile.id_card_photo ? (
            <div className="border rounded p-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">身份证照片:</p>
              <img
                src={profile.id_card_photo}
                alt="身份证"
                className="w-full max-w-xs rounded border"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div style={{ display: 'none' }} className="text-xs text-gray-400">
                身份证照片已上传
              </div>
            </div>
          ) : (
            <span className="text-gray-400">未上传</span>
          )}
        </Descriptions.Item>
      </Descriptions>
    );
  };

  const renderServiceSection = () => {
    const profile = courierDetail?.profile || {};
    const stats = courierDetail?.stats || {};
    const serviceAreas = courierDetail?.service_areas || [];

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" className="h-full">
              <Statistic
                title="完成订单"
                value={stats.completed_orders || 0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="h-full">
              <Statistic
                title="履约率"
                value={stats.fulfillment_rate || 0}
                suffix="%"
                valueStyle={{ color: stats.fulfillment_rate >= 95 ? '#3f8600' : '#cf1322' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="h-full">
              <Statistic
                title="平均评分"
                value={stats.avg_rating || 0}
                precision={1}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="h-full">
              <Statistic
                title="超时订单"
                value={stats.timeout_orders || 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Divider orientation="left" plain style={{ margin: '8px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>服务能力</span>
        </Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>综合评分</span>
                <span className="font-medium">{stats.avg_rating ? `${stats.avg_rating.toFixed(1)} / 5.0` : '-'}</span>
              </div>
              <Progress percent={Math.round((stats.avg_rating || 0) * 20)} status="active" strokeColor="#faad14" size="small" />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>履约效率</span>
                <span className="font-medium">{stats.fulfillment_rate || 0}%</span>
              </div>
              <Progress percent={stats.fulfillment_rate || 0} size="small" />
            </div>
          </Col>
        </Row>

        <Divider orientation="left" plain style={{ margin: '8px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>服务区域</span>
        </Divider>
        {serviceAreas.length > 0 ? (
          <Space wrap>
            {serviceAreas.map((area, idx) => (
              <Tag key={idx} color="blue" icon={<ApartmentOutlined />}>
                {area.city} {area.district}
              </Tag>
            ))}
          </Space>
        ) : (
          <Alert
            message="未设置服务区域"
            type="info"
            showIcon
            size="small"
          />
        )}

        <Divider orientation="left" plain style={{ margin: '8px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>当前位置</span>
        </Divider>
        {profile.latitude && profile.longitude ? (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="纬度">{profile.latitude.toFixed(6)}</Descriptions.Item>
            <Descriptions.Item label="经度">{profile.longitude.toFixed(6)}</Descriptions.Item>
            <Descriptions.Item label="在线状态" span={2}>
              <Tag color={profile.is_online ? 'green' : 'default'}>
                <EnvironmentOutlined /> {profile.is_online ? '在线' : '离线'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="位置更新时间" span={2}>
              {profile.updated_at ? dayjs(profile.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Alert
            message="暂无位置信息"
            type="warning"
            showIcon
            size="small"
          />
        )}
      </Space>
    );
  };

  const renderBlacklistSection = () => {
    const blacklist = courierDetail?.blacklist;
    const whitelist = courierDetail?.whitelist;

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {blacklist && (
          <Alert
            type="error"
            showIcon
            message="已加入黑名单"
            description={
              <div>
                <p><strong>原因：</strong>{blacklist.reason}</p>
                <p><strong>添加人：</strong>{blacklist.created_by_name || '系统'}</p>
                <p><strong>添加时间：</strong>{dayjs(blacklist.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
              </div>
            }
          />
        )}

        {whitelist && (
          <Alert
            type="success"
            showIcon
            message="已加入白名单"
            description={
              <div>
                <p><strong>原因：</strong>{whitelist.reason}</p>
                <p><strong>添加人：</strong>{whitelist.created_by_name || '系统'}</p>
                <p><strong>添加时间：</strong>{dayjs(whitelist.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
              </div>
            }
          />
        )}

        {!blacklist && !whitelist && (
          <Alert
            type="info"
            showIcon
            message="未加入黑白名单"
            description="该跑腿员当前不在黑名单或白名单中"
          />
        )}
      </Space>
    );
  };

  const renderCreditSection = () => {
    const profile = courierDetail?.profile || {};
    const creditHistory = courierDetail?.credit_history || [];

    return (
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Row gutter={16}>
          <Col xs={12}>
            <Card size="small">
              <Statistic
                title="当前信用分"
                value={profile.credit_score || 100}
                valueStyle={{ color: profile.credit_score >= 80 ? '#3f8600' : profile.credit_score >= 60 ? '#faad14' : '#cf1322' }}
                prefix={<CreditCardOutlined />}
                suffix="/ 100"
              />
            </Card>
          </Col>
        </Row>

        <Divider orientation="left" plain style={{ margin: '8px 0' }}>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>信用变更记录</span>
        </Divider>
        {creditHistory.length > 0 ? (
          <Timeline
            items={creditHistory.map((item, idx) => ({
              color: item.score_change > 0 ? 'green' : item.score_change < 0 ? 'red' : 'gray',
              children: (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="m-0 font-medium">{item.description}</p>
                    <p className="m-0 text-xs text-gray-500">
                      {item.operator && `操作人: ${item.operator}  ·  `}
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}
                    </p>
                  </div>
                  <span className={`font-bold ${getCreditChangeColor(item.score_change)}`}>
                    {item.score_change > 0 ? '+' : ''}{item.score_change}
                  </span>
                </div>
              ),
            }))}
          />
        ) : (
          <Alert
            message="暂无信用变更记录"
            type="info"
            showIcon
            size="small"
          />
        )}
      </Space>
    );
  };

  const renderRecentOrders = () => {
    const recentOrders = courierDetail?.recent_orders || [];

    const columns = [
      { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 140 },
      { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
      { title: '需求方', dataIndex: 'requester_name', key: 'requester_name', width: 100 },
      {
        title: '状态', dataIndex: 'status', key: 'status', width: 90,
        render: (v) => <Tag color={orderStatusMap[v]?.color}>{orderStatusMap[v]?.text}</Tag>,
      },
      {
        title: '金额', dataIndex: 'fee', key: 'fee', width: 80,
        render: (v) => `¥${v?.toFixed(2) || '0.00'}`,
      },
      {
        title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160,
        render: (v) => dayjs(v).format('MM-DD HH:mm'),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={recentOrders}
        rowKey="id"
        size="small"
        pagination={false}
        locale={{ emptyText: '暂无最近订单' }}
      />
    );
  };

  const columns = [
    {
      title: '姓名', dataIndex: 'name', key: 'name', width: 100,
    },
    {
      title: '手机号', dataIndex: 'phone', key: 'phone', width: 120,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v) => <Badge {...statusMap[v]} text={statusMap[v]?.text} />,
    },
    {
      title: '在线', dataIndex: 'online_status', key: 'online_status', width: 80,
      render: (v) => <Badge color={onlineMap[v]?.color} text={onlineMap[v]?.text} />,
    },
    {
      title: '完成订单', dataIndex: 'total_orders', key: 'total_orders', width: 90,
      sorter: (a, b) => (a.total_orders || 0) - (b.total_orders || 0),
    },
    {
      title: '评分', dataIndex: 'rating', key: 'rating', width: 80,
      render: (v) => v ? v.toFixed(1) : '-',
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: '履约率', dataIndex: 'fulfillment_rate', key: 'fulfillment_rate', width: 90,
      render: (v) => v ? `${v}%` : '-',
    },
    {
      title: '操作', key: 'actions', width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                style={{ color: '#52c41a' }}
                onClick={() => handleApprove(record.user_id || record.id)}
              >
                通过
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => { setRejectCourier(record); setRejectVisible(true); }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="跑腿员管理">
        <Table
          columns={columns}
          dataSource={couriers}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            total: pagination.total,
            pageSize: pagination.pageSize,
            onChange: fetchCouriers,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
          size="middle"
        />
      </Card>

      <Modal
        title={
          <Space>
            <Avatar icon={<UserOutlined />} />
            <span>跑腿员详情 - {currentCourier?.name || ''}</span>
            {currentCourier?.status && (
              <Badge {...statusMap[currentCourier.status]} text={statusMap[currentCourier.status]?.text} />
            )}
          </Space>
        }
        open={detailVisible}
        onCancel={() => { setDetailVisible(false); setCourierDetail(null); }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {detailLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : courierDetail ? (
          <Tabs defaultActiveKey="1" size="small">
            <TabPane
              tab={
                <span>
                  <UserOutlined /> 基础信息
                </span>
              }
              key="1"
            >
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                <Descriptions.Item label="姓名">{courierDetail.profile?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="手机号">{courierDetail.profile?.phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="用户状态">
                  <Tag color={courierDetail.profile?.user_status === 'active' ? 'green' : 'red'}>
                    {courierDetail.profile?.user_status === 'active' ? '正常' : '停用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="审核状态">
                  <Badge {...statusMap[courierDetail.profile?.status]} text={statusMap[courierDetail.profile?.status]?.text} />
                </Descriptions.Item>
                <Descriptions.Item label="在线状态">
                  <Badge color={courierDetail.profile?.is_online ? 'green' : 'default'} text={courierDetail.profile?.is_online ? '在线' : '离线'} />
                </Descriptions.Item>
                <Descriptions.Item label="信用分">
                  <span className={`font-bold ${courierDetail.profile?.credit_score >= 80 ? 'text-green-600' : courierDetail.profile?.credit_score >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                    {courierDetail.profile?.credit_score || '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间" span={2}>
                  {courierDetail.profile?.created_at ? dayjs(courierDetail.profile.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <IdcardOutlined /> 实名认证
                </span>
              }
              key="2"
            >
              {renderRealnameSection()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <ApartmentOutlined /> 服务能力
                </span>
              }
              key="3"
            >
              {renderServiceSection()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SafetyOutlined /> 黑白名单
                </span>
              }
              key="4"
            >
              {renderBlacklistSection()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CreditCardOutlined /> 信用记录
                </span>
              }
              key="5"
            >
              {renderCreditSection()}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <HistoryOutlined /> 最近订单
                </span>
              }
              key="6"
            >
              {renderRecentOrders()}
            </TabPane>
          </Tabs>
        ) : null}
      </Modal>

      <Modal
        title="拒绝审核"
        open={rejectVisible}
        onCancel={() => { setRejectVisible(false); rejectForm.resetFields(); }}
        onOk={() => rejectForm.submit()}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <TextArea rows={3} placeholder="请输入拒绝原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
