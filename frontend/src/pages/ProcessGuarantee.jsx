import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Space, Tabs, Modal, Descriptions, List, Avatar, Timeline, Typography, Divider, Steps, message } from 'antd';
import { UserOutlined, WalletOutlined, FileTextOutlined, SafetyOutlined, ClockCircleOutlined, AlertOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { profileAPI, adminAPI } from '../utils/api';
import { useAuth } from '../App';

const { Title } = Typography;
const { Step } = Steps;

const PROCESS_STEPS = [
  { title: '申请报名', icon: <UserOutlined /> },
  { title: '保证金托管', icon: <WalletOutlined /> },
  { title: '合同签署', icon: <SafetyOutlined /> },
  { title: '考勤打卡', icon: <ClockCircleOutlined /> },
  { title: '工资支付', icon: <WalletOutlined /> },
];

const demoMatches = [
  {
    id: 1,
    job_id: 1,
    title: '地铁站木工班组补员',
    company_name: '中建三局华北项目部',
    daily_salary: 480,
    match_score: 92,
    status: 'in_progress',
    created_at: '2026-06-01T09:30:00',
    worker_deposit: 500,
    deposit_status: 'held',
    contract_status: 'signed',
    attendance_days: 10,
    total_hours: 100,
    payment_amount: 0,
    payment_status: 'pending'
  },
  {
    id: 2,
    job_id: 3,
    title: '钢筋工短期支援',
    company_name: '华东基础工程有限公司',
    daily_salary: 420,
    match_score: 88,
    status: 'completed',
    created_at: '2026-05-15T10:15:00',
    worker_deposit: 300,
    deposit_status: 'released',
    contract_status: 'terminated',
    attendance_days: 15,
    total_hours: 150,
    payment_amount: 6300,
    payment_status: 'released'
  },
  {
    id: 3,
    job_id: 2,
    title: '混凝土工急招',
    company_name: '北京建工集团',
    daily_salary: 380,
    match_score: 85,
    status: 'accepted',
    created_at: '2026-06-03T14:00:00',
    worker_deposit: 300,
    deposit_status: 'held',
    contract_status: 'signed',
    attendance_days: 0,
    total_hours: 0,
    payment_amount: 0,
    payment_status: 'pending'
  }
];

const demoPayments = [
  { id: 1, type: 'deposit', amount: 500, status: 'held', title: '地铁站木工班组补员', created_at: '2026-06-01T10:00:00' },
  { id: 2, type: 'deposit', amount: 300, status: 'released', title: '钢筋工短期支援', created_at: '2026-05-15T11:00:00' },
  { id: 3, type: 'salary', amount: 6300, status: 'released', title: '钢筋工短期支援', created_at: '2026-06-01T15:00:00' },
  { id: 4, type: 'deposit', amount: 300, status: 'held', title: '混凝土工急招', created_at: '2026-06-03T15:00:00' },
];

const demoContracts = [
  { id: 1, title: '地铁站木工班组补员 - 劳务合同', status: 'signed', template_name: '标准劳务合同模板A', created_at: '2026-06-02T09:00:00', signed_at: '2026-06-02T10:30:00' },
  { id: 2, title: '钢筋工短期支援 - 劳务合同', status: 'terminated', template_name: '短期用工合同模板B', created_at: '2026-05-16T09:00:00', signed_at: '2026-05-16T10:00:00' },
  { id: 3, title: '混凝土工急招 - 劳务合同', status: 'signed', template_name: '标准劳务合同模板A', created_at: '2026-06-04T09:00:00', signed_at: '2026-06-04T10:00:00' },
];

const demoAttendances = [
  { id: 1, job_title: '地铁站木工班组补员', date: '2026-06-04', check_in: '08:02', check_out: '18:05', hours: 10, confirmed: 1, confirm_by: '李工' },
  { id: 2, job_title: '地铁站木工班组补员', date: '2026-06-03', check_in: '08:05', check_out: '18:10', hours: 10, confirmed: 1, confirm_by: '李工' },
  { id: 3, job_title: '地铁站木工班组补员', date: '2026-06-02', check_in: '08:01', check_out: '18:03', hours: 10, confirmed: 1, confirm_by: '李工' },
  { id: 4, job_title: '地铁站木工班组补员', date: '2026-06-01', check_in: '08:03', check_out: '18:08', hours: 10, confirmed: 1, confirm_by: '李工' },
  { id: 5, job_title: '钢筋工短期支援', date: '2026-05-30', check_in: '08:00', check_out: '18:00', hours: 10, confirmed: 1, confirm_by: '王工' },
];

const demoDisputes = [
  { id: 1, title: '钢筋工短期支援 - 加班工资争议', type: 'wage_dispute', status: 'resolved', created_at: '2026-06-02T09:00:00', plaintiff: '工友A', defendant: '华东基础工程有限公司' },
];

function ProcessGuarantee() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [matches, setMatches] = useState([]);
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await profileAPI.getMyJobs();
      setMatches(res.data?.length > 0 ? res.data : demoMatches);
      setPayments(demoPayments);
      setContracts(demoContracts);
      setAttendances(demoAttendances);
      setDisputes(demoDisputes);
    } catch (error) {
      setMatches(demoMatches);
      setPayments(demoPayments);
      setContracts(demoContracts);
      setAttendances(demoAttendances);
      setDisputes(demoDisputes);
    }
  };

  const handleViewDetail = (match) => {
    setSelectedMatch(match);
    setDetailModal(true);
  };

  const getCurrentStep = (match) => {
    if (match.status === 'pending') return 0;
    if (match.status === 'accepted') return 2;
    if (match.status === 'in_progress') return 3;
    if (match.status === 'completed') return 5;
    return 0;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待确认' },
      accepted: { color: 'blue', text: '已通过' },
      in_progress: { color: 'orange', text: '进行中' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已拒绝' },
      cancelled: { color: 'red', text: '已取消' },
    };
    const s = statusMap[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const overviewStats = [
    { title: '申请记录', value: matches.length, icon: <UserOutlined />, color: '#1890ff' },
    { title: '保证金托管', value: payments.filter(p => p.type === 'deposit').length, icon: <WalletOutlined />, color: '#722ed1' },
    { title: '合同签署', value: contracts.filter(c => c.status === 'signed').length, icon: <SafetyOutlined />, color: '#52c41a' },
    { title: '打卡记录', value: attendances.length, icon: <ClockCircleOutlined />, color: '#fa8c16' },
    { title: '工资支付', value: payments.filter(p => p.type === 'salary').length, icon: <WalletOutlined />, color: '#3f8600' },
    { title: '纠纷记录', value: disputes.length, icon: <AlertOutlined />, color: '#cf1322' },
  ];

  const matchColumns = [
    { title: '招工标题', dataIndex: 'title', key: 'title', render: (t, r) => <a onClick={() => navigate(`/jobs/${r.job_id}`)}>{t}</a> },
    { title: '企业', dataIndex: 'company_name', key: 'company_name' },
    { title: '日薪', dataIndex: 'daily_salary', key: 'daily_salary', render: v => `¥${v}/天` },
    { title: '匹配度', dataIndex: 'match_score', key: 'match_score', render: s => <Tag color="green">{s}%</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => getStatusTag(s) },
    { title: '保证金', dataIndex: 'worker_deposit', key: 'worker_deposit', render: v => v ? `¥${v}` : '-' },
    { title: '考勤天数', dataIndex: 'attendance_days', key: 'attendance_days', render: d => d ? `${d}天` : '-' },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', render: t => t?.split('T')[0] },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ];

  const paymentColumns = [
    { title: '项目', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', render: t => t === 'deposit' ? <Tag color="purple">保证金</Tag> : <Tag color="green">工资</Tag> },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => s === 'held' ? <Tag color="orange">托管中</Tag> : <Tag color="green">已解冻</Tag> },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: t => t?.split('T')[0] },
  ];

  const contractColumns = [
    { title: '合同名称', dataIndex: 'title', key: 'title' },
    { title: '模板', dataIndex: 'template_name', key: 'template_name' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => s === 'signed' ? <Tag color="green">已签署</Tag> : <Tag color="gray">已终止</Tag> },
    { title: '签署时间', dataIndex: 'signed_at', key: 'signed_at', render: t => t?.split('T')[0] },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>查看合同</Button>
    }
  ];

  const attendanceColumns = [
    { title: '项目', dataIndex: 'job_title', key: 'job_title' },
    { title: '日期', dataIndex: 'date', key: 'date' },
    { title: '上班', dataIndex: 'check_in', key: 'check_in' },
    { title: '下班', dataIndex: 'check_out', key: 'check_out' },
    { title: '工时', dataIndex: 'hours', key: 'hours', render: h => `${h}小时` },
    { title: '确认状态', dataIndex: 'confirmed', key: 'confirmed', render: c => c ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag> },
    { title: '确认人', dataIndex: 'confirm_by', key: 'confirm_by' },
  ];

  const disputeColumns = [
    { title: '纠纷标题', dataIndex: 'title', key: 'title' },
    { title: '类型', dataIndex: 'type', key: 'type', render: t => t === 'wage_dispute' ? '工资争议' : t === 'attendance' ? '考勤争议' : '其他' },
    { title: '申诉方', dataIndex: 'plaintiff', key: 'plaintiff' },
    { title: '被诉方', dataIndex: 'defendant', key: 'defendant' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => s === 'resolved' ? <Tag color="green">已解决</Tag> : <Tag color="orange">处理中</Tag> },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', render: t => t?.split('T')[0] },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>查看详情</Button>
    }
  ];

  return (
    <div className="page-container">
      <Title level={4} style={{ marginBottom: 16 }}>
        过程保障中心
      </Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {overviewStats.map((stat, index) => (
          <Col xs={12} sm={8} md={4} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={{ color: stat.color }}
                prefix={stat.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="过程保障链路说明"
        style={{ marginBottom: 24 }}
        extra={<Button size="small" type="primary" onClick={() => navigate('/jobs')}>去申请岗位</Button>}
      >
        <Steps current={3} size="small">
          {PROCESS_STEPS.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
        <Divider orientation="left">各环节说明</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="1. 申请报名">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>工友/班组提交申请，企业审核确认。平台智能匹配推荐，匹配度越高优先级越高。</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="2. 保证金托管">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>工友缴纳履约保证金，由平台第三方托管。完工验收合格后解冻，保障双方权益。</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="3. 合同签署">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>使用平台标准劳务合同模板，双方在线签署，平台备案留存，保障合法权益。</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="4. 考勤打卡">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>现场NFC/蓝牙打卡，定位核验防作弊。企业每日确认，工时数据链上存证。</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="5. 工资支付">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>按日薪×确认工时自动计算，工资由平台监管发放，杜绝拖欠。</p>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card size="small" title="6. 纠纷调解">
              <p style={{ color: '#666', fontSize: 12, margin: 0 }}>如发生争议，平台提供调解仲裁服务。根据链上数据快速判定，保障公平公正。</p>
            </Card>
          </Col>
        </Row>
      </Card>

      <Tabs
        items={[
          {
            key: 'matches',
            label: '申请记录',
            children: (
              <Card>
                <Table
                  columns={matchColumns}
                  dataSource={matches}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'deposits',
            label: '保证金',
            children: (
              <Card>
                <Table
                  columns={paymentColumns}
                  dataSource={payments.filter(p => p.type === 'deposit')}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'contracts',
            label: '合同管理',
            children: (
              <Card>
                <Table
                  columns={contractColumns}
                  dataSource={contracts}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'attendance',
            label: '考勤记录',
            children: (
              <Card>
                <Table
                  columns={attendanceColumns}
                  dataSource={attendances}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'payments',
            label: '工资支付',
            children: (
              <Card>
                <Table
                  columns={paymentColumns}
                  dataSource={payments.filter(p => p.type === 'salary')}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'disputes',
            label: '纠纷调解',
            children: (
              <Card>
                <Table
                  columns={disputeColumns}
                  dataSource={disputes}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          }
        ]}
      />

      <Modal
        title="申请详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={<Button onClick={() => setDetailModal(false)}>关闭</Button>}
      >
        {selectedMatch && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="招工标题">{selectedMatch.title}</Descriptions.Item>
              <Descriptions.Item label="企业">{selectedMatch.company_name}</Descriptions.Item>
              <Descriptions.Item label="日薪">¥{selectedMatch.daily_salary}/天</Descriptions.Item>
              <Descriptions.Item label="匹配度">{selectedMatch.match_score}%</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>
                {getStatusTag(selectedMatch.status)}
              </Descriptions.Item>
              <Descriptions.Item label="保证金">¥{selectedMatch.worker_deposit} ({selectedMatch.deposit_status === 'held' ? '托管中' : '已解冻'})</Descriptions.Item>
              <Descriptions.Item label="合同状态">{selectedMatch.contract_status === 'signed' ? '已签署' : '未签署'}</Descriptions.Item>
              <Descriptions.Item label="考勤">{selectedMatch.attendance_days}天 / {selectedMatch.total_hours}小时</Descriptions.Item>
              <Descriptions.Item label="工资支付">{selectedMatch.payment_amount > 0 ? `¥${selectedMatch.payment_amount}` : '待支付'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">进度跟踪</Divider>
            <Steps
              direction="vertical"
              size="small"
              current={getCurrentStep(selectedMatch)}
              status={selectedMatch.status === 'completed' ? 'finish' : 'process'}
            >
              <Step title="申请提交" description={selectedMatch.created_at?.split('T')[0]} />
              <Step title="保证金托管" description={`¥${selectedMatch.worker_deposit} 已托管`} />
              <Step title="合同签署" description="合同已在线签署" />
              <Step title="施工进行中" description={`已打卡 ${selectedMatch.attendance_days} 天`} />
              <Step title="工资结算" description={selectedMatch.payment_amount > 0 ? '已支付 ¥' + selectedMatch.payment_amount : '待结算'} />
            </Steps>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProcessGuarantee;
