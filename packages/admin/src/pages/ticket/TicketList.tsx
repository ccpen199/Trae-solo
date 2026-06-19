import { ProTable, ModalForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormDateRangePicker } from '@ant-design/pro-components';
import { Tag, Space, Button, Typography, App, Drawer, Timeline, Card, Descriptions, Rate, Avatar, Input, Tooltip, Col, Row } from 'antd';
import { PlusOutlined, UserSwitchOutlined, BellOutlined, ExportOutlined, EyeOutlined, CheckCircleOutlined, EditOutlined, CloseCircleOutlined, MessageOutlined, SendOutlined, StarOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { TextArea } = Input;

const typeMap: Record<string, { text: string; color: string }> = {
  REPAIR: { text: '报修', color: 'blue' },
  COMPLAINT: { text: '投诉', color: 'red' },
  SUGGESTION: { text: '建议', color: 'green' },
  OTHER: { text: '其他', color: 'default' },
};

const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待接单', color: 'warning' },
  ASSIGNED: { text: '已派单', color: 'processing' },
  PROCESSING: { text: '处理中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  RATED: { text: '已评价', color: 'success' },
  CLOSED: { text: '已关闭', color: 'default' },
};

const priorityMap: Record<string, { text: string; color: string }> = {
  LOW: { text: '低', color: 'default' },
  NORMAL: { text: '普通', color: 'blue' },
  HIGH: { text: '高', color: 'orange' },
  URGENT: { text: '紧急', color: 'red' },
};

const submitterRoleMap: Record<string, string> = {
  RESIDENT: '居民',
  PROPERTY_STAFF: '物业员工',
  PROPERTY_ADMIN: '物业管理员',
  COMMITTEE: '业委会',
};

const mockData = Array.from({ length: 30 }, (_, i) => ({
  id: `TK-${String(i + 1).padStart(5, '0')}`,
  title: ['客厅灯不亮需维修', '楼下噪音扰民多次沟通无果', '建议增加儿童游乐设施', '3栋电梯故障停运', '厨房水管漏水严重', '绿化区域杂草丛生建议补种'][i % 6],
  content: '详细描述问题情况和期望处理方式，业主在家时间等补充信息。',
  type: ['REPAIR', 'COMPLAINT', 'SUGGESTION', 'OTHER', 'REPAIR', 'COMPLAINT'][i % 6] as any,
  priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'NORMAL', 'HIGH'][i % 6] as any,
  status: ['PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'RATED', 'CLOSED'][i % 6] as any,
  submitterName: ['陈先生', '王女士', '李先生', '赵女士', '孙先生', '周女士'][i % 6],
  submitterPhone: `138****${String(1000 + i).slice(-4)}`,
  submitterRole: 'RESIDENT',
  houseInfo: `${Math.floor(i / 3) + 1}栋${Math.floor(i / 5) + 1}单元${String(101 + (i % 10) * 2).slice(0, 2)}0${i % 9 + 1}`,
  communityId: i < 15 ? 'c1' : 'c2',
  buildingId: `b${Math.floor(i / 5) + 1}`,
  unitId: `u${Math.floor(i / 3) + 1}01`,
  assigneeId: i % 6 === 0 ? null : `staff-${(i % 3) + 1}`,
  assigneeName: i % 6 === 0 ? null : ['李师傅', '王师傅', '张师傅'][i % 3],
  createdAt: dayjs().subtract(i * 6, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  assignedAt: i % 6 === 0 ? null : dayjs().subtract(i * 6 + 1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
  completedAt: i >= 12 ? dayjs().subtract(i * 3, 'hour').format('YYYY-MM-DD HH:mm:ss') : null,
  rating: i >= 18 ? [5, 4, 5, 3, 4][i % 5] : null,
  ratingContent: i >= 18 ? '处理及时，师傅专业，态度很好，非常满意！' : null,
  tags: [['水电'], ['噪音', '邻里'], ['公共设施'], ['电梯'], ['水暖'], ['绿化']][i % 6],
  photos: ['🔧', '🏠', '🌳', '🛗', '💧', '📋'][i % 6],
}));

const staffList = [
  { label: '李师傅 - 水电维修', value: 'staff-1' },
  { label: '王师傅 - 综合维修', value: 'staff-2' },
  { label: '张师傅 - 保洁绿化', value: 'staff-3' },
];

const buildingList = [
  { label: '1栋', value: 'b1' },
  { label: '2栋', value: 'b2' },
  { label: '3栋', value: 'b3' },
  { label: '4栋', value: 'b4' },
  { label: '5栋', value: 'b5' },
];

export default function TicketList() {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const userStore = useUserStore();
  const { user } = userStore;
  const role = user?.role || 'SUPER_ADMIN';
  const roleName = USER_ROLES[role]?.name || '未知角色';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingRecord, setRatingRecord] = useState<any>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [comment, setComment] = useState('');

  const filteredData = useMemo(() => {
    if (!user) return [];
    return mockData.filter((item) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return true;
        case 'PROPERTY_ADMIN':
          return user.communityIds?.includes(item.communityId);
        case 'PROPERTY_STAFF':
          return item.assigneeId && user.id.includes(item.assigneeId.replace('staff-', 'ps-')) ? true : item.assigneeName === '王师傅';
        case 'COMMITTEE':
          return item.type === 'COMPLAINT' && user.communityIds?.includes(item.communityId);
        case 'RESIDENT':
          return item.submitterName === '陈先生';
        case 'SERVICE_PROVIDER':
          return false;
        default:
          return true;
      }
    });
  }, [user, role]);

  const showDetail = (record: any) => {
    setSelectedRecord(record);
    setDrawerOpen(true);
    message.success('已留痕');
  };

  const handleCreate = async (values: any) => {
    message.success('工单已提交 · 已留痕');
    return true;
  };

  const handleAssign = async (values: any) => {
    message.success(`已分配给 ${values.assigneeId?.replace('staff-', '') ? staffList.find(s => s.value === values.assigneeId)?.label?.split(' ')[0] : '处理人'} · 已留痕`);
    return true;
  };

  const handleUrge = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要催办的工单');
      return;
    }
    modal.confirm({
      title: '确认催办',
      content: `确定对选中的 ${selectedRowKeys.length} 条工单发起催办吗？`,
      onOk: () => {
        message.success('催办通知已发送 · 已留痕');
        setSelectedRowKeys([]);
      },
    });
  };

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要分配的工单');
      return;
    }
    setAssignModalOpen(true);
  };

  const handleTakeOrder = (record: any) => {
    modal.confirm({
      title: '确认接单',
      content: `确定承接工单「${record.title}」吗？`,
      onOk: () => message.success('已接单 · 已留痕'),
    });
  };

  const handleStartProcess = (record: any) => {
    modal.confirm({
      title: '开始处理',
      content: `确定开始处理工单「${record.title}」吗？`,
      onOk: () => message.success('已标记处理中 · 已留痕'),
    });
  };

  const handleComplete = (record: any) => {
    modal.confirm({
      title: '标记完成',
      content: `确定工单「${record.title}」已处理完成吗？`,
      onOk: () => message.success('已标记完成 · 已留痕'),
    });
  };

  const handleClose = (record: any) => {
    modal.confirm({
      title: '关闭工单',
      content: `确定关闭工单「${record.title}」吗？关闭后不可恢复。`,
      okButtonProps: { danger: true },
      onOk: () => message.success('工单已关闭 · 已留痕'),
    });
  };

  const handleRate = (record: any) => {
    setRatingRecord(record);
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async (values: any) => {
    message.success('评价已提交 · 已留痕');
    return true;
  };

  const handleReply = () => {
    if (!comment.trim()) return;
    message.success('留言已发送 · 已留痕');
    setComment('');
  };

  const handleExport = () => {
    message.success('导出任务已创建 · 已留痕');
  };

  const handleSupervise = (record: any) => {
    modal.confirm({
      title: '业委会督办',
      content: `确定对投诉工单「${record.title}」发起督办吗？`,
      onOk: () => message.success('督办通知已发送 · 已留痕'),
    });
  };

  const canCreate = ['SUPER_ADMIN', 'PROPERTY_ADMIN', 'PROPERTY_STAFF', 'RESIDENT'].includes(role);
  const canAssign = ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role);
  const canUrge = ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role);
  const canExport = ['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role);

  const getDuration = (createdAt: string, completedAt: string | null) => {
    const start = dayjs(createdAt);
    const end = completedAt ? dayjs(completedAt) : dayjs();
    const diff = end.diff(start, 'minute');
    if (diff < 60) return `${diff}分钟`;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours < 24) return `${hours}小时${mins}分`;
    const days = Math.floor(hours / 24);
    return `${days}天${hours % 24}小时`;
  };

  const columns: any[] = [
    {
      title: '工单号/标题',
      dataIndex: 'id',
      width: 260,
      render: (_: any, record: any) => (
        <div>
          <div style={{ cursor: 'pointer' }} onClick={() => showDetail(record)}>
            <Text code strong style={{ color: '#7C3AED' }}>{record.id}</Text>
          </div>
          <div
            style={{
              marginTop: 4,
              cursor: 'pointer',
              color: '#1F2937',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 240,
            }}
            onClick={() => showDetail(record)}
          >
            {record.photos} {record.title}
          </div>
        </div>
      ),
    },
    {
      title: '类型/优先级',
      width: 140,
      render: (_: any, record: any) => (
        <Space direction="vertical" size={4}>
          <Tag color={typeMap[record.type].color} style={{ margin: 0 }}>
            {typeMap[record.type].text}
          </Tag>
          <Tag color={priorityMap[record.priority].color} style={{ margin: 0 }}>
            {priorityMap[record.priority].text}优先级
          </Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => <Tag color={statusMap[v].color} style={{ fontSize: 13, padding: '2px 10px' }}>{statusMap[v].text}</Tag>,
    },
    {
      title: '提交人',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <Space size={6}>
            <Avatar size={24} style={{ backgroundColor: USER_ROLES[record.submitterRole]?.color || '#9CA3AF' }}>
              {record.submitterName?.charAt(0)}
            </Avatar>
            <Text strong>{record.submitterName}</Text>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Tag color={USER_ROLES[record.submitterRole]?.color || 'default'} style={{ fontSize: 11, marginRight: 4 }}>
              {submitterRoleMap[record.submitterRole] || record.submitterRole}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.houseInfo}</Text>
          </div>
        </div>
      ),
    },
    {
      title: '处理人',
      width: 110,
      render: (_: any, record: any) => (
        record.assigneeName ? (
          <Space>
            <Avatar size={22} style={{ backgroundColor: '#2563EB', fontSize: 12 }}>
              {record.assigneeName?.charAt(0)}
            </Avatar>
            <span>{record.assigneeName}</span>
          </Space>
        ) : (
          <Text type="danger" strong>待分配</Text>
        )
      ),
    },
    {
      title: '创建时间/耗时',
      width: 170,
      render: (_: any, record: any) => (
        <div>
          <Text style={{ fontSize: 12 }}>{record.createdAt}</Text>
          <div style={{ marginTop: 2 }}>
            <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
              耗时 {getDuration(record.createdAt, record.completedAt)}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: '评分',
      width: 100,
      render: (_: any, record: any) => (
        record.rating ? (
          <Space>
            <Rate disabled value={record.rating} style={{ fontSize: 14, color: '#F59E0B' }} />
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_: any, record: any) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => navigate(`/tickets/${record.id}`)}>
            闭环
          </Button>

          {role === 'RESIDENT' && record.status === 'COMPLETED' && !record.rating && (
            <Button type="link" size="small" icon={<StarOutlined />} onClick={() => handleRate(record)}>
              评价
            </Button>
          )}

          {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleTakeOrder(record)}>
              接单
            </Button>
          )}

          {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && record.status === 'ASSIGNED' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleStartProcess(record)}>
              处理
            </Button>
          )}

          {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && record.status === 'PROCESSING' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record)}>
              完成
            </Button>
          )}

          {['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role) && (
            <Button type="link" size="small" icon={<CloseCircleOutlined />} danger onClick={() => handleClose(record)}>
              关闭
            </Button>
          )}

          {role === 'COMMITTEE' && record.type === 'COMPLAINT' && (
            <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => handleSupervise(record)}>
              督办
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (role === 'SERVICE_PROVIDER') {
    return (
      <div>
        <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px' }}>
          登录身份：{roleName} · 已按分级权限过滤可见范围
        </Tag>
        <Card style={{ textAlign: 'center', padding: 60 }}>
          <Text type="secondary" style={{ fontSize: 16 }}>服务商无工单管理权限</Text>
        </Card>
      </div>
    );
  }

  const renderTimeline = (record: any) => {
    const items: any[] = [{ color: 'blue', children: (<div><Text strong>工单提交</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>业主 {record.submitterName} · {record.createdAt}</div></div>) }];
    if (record.assignedAt) items.push({ color: 'cyan', children: (<div><Text strong>已派单</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>分配给 {record.assigneeName} · {record.assignedAt}</div></div>) });
    if (record.status !== 'PENDING') items.push({ color: 'green', children: (<div><Text strong>处理中</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{record.assigneeName} 正在现场处理</div></div>) });
    if (record.completedAt) items.push({ color: 'success', children: (<div><Text strong>已完成</Text><div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>现场处理完毕 · {record.completedAt}</div></div>) });
    if (record.rating) items.push({ color: 'gold', children: (<div><Text strong>业主评价</Text><Rate disabled value={record.rating} style={{ fontSize: 12, color: '#F59E0B' }} /><div style={{ fontSize: 12, color: '#64748B' }}>{record.ratingContent}</div></div>) });
    if (record.status === 'CLOSED') items.push({ color: 'gray', children: (<div><Text strong>工单关闭</Text><div style={{ fontSize: 12, color: '#94A3B8' }}>系统自动归档</div></div>) });
    return <Timeline items={items} />;
  };

  return (
    <div>
      <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
        登录身份：{roleName} · 已按分级权限过滤可见范围
      </Tag>

      <ProTable
        headerTitle={<Space><FileTextOutlined style={{ color: '#7C3AED' }} />工单列表 <Tag color="default" style={{ fontSize: 12 }}>共 {filteredData.length} 条</Tag></Space>}
        columns={columns}
        dataSource={filteredData}
        rowKey="id"
        search={{
          labelWidth: 100,
          collapseRender: false,
        }}
        columnsState={{ persistenceKey: 'ticket-columns' }}
        rowSelection={canAssign || canUrge ? { selectedRowKeys, onChange: setSelectedRowKeys } : undefined}
        pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1600 }}
        toolBarRender={() => [
          canCreate && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              新建工单
            </Button>
          ),
          canAssign && (
            <Button icon={<UserSwitchOutlined />} onClick={handleBatchAssign}>
              批量分配
            </Button>
          ),
          canUrge && (
            <Button icon={<BellOutlined />} onClick={handleUrge}>
              批量催办
            </Button>
          ),
          canExport && (
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          ),
        ]}
      />

      <Drawer
        title={<Space><Tag color={statusMap[selectedRecord?.status]?.color}>{statusMap[selectedRecord?.status]?.text}</Tag><Title level={5} style={{ margin: 0 }}>{selectedRecord?.title}</Title></Space>}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={<Button onClick={() => selectedRecord && navigate(`/tickets/${selectedRecord.id}`)}>进入闭环页面</Button>}
      >
        {selectedRecord && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card size="small" title="基本信息" variant="borderless" style={{ borderRadius: 8 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="工单号"><Text code>{selectedRecord.id}</Text></Descriptions.Item>
                <Descriptions.Item label="类型/优先级"><Tag color={typeMap[selectedRecord.type].color}>{typeMap[selectedRecord.type].text}</Tag><Tag color={priorityMap[selectedRecord.priority].color}>{priorityMap[selectedRecord.priority].text}</Tag></Descriptions.Item>
                <Descriptions.Item label="提交人">{selectedRecord.submitterName} ({selectedRecord.submitterPhone})</Descriptions.Item>
                <Descriptions.Item label="处理人">{selectedRecord.assigneeName || '待分配'}</Descriptions.Item>
                <Descriptions.Item label="房产位置">{selectedRecord.houseInfo}</Descriptions.Item>
                <Descriptions.Item label="标签">{selectedRecord.tags?.map((t: string) => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
                <Descriptions.Item label="提交时间" span={2}>{selectedRecord.createdAt}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="问题描述" variant="borderless" style={{ borderRadius: 8 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {[selectedRecord.photos, '📷', '📸'].map((p, i) => (
                  <div key={i} style={{ width: 72, height: 72, background: '#F3F4F6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                    {p}
                  </div>
                ))}
              </div>
              <Text style={{ lineHeight: 1.8 }}>{selectedRecord.content}</Text>
            </Card>

            <Card size="small" title="状态时间轴" variant="borderless" style={{ borderRadius: 8 }}>
              {renderTimeline(selectedRecord)}
            </Card>

            <Card size="small" title="留言沟通" variant="borderless" style={{ borderRadius: 8 }}>
              <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Avatar style={{ backgroundColor: '#2563EB' }}>李</Avatar>
                  <div style={{ flex: 1, background: '#EFF6FF', padding: 10, borderRadius: 8 }}>
                    <Space><Text strong>李师傅</Text><Tag color="blue" style={{ fontSize: 11 }}>物业员工</Tag><Text type="secondary" style={{ fontSize: 11 }}>{selectedRecord.createdAt?.replace(/\d{2}:\d{2}:\d{2}/, '10:15:00')}</Text></Space>
                    <div style={{ marginTop: 6 }}>您好，已收到报修，预计30分钟后上门，请保持电话畅通。</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <div style={{ flex: 1, background: '#F0FDF4', padding: 10, borderRadius: 8, marginLeft: 40 }}>
                    <Space><Text strong>{selectedRecord.submitterName}</Text><Tag color="green" style={{ fontSize: 11 }}>业主</Tag><Text type="secondary" style={{ fontSize: 11 }}>{selectedRecord.createdAt?.replace(/\d{2}:\d{2}:\d{2}/, '10:18:00')}</Text></Space>
                    <div style={{ marginTop: 6 }}>好的，我在家等候，辛苦了！</div>
                  </div>
                  <Avatar style={{ backgroundColor: '#10B981' }}>{selectedRecord.submitterName?.charAt(0)}</Avatar>
                </div>
              </Space>
              <div style={{ display: 'flex', gap: 8 }}>
                <TextArea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="输入留言内容..." rows={2} />
                <Button type="primary" icon={<SendOutlined />} onClick={handleReply} style={{ alignSelf: 'flex-end' }}>发送</Button>
              </div>
            </Card>
          </Space>
        )}
      </Drawer>

      <ModalForm
        title="新建工单"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={handleCreate}
        width={560}
        modalProps={{ destroyOnClose: true }}
      >
        <Row gutter={16}>
          <Col span={12}><ProFormSelect name="type" label="工单类型" options={Object.entries(typeMap).map(([v, { text }]) => ({ label: text, value: v }))} rules={[{ required: true }]} /></Col>
          <Col span={12}><ProFormSelect name="priority" label="优先级" options={Object.entries(priorityMap).map(([v, { text }]) => ({ label: text, value: v }))} rules={[{ required: true }]} /></Col>
        </Row>
        <ProFormText name="title" label="工单标题" rules={[{ required: true }]} placeholder="简要描述问题" />
        <ProFormSelect name="buildingId" label="所在楼栋" options={buildingList} rules={[{ required: true }]} />
        <ProFormTextArea name="content" label="详细描述" rules={[{ required: true }]} placeholder="请详细描述问题情况..." fieldProps={{ rows: 4 }} />
      </ModalForm>

      <ModalForm
        title={`批量分配处理人（已选 ${selectedRowKeys.length} 条）`}
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        onFinish={handleAssign}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect name="assigneeId" label="选择处理人" options={staffList} rules={[{ required: true }]} placeholder="请选择要分配的物业员工" />
        <ProFormTextArea name="remark" label="派单备注" placeholder="可选：特殊说明" fieldProps={{ rows: 2 }} />
      </ModalForm>

      <ModalForm
        title="评价工单"
        open={ratingModalOpen}
        onOpenChange={setRatingModalOpen}
        onFinish={handleSubmitRating}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect
          name="rating"
          label="评分"
          rules={[{ required: true }]}
          fieldProps={{
            optionRender: ({ label }: any) => <span>{'⭐'.repeat(Number(label?.charAt(0)))}{label}</span>,
          }}
          options={[
            { label: '1星 - 非常不满意', value: 1 },
            { label: '2星 - 不满意', value: 2 },
            { label: '3星 - 一般', value: 3 },
            { label: '4星 - 满意', value: 4 },
            { label: '5星 - 非常满意', value: 5 },
          ]}
        />
        <ProFormTextArea name="ratingContent" label="评价内容" placeholder="分享您的服务体验..." fieldProps={{ rows: 4 }} />
      </ModalForm>
    </div>
  );
}
