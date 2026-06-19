import { ProTable, ModalForm, ProFormSelect, ProFormDigit, ProFormDatePicker, ProFormTextArea, ProFormUploadButton } from '@ant-design/pro-components';
import { Tag, Space, Button, App, Drawer, Card, Row, Col, Statistic, Tabs, Descriptions, Timeline, Upload, Avatar, Typography, List, Switch } from 'antd';
import { EyeOutlined, CheckCircleOutlined, PlusOutlined, EditOutlined, DollarOutlined, BankOutlined, LockOutlined, ClockOutlined, HistoryOutlined, ShopOutlined, FileTextOutlined, PercentageOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const { Text } = Typography;

const settlementStatusMap: Record<string, { text: string; color: string }> = {
  UNSETTLED: { text: '待结算', color: 'warning' },
  SETTLING: { text: '结算中', color: 'processing' },
  PAID: { text: '已打款', color: 'success' },
};

const providers = ['好阿姨家政服务', '顺丰快递驿站', '邻里团生鲜', '优选生活商城', '速修家电维修', '优家家政服务'];
const providerIds: Record<string, string> = {
  '好阿姨家政服务': 'sp001',
  '顺丰快递驿站': 'sp002',
  '邻里团生鲜': 'sp003',
  '优选生活商城': 'sp004',
  '速修家电维修': 'sp005',
  '优家家政服务': 'sp006',
};

const mockSettlements = Array.from({ length: 20 }, (_, i) => {
  const provider = providers[i % 6];
  const statuses = ['UNSETTLED', 'SETTLING', 'PAID', 'PAID', 'PAID', 'UNSETTLED', 'PAID', 'SETTLING', 'PAID', 'UNSETTLED'];
  const status = statuses[i % 10];
  const orderCount = 10 + (i * 7) % 50;
  const totalAmount = orderCount * (80 + (i * 13) % 120);
  const commissionRate = [10, 12, 8, 15, 10, 12][i % 6];
  const platformCommission = Math.round(totalAmount * commissionRate / 100);
  return {
    id: `STL-${String(i + 1).padStart(5, '0')}`,
    settlementNo: `JS2026${String(25 - (i % 10)).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`,
    period: `2026-W${String(25 - (i % 8)).padStart(2, '0')}`,
    providerName: provider,
    providerId: providerIds[provider],
    orderCount,
    totalAmount: totalAmount.toFixed(2),
    platformCommission: platformCommission.toFixed(2),
    providerAmount: (totalAmount - platformCommission).toFixed(2),
    status,
    settleTime: status !== 'UNSETTLED' ? dayjs().subtract(i * 2, 'day').format('YYYY-MM-DD HH:mm:ss') : null,
    operator: status !== 'UNSETTLED' ? ['王财务', '李主管', '张经理'][i % 3] : null,
    remark: i % 4 === 0 ? '按期结算，无异常' : '',
  };
});

const mockSettlementOrders: Record<string, any[]> = {
  'STL-00001': Array.from({ length: 5 }, (_, j) => {
    const amount = [198, 15, 89.9, 268, 180][j % 5];
    const rate = [10, 12, 8, 15, 10][j % 5];
    return {
      id: `ORD-${1000 + j}`,
      orderNo: `SO2026061${j}${String(5000 + j).padStart(4, '0')}`,
      serviceItemName: ['日常保洁3小时', '顺丰快递代收', '蔬菜套餐B', '空调清洗', '热水器维修'][j % 5],
      customerName: ['陈先生', '王女士', '李先生', '赵女士', '孙先生'][j % 5],
      amount: amount.toFixed(2),
      commissionRate: rate,
      platformCommission: (amount * rate / 100).toFixed(2),
      providerIncome: (amount * (100 - rate) / 100).toFixed(2),
      completeTime: dayjs().subtract(j + 1, 'day').format('YYYY-MM-DD HH:mm'),
    };
  }),
};

const mockCommissionRules = [
  { id: 1, category: '家政服务', baseRate: 12, tierThreshold: 10000, tierRate: 10, effectiveDate: '2026-01-01', status: 'active' },
  { id: 2, category: '快递代收', baseRate: 15, tierThreshold: 50000, tierRate: 12, effectiveDate: '2026-01-01', status: 'active' },
  { id: 3, category: '社区团购', baseRate: 8, tierThreshold: 50000, tierRate: 6, effectiveDate: '2026-03-01', status: 'active' },
  { id: 4, category: '商城购物', baseRate: 10, tierThreshold: 100000, tierRate: 8, effectiveDate: '2026-02-15', status: 'active' },
  { id: 5, category: '家电维修', baseRate: 12, tierThreshold: 30000, tierRate: 10, effectiveDate: '2026-04-01', status: 'inactive' },
];

const categoryList = [
  { label: '家政服务', value: '家政服务' },
  { label: '快递代收', value: '快递代收' },
  { label: '社区团购', value: '社区团购' },
  { label: '商城购物', value: '商城购物' },
  { label: '家电维修', value: '家电维修' },
];

export default function Commission() {
  const { message, modal } = App.useApp();
  const userStore = useUserStore();
  const { user } = userStore;
  const role = user?.role || 'SUPER_ADMIN';
  const roleName = USER_ROLES[role]?.name || '未知角色';

  const [activeTab, setActiveTab] = useState('settlement');
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payItem, setPayItem] = useState<any>(null);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleItem, setRuleItem] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const filteredSettlements = useMemo(() => {
    if (!user) return [];
    return mockSettlements.filter((item) => {
      switch (role) {
        case 'SUPER_ADMIN':
        case 'PROPERTY_ADMIN':
          return true;
        case 'SERVICE_PROVIDER':
          return item.providerId === user.providerId;
        default:
          return false;
      }
    });
  }, [user, role]);

  const stats = useMemo(() => {
    let unsettled = 0, settled = 0, frozen = 0, total = 0;
    filteredSettlements.forEach((d) => {
      const amt = Number(d.providerAmount);
      if (d.status === 'UNSETTLED') unsettled += amt;
      if (d.status === 'SETTLING') frozen += amt;
      if (d.status === 'PAID') settled += amt;
      total += amt;
    });
    return {
      unsettled: unsettled.toFixed(2),
      settled: settled.toFixed(2),
      frozen: frozen.toFixed(2),
      total: total.toFixed(2),
    };
  }, [filteredSettlements]);

  const hasManagePermission = ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role);
  const hasViewPermission = hasManagePermission || role === 'SERVICE_PROVIDER';

  const handleViewDetail = (record: any) => {
    setDetailItem(record);
    setDetailOpen(true);
    message.success('已留痕');
  };

  const handleBatchSettle = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要结算的结算单');
      return;
    }
    modal.confirm({
      title: '批量结算确认',
      content: `确定将选中的 ${selectedRowKeys.length} 条结算单提交结算吗？`,
      onOk: () => {
        message.success('批量结算已提交 · 已留痕');
        setSelectedRowKeys([]);
      },
    });
  };

  const handlePay = (record: any) => {
    setPayItem(record);
    setPayOpen(true);
  };

  const handlePaySubmit = async (values: any) => {
    message.success('打款凭证已上传 · 已留痕');
    return true;
  };

  const handleAddRule = () => {
    setRuleItem(null);
    setRuleOpen(true);
  };

  const handleEditRule = (record: any) => {
    setRuleItem(record);
    setRuleOpen(true);
  };

  const handleRuleSubmit = async (values: any) => {
    message.success(`${ruleItem ? '规则已更新' : '规则已创建'} · 已留痕`);
    return true;
  };

  const handleToggleRule = (record: any, checked: boolean) => {
    message.success(`规则已${checked ? '启用' : '停用'} · 已留痕`);
  };

  if (!hasViewPermission) {
    return (
      <div>
        <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
          登录身份：{roleName} · 已按分级权限过滤可见范围
        </Tag>
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#9CA3AF' }}>🔒</div>
          <div style={{ fontSize: 16, color: '#64748B' }}>您当前角色无分佣结算查看权限</div>
        </Card>
      </div>
    );
  }

  const settlementColumns: any[] = [
    {
      title: '结算单号',
      dataIndex: 'settlementNo',
      width: 180,
      render: (v: string, record: any) => (
        <div>
          <Text code style={{ fontSize: 11, color: '#7C3AED' }}>{v}</Text>
          <div style={{ marginTop: 4, fontSize: 11 }}>
            <CalendarOutlined style={{ color: '#9CA3AF' }} /> <Text type="secondary">{record.period}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '服务商',
      dataIndex: 'providerName',
      width: 160,
      render: (v: string, record: any) => (
        <Space>
          <Avatar size={24} style={{ backgroundColor: '#EC4899', fontSize: 12 }} icon={<ShopOutlined />} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{v}</div>
            <Text type="secondary" style={{ fontSize: 10 }}>ID: {record.providerId}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '订单量',
      dataIndex: 'orderCount',
      width: 90,
      align: 'center' as const,
      render: (v: number) => <Text strong>{v}</Text>,
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      width: 110,
      align: 'right' as const,
      render: (v: string) => <Text strong>¥{Number(v).toLocaleString()}</Text>,
    },
    {
      title: '平台佣金',
      dataIndex: 'platformCommission',
      width: 110,
      align: 'right' as const,
      render: (v: string) => <Text style={{ color: '#F59E0B' }} strong>¥{Number(v).toLocaleString()}</Text>,
    },
    {
      title: '服务商应收',
      dataIndex: 'providerAmount',
      width: 130,
      align: 'right' as const,
      render: (v: string) => <Text style={{ color: '#10B981' }} strong>¥{Number(v).toLocaleString()}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => (
        <Tag color={settlementStatusMap[v].color} style={{ fontSize: 13, padding: '2px 12px' }}>
          {settlementStatusMap[v].text}
        </Tag>
      ),
    },
    {
      title: '结算/打款时间',
      width: 160,
      render: (_: any, record: any) => (
        <div style={{ fontSize: 11 }}>
          {record.settleTime && <div><ClockOutlined />结算: {record.settleTime.split(' ')[0]}</div>}
          {record.operator && <div style={{ marginTop: 2 }}><UserOutlined /> {record.operator}</div>}
          {!record.settleTime && <Text type="secondary">-</Text>}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size={2} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>明细</Button>
          {hasManagePermission && record.status === 'SETTLING' && (
            <Button type="primary" size="small" icon={<BankOutlined />} onClick={() => handlePay(record)}>打款确认</Button>
          )}
        </Space>
      ),
    },
  ];

  const ruleColumns: any[] = [
    {
      title: '类目',
      dataIndex: 'category',
      width: 140,
      render: (v: string) => (
        <Tag color={['家政服务' === v ? 'magenta' : '快递代收' === v ? 'blue' : '社区团购' === v ? 'cyan' : '商城购物' === v ? 'purple' : 'orange']}>
          {v}
        </Tag>
      ),
    },
    {
      title: '基础佣金比例',
      dataIndex: 'baseRate',
      width: 120,
      render: (v: number) => (
        <Space>
          <PercentageOutlined style={{ color: '#F59E0B' }} />
          <Text strong style={{ color: '#D97706', fontSize: 15 }}>{v}%</Text>
        </Space>
      ),
    },
    {
      title: '阶梯阈值',
      dataIndex: 'tierThreshold',
      width: 140,
      render: (v: number) => (
        <Text>月订单额 ≥ ¥{v.toLocaleString()}</Text>
      ),
    },
    {
      title: '阶梯佣金比例',
      dataIndex: 'tierRate',
      width: 130,
      render: (v: number) => (
        <Space>
          <PercentageOutlined style={{ color: '#10B981' }} />
          <Text strong style={{ color: '#059669', fontSize: 15 }}>{v}%</Text>
        </Space>
      ),
    },
    {
      title: '生效日期',
      dataIndex: 'effectiveDate',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string, record: any) => (
        <Space>
          <Switch
            size="small"
            checked={v === 'active'}
            checkedChildren="启用"
            unCheckedChildren="停用"
            onChange={(c) => handleToggleRule(record, c)}
          />
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditRule(record)}>编辑</Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'settlement',
      label: <Space><FileTextOutlined />结算单列表</Space>,
      children: (
        <ProTable
          headerTitle={<Space><HistoryOutlined />分佣结算单 <Tag color="default" style={{ fontSize: 12 }}>共 {filteredSettlements.length} 单</Tag></Space>}
          columns={settlementColumns}
          dataSource={filteredSettlements}
          rowKey="id"
          search={{ labelWidth: 90, collapseRender: false }}
          rowSelection={hasManagePermission ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record: any) => ({ disabled: record.status !== 'UNSETTLED' }),
          } : undefined}
          pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条结算单` }}
          scroll={{ x: 1500 }}
          toolBarRender={() => hasManagePermission ? [
            <Button key="batch" type="primary" icon={<BankOutlined />} onClick={handleBatchSettle}>
              批量结算 ({selectedRowKeys.length})
            </Button>,
          ] : []}
        />
      ),
    },
    ...(hasManagePermission ? [{
      key: 'rules',
      label: <Space><PercentageOutlined />分佣规则</Space>,
      children: (
        <ProTable
          headerTitle={<Space><PercentageOutlined style={{ color: '#7C3AED' }} />分佣规则配置</Space>}
          columns={ruleColumns}
          dataSource={mockCommissionRules}
          rowKey="id"
          search={false}
          pagination={false}
          scroll={{ x: 1200 }}
          toolBarRender={() => [
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleAddRule}>
              新增规则
            </Button>,
          ]}
        />
      ),
    }] : []),
  ];

  return (
    <div>
      <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
        登录身份：{roleName} · 已按分级权限过滤可见范围
      </Tag>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><ClockOutlined style={{ color: '#F59E0B' }} />待结算金额</Space>}
              value={stats.unsettled}
              prefix="¥"
              valueStyle={{ color: '#F59E0B', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><CheckCircleOutlined style={{ color: '#10B981' }} />已结算金额</Space>}
              value={stats.settled}
              prefix="¥"
              valueStyle={{ color: '#10B981', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><LockOutlined style={{ color: '#6366F1' }} />冻结金额</Space>}
              value={stats.frozen}
              prefix="¥"
              valueStyle={{ color: '#6366F1', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><DollarOutlined style={{ color: '#7C3AED' }} />累计结算</Space>}
              value={stats.total}
              prefix="¥"
              valueStyle={{ color: '#7C3AED', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }} bodyStyle={{ padding: '12px 0 0 0' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ padding: '0 20px' }} />
      </Card>

      <Drawer
        title={<Space><FileTextOutlined style={{ color: '#7C3AED' }} />结算单明细 <Tag color={settlementStatusMap[detailItem?.status]?.color}>{settlementStatusMap[detailItem?.status]?.text}</Tag></Space>}
        width={820}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {detailItem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" variant="borderless" style={{ borderRadius: 8, background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>结算单号</Text>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{detailItem.settlementNo}</div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11 }}>结算周期</Text>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{detailItem.period}</div>
                </Col>
                <Col span={8}>
                  <Statistic title="订单数" value={detailItem.orderCount} valueStyle={{ fontSize: 20 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="总金额" value={detailItem.totalAmount} prefix="¥" valueStyle={{ fontSize: 20, color: '#EF4444' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="服务商应收" value={detailItem.providerAmount} prefix="¥" valueStyle={{ fontSize: 20, color: '#10B981' }} />
                </Col>
              </Row>
            </Card>

            <Card size="small" title="结算概要" variant="borderless" style={{ borderRadius: 8 }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="服务商">
                  <Space><Avatar size={20} style={{ backgroundColor: '#EC4899', fontSize: 10 }} icon={<ShopOutlined />} />{detailItem.providerName}</Space>
                </Descriptions.Item>
                <Descriptions.Item label="平台佣金">
                  <Text strong style={{ color: '#F59E0B' }}>¥{Number(detailItem.platformCommission).toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="结算时间">{detailItem.settleTime || '-'}</Descriptions.Item>
                <Descriptions.Item label="操作人">{detailItem.operator || '-'}</Descriptions.Item>
                {detailItem.remark && <Descriptions.Item label="备注" span={2}>{detailItem.remark}</Descriptions.Item>}
              </Descriptions>
            </Card>

            <Card size="small" title={<Space>包含订单明细 <Tag color="default">{(mockSettlementOrders[detailItem.id] || []).length} 条</Tag></Space>} variant="borderless" style={{ borderRadius: 8 }}>
              <List
                size="small"
                dataSource={mockSettlementOrders[detailItem.id] || []}
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px dashed #F1F5F9' }}>
                    <List.Item.Meta
                      avatar={<Tag color="purple" style={{ fontSize: 11 }}>#{item.id.slice(-4)}</Tag>}
                      title={<Text style={{ fontSize: 13 }}>{item.serviceItemName}</Text>}
                      description={
                        <div style={{ fontSize: 11, marginTop: 4 }}>
                          <Text code>{item.orderNo}</Text>
                          <span style={{ margin: '0 6px' }}>·</span>
                          <UserOutlined /> {item.customerName}
                          <span style={{ margin: '0 6px' }}>·</span>
                          <CalendarOutlined /> {item.completeTime}
                        </div>
                      }
                    />
                    <div style={{ textAlign: 'right', fontSize: 12, minWidth: 280 }}>
                      <Row gutter={8}>
                        <Col span={8}>
                          <div><Text type="secondary">订单额</Text></div>
                          <Text strong>¥{item.amount}</Text>
                        </Col>
                        <Col span={8}>
                          <div><Text type="secondary">佣金 ({item.commissionRate}%)</Text></div>
                          <Text style={{ color: '#F59E0B' }} strong>¥{item.platformCommission}</Text>
                        </Col>
                        <Col span={8}>
                          <div><Text type="secondary">服务商收入</Text></div>
                          <Text style={{ color: '#10B981' }} strong>¥{item.providerIncome}</Text>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: '暂无订单明细数据' }}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      <ModalForm
        title={`打款确认 - ${payItem?.settlementNo}`}
        open={payOpen}
        onOpenChange={setPayOpen}
        onFinish={handlePaySubmit}
        width={520}
        modalProps={{ destroyOnClose: true }}
      >
        <div style={{ marginBottom: 16, padding: 16, background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', borderRadius: 10 }}>
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>服务商</Text>
              <div style={{ fontWeight: 700 }}>{payItem?.providerName}</div>
            </Col>
            <Col span={12}>
              <Text type="secondary" style={{ fontSize: 11 }}>打款金额</Text>
              <div style={{ fontWeight: 700, fontSize: 22, color: '#059669' }}>¥{Number(payItem?.providerAmount || 0).toLocaleString()}</div>
            </Col>
          </Row>
        </div>
        <ProFormSelect
          name="payMethod"
          label="打款方式"
          rules={[{ required: true }]}
          options={[
            { label: '🏦 银行转账', value: 'bank' },
            { label: '💚 微信支付', value: 'wechat' },
            { label: '💙 支付宝', value: 'alipay' },
          ]}
        />
        <ProFormUploadButton
          name="voucher"
          label="打款凭证"
          rules={[{ required: true }]}
          fieldProps={{
            maxCount: 3,
            listType: 'picture-card',
            accept: 'image/*',
            customRequest: () => { },
          }}
          title="上传凭证"
          buttonProps={{ children: '上传凭证' }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="可选：打款备注"
          fieldProps={{ rows: 2 }}
        />
      </ModalForm>

      <ModalForm
        title={ruleItem ? '编辑分佣规则' : '新增分佣规则'}
        open={ruleOpen}
        onOpenChange={setRuleOpen}
        onFinish={handleRuleSubmit}
        width={560}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect
          name="category"
          label="服务类目"
          rules={[{ required: true }]}
          options={categoryList}
          initialValue={ruleItem?.category}
        />
        <Row gutter={16}>
          <Col span={12}>
            <ProFormDigit
              name="baseRate"
              label="基础佣金比例"
              min={1}
              max={50}
              rules={[{ required: true }]}
              fieldProps={{ precision: 0, addonAfter: '%' }}
              initialValue={ruleItem?.baseRate}
            />
          </Col>
          <Col span={12}>
            <ProFormDigit
              name="tierRate"
              label="阶梯佣金比例"
              min={1}
              max={50}
              rules={[{ required: true }]}
              fieldProps={{ precision: 0, addonAfter: '%' }}
              initialValue={ruleItem?.tierRate}
            />
          </Col>
        </Row>
        <ProFormDigit
          name="tierThreshold"
          label="阶梯触发阈值（月订单额）"
          min={0}
          rules={[{ required: true }]}
          fieldProps={{ precision: 0, prefix: '¥' }}
          initialValue={ruleItem?.tierThreshold}
        />
        <ProFormDatePicker
          name="effectiveDate"
          label="生效日期"
          rules={[{ required: true }]}
          initialValue={ruleItem?.effectiveDate ? dayjs(ruleItem.effectiveDate) : dayjs()}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormTextArea
          name="description"
          label="规则说明"
          placeholder="请输入规则说明..."
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </div>
  );
}
