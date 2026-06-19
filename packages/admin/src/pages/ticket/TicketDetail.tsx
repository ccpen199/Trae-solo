import { useState, useMemo } from 'react';
import { Card, Descriptions, Tag, Space, Button, Timeline, Input, Avatar, Typography, Divider, Rate, App, Row, Col, List, Progress, Statistic } from 'antd';
import { ModalForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, SendOutlined, UserSwitchOutlined, PlayCircleOutlined, CheckCircleOutlined, BellOutlined, CloseCircleOutlined, ClockCircleOutlined, SwapOutlined, StarOutlined, FileTextOutlined, PhoneOutlined, EnvironmentOutlined, HomeOutlined } from '@ant-design/icons';
import { useUserStore, USER_ROLES } from '@/store/user';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

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
  LOW: { text: '低优先级', color: 'default' },
  NORMAL: { text: '普通', color: 'blue' },
  HIGH: { text: '高优先级', color: 'orange' },
  URGENT: { text: '紧急', color: 'red' },
};

const mockTicket = {
  id: 'TK-00023',
  title: '3栋电梯间歇性停运影响出行',
  content: '3栋西单元电梯近一周内出现3次突然停运情况，最长一次持续2小时，老人小孩上下楼非常不便。希望物业尽快安排专业人员检修，排除安全隐患。停运时间段多集中在早高峰7:30-8:30和晚高峰18:00-19:00。',
  type: 'REPAIR',
  priority: 'URGENT',
  status: 'PROCESSING',
  submitterName: '陈先生',
  submitterPhone: '138****0005',
  submitterRole: 'RESIDENT',
  houseInfo: '3栋2单元1503',
  communityId: 'c1',
  buildingId: 'b3',
  unitId: 'u215',
  assigneeId: 'staff-2',
  assigneeName: '王师傅',
  assigneePhone: '138****0003',
  createdAt: dayjs().subtract(2, 'day').hour(8).minute(15).format('YYYY-MM-DD HH:mm:ss'),
  assignedAt: dayjs().subtract(2, 'day').hour(8).minute(30).format('YYYY-MM-DD HH:mm:ss'),
  completedAt: null,
  rating: null,
  ratingContent: null,
  tags: ['电梯', '紧急', '公共设施'],
  photos: ['🛗', '⚙️', '🔧'],
};

