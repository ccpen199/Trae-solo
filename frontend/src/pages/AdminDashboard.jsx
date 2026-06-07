import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Tabs, List, Typography, Button, Space, Modal, Descriptions, Progress, Alert, Badge } from 'antd';
import { 
  TeamOutlined, 
  ShopOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  SafetyOutlined,
  FireOutlined,
  AuditOutlined,
  WalletOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
  EyeOutlined,
  CloseCircleOutlined,
  CheckCircleTwoTone,
  ExclamationCircleOutlined,
  UserOutlined,
  AlertOutlined,
  FileProtectOutlined
} from '@ant-design/icons';
import { adminAPI } from '../utils/api';

const { Title, Text } = Typography;
const { confirm } = Modal;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [safetyTips, setSafetyTips] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certAudits, setCertAudits] = useState([]);
  const [safetyAudits, setSafetyAudits] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [detailModal, setDetailModal] = useState({ visible: false, data: null, type: '' });

  useEffect(() => {
    loadData();
    loadAuditData();
  }, []);

  const loadAuditData = () => {
    setTimeout(() => {
      setCertAudits([
        { id: 1, workerName: '张三', phone: '138****1234', certType: '电工证', certNumber: '京A123456', uploadDate: '2025-01-15', ocrConfidence: 96.5, status: 'pending' },
        { id: 2, workerName: '李四', phone: '139****5678', certType: '焊工证', certNumber: '京B789012', uploadDate: '2025-01-14', ocrConfidence: 93.2, status: 'pending' },
        { id: 3, workerName: '王五', phone: '137****9012', certType: '架子工证', certNumber: '京C345678', uploadDate: '2025-01-13', ocrConfidence: 98.1, status: 'approved' },
        { id: 4, workerName: '赵六', phone: '136****3456', certType: '塔吊司机证', certNumber: '京D901234', uploadDate: '2025-01-12', ocrConfidence: 95.7, status: 'rejected' },
      ]);
      setSafetyAudits([
        { id: 1, companyName: '中建一局', jobTitle: '朝阳区住宅小区项目', materialType: '安全生产许可证', uploadDate: '2025-01-15', status: 'pending' },
        { id: 2, companyName: '中铁建设', jobTitle: '海淀区写字楼项目', materialType: '建筑企业资质证书', uploadDate: '2025-01-14', status: 'pending' },
        { id: 3, companyName: '北京建工', jobTitle: '西城区商业综合体项目', materialType: '三类人员安全考核证', uploadDate: '2025-01-13', status: 'approved' },
      ]);
      setContracts([
        { id: 1, contractNumber: 'CT202501001', jobTitle: '朝阳区住宅小区项目', workerName: '张三', companyName: '中建一局', signDate: '2025-01-10', startDate: '2025-01-15', endDate: '2025-03-15', dailySalary: 500, status: 'active' },
        { id: 2, contractNumber: 'CT202501002', jobTitle: '海淀区写字楼项目', workerName: '李四', companyName: '中铁建设', signDate: '2025-01-09', startDate: '2025-01-12', endDate: '2025-04-12', dailySalary: 450, status: 'active' },
        { id: 3, contractNumber: 'CT202501003', jobTitle: '西城区商业综合体项目', workerName: '王五', companyName: '北京建工', signDate: '2025-01-05', startDate: '2025-01-08', endDate: '2025-02-08', dailySalary: 600, status: 'expired' },
        { id: 4, contractNumber: 'CT202501004', jobTitle: '丰台区市政工程', workerName: '赵六', companyName: '市政集团', signDate: '2025-01-01', startDate: '2025-01-03', endDate: '2025-06-03', dailySalary: 480, status: 'active' },
      ]);
      setPayments([
        { id: 1, paymentNumber: 'PAY20250115001', workerName: '张三', jobTitle: '朝阳区住宅小区项目', amount: 15000, days: 30, payDate: '2025-01-15', status: 'paid' },
        { id: 2, paymentNumber: 'PAY20250115002', workerName: '李四', jobTitle: '海淀区写字楼项目', amount: 13500, days: 30, payDate: '2025-01-15', status: 'paid' },
        { id: 3, paymentNumber: 'PAY20250115003', workerName: '赵六', jobTitle: '丰台区市政工程', amount: 14400, days: 30, payDate: '2025-01-15', status: 'pending' },
      ]);
      setDisputes([
        { id: 1, disputeNumber: 'DP202501001', jobTitle: '朝阳区住宅小区项目', workerName: '张三', companyName: '中建一局', type: '工资争议', amount: 1500, submitDate: '2025-01-14', description: '加班费计算有误，少算3天', status: 'mediating', handler: '李审核员' },
        { id: 2, disputeNumber: 'DP202501002', jobTitle: '通州区产业园项目', workerName: '钱七', companyName: '华夏建设', type: '工期争议', amount: 0, submitDate: '2025-01-12', description: '提前完工奖金未支付', status: 'resolved', handler: '王审核员' },
      ]);
    }, 500);
  };

  const loadData = async () => {
    try {
      const [statsRes, tipsRes, workersRes, companiesRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getSafetyTips(),
        adminAPI.getWorkers().catch(() => ({ data: [] })),
        adminAPI.getCompanies().catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setSafetyTips(tipsRes.data);
      setWorkers(workersRes.data || []);
      setCompanies(companiesRes.data || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (type, id) => {
    confirm({
      title: '确认审核通过？',
      icon: <CheckCircleTwoTone twoToneColor="#52c41a" />,
      content: '审核通过后将正式生效',
      onOk() {
        if (type === 'cert') {
          setCertAudits(certAudits.map(item => item.id === id ? { ...item, status: 'approved' } : item));
        } else {
          setSafetyAudits(safetyAudits.map(item => item.id === id ? { ...item, status: 'approved' } : item));
        }
      },
    });
  };

  const handleReject = (type, id) => {
    confirm({
      title: '确认驳回？',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: '请在后续流程中说明驳回原因',
      onOk() {
        if (type === 'cert') {
          setCertAudits(certAudits.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
        } else {
          setSafetyAudits(safetyAudits.map(item => item.id === id ? { ...item, status: 'rejected' } : item));
        }
      },
    });
  };

  const handleViewDetail = (type, data) => {
    setDetailModal({ visible: true, data, type });
  };

  const workerColumns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '技能', dataIndex: 'skills', key: 'skills', render: s => s || '-' },
    { title: '工龄', dataIndex: 'experience_years', key: 'experience_years', render: y => y ? `${y}年` : '-' },
    { title: '信用分', dataIndex: 'credit_score', key: 'credit_score' },
    {
      title: '认证',
      dataIndex: 'real_name_verified',
      key: 'real_name_verified',
      render: v => v ? <Tag color="green">已实名</Tag> : <Tag color="orange">未实名</Tag>
    }
  ];

  const companyColumns = [
    { title: '企业名称', dataIndex: 'company_name', key: 'company_name', render: n => n || '-' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person', render: n => n || '-' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone', render: n => n || '-' },
    { title: '地址', dataIndex: 'address', key: 'address', render: n => n || '-' },
    {
      title: '资质',
      dataIndex: 'license_verified',
      key: 'license_verified',
      render: v => v ? <Tag color="green">已认证</Tag> : <Tag color="orange">未认证</Tag>
    }
  ];

  const certAuditColumns = [
    { title: '工友姓名', dataIndex: 'workerName', key: 'workerName' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '证书类型', dataIndex: 'certType', key: 'certType' },
    { title: '证书编号', dataIndex: 'certNumber', key: 'certNumber' },
    { title: 'OCR置信度', dataIndex: 'ocrConfidence', key: 'ocrConfidence', render: v => `${v}%` },
    { title: '上传日期', dataIndex: 'uploadDate', key: 'uploadDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const map = { pending: 'orange', approved: 'green', rejected: 'red' };
        const text = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
        return <Tag color={map[v]}>{text[v]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail('cert', record)}>查看</Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove('cert', record.id)}>通过</Button>
              <Button size="small" danger onClick={() => handleReject('cert', record.id)}>驳回</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const safetyAuditColumns = [
    { title: '企业名称', dataIndex: 'companyName', key: 'companyName' },
    { title: '招工项目', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: '材料类型', dataIndex: 'materialType', key: 'materialType' },
    { title: '上传日期', dataIndex: 'uploadDate', key: 'uploadDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const map = { pending: 'orange', approved: 'green', rejected: 'red' };
        const text = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
        return <Tag color={map[v]}>{text[v]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail('safety', record)}>查看</Button>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" onClick={() => handleApprove('safety', record.id)}>通过</Button>
              <Button size="small" danger onClick={() => handleReject('safety', record.id)}>驳回</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  const contractColumns = [
    { title: '合同编号', dataIndex: 'contractNumber', key: 'contractNumber' },
    { title: '招工项目', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: '工友', dataIndex: 'workerName', key: 'workerName' },
    { title: '企业', dataIndex: 'companyName', key: 'companyName' },
    { title: '日薪', dataIndex: 'dailySalary', key: 'dailySalary', render: v => `¥${v}` },
    { title: '合同期限', key: 'period', render: (_, r) => `${r.startDate} ~ ${r.endDate}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const map = { active: 'green', expired: 'default', terminated: 'red' };
        const text = { active: '履行中', expired: '已到期', terminated: '已终止' };
        return <Tag color={map[v]}>{text[v]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail('contract', record)}>查看详情</Button>
      )
    }
  ];

  const paymentColumns = [
    { title: '支付单号', dataIndex: 'paymentNumber', key: 'paymentNumber' },
    { title: '工友', dataIndex: 'workerName', key: 'workerName' },
    { title: '项目', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: '出勤天数', dataIndex: 'days', key: 'days', render: v => `${v}天` },
    { title: '支付金额', dataIndex: 'amount', key: 'amount', render: v => <Text strong style={{ color: '#52c41a' }}>¥{v.toLocaleString()}</Text> },
    { title: '支付日期', dataIndex: 'payDate', key: 'payDate' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const map = { paid: 'green', pending: 'orange', failed: 'red' };
        const text = { paid: '已支付', pending: '待支付', failed: '支付失败' };
        return <Tag color={map[v]}>{text[v]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail('payment', record)}>复查</Button>
      )
    }
  ];

  const disputeColumns = [
    { title: '纠纷编号', dataIndex: 'disputeNumber', key: 'disputeNumber' },
    { title: '项目', dataIndex: 'jobTitle', key: 'jobTitle' },
    { title: '工友', dataIndex: 'workerName', key: 'workerName' },
    { title: '企业', dataIndex: 'companyName', key: 'companyName' },
    { title: '纠纷类型', dataIndex: 'type', key: 'type' },
    { title: '涉及金额', dataIndex: 'amount', key: 'amount', render: v => v > 0 ? `¥${v}` : '-' },
    { title: '处理人', dataIndex: 'handler', key: 'handler' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: v => {
        const map = { pending: 'orange', mediating: 'blue', resolved: 'green', closed: 'default' };
        const text = { pending: '待处理', mediating: '调解中', resolved: '已解决', closed: '已关闭' };
        return <Tag color={map[v]}>{text[v]}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail('dispute', record)}>复查</Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <Title level={3}>管理后台</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="工友总数"
              value={stats?.overview?.totalWorkers || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="企业总数"
              value={stats?.overview?.totalCompanies || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="招工总数"
              value={stats?.overview?.totalJobs || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功匹配"
              value={stats?.overview?.totalMatches || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs
        items={[
          {
            key: 'heatmap',
            label: '用工热力图',
            children: (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="工种需求排行">
                    <Table
                      dataSource={stats?.skillStats || []}
                      columns={[
                        { title: '工种', dataIndex: 'skill', key: 'skill' },
                        { title: '需求数量', dataIndex: 'count', key: 'count' }
                      ]}
                      rowKey="skill"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="区域薪资水平">
                    <Table
                      dataSource={stats?.regionStats || []}
                      columns={[
                        { title: '地区', dataIndex: 'location', key: 'location' },
                        { title: '岗位数', dataIndex: 'count', key: 'count' },
                        { title: '平均日薪', dataIndex: 'avg_salary', key: 'avg_salary', render: v => `¥${Math.round(v)}` }
                      ]}
                      rowKey="location"
                      pagination={false}
                      size="small"
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'workers',
            label: '工友管理',
            children: (
              <Card>
                <Table
                  columns={workerColumns}
                  dataSource={workers}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )
          },
          {
            key: 'companies',
            label: '企业管理',
            children: (
              <Card>
                <Table
                  columns={companyColumns}
                  dataSource={companies}
                  rowKey="id"
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            )
          },
          {
            key: 'safety',
            label: '安全知识库',
            children: (
              <Card title="安全知识">
                <List
                  dataSource={safetyTips}
                  renderItem={item => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        avatar={item.is_daily_tip ? 
                          <SafetyOutlined style={{ color: '#faad14', fontSize: 24 }} /> :
                          <FireOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {item.title}
                            {item.is_daily_tip && <Tag color="gold">每日提醒</Tag>}
                            <Tag color="blue">{item.category}</Tag>
                          </div>
                        }
                        description={item.content}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )
          },
          {
            key: 'audit',
            label: '审核看板',
            icon: <AuditOutlined />,
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="待审核证书"
                        value={certAudits.filter(c => c.status === 'pending').length}
                        prefix={<IdcardOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="待审核安全材料"
                        value={safetyAudits.filter(s => s.status === 'pending').length}
                        prefix={<FileProtectOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="今日审核通过"
                        value={certAudits.filter(c => c.status === 'approved').length + safetyAudits.filter(s => s.status === 'approved').length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="今日审核驳回"
                        value={certAudits.filter(c => c.status === 'rejected').length + safetyAudits.filter(s => s.status === 'rejected').length}
                        prefix={<CloseCircleOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>

                <Alert
                  message="审核责任说明"
                  description="审核人员需对提交的材料真实性负责，证书审核需核对OCR识别结果与原件照片的一致性，安全材料需检查完整性和有效期。"
                  type="info"
                  showIcon
                />

                <Card title="工友证书审核" extra={<Tag color="orange">{certAudits.filter(c => c.status === 'pending').length} 条待处理</Tag>}>
                  <Table
                    columns={certAuditColumns}
                    dataSource={certAudits}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>

                <Card title="企业安全材料审核" extra={<Tag color="orange">{safetyAudits.filter(s => s.status === 'pending').length} 条待处理</Tag>}>
                  <Table
                    columns={safetyAuditColumns}
                    dataSource={safetyAudits}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Space>
            )
          },
          {
            key: 'contracts',
            label: '合同复查',
            icon: <SolutionOutlined />,
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="合同复查说明"
                  description="所有劳务合同需平台备案，确保日薪标准、工期、结算方式清晰明确。复查重点：合同期限与招工工期一致性、薪资标准符合区域行情、双方权责清晰。"
                  type="warning"
                  showIcon
                />
                <Card title="合同管理">
                  <Table
                    columns={contractColumns}
                    dataSource={contracts}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Space>
            )
          },
          {
            key: 'payments',
            label: '工资复查',
            icon: <WalletOutlined />,
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="工资支付复查说明"
                  description="工资支付需与考勤记录、合同约定日薪一致，确保足额及时发放。平台对每笔支付进行自动核验，异常支付将触发预警。"
                  type="warning"
                  showIcon
                />
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="本月已支付"
                        value={payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)}
                        prefix="¥"
                        valueStyle={{ color: '#52c41a' }}
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="待支付金额"
                        value={payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)}
                        prefix="¥"
                        valueStyle={{ color: '#fa8c16' }}
                        suffix="元"
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="支付及时率"
                        value={98.5}
                        suffix="%"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                </Row>
                <Card title="工资支付记录">
                  <Table
                    columns={paymentColumns}
                    dataSource={payments}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Space>
            )
          },
          {
            key: 'disputes',
            label: '纠纷复查',
            icon: <AlertOutlined />,
            children: (
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="纠纷调解说明"
                  description="平台作为中立第三方，依据合同约定、考勤记录、聊天证据进行调解。调解原则：24小时响应、3个工作日内给出处理意见、全程留痕可追溯。"
                  type="error"
                  showIcon
                />
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="待处理纠纷"
                        value={disputes.filter(d => d.status === 'pending' || d.status === 'mediating').length}
                        prefix={<ExclamationCircleOutlined />}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="已解决纠纷"
                        value={disputes.filter(d => d.status === 'resolved').length}
                        prefix={<CheckCircleOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Card>
                      <Statistic
                        title="平均调解时长"
                        value={2.5}
                        suffix="天"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                </Row>
                <Card title="纠纷管理">
                  <Table
                    columns={disputeColumns}
                    dataSource={disputes}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {detailModal.type === 'cert' && <><IdcardOutlined /> 证书详情</>}
            {detailModal.type === 'safety' && <><FileProtectOutlined /> 安全材料详情</>}
            {detailModal.type === 'contract' && <><SolutionOutlined /> 合同详情</>}
            {detailModal.type === 'payment' && <><WalletOutlined /> 工资支付详情</>}
            {detailModal.type === 'dispute' && <><AlertOutlined /> 纠纷详情</>}
          </div>
        }
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, data: null, type: '' })}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailModal({ visible: false, data: null, type: '' })}>
            关闭
          </Button>
        ]}
      >
        {detailModal.data && detailModal.type === 'cert' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="工友姓名">{detailModal.data.workerName}</Descriptions.Item>
            <Descriptions.Item label="手机号">{detailModal.data.phone}</Descriptions.Item>
            <Descriptions.Item label="证书类型">{detailModal.data.certType}</Descriptions.Item>
            <Descriptions.Item label="证书编号">{detailModal.data.certNumber}</Descriptions.Item>
            <Descriptions.Item label="OCR置信度" span={2}>
              <Progress percent={detailModal.data.ocrConfidence} status={detailModal.data.ocrConfidence >= 95 ? 'success' : 'exception'} />
            </Descriptions.Item>
            <Descriptions.Item label="上传日期">{detailModal.data.uploadDate}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detailModal.data.status === 'pending' && <Tag color="orange">待审核</Tag>}
              {detailModal.data.status === 'approved' && <Tag color="green">已通过</Tag>}
              {detailModal.data.status === 'rejected' && <Tag color="red">已驳回</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="OCR识别结果" span={2}>
              <Alert
                message="OCR智能识别已完成"
                description="系统已自动识别证书信息：电工证 京A123456，持证人张三，有效期至2028-12-31。请核对与上传照片一致性。"
                type="info"
                showIcon
              />
            </Descriptions.Item>
          </Descriptions>
        )}

        {detailModal.data && detailModal.type === 'safety' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="企业名称">{detailModal.data.companyName}</Descriptions.Item>
            <Descriptions.Item label="招工项目">{detailModal.data.jobTitle}</Descriptions.Item>
            <Descriptions.Item label="材料类型">{detailModal.data.materialType}</Descriptions.Item>
            <Descriptions.Item label="上传日期">{detailModal.data.uploadDate}</Descriptions.Item>
            <Descriptions.Item label="状态">
              {detailModal.data.status === 'pending' && <Tag color="orange">待审核</Tag>}
              {detailModal.data.status === 'approved' && <Tag color="green">已通过</Tag>}
              {detailModal.data.status === 'rejected' && <Tag color="red">已驳回</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="材料编号">AQ202501001</Descriptions.Item>
            <Descriptions.Item label="有效期至" span={2}>2027-12-31</Descriptions.Item>
            <Descriptions.Item label="审核意见" span={2}>
              <Alert
                message="材料完整性检查通过"
                description="安全生产许可证编号：（京）JZ安许证字[2022]123456，有效期至2027-12-31，发证机关：北京市住房和城乡建设委员会。"
                type="success"
                showIcon
              />
            </Descriptions.Item>
          </Descriptions>
        )}

        {detailModal.data && detailModal.type === 'contract' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="合同编号">{detailModal.data.contractNumber}</Descriptions.Item>
            <Descriptions.Item label="签订日期">{detailModal.data.signDate}</Descriptions.Item>
            <Descriptions.Item label="招工项目">{detailModal.data.jobTitle}</Descriptions.Item>
            <Descriptions.Item label="工友">{detailModal.data.workerName}</Descriptions.Item>
            <Descriptions.Item label="企业">{detailModal.data.companyName}</Descriptions.Item>
            <Descriptions.Item label="日薪标准"><Text strong style={{ color: '#52c41a' }}>¥{detailModal.data.dailySalary}</Text></Descriptions.Item>
            <Descriptions.Item label="合同开始日期">{detailModal.data.startDate}</Descriptions.Item>
            <Descriptions.Item label="合同结束日期">{detailModal.data.endDate}</Descriptions.Item>
            <Descriptions.Item label="合同状态" span={2}>
              {detailModal.data.status === 'active' && <Tag color="green">履行中</Tag>}
              {detailModal.data.status === 'expired' && <Tag color="default">已到期</Tag>}
              {detailModal.data.status === 'terminated' && <Tag color="red">已终止</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="复查记录" span={2}>
              <Alert
                message="合同复查通过"
                description="工期60天，日薪500元符合区域行情。付款方式：月结，每月15日支付上月工资。保证金：1000元已托管至平台。"
                type="success"
                showIcon
              />
            </Descriptions.Item>
          </Descriptions>
        )}

        {detailModal.data && detailModal.type === 'payment' && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="支付单号">{detailModal.data.paymentNumber}</Descriptions.Item>
            <Descriptions.Item label="支付日期">{detailModal.data.payDate}</Descriptions.Item>
            <Descriptions.Item label="工友">{detailModal.data.workerName}</Descriptions.Item>
            <Descriptions.Item label="项目">{detailModal.data.jobTitle}</Descriptions.Item>
            <Descriptions.Item label="出勤天数">{detailModal.data.days}天</Descriptions.Item>
            <Descriptions.Item label="支付金额"><Text strong style={{ color: '#52c41a', fontSize: 18 }}>¥{detailModal.data.amount.toLocaleString()}</Text></Descriptions.Item>
            <Descriptions.Item label="核算标准" span={2}>日薪¥500 × 30天 = ¥15,000</Descriptions.Item>
            <Descriptions.Item label="支付状态">
              {detailModal.data.status === 'paid' && <Tag color="green">已支付</Tag>}
              {detailModal.data.status === 'pending' && <Tag color="orange">待支付</Tag>}
              {detailModal.data.status === 'failed' && <Tag color="red">支付失败</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="支付凭证">已上传</Descriptions.Item>
            <Descriptions.Item label="复查结果" span={2}>
              <Alert
                message="工资支付核验通过"
                description="考勤记录核对：30天全部出勤，无旷工迟到。合同日薪标准¥500，核算正确。工友已确认收到工资。"
                type="success"
                showIcon
              />
            </Descriptions.Item>
          </Descriptions>
        )}

        {detailModal.data && detailModal.type === 'dispute' && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="纠纷编号">{detailModal.data.disputeNumber}</Descriptions.Item>
              <Descriptions.Item label="提交日期">{detailModal.data.submitDate}</Descriptions.Item>
              <Descriptions.Item label="项目">{detailModal.data.jobTitle}</Descriptions.Item>
              <Descriptions.Item label="纠纷类型">{detailModal.data.type}</Descriptions.Item>
              <Descriptions.Item label="工友">{detailModal.data.workerName}</Descriptions.Item>
              <Descriptions.Item label="企业">{detailModal.data.companyName}</Descriptions.Item>
              <Descriptions.Item label="涉及金额">{detailModal.data.amount > 0 ? `¥${detailModal.data.amount}` : '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detailModal.data.handler}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {detailModal.data.status === 'pending' && <Tag color="orange">待处理</Tag>}
                {detailModal.data.status === 'mediating' && <Tag color="blue">调解中</Tag>}
                {detailModal.data.status === 'resolved' && <Tag color="green">已解决</Tag>}
                {detailModal.data.status === 'closed' && <Tag color="default">已关闭</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="纠纷描述" span={2}>{detailModal.data.description}</Descriptions.Item>
            </Descriptions>
            <Alert
              message="调解进度"
              description={
                <div>
                  <p>1. 2025-01-14 工友张三提交纠纷申请，附上考勤记录截图</p>
                  <p>2. 2025-01-14 平台受理，向企业中建一局发出调解通知</p>
                  <p>3. 2025-01-15 企业回复：加班费计算有误，同意补发3天加班费¥1,500</p>
                  <p>4. 2025-01-15 待工友确认同意调解方案...</p>
                </div>
              }
              type="info"
              showIcon
            />
          </Space>
        )}
      </Modal>
    </div>
  );
}

export default AdminDashboard;
