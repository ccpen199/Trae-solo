import { ProTable, ModalForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormRate } from '@ant-design/pro-components';
import { Tag, Space, Button, App, Drawer, Card, Descriptions, Timeline, Row, Col, Statistic, Rate, Avatar, Typography, List } from 'antd';
import { EyeOutlined, CheckCircleOutlined, PlayCircleOutlined, StarOutlined, RollbackOutlined, ShopOutlined, UserOutlined, HomeOutlined, PhoneOutlined, DollarOutlined, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const { Text } = Typography;

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING_PAY: { text: '待支付', color: 'warning' },
  PAID: { text: '待接单', color: 'processing' },
  ACCEPTED: { text: '已接单', color: 'processing' },
  SERVICING: { text: '服务中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  RATED: { text: '已评价', color: 'success' },
  REFUNDING: { text: '退款中', color: 'warning' },
  REFUNDED: { text: '已退款', color: 'default' },
  CANCELLED: { text: '已取消', color: 'default' },
};

const categoryColorMap: Record<string, string> = {
  '家政服务': 'magenta',
  '快递代收': 'blue',
  '社区团购': 'cyan',
  '商城购物': 'purple',
  '家电维修': 'orange',
};

const providerIds: Record<string, string> = {
  '好阿姨家政服务': 'sp001',
  '顺丰快递驿站': 'sp002',
  '邻里团生鲜': 'sp003',
  '优选生活商城': 'sp004',
  '速修家电维修': 'sp005',
  '优家家政服务': 'sp006',
};

const mockData = Array.from({ length: 25 }, (_, i) => {
  const items = [
    { name: '日常保洁3小时', cat: '家政服务', provider: '好阿姨家政服务' },
    { name: '顺丰快递代收代寄', cat: '快递代收', provider: '顺丰快递驿站' },
    { name: '新鲜蔬菜套餐B', cat: '社区团购', provider: '邻里团生鲜' },
    { name: '空调深度清洗', cat: '家政服务', provider: '优家家政服务' },
    { name: '海尔电热水器维修', cat: '家电维修', provider: '速修家电维修' },
    { name: '进口零食大礼包', cat: '商城购物', provider: '优选生活商城' },
  ];
  const item = items[i % 6];
  const statuses = ['PAID', 'ACCEPTED', 'SERVICING', 'COMPLETED', 'RATED', 'PAID', 'COMPLETED', 'REFUNDING', 'CANCELLED', 'COMPLETED'];
  const status = statuses[i % 10];
  const amount = [198.00, 15.00, 89.90, 268.00, 180.00, 156.50][i % 6];
  return {
    id: `ORD-${String(i + 1).padStart(6, '0')}`,
    orderNo: `SO20260619${String(i + 1).padStart(6, '0')}`,
    serviceItemName: item.name,
    category: item.cat,
    providerName: item.provider,
    providerId: providerIds[item.provider],
    customerName: ['陈先生', '王女士', '李先生', '赵女士', '孙先生', '周女士'][i % 6],
    customerId: `u-${i % 5 + 101}`,
    customerPhone: `138****${String(1000 + i).slice(-4)}`,
    customerHouseInfo: [`${Math.floor(i / 3) + 1}栋${Math.floor(i / 5) + 1}单元${String(101 + i % 10 * 2).slice(0, 2)}0${(i % 9) + 1}`, '1栋1单元1503', '2栋3单元0802'][i % 3],
    communityId: i < 15 ? 'c1' : 'c2',
    status,
    amount,
    platformFee: (amount * 0.12).toFixed(2),
    providerIncome: (amount * 0.88).toFixed(2),
    payTime: dayjs().subtract(5 - (i % 5), 'day').hour(9 + (i % 8)).minute(10 + (i % 30)).format('YYYY-MM-DD HH:mm:ss'),
    acceptTime: status !== 'PAID' ? dayjs().subtract(5 - (i % 5), 'day').hour(10 + (i % 8)).minute(10 + (i % 30)).format('YYYY-MM-DD HH:mm:ss') : null,
    completeTime: ['COMPLETED', 'RATED', 'REFUNDED'].includes(status) ? dayjs().subtract(4 - (i % 5), 'day').hour(14 + (i % 5)).minute(10 + (i % 30)).format('YYYY-MM-DD HH:mm:ss') : null,
    rating: status === 'RATED' ? [5, 4, 5, 3, 4][i % 5] : null,
    refundReason: status === 'REFUNDING' ? '师傅临时有事无法上门，协商退款' : status === 'REFUNDED' ? '用户主动取消' : null,
  };
});

const timeSlots = Array.from({ length: 12 }, (_, i) => ({
  label: `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'} - ${9 + Math.floor((i + 1) / 2)}:${(i + 1) % 2 === 0 ? '00' : '30'}`,
  value: `slot-${i + 1}`,
}));

export default function ServiceOrder() {
  const { message, modal } = App.useApp();
  const userStore = useUserStore();
  const { user } = userStore;
  const role = user?.role || 'SUPER_ADMIN';
  const roleName = USER_ROLES[role]?.name || '未知角色';

  const [viewItem, setViewItem] = useState<any>(null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [acceptItem, setAcceptItem] = useState<any>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingItem, setRatingItem] = useState<any>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundItem, setRefundItem] = useState<any>(null);

  const filteredData = useMemo(() => {
    if (!user) return [];
    return mockData.filter((item) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return true;
        case 'PROPERTY_ADMIN':
          return user.communityIds?.includes(item.communityId);
        case 'SERVICE_PROVIDER':
          return item.providerId === user.providerId;
        case 'RESIDENT':
          return item.customerName === '陈先生';
        default:
          return false;
      }
    });
  }, [user, role]);

  const stats = useMemo(() => {
    const currentMonth = filteredData.filter((d) => dayjs(d.payTime).isAfter(dayjs().startOf('month')));
    const gmv = currentMonth.reduce((s, d) => s + (['COMPLETED', 'RATED'].includes(d.status) ? Number(d.amount) : 0), 0);
    return {
      pendingAccept: filteredData.filter((d) => d.status === 'PAID').length,
      servicing: filteredData.filter((d) => ['ACCEPTED', 'SERVICING'].includes(d.status)).length,
      pendingRate: filteredData.filter((d) => d.status === 'COMPLETED').length,
      gmv: gmv.toFixed(2),
    };
  }, [filteredData]);

  const hasPermission = ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'SERVICE_PROVIDER', 'RESIDENT'].includes(role);

  const handleView = (record: any) => {
    setViewItem(record);
    message.success('已留痕');
  };

  const handleAccept = (record: any) => {
    setAcceptItem(record);
    setAcceptOpen(true);
  };

  const handleAcceptSubmit = async (values: any) => {
    message.success('已接单，预约时段已确认 · 已留痕');
    return true;
  };

  const handleStartService = (record: any) => {
    modal.confirm({
      title: '确认开始服务',
      content: `确定开始服务订单「${record.serviceItemName}」吗？请确保已到达服务地点。`,
      onOk: () => message.success('已标记服务中 · 已留痕'),
    });
  };

  const handleCompleteService = (record: any) => {
    modal.confirm({
      title: '确认服务完成',
      content: `确定订单「${record.serviceItemName}」已服务完成吗？客户将收到评价提醒。`,
      onOk: () => message.success('已标记完成 · 已留痕'),
    });
  };

  const handleRate = (record: any) => {
    setRatingItem(record);
    setRatingOpen(true);
  };

  const handleRateSubmit = async (values: any) => {
    message.success('评价已提交 · 已留痕');
    return true;
  };

  const handleRefund = (record: any) => {
    setRefundItem(record);
    setRefundOpen(true);
  };

  const handleRefundSubmit = async (values: any) => {
    message.success('退款申请已提交 · 已留痕');
    return true;
  };

  if (!hasPermission) {
    return (
      <div>
        <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
          登录身份：{roleName} · 已按分级权限过滤可见范围
        </Tag>
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#9CA3AF' }}>🔒</div>
          <div style={{ fontSize: 16, color: '#64748B' }}>您当前角色无服务订单查看权限</div>
        </Card>
      </div>
    );
  }

  const getOrderTimeline = (item: any) => {
    const t: any[] = [{ color: 'blue', children: (<div><Text strong>下单</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>客户 {item.customerName}</div></div>) }];
    if (item.payTime) t.push({ color: 'cyan', children: (<div><Text strong>已支付</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>¥{item.amount} · {item.payTime}</div></div>) });
    if (item.acceptTime) t.push({ color: 'green', children: (<div><Text strong>已接单 / 派单</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.providerName} · {item.acceptTime}</div></div>) });
    if (item.completeTime) t.push({ color: 'success', children: (<div><Text strong>上门服务 / 完成</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.completeTime}</div></div>) });
    if (item.rating) t.push({ color: 'gold', children: (<div><Text strong>客户评价</Text><Rate disabled value={item.rating} style={{ fontSize: 12, color: '#F59E0B' }} /></div>) });
    if (item.status === 'REFUNDING' || item.status === 'REFUNDED') t.push({ color: item.status === 'REFUNDING' ? 'warning' : 'gray', children: (<div><Text strong>{item.status === 'REFUNDING' ? '退款处理中' : '已退款'}</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.refundReason}</div></div>) });
    return t;
  };

  const columns: any[] = [
    {
      title: '订单号/商品',
      dataIndex: 'orderNo',
      width: 240,
      render: (_: any, record: any) => (
        <div>
          <Text code style={{ fontSize: 11, color: '#7C3AED' }}>{record.orderNo}</Text>
          <div style={{ marginTop: 4, fontWeight: 500, color: '#1F2937', fontSize: 13 }}>
            <ShopOutlined style={{ color: '#7C3AED', marginRight: 4 }} />{record.serviceItemName}
          </div>
          <Tag color={categoryColorMap[record.category] || 'default'} style={{ fontSize: 11, marginTop: 4 }}>{record.category}</Tag>
        </div>
      ),
    },
    {
      title: '服务商',
      dataIndex: 'providerName',
      width: 140,
      render: (v: string, record: any) => (
        <Space>
          <Avatar size={24} style={{ backgroundColor: '#EC4899', fontSize: 12 }} icon={<ShopOutlined />} />
          <div>
            <div style={{ fontSize: 13 }}>{v}</div>
            <Text type="secondary" style={{ fontSize: 11 }}>ID: {record.providerId}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '客户/地址',
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <Space size={6}>
            <Avatar size={20} style={{ backgroundColor: USER_ROLES.RESIDENT.color, fontSize: 10 }}>
              <UserOutlined />
            </Avatar>
            <Text strong style={{ fontSize: 13 }}>{record.customerName}</Text>
          </Space>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            <PhoneOutlined style={{ color: '#9CA3AF' }} /> <Text type="secondary">{record.customerPhone}</Text>
          </div>
          <div style={{ marginTop: 2, fontSize: 12 }}>
            <HomeOutlined style={{ color: '#9CA3AF' }} /> <Text type="secondary">{record.customerHouseInfo}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={statusMap[v].color} style={{ fontSize: 13, padding: '2px 12px' }}>{statusMap[v].text}</Tag>
      ),
    },
    {
      title: '金额/分佣',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <div style={{ color: '#EF4444', fontWeight: 700, fontSize: 15 }}>¥{Number(record.amount).toFixed(2)}</div>
          <div style={{ marginTop: 4, fontSize: 11 }}>
            <Text type="secondary">平台佣金</Text> <Text style={{ color: '#F59E0B' }}>¥{record.platformFee}</Text>
          </div>
          <div style={{ fontSize: 11 }}>
            <Text type="secondary">服务商收入</Text> <Text style={{ color: '#10B981' }}>¥{record.providerIncome}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '时间',
      width: 160,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 11 }}>
          {record.payTime && (
            <div><ClockCircleOutlined style={{ color: '#94A3B8' }} /> 支付: {record.payTime.split(' ')[0]}</div>
          )}
          {record.acceptTime && (
            <div style={{ marginTop: 2 }}><Text type="secondary">接单: {record.acceptTime.split(' ')[0]}</Text></div>
          )}
          {record.completeTime && (
            <div style={{ marginTop: 2 }}><Text type="secondary">完成: {record.completeTime.split(' ')[0]}</Text></div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size={2} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {role === 'SERVICE_PROVIDER' && record.status === 'PAID' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleAccept(record)}>接单</Button>
          )}
          {role === 'SERVICE_PROVIDER' && (record.status === 'ACCEPTED') && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStartService(record)}>开始服务</Button>
          )}
          {role === 'SERVICE_PROVIDER' && record.status === 'SERVICING' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleCompleteService(record)}>完成服务</Button>
          )}
          {role === 'RESIDENT' && record.status === 'COMPLETED' && (
            <Button type="primary" size="small" icon={<StarOutlined />} onClick={() => handleRate(record)}>评价</Button>
          )}
          {['PAID', 'ACCEPTED', 'SERVICING'].includes(record.status) && (
            <Button type="link" size="small" danger icon={<RollbackOutlined />} onClick={() => handleRefund(record)}>退款</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
        登录身份：{roleName} · 已按分级权限过滤可见范围
      </Tag>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title={<Space><ClockCircleOutlined style={{ color: '#F59E0B' }} />待接单</Space>} value={stats.pendingAccept} valueStyle={{ color: '#F59E0B', fontSize: 26 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title={<Space><PlayCircleOutlined style={{ color: '#2563EB' }} />服务中</Space>} value={stats.servicing} valueStyle={{ color: '#2563EB', fontSize: 26 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title={<Space><StarOutlined style={{ color: '#7C3AED' }} />待评价</Space>} value={stats.pendingRate} valueStyle={{ color: '#7C3AED', fontSize: 26 }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic title={<Space><DollarOutlined style={{ color: '#10B981' }} />本月GMV</Space>} value={stats.gmv} prefix="¥" valueStyle={{ color: '#10B981', fontSize: 24 }} />
          </Card>
        </Col>
      </Row>

      <ProTable
        headerTitle={<Space><FileTextOutlined style={{ color: '#7C3AED' }} />服务订单 <Tag color="default" style={{ fontSize: 12 }}>共 {filteredData.length} 单</Tag></Space>}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        search={{ labelWidth: 90, collapseRender: false }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条订单` }}
        scroll={{ x: 1600 }}
      />

      <Drawer
        title={<Space><FileTextOutlined style={{ color: '#7C3AED' }} />订单详情 <Tag color={statusMap[viewItem?.status]?.color}>{statusMap[viewItem?.status]?.text}</Tag></Space>}
        width={640}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" variant="borderless" style={{ borderRadius: 8, background: 'linear-gradient(135deg, #EFF6FF 0%, #FAE8FF 100%)' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>订单号</Text>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{viewItem.orderNo}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>订单金额</Text>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>¥{Number(viewItem.amount).toFixed(2)}</div>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="商品信息" variant="borderless" style={{ borderRadius: 8 }}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="服务商品">{viewItem.serviceItemName} <Tag color={categoryColorMap[viewItem.category]}>{viewItem.category}</Tag></Descriptions.Item>
                <Descriptions.Item label="服务商">
                  <Space><Avatar size={20} style={{ backgroundColor: '#EC4899', fontSize: 10 }} icon={<ShopOutlined />} />{viewItem.providerName}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="客户信息">
                  <div>{viewItem.customerName} · {viewItem.customerPhone}</div>
                  <div style={{ marginTop: 2 }}><HomeOutlined /> {viewItem.customerHouseInfo}</div>
                </Descriptions.Item>
                <Descriptions.Item label="金额明细">
                  <div>商品金额: <b>¥{Number(viewItem.amount).toFixed(2)}</b></div>
                  <div style={{ marginTop: 2 }}>平台佣金(12%): <span style={{ color: '#F59E0B' }}>¥{viewItem.platformFee}</span></div>
                  <div style={{ marginTop: 2 }}>服务商收入: <span style={{ color: '#10B981' }}>¥{viewItem.providerIncome}</span></div>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="状态流程时间轴" variant="borderless" style={{ borderRadius: 8 }}>
              <Timeline items={getOrderTimeline(viewItem)} />
            </Card>

            {viewItem.refundReason && (
              <Card size="small" title={<Space style={{ color: '#F59E0B' }}><RollbackOutlined />退款说明</Space>} variant="borderless" style={{ borderRadius: 8, background: '#FFFBEB' }}>
                <Text style={{ fontSize: 13 }}>{viewItem.refundReason}</Text>
              </Card>
            )}
            {viewItem.rating && (
              <Card size="small" title={<Space style={{ color: '#F59E0B' }}><StarOutlined />客户评价</Space>} variant="borderless" style={{ borderRadius: 8, background: '#FEFCE8' }}>
                <Space>
                  <Rate disabled value={viewItem.rating} style={{ fontSize: 18 }} />
                  <Text strong>{viewItem.rating} 星</Text>
                </Space>
                <div style={{ marginTop: 8, fontSize: 13, color: '#475569' }}>服务专业准时，师傅态度很好，处理得非常干净！强烈推荐~</div>
              </Card>
            )}
          </Space>
        )}
      </Drawer>

      <ModalForm
        title={`接单确认 - ${acceptItem?.serviceItemName}`}
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        onFinish={handleAcceptSubmit}
        width={520}
        modalProps={{ destroyOnClose: true }}
      >
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="客户">{acceptItem?.customerName} · {acceptItem?.customerPhone}</Descriptions.Item>
          <Descriptions.Item label="服务地址">{acceptItem?.customerHouseInfo}</Descriptions.Item>
          <Descriptions.Item label="订单金额">¥{acceptItem?.amount} (您的收入: ¥{acceptItem?.providerIncome})</Descriptions.Item>
        </Descriptions>
        <ProFormSelect
          name="timeSlot"
          label="选择预约上门时段"
          rules={[{ required: true }]}
          options={timeSlots}
          placeholder="请选择您可以上门服务的时间段"
        />
        <ProFormText
          name="remark"
          label="接单备注 (可选)"
          placeholder="例如：将携带专业清洁设备上门"
        />
      </ModalForm>

      <ModalForm
        title={`订单评价 - ${ratingItem?.serviceItemName}`}
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        onFinish={handleRateSubmit}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormRate
          name="rating"
          label="综合评分"
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="tags"
          label="服务标签"
          mode="multiple"
          options={[
            { label: '服务准时', value: 'on_time' },
            { label: '态度专业', value: 'professional' },
            { label: '效果满意', value: 'satisfied' },
            { label: '性价比高', value: 'value' },
            { label: '工具齐全', value: 'well_equipped' },
          ]}
        />
        <ProFormTextArea
          name="comment"
          label="评价内容"
          placeholder="分享您的服务体验..."
          fieldProps={{ rows: 4 }}
        />
      </ModalForm>

      <ModalForm
        title={`申请退款 - ${refundItem?.orderNo}`}
        open={refundOpen}
        onOpenChange={setRefundOpen}
        onFinish={handleRefundSubmit}
        width={480}
        modalProps={{ destroyOnClose: true, okButtonProps: { danger: true } }}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#FEF2F2', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>退款金额</Text>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#EF4444' }}>¥{Number(refundItem?.amount || 0).toFixed(2)}</div>
        </div>
        <ProFormSelect
          name="reason"
          label="退款原因"
          rules={[{ required: true }]}
          options={[
            { label: '临时有事不需要服务', value: 'user_cancel' },
            { label: '商家无法按时提供服务', value: 'provider_issue' },
            { label: '服务效果不满意', value: 'quality_issue' },
            { label: '重复下单', value: 'duplicate' },
            { label: '其他原因', value: 'other' },
          ]}
        />
        <ProFormTextArea
          name="detail"
          label="详细说明"
          placeholder="请描述退款原因，便于我们更好地改进服务..."
          rules={[{ required: true }]}
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </div>
  );
}