const mockComments = [
  { id: 1, user: '王师傅', role: 'PROPERTY_STAFF', content: '已联系电梯维保公司，今日上午10点工程师上门检测，初步怀疑是门机控制器故障。', time: dayjs().subtract(1, 'day').hour(9).minute(20).format('YYYY-MM-DD HH:mm:ss') },
  { id: 2, user: '陈先生', role: 'RESIDENT', content: '好的，麻烦尽快！今天早上又卡在5楼了，幸好里面没人。', time: dayjs().subtract(1, 'day').hour(9).minute(35).format('YYYY-MM-DD HH:mm:ss') },
  { id: 3, user: '张主任', role: 'COMMITTEE', content: '业委会已关注此工单，请物业在24小时内给出明确修复时间表。', time: dayjs().subtract(1, 'day').hour(15).minute(10).format('YYYY-MM-DD HH:mm:ss') },
  { id: 4, user: '王师傅', role: 'PROPERTY_STAFF', content: '维保公司已到达现场，正在对主控板进行全面检测，预计下午出检测报告。', time: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss') },
];

const relatedSameHouse = [
  { id: 'TK-00011', title: '3栋门禁系统故障', status: 'CLOSED', type: 'REPAIR', createdAt: '2026-06-10' },
  { id: 'TK-00005', title: '楼道灯不亮', status: 'RATED', type: 'REPAIR', createdAt: '2026-06-05' },
];

const relatedSameBuilding = [
  { id: 'TK-00019', title: '3栋消防通道堆放杂物', status: 'COMPLETED', type: 'COMPLAINT', createdAt: '2026-06-15' },
  { id: 'TK-00017', title: '3栋垃圾桶清运不及时', status: 'PROCESSING', type: 'COMPLAINT', createdAt: '2026-06-14' },
  { id: 'TK-00013', title: '3栋保洁频次建议增加', status: 'RATED', type: 'SUGGESTION', createdAt: '2026-06-12' },
];

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const userStore = useUserStore();
  const { user } = userStore;
  const role = user?.role || 'SUPER_ADMIN';
  const roleName = USER_ROLES[role]?.name || '未知角色';

  const [comment, setComment] = useState('');
  const [assignOpen, setAssignOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const ticket = useMemo(() => mockTicket, []);

  const getDuration = (createdAt: string, completedAt: string | null) => {
    const start = dayjs(createdAt);
    const end = completedAt ? dayjs(completedAt) : dayjs();
    const hours = end.diff(start, 'hour');
    const mins = end.diff(start, 'minute') % 60;
    return `${hours}小时${mins}分`;
  };

  const getSlaProgress = () => {
    const start = dayjs(ticket.createdAt);
    const now = dayjs();
    const total = ticket.priority === 'URGENT' ? 4 : ticket.priority === 'HIGH' ? 8 : 24;
    const elapsed = now.diff(start, 'hour');
    const pct = Math.min(Math.round((elapsed / total) * 100), 100);
    return { pct, remain: Math.max(total - elapsed, 0), total };
  };

  const sla = getSlaProgress();

  const handleSendComment = () => {
    if (!comment.trim()) return;
    message.success('留言已发送 · 已留痕');
    setComment('');
  };

  const handleAssign = async (values: any) => {
    message.success('已重新分配处理人 · 已留痕');
    return true;
  };

  const handleTakeOrder = () => {
    modal.confirm({
      title: '确认接单',
      content: '您确定要承接此工单吗？',
      onOk: () => message.success('已接单 · 已留痕'),
    });
  };

  const handleStartProcess = () => {
    modal.confirm({
      title: '开始处理',
      content: '确定开始处理此工单吗？',
      onOk: () => message.success('已标记处理中 · 已留痕'),
    });
  };

  const handleComplete = () => {
    modal.confirm({
      title: '标记完成',
      content: '确定此工单已处理完成吗？业主将收到评价提醒。',
      onOk: () => message.success('已标记完成 · 已留痕'),
    });
  };

  const handleUrge = () => {
    modal.confirm({
      title: '确认催办',
      content: '确定向处理人发送催办通知吗？',
      onOk: () => message.success('催办通知已发送 · 已留痕'),
    });
  };

  const handleClose = () => {
    modal.confirm({
      title: '关闭工单',
      content: '确定关闭此工单吗？关闭后将无法再操作。',
      okButtonProps: { danger: true },
      onOk: () => message.success('工单已关闭 · 已留痕'),
    });
  };

  const handleSubmitRating = async (values: any) => {
    message.success('评价已提交 · 已留痕');
    return true;
  };

  const handleTransfer = async (values: any) => {
    message.success('已转派处理人 · 已留痕');
    return true;
  };

  const timelineItems: any[] = [
    {
      color: 'blue',
      dot: <FileTextOutlined />,
      children: (
        <div>
          <Text strong>工单提交</Text>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            业主 <Tag color={USER_ROLES.RESIDENT.color} style={{ fontSize: 11 }}>居民</Tag> {ticket.submitterName}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{ticket.createdAt}</Text>
        </div>
      ),
    },
    {
      color: 'cyan',
      dot: <UserSwitchOutlined />,
      children: (
        <div>
          <Text strong>已派单</Text>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            分配给 <Tag color={USER_ROLES.PROPERTY_STAFF.color} style={{ fontSize: 11 }}>物业员工</Tag> {ticket.assigneeName}
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>{ticket.assignedAt}</Text>
        </div>
      ),
    },
    {
      color: 'green',
      dot: <PlayCircleOutlined />,
      children: (
        <div>
          <Text strong>处理中</Text>
          <Paragraph style={{ fontSize: 13, color: '#475569', margin: '6px 0 0 0' }}>
            已联系电梯维保公司，现场对门机控制器、主控板、安全回路进行逐项检测。更换门机编码器，调整门速参数。
          </Paragraph>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['🔧', '⚙️'].map((p, i) => (
              <div key={i} style={{ width: 48, height: 48, background: '#F1F5F9', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{p}</div>
            ))}
          </div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>{ticket.assigneeName} · {dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss')}</Text>
        </div>
      ),
    },
  ];

  if (ticket.completedAt) {
    timelineItems.push({
      color: 'success',
      dot: <CheckCircleOutlined />,
      children: (
        <div>
          <Text strong>已完成</Text>
          <Paragraph style={{ fontSize: 13, margin: '6px 0 0 0' }}>现场处理完毕，电梯运行恢复正常，已空载试运行30分钟无异常。</Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>{ticket.completedAt}</Text>
        </div>
      ),
    });
  }

  if (ticket.rating) {
    timelineItems.push({
      color: 'gold',
      dot: <StarOutlined />,
      children: (
        <div>
          <Text strong>业主评价</Text>
          <div style={{ marginTop: 6 }}>
            <Rate disabled value={ticket.rating} style={{ fontSize: 14, color: '#F59E0B' }} />
          </div>
          <Paragraph style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>{ticket.ratingContent || '服务专业，响应迅速，非常满意！'}</Paragraph>
        </div>
      ),
    });
  }

  return (
    <div style={{ paddingBottom: 32 }}>
      <Tag color="purple" style={{ marginBottom: 16, fontSize: 14, padding: '4px 14px', fontWeight: 500 }}>
        登录身份：{roleName} · 已按分级权限过滤可见范围
      </Tag>

      <Button icon={<ArrowLeftOutlined />} style={{ marginBottom: 16 }} onClick={() => navigate(-1)}>
        返回工单列表
      </Button>

      <Card style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Space wrap size={8} style={{ marginBottom: 12 }}>
              <Text code strong style={{ fontSize: 13, color: '#7C3AED', background: '#F5F3FF', padding: '4px 10px', borderRadius: 6 }}>
                #{ticket.id}
              </Text>
              <Tag color={typeMap[ticket.type].color} style={{ fontSize: 13, padding: '2px 12px' }}>{typeMap[ticket.type].text}</Tag>
              <Tag color={priorityMap[ticket.priority].color} style={{ fontSize: 13, padding: '2px 12px' }}>{priorityMap[ticket.priority].text}</Tag>
              <Tag color={statusMap[ticket.status].color} style={{ fontSize: 13, padding: '2px 12px' }}>{statusMap[ticket.status].text}</Tag>
            </Space>
            <Title level={4} style={{ margin: '8px 0 12px 0' }}>{ticket.title}</Title>
            <Row gutter={[24, 8]}>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>创建时间</Text>
                <div style={{ fontSize: 13, marginTop: 2 }}>{ticket.createdAt}</div>
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>累计耗时</Text>
                <div style={{ fontSize: 13, marginTop: 2, color: '#7C3AED', fontWeight: 500 }}>
                  <ClockCircleOutlined /> {getDuration(ticket.createdAt, ticket.completedAt)}
                </div>
              </Col>
              <Col xs={12} md={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>SLA 响应时效</Text>
                <div style={{ marginTop: 2 }}>
                  <Progress percent={sla.pct} size="small" status={sla.pct > 80 ? 'exception' : 'active'} style={{ width: 140 }} />
                  <Text type="secondary" style={{ fontSize: 11 }}>剩余 {sla.remain}h / {sla.total}h</Text>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={17}>
          <Card size="small" title={<Space><EnvironmentOutlined style={{ color: '#7C3AED' }} />基本信息</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="提交人">
                <Space><Avatar size={22} style={{ backgroundColor: USER_ROLES.RESIDENT.color, fontSize: 12 }}>{ticket.submitterName?.charAt(0)}</Avatar><Text strong>{ticket.submitterName}</Text><Tag color={USER_ROLES.RESIDENT.color} style={{ fontSize: 11 }}>居民</Tag></Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系方式">
                <Space><PhoneOutlined />{ticket.submitterPhone}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="房产位置">
                <Space><HomeOutlined />{ticket.houseInfo}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="标签">{ticket.tags?.map((t: string) => <Tag key={t} color="purple" style={{ fontSize: 11 }}>{t}</Tag>)}</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ticket.photos.concat(['📷']).map((p: string, i: number) => (
                <div key={i} style={{ width: 96, height: 96, background: 'linear-gradient(135deg,#F8FAFC 0%,#E2E8F0 100%)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, border: '1px solid #E2E8F0' }}>
                  {p}
                </div>
              ))}
            </div>
          </Card>

          <Card size="small" title={<Space><FileTextOutlined style={{ color: '#7C3AED' }} />工单内容描述</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <Paragraph style={{ lineHeight: 1.9, color: '#334155', margin: 0, fontSize: 14 }}>
              {ticket.content}
            </Paragraph>
          </Card>

          <Card size="small" title={<Space><PlayCircleOutlined style={{ color: '#7C3AED' }} />状态时间轴</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <Timeline mode="left" items={timelineItems} style={{ paddingTop: 8 }} />
          </Card>

          <Card size="small" title={<Space><SendOutlined style={{ color: '#7C3AED' }} />评论 / 留言区</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }} extra={<Tag color="default">{mockComments.length} 条</Tag>}>
            <div style={{ marginBottom: 16 }}>
              {mockComments.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: 10, marginBottom: 18, paddingBottom: 16, borderBottom: '1px dashed #F1F5F9' }}>
                  <Avatar size={34} style={{ backgroundColor: USER_ROLES[c.role as keyof typeof USER_ROLES]?.color || '#9CA3AF', flexShrink: 0 }}>
                    {c.user.charAt(0)}
                  </Avatar>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <Text strong>{c.user}</Text>
                      <Tag color={USER_ROLES[c.role as keyof typeof USER_ROLES]?.color || 'default'} style={{ fontSize: 11, margin: 0 }}>
                        {USER_ROLES[c.role as keyof typeof USER_ROLES]?.name || c.role}
                      </Tag>
                      <Text type="secondary" style={{ fontSize: 11 }}>{c.time}</Text>
                    </div>
                    <div style={{ color: '#334155', lineHeight: 1.7 }}>{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <TextArea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`以「${roleName}」身份留言...`}
                rows={3}
                style={{ flex: 1, borderRadius: 10 }}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSendComment} style={{ alignSelf: 'flex-end', height: 40, borderRadius: 10 }}>
                发送
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card size="small" title={<Space><UserSwitchOutlined style={{ color: '#7C3AED' }} />分配信息</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <div style={{ textAlign: 'center', padding: '8px 0 16px 0', borderBottom: '1px dashed #F1F5F9', marginBottom: 12 }}>
              <Avatar size={52} style={{ backgroundColor: USER_ROLES.PROPERTY_STAFF.color }}>
                {ticket.assigneeName?.charAt(0)}
              </Avatar>
              <div style={{ fontWeight: 600, marginTop: 8 }}>{ticket.assigneeName || '待分配'}</div>
              <Tag color={USER_ROLES.PROPERTY_STAFF.color} style={{ fontSize: 11, marginTop: 4 }}>物业维修专员</Tag>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                <PhoneOutlined /> {ticket.assigneePhone || '-'}
              </div>
            </div>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Statistic title="派单时间" value={ticket.assignedAt?.split(' ')[0] || '-'} valueStyle={{ fontSize: 14, color: '#334155' }} />
              </Col>
              <Col span={12}>
                <Statistic title="SLA 倒计时" value={`${sla.remain}h`} valueStyle={{ fontSize: 14, color: sla.pct > 80 ? '#EF4444' : '#10B981' }} />
              </Col>
            </Row>
            <Progress percent={sla.pct} status={sla.pct > 80 ? 'exception' : 'active'} style={{ marginTop: 8 }} />
          </Card>

          <Card size="small" title={<Space><PlayCircleOutlined style={{ color: '#7C3AED' }} />操作面板</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role) && ticket.status === 'PENDING' && (
                <Button block type="primary" icon={<UserSwitchOutlined />} onClick={() => setAssignOpen(true)}>
                  分配处理人
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && ticket.status === 'PENDING' && (
                <Button block icon={<CheckCircleOutlined />} onClick={handleTakeOrder}>
                  接单
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && (ticket.status === 'PENDING' || ticket.status === 'ASSIGNED') && (
                <Button block icon={<PlayCircleOutlined />} onClick={handleStartProcess}>
                  开始处理
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_STAFF'].includes(role) && ticket.status === 'PROCESSING' && (
                <Button block type="primary" icon={<CheckCircleOutlined />} onClick={handleComplete}>
                  完成服务
                </Button>
              )}
              {role === 'RESIDENT' && ticket.status === 'COMPLETED' && !ticket.rating && (
                <Button block type="primary" icon={<StarOutlined />} onClick={() => setRatingOpen(true)}>
                  评价服务
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role) && (
                <Button block icon={<BellOutlined />} onClick={handleUrge}>
                  催办
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role) && (
                <Button block icon={<SwapOutlined />} onClick={() => setTransferOpen(true)}>
                  转派处理人
                </Button>
              )}
              {['SUPER_ADMIN', 'PROPERTY_ADMIN'].includes(role) && (
                <Button block danger icon={<CloseCircleOutlined />} onClick={handleClose}>
                  关闭工单
                </Button>
              )}
            </Space>
          </Card>

          <Card size="small" title={<Space><HomeOutlined style={{ color: '#7C3AED' }} />相关工单</Space>} style={{ borderRadius: 12, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Divider orientation="left" style={{ margin: '4px 0 8px 0', fontSize: 12 }} plain>同户历史 Top 2</Divider>
            <List
              size="small"
              dataSource={relatedSameHouse}
              renderItem={(item) => (
                <List.Item style={{ cursor: 'pointer', padding: '6px 0' }} onClick={() => navigate(`/tickets/${item.id}`)}>
                  <List.Item.Meta
                    avatar={<Tag color={typeMap[item.type as keyof typeof typeMap]?.color || 'default'} style={{ fontSize: 11 }}>{typeMap[item.type as keyof typeof typeMap]?.text}</Tag>}
                    title={<Text style={{ fontSize: 12 }} ellipsis>{item.title}</Text>}
                    description={
                      <Space size={8}>
                        <Tag color={statusMap[item.status as keyof typeof statusMap]?.color || 'default'} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>{statusMap[item.status as keyof typeof statusMap]?.text}</Tag>
                        <Text type="secondary" style={{ fontSize: 10 }}>{item.createdAt}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <Divider orientation="left" style={{ margin: '8px 0', fontSize: 12 }} plain>同栋同类型 Top 3</Divider>
            <List
              size="small"
              dataSource={relatedSameBuilding}
              renderItem={(item) => (
                <List.Item style={{ cursor: 'pointer', padding: '6px 0' }} onClick={() => navigate(`/tickets/${item.id}`)}>
                  <List.Item.Meta
                    avatar={<Tag color={typeMap[item.type as keyof typeof typeMap]?.color || 'default'} style={{ fontSize: 11 }}>{typeMap[item.type as keyof typeof typeMap]?.text}</Tag>}
                    title={<Text style={{ fontSize: 12 }} ellipsis>{item.title}</Text>}
                    description={
                      <Space size={8}>
                        <Tag color={statusMap[item.status as keyof typeof statusMap]?.color || 'default'} style={{ fontSize: 10, padding: '0 6px', margin: 0 }}>{statusMap[item.status as keyof typeof statusMap]?.text}</Tag>
                        <Text type="secondary" style={{ fontSize: 10 }}>{item.createdAt}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <ModalForm
        title="分配处理人"
        open={assignOpen}
        onOpenChange={setAssignOpen}
        onFinish={handleAssign}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect
          name="assigneeId"
          label="选择处理人"
          rules={[{ required: true }]}
          options={[
            { label: '李师傅 - 水电维修', value: 'staff-1' },
            { label: '王师傅 - 综合维修', value: 'staff-2' },
            { label: '张师傅 - 保洁绿化', value: 'staff-3' },
          ]}
        />
        <ProFormTextArea name="remark" label="派单备注" placeholder="可选" fieldProps={{ rows: 2 }} />
      </ModalForm>

      <ModalForm
        title="评价服务"
        open={ratingOpen}
        onOpenChange={setRatingOpen}
        onFinish={handleSubmitRating}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect
          name="rating"
          label="服务评分"
          rules={[{ required: true }]}
          options={[
            { label: '⭐ 1星 - 非常不满意', value: 1 },
            { label: '⭐⭐ 2星 - 不满意', value: 2 },
            { label: '⭐⭐⭐ 3星 - 一般', value: 3 },
            { label: '⭐⭐⭐⭐ 4星 - 满意', value: 4 },
            { label: '⭐⭐⭐⭐⭐ 5星 - 非常满意', value: 5 },
          ]}
        />
        <ProFormTextArea name="ratingContent" label="评价内容" placeholder="请输入您的评价..." fieldProps={{ rows: 4 }} />
      </ModalForm>

      <ModalForm
        title="转派处理人"
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onFinish={handleTransfer}
        width={480}
        modalProps={{ destroyOnClose: true }}
      >
        <ProFormSelect
          name="newAssigneeId"
          label="转派给"
          rules={[{ required: true }]}
          options={[
            { label: '李师傅 - 水电维修', value: 'staff-1' },
            { label: '王师傅 - 综合维修', value: 'staff-2' },
            { label: '张师傅 - 保洁绿化', value: 'staff-3' },
          ]}
        />
        <ProFormTextArea name="reason" label="转派原因" placeholder="请说明转派原因..." rules={[{ required: true }]} fieldProps={{ rows: 3 }} />
      </ModalForm>
    </div>
  );
}
