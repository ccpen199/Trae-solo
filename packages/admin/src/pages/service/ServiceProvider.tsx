import { ProTable, ModalForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormDigit } from '@ant-design/pro-components';
import { Tag, Space, Button, Avatar, App, Drawer, Card, Descriptions, Rate, Row, Col, Statistic, Timeline } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, AuditOutlined, ShopOutlined, UserOutlined, PhoneOutlined, FileTextOutlined, PercentageOutlined, StarOutlined, HistoryOutlined } from '@ant-design/icons';
import { useState, useMemo } from 'react';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待审核', color: 'warning' },
  APPROVED: { text: '已认证', color: 'success' },
  REJECTED: { text: '已驳回', color: 'error' },
  SUSPENDED: { text: '已停用', color: 'default' },
};

const categoryColorMap: Record<string, string> = {
  '家政': 'magenta',
  '快递': 'blue',
  '团购': 'cyan',
  '商城': 'purple',
};

const mockData = Array.from({ length: 18 }, (_, i) => ({
  id: `SP-${String(i + 1).padStart(4, '0')}`,
  name: ['好阿姨家政服务', '顺丰快递驿站', '邻里团生鲜', '优选生活商城', '速修家电维修', '优家家政服务'][i % 6],
  contactName: ['刘经理', '王站长', '张主管', '陈总监', '李师傅', '赵店长'][i % 6],
  contactPhone: `138****${String(2000 + i).slice(-4)}`,
  businessLicenseNo: `913301${String(100000 + i * 137).slice(-6)}MA${String(10 + i).slice(-2)}X`,
  categories: [
    ['家政'], ['快递', '商城'], ['团购'], ['商城', '团购'],
    ['家政', '商城'], ['快递'],
  ][i % 6],
  serviceScope: [
    '阳光花园小区, 翠湖天地', '阳光花园小区', '翠湖天地, 绿城玫瑰园',
    '阳光花园小区, 绿城玫瑰园', '阳光花园小区, 翠湖天地', '阳光花园小区',
  ][i % 6],
  communityIds: [['c1', 'c2'], ['c1'], ['c2', 'c3'], ['c1', 'c3'], ['c1', 'c2'], ['c1']][i % 6],
  auditStatus: ['PENDING', 'APPROVED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING'][i % 6],
  commissionRate: [10, 12, 8, 15, 10, 12][i % 6],
  applyTime: dayjs().subtract(30 - i * 2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  auditTime: i % 6 !== 0 && i % 6 !== 5 ? dayjs().subtract(28 - i * 2, 'day').format('YYYY-MM-DD HH:mm:ss') : null,
  auditRemark: i % 6 === 3 ? '营业执照信息模糊，请重新上传清晰版本' : i % 6 === 4 ? '用户投诉率超标，暂停服务整顿' : '资料齐全，符合入驻要求',
  rating: [4.9, 4.7, 4.5, 4.8, 4.3, 4.6][i % 6],
  orderCount: [326, 1245, 892, 567, 98, 234][i % 6],
  settledAmount: [89250.00, 245600.00, 156780.00, 78900.00, 12340.00, 56780.00][i % 6],
}));

const mockAuditTrail: Record<string, any[]> = {
  'SP-00002': [
    { time: dayjs().subtract(28, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '李物业', fromStatus: 'PENDING', toStatus: 'APPROVED', remark: '资料齐全，符合入驻要求，佣金比例12%' },
    { time: dayjs().subtract(10, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '王经理', fromStatus: 'APPROVED', toStatus: 'APPROVED', remark: '调整佣金比例：12% → 10%' },
  ],
  'SP-00004': [
    { time: dayjs().subtract(22, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '李物业', fromStatus: 'PENDING', toStatus: 'REJECTED', remark: '营业执照信息模糊，请重新上传清晰版本' },
  ],
  'SP-00005': [
    { time: dayjs().subtract(26, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '李物业', fromStatus: 'PENDING', toStatus: 'APPROVED', remark: '资质审核通过' },
    { time: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm:ss'), operator: '王经理', fromStatus: 'APPROVED', toStatus: 'SUSPENDED', remark: '用户投诉率超标，暂停服务整顿' },
  ],
};

const communityList = [
  { label: '阳光花园小区', value: 'c1' },
  { label: '翠湖天地', value: 'c2' },
  { label: '绿城玫瑰园', value: 'c3' },
];

export default function ServiceProvider() {
  const { message, modal } = App.useApp();
  const userStore = useUserStore();
  const { user } = userStore;
  const role = user?.role || 'SUPER_ADMIN';
  const roleName = USER_ROLES[role]?.name || '未知角色';

  const [viewItem, setViewItem] = useState<any>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditItem, setAuditItem] = useState<any>(null);
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [commissionItem, setCommissionItem] = useState<any>(null);
  const [trailOpen, setTrailOpen] = useState(false);
  const [trailItem, setTrailItem] = useState<any>(null);

  const filteredData = useMemo(() => {
    if (!user) return [];
    return mockData.filter((item) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return true;
        case 'PROPERTY_ADMIN':
          return item.communityIds?.some((cid: string) => user.communityIds?.includes(cid));
        default:
          return false;
      }
    });
  }, [user, role]);

  const stats = useMemo(() => ({
    pending: filteredData.filter((d) => d.auditStatus === 'PENDING').length,
    approved: filteredData.filter((d) => d.auditStatus === 'APPROVED').length,
    suspended: filteredData.filter((d) => d.auditStatus === 'SUSPENDED').length,
    newThisMonth: filteredData.filter((d) => dayjs(d.applyTime).isAfter(dayjs().startOf('month'))).length,
  }), [filteredData]);

  const hasPermission = ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role);

  const handleAudit = (record: any) => {
    setAuditItem(record);
    setAuditOpen(true);
  };

  const handleAuditSubmit = async (values: any) => {
    message.success(`${values.result === 'APPROVED' ? '审核通过' : '已驳回'} · 已留痕`);
    return true;
  };

  const handleSuspend = (record: any) => {
    modal.confirm({
      title: '确认停用',
      content: `确定停用服务商「${record.name}」吗？该操作将下架其所有服务商品。`,
      onOk: () => message.success('服务商已停用 · 已留痕'),
    });
  };

  const handleResume = (record: any) => {
    modal.confirm({
      title: '确认启用',
      content: `确定重新启用服务商「${record.name}」吗？`,
      onOk: () => message.success('服务商已启用 · 已留痕'),
    });
  };

  const handleCommission = (record: any) => {
    setCommissionItem(record);
    setCommissionOpen(true);
  };

  const handleCommissionSubmit = async (values: any) => {
    message.success('佣金比例已调整 · 已留痕');
    return true;
  };

  const handleViewTrail = (record: any) => {
    setTrailItem(record);
    setTrailOpen(true);
    message.success('已留痕');
  };

  const handleViewDetail = (record: any) => {
    setViewItem(record);
    message.success('已留痕');
  };

  if (!hasPermission) {
    return (
      <div>
        <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
          登录身份：{roleName} · 已按分级权限过滤可见范围
        </Tag>
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: '#9CA3AF' }}>🔒</div>
          <div style={{ fontSize: 16, color: '#64748B' }}>您当前角色无服务商管理权限</div>
        </Card>
      </div>
    );
  }

  const columns: any[] = [
    {
      title: '服务商/联系人',
      dataIndex: 'name',
      width: 220,
      render: (v: string, record: any) => (
        <div>
          <Space size={8}>
            <Avatar style={{ backgroundColor: '#EC4899' }} icon={<ShopOutlined />} />
            <div>
              <div style={{ fontWeight: 600, color: '#1F2937' }}>{v}</div>
              <Space size={6} style={{ marginTop: 2 }}>
                <UserOutlined style={{ fontSize: 11, color: '#9CA3AF' }} />
                <Text style={{ fontSize: 12, color: '#64748B' }}>{record.contactName}</Text>
                <PhoneOutlined style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }} />
                <Text style={{ fontSize: 12, color: '#64748B' }}>{record.contactPhone}</Text>
              </Space>
            </div>
          </Space>
        </div>
      ),
    },
    {
      title: '服务类目',
      dataIndex: 'categories',
      width: 140,
      render: (v: string[]) => (
        <Space size={4} wrap>
          {v.map((c) => (
            <Tag key={c} color={categoryColorMap[c] || 'default'} style={{ fontSize: 11 }}>{c}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '入驻范围',
      dataIndex: 'serviceScope',
      width: 200,
      ellipsis: true,
      render: (v: string) => (
        <Space size={4}>
          <FileTextOutlined style={{ color: '#7C3AED', fontSize: 12 }} />
          <span title={v} style={{ fontSize: 12 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      width: 100,
      render: (v: string) => (
        <Tag color={statusMap[v].color} style={{ fontSize: 13, padding: '2px 12px' }}>
          {statusMap[v].text}
        </Tag>
      ),
    },
    {
      title: '分佣比例',
      dataIndex: 'commissionRate',
      width: 100,
      render: (v: number) => (
        <Space>
          <PercentageOutlined style={{ color: '#F59E0B' }} />
          <Text strong style={{ color: '#D97706' }}>{v}%</Text>
        </Space>
      ),
    },
    {
      title: '经营数据',
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <Space size={10}>
            <Space size={4}>
              <StarOutlined style={{ color: '#F59E0B', fontSize: 12 }} />
              <Rate disabled value={record.rating} allowHalf style={{ fontSize: 12 }} />
              <Text style={{ fontSize: 12, color: '#64748B' }}>{record.rating}</Text>
            </Space>
          </Space>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            <Text type="secondary">订单</Text> <Text strong>{record.orderCount}</Text>
            <span style={{ color: '#E2E8F0', margin: '0 8px' }}>|</span>
            <Text type="secondary">累计结算</Text> <Text strong style={{ color: '#10B981' }}>¥{record.settledAmount.toLocaleString()}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '申请/审核时间',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: 12 }}>
            <Text type="secondary">申请：</Text>{record.applyTime?.split(' ')[0]}
          </div>
          <div style={{ fontSize: 12, marginTop: 2 }}>
            <Text type="secondary">审核：</Text>{record.auditTime ? record.auditTime.split(' ')[0] : '-'}
          </div>
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewTrail(record)}>审核轨迹</Button>
          {record.auditStatus === 'PENDING' && (
            <Button type="primary" size="small" icon={<AuditOutlined />} onClick={() => handleAudit(record)}>审核</Button>
          )}
          {record.auditStatus === 'APPROVED' && (
            <>
              <Button type="link" size="small" icon={<PercentageOutlined />} onClick={() => handleCommission(record)}>调佣</Button>
              <Button type="link" size="small" danger icon={<PauseCircleOutlined />} onClick={() => handleSuspend(record)}>停用</Button>
            </>
          )}
          {record.auditStatus === 'REJECTED' && (
            <Button type="link" size="small" icon={<AuditOutlined />} onClick={() => handleAudit(record)}>重新审核</Button>
          )}
          {record.auditStatus === 'SUSPENDED' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} type="primary" onClick={() => handleResume(record)}>启用</Button>
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
            <Statistic
              title={<Space size={4}><AuditOutlined style={{ color: '#F59E0B' }} />待审核</Space>}
              value={stats.pending}
              valueStyle={{ color: '#F59E0B', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><CheckCircleOutlined style={{ color: '#10B981' }} />已认证</Space>}
              value={stats.approved}
              valueStyle={{ color: '#10B981', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><PauseCircleOutlined style={{ color: '#64748B' }} />已停用</Space>}
              value={stats.suspended}
              valueStyle={{ color: '#64748B', fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title={<Space size={4}><ShopOutlined style={{ color: '#7C3AED' }} />本月新增</Space>}
              value={stats.newThisMonth}
              valueStyle={{ color: '#7C3AED', fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      <ProTable
        headerTitle={<Space><ShopOutlined style={{ color: '#7C3AED' }} />服务商入驻管理 <Tag color="default" style={{ fontSize: 12 }}>共 {filteredData.length} 家</Tag></Space>}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        search={{
          labelWidth: 90,
          collapseRender: false,
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 家服务商` }}
        scroll={{ x: 1600 }}
      />

      <Drawer
        title={<Space><ShopOutlined style={{ color: '#EC4899' }} />服务商详情</Space>}
        width={640}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      >
        {viewItem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" variant="borderless" style={{ borderRadius: 8, background: 'linear-gradient(135deg, #FDF2F8 0%, #FAE8FF 100%)' }}>
              <Space>
                <Avatar size={56} style={{ backgroundColor: '#EC4899' }} icon={<ShopOutlined />} />
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{viewItem.name}</div>
                  <Tag color={statusMap[viewItem.auditStatus].color} style={{ marginTop: 4 }}>{statusMap[viewItem.auditStatus].text}</Tag>
                </div>
              </Space>
            </Card>
            <Card size="small" title="基本信息" variant="borderless" style={{ borderRadius: 8 }}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="服务商ID">{viewItem.id}</Descriptions.Item>
                <Descriptions.Item label="联系人">{viewItem.contactName}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{viewItem.contactPhone}</Descriptions.Item>
                <Descriptions.Item label="营业执照号">{viewItem.businessLicenseNo}</Descriptions.Item>
                <Descriptions.Item label="服务类目">{viewItem.categories.map((c: string) => <Tag key={c} color={categoryColorMap[c]}>{c}</Tag>)}</Descriptions.Item>
                <Descriptions.Item label="入驻范围">{viewItem.serviceScope}</Descriptions.Item>
                <Descriptions.Item label="当前分佣比例"><Text strong style={{ color: '#D97706' }}>{viewItem.commissionRate}%</Text></Descriptions.Item>
                <Descriptions.Item label="申请时间">{viewItem.applyTime}</Descriptions.Item>
                <Descriptions.Item label="审核时间">{viewItem.auditTime || '-'}</Descriptions.Item>
                {viewItem.auditRemark && <Descriptions.Item label="审核备注">{viewItem.auditRemark}</Descriptions.Item>}
              </Descriptions>
            </Card>
            <Card size="small" title="经营数据" variant="borderless" style={{ borderRadius: 8 }}>
              <Row gutter={[16, 16]}>
                <Col span={8}><Statistic title="服务评分" value={viewItem.rating} prefix={<StarOutlined style={{ color: '#F59E0B' }} />} valueStyle={{ fontSize: 22 }} /></Col>
                <Col span={8}><Statistic title="累计订单" value={viewItem.orderCount} valueStyle={{ fontSize: 22, color: '#3B82F6' }} /></Col>
                <Col span={8}><Statistic title="累计结算" value={viewItem.settledAmount} prefix="¥" valueStyle={{ fontSize: 22, color: '#10B981' }} /></Col>
              </Row>
            </Card>
          </Space>
        )}
      </Drawer>

      <Drawer
        title={<Space><HistoryOutlined style={{ color: '#7C3AED' }} />审核轨迹 - {trailItem?.name}</Space>}
        width={560}
        open={trailOpen}
        onClose={() => setTrailOpen(false)}
      >
        {(() => {
          const baseTrail = mockAuditTrail[trailItem?.id as string];
          const trail = baseTrail || [
            { time: trailItem?.applyTime, operator: '系统', fromStatus: '-', toStatus: 'PENDING', remark: '服务商提交入驻申请' },
            ...(trailItem?.auditTime ? [{ time: trailItem.auditTime, operator: '李物业', fromStatus: 'PENDING', toStatus: trailItem.auditStatus as string, remark: (trailItem.auditRemark as string) || '审核完成' }] : []),
          ];
          const items = trail.map((t: any, i: number) => {
            const nextColor = t.toStatus === 'APPROVED' ? 'success' : t.toStatus === 'REJECTED' ? 'red' : t.toStatus === 'SUSPENDED' ? 'gray' : 'cyan';
            return {
              color: i === 0 ? 'blue' : nextColor,
              children: (
                <div>
                  <Space wrap>
                    <Text strong>{t.operator}</Text>
                    <Tag color="default" style={{ fontSize: 11 }}>{t.fromStatus || '-'} → {t.toStatus}</Tag>
                  </Space>
                  <div style={{ marginTop: 4, fontSize: 13, color: '#475569' }}>{t.remark}</div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>{t.time}</Text>
                </div>
              ),
            };
          });
          return <Timeline items={items} />;
        })()}
      </Drawer>

      <ModalForm
        title={`服务商入驻审核 - ${auditItem?.name}`}
        open={auditOpen}
        onOpenChange={setAuditOpen}
        onFinish={handleAuditSubmit}
        width={560}
        modalProps={{ destroyOnClose: true }}
      >
        <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
          <Descriptions.Item label="服务商">{auditItem?.name}</Descriptions.Item>
          <Descriptions.Item label="联系人/电话">{auditItem?.contactName} / {auditItem?.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="营业执照号">{auditItem?.businessLicenseNo}</Descriptions.Item>
          <Descriptions.Item label="入驻范围">{auditItem?.serviceScope}</Descriptions.Item>
        </Descriptions>
        <ProFormSelect
          name="result"
          label="审核结果"
          rules={[{ required: true }]}
          options={[
            { label: '✅ 通过审核', value: 'APPROVED' },
            { label: '❌ 驳回申请', value: 'REJECTED' },
          ]}
        />
        <ProFormDigit
          name="commissionRate"
          label="分佣比例 (%)"
          min={1}
          max={50}
          rules={[{ required: true }]}
          fieldProps={{ precision: 0, addonAfter: '%' }}
          placeholder="建议 8-15%"
        />
        <ProFormSelect
          name="serviceScope"
          label="入驻小区"
          mode="multiple"
          options={communityList}
          rules={[{ required: true }]}
        />
        <ProFormTextArea
          name="auditRemark"
          label="审核备注"
          rules={[{ required: true }]}
          placeholder="请说明审核意见..."
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      <ModalForm
        title={`调整分佣比例 - ${commissionItem?.name}`}
        open={commissionOpen}
        onOpenChange={setCommissionOpen}
        onFinish={handleCommissionSubmit}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <div style={{ marginBottom: 16, padding: 12, background: '#FEF3C7', borderRadius: 8 }}>
          <Text style={{ fontSize: 13 }}>当前分佣比例：</Text>
          <Text strong style={{ color: '#D97706', fontSize: 16 }}>{commissionItem?.commissionRate}%</Text>
        </div>
        <ProFormDigit
          name="newRate"
          label="新分佣比例"
          min={1}
          max={50}
          rules={[{ required: true }]}
          fieldProps={{ precision: 0, addonAfter: '%' }}
        />
        <ProFormTextArea
          name="reason"
          label="调整原因"
          placeholder="请说明调整原因..."
          rules={[{ required: true }]}
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>
    </div>
  );
}
