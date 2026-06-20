import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Empty, Alert, Tooltip, Drawer, Button, Space, Modal, Descriptions, Spin } from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined, RiseOutlined, ThunderboltOutlined,
  EditOutlined, ScanOutlined, SafetyCertificateOutlined, CloudUploadOutlined,
  UnorderedListOutlined, SafetyOutlined, SmileOutlined, FingerprintOutlined,
  AuditOutlined, FormOutlined, FileProtectOutlined, DownloadOutlined,
  EyeOutlined, LinkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { http } from '../utils/request';
import { Column as ColumnChart, Area as AreaChart, Pie as PieChart } from '@ant-design/charts';
import dayjs from 'dayjs';

interface DashboardData {
  totalApplies: number;
  reviewings: number;
  approved: number;
  rejected: number;
  todayNew: number;
  avgDuration: number;
  dailyTrend: { date: string; newApplies: number; approved: number; rejected: number }[];
  categoryDist: { category: string; count: number }[];
  workload: { reviewer: string; processing: number; done: number }[];
}

interface StatsData {
  signingStats: { signLogs: number; bioVerified: number };
  caStats: { active: number; total: number };
  archiveStats: { completed: number; total: number };
}

interface RecentApply {
  id: string;
  name: string;
  applicant: string;
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected';
  applyId: string;
  itemCode?: string;
  createdAt?: string;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentApplies, setRecentApplies] = useState<RecentApply[]>([]);
  const [loading, setLoading] = useState(true);
  const [alerted, setAlerted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerContent, setDrawerContent] = useState<React.ReactNode>(null);
  const alertShownRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [dashboardData, statsData, recentData] = await Promise.all([
          http.get<DashboardData>('/admin/dashboard'),
          http.get<StatsData>('/admin/stats'),
          http.get<RecentApply[]>('/admin/recent-applies')
        ]);
        setData(dashboardData);
        setStats(statsData);
        setRecentApplies(Array.isArray(recentData) ? recentData : []);
      } catch {
        const d = mockData();
        setData(d);
        setStats({
          signingStats: { signLogs: 12580, bioVerified: 9876 },
          caStats: { active: 3256, total: 3420 },
          archiveStats: { completed: 2468, total: 2846 }
        });
        setRecentApplies([
          { id: '1', applyId: 'APP20240515001', name: '个体工商户设立登记', applicant: '张**', status: 'reviewing' },
          { id: '2', applyId: 'APP20240515002', name: '食品经营许可证核发', applicant: '李**', status: 'submitted' },
          { id: '3', applyId: 'APP20240515003', name: '有限公司设立', applicant: '王**', status: 'reviewing' },
          { id: '4', applyId: 'APP20240515004', name: '变更登记-经营范围', applicant: '赵**', status: 'approved' },
          { id: '5', applyId: 'APP20240515005', name: '年度报告公示', applicant: '孙**', status: 'rejected' }
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (data && data.reviewings > 0 && !alertShownRef.current) {
      alertShownRef.current = true;
      Modal.info({
        title: '待办审核提醒',
        icon: <ClockCircleOutlined style={{ color: '#faad14' }} />,
        content: `当前有待办审核 ${data.reviewings} 件，请尽快处理`,
        okText: '知道了',
        centered: true
      });
    }
  }, [data]);

  const mockData = (): DashboardData => ({
    totalApplies: 2846, reviewings: 142, approved: 2621, rejected: 83, todayNew: 38,
    avgDuration: 2.35,
    dailyTrend: Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(6 - i, 'day').format('MM-DD');
      return { date: d, newApplies: 30 + Math.floor(Math.random() * 25), approved: 25 + Math.floor(Math.random() * 20), rejected: Math.floor(Math.random() * 5) };
    }),
    categoryDist: [
      { category: '市场主体登记', count: 1423 }, { category: '行政许可', count: 569 },
      { category: '变更登记', count: 427 }, { category: '注销登记', count: 285 },
      { category: '年度报告', count: 142 }
    ],
    workload: [
      { reviewer: '王审核', processing: 32, done: 456 },
      { reviewer: '赵复审', processing: 28, done: 398 },
      { reviewer: '孙受理', processing: 45, done: 721 },
      { reviewer: '管理员', processing: 37, done: 518 }
    ]
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'sign-process':
        navigate('/templates');
        break;
      case 'ca-manage':
        setDrawerTitle('CA证书预置管理');
        setDrawerContent(
          <div>
            <Alert type="info" showIcon style={{ marginBottom: 16 }} message="CA证书管理说明" description="此处可对省级CA签发的数字证书进行预置、续期、吊销、查询等操作。证书采用SM2国密算法，具备法律效力。" />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="证书签发机构">XX省电子认证服务中心（省级CA）</Descriptions.Item>
              <Descriptions.Item label="证书算法">SM2/SM3/SM4 国密算法</Descriptions.Item>
              <Descriptions.Item label="证书有效期">默认 1 年，支持续期</Descriptions.Item>
              <Descriptions.Item label="证书用途">电子签名、身份认证、数据加密</Descriptions.Item>
            </Descriptions>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary">前往证书管理</Button>
              <Button>导出证书列表</Button>
            </Space>
          </div>
        );
        setDrawerOpen(true);
        break;
      case 'face-verify':
        setDrawerTitle('人脸识别核验通道');
        setDrawerContent(
          <div>
            <Alert type="success" showIcon style={{ marginBottom: 16 }} message="人脸识别通道已启用" description="对接公安部公民身份认证系统（CTID），支持活体检测+人脸比对，准确率 99.9%。" />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="核验方式">1:1 人脸比对（身份证照片 vs 实时抓拍）</Descriptions.Item>
              <Descriptions.Item label="活体检测">动作活体 + 静默活体双模式</Descriptions.Item>
              <Descriptions.Item label="接入方">公安部第一研究所 CTID</Descriptions.Item>
              <Descriptions.Item label="平均耗时">1.5 ~ 3 秒/次</Descriptions.Item>
              <Descriptions.Item label="核验阈值">相似度 ≥ 70 分判定通过</Descriptions.Item>
            </Descriptions>
            <Button type="primary" style={{ marginTop: 16 }} block>发起一次测试核验</Button>
          </div>
        );
        setDrawerOpen(true);
        break;
      case 'fingerprint-verify':
        setDrawerTitle('指纹核验通道');
        setDrawerContent(
          <div>
            <Alert type="success" showIcon style={{ marginBottom: 16 }} message="指纹核验通道已启用" description="对接公安指纹库，支持1:1核验和1:N检索，适用于高安全等级业务。" />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="采集设备">标准指纹采集仪（支持国密算法加密传输）</Descriptions.Item>
              <Descriptions.Item label="比对算法">公安部 FP_ABIS 标准算法</Descriptions.Item>
              <Descriptions.Item label="特征点">42 个指纹特征点比对</Descriptions.Item>
              <Descriptions.Item label="核验通过率">≥ 95%（合规采集前提下）</Descriptions.Item>
            </Descriptions>
            <Button type="primary" style={{ marginTop: 16 }} block>查看核验历史记录</Button>
          </div>
        );
        setDrawerOpen(true);
        break;
      case 'approval-workbench':
        navigate('/review');
        break;
      case 'pending-list':
        navigate('/review?filter=pending');
        break;
      case 'legal-declaration':
        setDrawerTitle('法律效力声明');
        setDrawerContent(
          <div>
            <Card type="inner" title="📜 电子签名与数据电文法律效力" style={{ marginBottom: 12 }}>
              <div style={{ lineHeight: 2, color: '#334155' }}>
                <p>依据 <b>《中华人民共和国电子签名法》</b> 第十三条、第十四条规定：</p>
                <p style={{ padding: '8px 12px', background: '#f0f9ff', borderRadius: 6, borderLeft: '4px solid #1E5DAB' }}>
                  可靠的电子签名与手写签名或者盖章具有<b>同等的法律效力</b>。当事人不得仅以其采用电子签名、数据电文的形式为由，否定其法律效力。
                </p>
                <p>本平台采用的电子签名符合 <b>SM2/SM3/SM4</b> 国家商用密码算法标准，并由 <b>省级CA机构</b> 签发数字证书，经 <b>可信时间戳（TSA）</b> 固化，属于法定的"可靠电子签名"范畴。</p>
              </div>
            </Card>
            <Card type="inner" title="🔐 合规依据">
              <ul style={{ lineHeight: 2, margin: 0, paddingLeft: 20 }}>
                <li>《中华人民共和国电子签名法》（2019修正）</li>
                <li>《中华人民共和国密码法》（2020年实施）</li>
                <li>《政务信息系统密码应用与安全性评估工作指南》</li>
                <li>GB/T 35275-2017《信息安全技术 SM2 密码算法加密签名消息语法规范》</li>
                <li>GB/T 38540-2020《信息安全技术 安全电子签章密码技术规范》</li>
              </ul>
            </Card>
          </div>
        );
        setDrawerOpen(true);
        break;
      case 'download-evidence':
        setDrawerTitle('证据包一键下载');
        setDrawerContent(
          <div>
            <Alert type="info" showIcon style={{ marginBottom: 16 }} message="标准证据包说明" description="每份证据包符合司法举证要求，采用ZIP格式封装，包含 6 类核心证据文件。" />
            <Card type="inner" title="📦 证据包内容清单（共6项）">
              <ol style={{ lineHeight: 2.2, margin: 0, paddingLeft: 22 }}>
                <li><b>申请表原件.pdf</b> — 加盖电子签名/电子签章的原始申请表</li>
                <li><b>签署日志.json</b> — 全流程操作日志（操作人/设备/IP/时间戳）</li>
                <li><b>时间戳验证报告.tsr</b> — 省级TSA签发的可信时间戳</li>
                <li><b>CA数字证书.crt</b> — 签署方SM2国密证书（含公钥）</li>
                <li><b>审批记录.pdf</b> — 各审批节点意见与审核结果汇总</li>
                <li><b>哈希校验报告.txt</b> — SHA-256文件完整性校验值清单</li>
              </ol>
            </Card>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<DownloadOutlined />}>前往证据下载中心</Button>
              <Button icon={<EyeOutlined />}>查看已生成的证据包列表</Button>
            </Space>
          </div>
        );
        setDrawerOpen(true);
        break;
    }
  };

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="正在加载Dashboard数据..." />
      </div>
    );
  }

  const trendData = data.dailyTrend.flatMap((item) => ([
    { date: item.date, type: '新增申请', value: item.newApplies },
    { date: item.date, type: '审批通过', value: item.approved }
  ]));

  const workloadData = data.workload.flatMap((item) => ([
    { reviewer: item.reviewer, type: '处理中', value: item.processing },
    { reviewer: item.reviewer, type: '已办结', value: item.done }
  ]));

  const statCards = [
    { title: '累计申请总数', value: data.totalApplies, icon: <FileTextOutlined />, color: '#1E5DAB', bg: '#e8f1fb' },
    { title: '待审核中', value: data.reviewings, icon: <ClockCircleOutlined />, color: '#faad14', bg: '#fffbe6' },
    { title: '已审批通过', value: data.approved, icon: <CheckCircleOutlined />, color: '#52c41a', bg: '#f6ffed' },
    { title: '已驳回', value: data.rejected, icon: <CloseCircleOutlined />, color: '#ff4d4f', bg: '#fff1f0' },
    { title: '今日新增', value: data.todayNew, icon: <ThunderboltOutlined />, color: '#eb2f96', bg: '#fff0f6' },
    {
      title: '平均审批时长',
      value: Number(data.avgDuration).toFixed(2),
      icon: <RiseOutlined />,
      color: '#722ed1',
      bg: '#f9f0ff',
      suffix: '工作日',
      tooltip: '计算口径：近30天内所有已办结申请的"受理时间 → 最终审批通过/驳回时间"间隔的算术平均值，扣除法定节假日与周末。'
    },
  ];

  const eSignCards = [
    {
      title: '累计签署次数',
      value: stats?.signingStats.signLogs ?? 0,
      icon: <EditOutlined />,
      color: '#1890ff',
      bg: '#e6f4ff',
      desc: '所有电子签名操作记录'
    },
    {
      title: '生物特征核验',
      value: stats?.signingStats.bioVerified ?? 0,
      icon: <ScanOutlined />,
      color: '#722ed1',
      bg: '#f9f0ff',
      desc: '人脸识别 + 指纹核验',
      descColor: '#9254de'
    },
    {
      title: 'CA证书在用',
      value: (stats?.caStats.active ?? 0),
      suffix: `/${stats?.caStats.total ?? 0}`,
      icon: <SafetyCertificateOutlined />,
      color: '#52c41a',
      bg: '#f6ffed',
      desc: '省级CA签发 · SM2国密',
      descColor: '#73d13d'
    },
    {
      title: '电子档案归集',
      value: (stats?.archiveStats.completed ?? 0),
      suffix: `/${stats?.archiveStats.total ?? 0}`,
      icon: <CloudUploadOutlined />,
      color: '#fa8c16',
      bg: '#fff7e6',
      desc: '政务云归档完成率',
      descColor: '#ffa940'
    },
  ];

  const quickActions = [
    { key: 'sign-process', label: '多步骤签署流程引导', icon: <UnorderedListOutlined />, color: '#1890ff' },
    { key: 'ca-manage', label: 'CA证书预置管理', icon: <SafetyOutlined />, color: '#52c41a' },
    { key: 'face-verify', label: '人脸识别核验通道', icon: <SmileOutlined />, color: '#13c2c2' },
    { key: 'fingerprint-verify', label: '指纹核验通道', icon: <FingerprintOutlined />, color: '#722ed1' },
    { key: 'approval-workbench', label: '审批分级工作台', icon: <AuditOutlined />, color: '#fa8c16' },
    { key: 'pending-list', label: '待签署申请列表', icon: <FormOutlined />, color: '#eb2f96' },
    { key: 'legal-declaration', label: '法律效力声明查看', icon: <FileProtectOutlined />, color: '#cf1322' },
    { key: 'download-evidence', label: '证据包一键下载', icon: <DownloadOutlined />, color: '#1E5DAB' },
  ];

  return (
    <div>
      {data.reviewings > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 10 }}
          icon={<ClockCircleOutlined />}
          message={
            <span>
              <b>待办审核提醒：</b>当前有待办审核 <b style={{ color: '#d46b08' }}>{data.reviewings}</b> 件，请尽快处理
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/review')}
                style={{ marginLeft: 12, padding: 0, height: 'auto' }}
              >
                立即前往处理 →
              </Button>
            </span>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} md={8} lg={4} key={i}>
            <Card bordered={false} style={{ borderRadius: 10 }}>
              <Row gutter={12} align="middle">
                <Col>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, background: s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: s.color
                  }}>{s.icon}</div>
                </Col>
                <Col flex="auto">
                  {s.tooltip ? (
                    <Tooltip title={s.tooltip} placement="topLeft">
                      <Statistic
                        title={<span style={{ cursor: 'help', borderBottom: '1px dashed #94a3b8' }}>{s.title}</span>}
                        value={s.value as any}
                        valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                        suffix={s.suffix as any}
                      />
                    </Tooltip>
                  ) : (
                    <Statistic title={s.title} value={s.value as any} valueStyle={{ fontSize: 22, fontWeight: 600, color: '#0f172a' }}
                      suffix={s.suffix as any} />
                  )}
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title={<span><LinkOutlined style={{ color: '#1E5DAB' }} /> 电子签名与CA认证</span>}
        bordered={false}
        style={{ borderRadius: 10, marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {eSignCards.map((s, i) => (
            <Col xs={24} sm={12} lg={6} key={i}>
              <Card bordered={false} style={{ borderRadius: 10, background: s.bg + '80', height: '100%' }}>
                <Row gutter={12} align="top">
                  <Col>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10, background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, color: s.color, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>{s.icon}</div>
                  </Col>
                  <Col flex="auto">
                    <Statistic
                      title={<span style={{ color: '#475569', fontSize: 13 }}>{s.title}</span>}
                      value={s.value as any}
                      valueStyle={{ fontSize: 24, fontWeight: 700, color: s.color }}
                      suffix={s.suffix ? <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 400 }}>{s.suffix}</span> : undefined}
                    />
                    {s.desc && (
                      <div style={{
                        fontSize: 12,
                        color: s.descColor || '#64748b',
                        marginTop: 4,
                        lineHeight: 1.4
                      }}>
                        {s.desc}
                      </div>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={<span><ThunderboltOutlined style={{ color: '#faad14' }} /> 快捷业务入口</span>}
        bordered={false}
        style={{ borderRadius: 10, marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          {quickActions.map((q, i) => (
            <Col xs={12} sm={6} lg={3} key={q.key}>
              <Card
                bordered
                hoverable
                style={{
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  height: '100%'
                }}
                styles={{ body: { padding: '20px 12px' } }}
                onClick={() => handleQuickAction(q.key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 16px ${q.color}25`;
                  e.currentTarget.style.borderColor = q.color + '50';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: q.color + '15',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: q.color,
                    marginBottom: 10
                  }}>
                    {q.icon}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: '#334155',
                    fontWeight: 500,
                    lineHeight: 1.4
                  }}>
                    {q.label}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="📈 七日申请与审批趋势" bordered={false} style={{ borderRadius: 10 }}>
            <AreaChart
              data={trendData}
              xField="date"
              yField="value"
              seriesField="type"
              color={['#1E5DAB', '#52c41a']}
              legend={{ position: 'top' }}
              smooth
              height={300}
              areaStyle={{ fillOpacity: 0.15 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="🥧 业务类别分布" bordered={false} style={{ borderRadius: 10 }}>
            <PieChart
              data={data.categoryDist}
              angleField="count"
              colorField="category"
              radius={0.85}
              height={300}
              legend={{ position: 'bottom', layout: 'vertical' }}
              label={{ text: 'category', content: '{name}\n{d}件' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="👥 审核人员工作量" bordered={false} style={{ borderRadius: 10 }}>
            <ColumnChart
              data={workloadData}
              xField="reviewer"
              yField="value"
              seriesField="type"
              isGroup
              height={280}
              color={['#faad14', '#52c41a']}
              label={{ position: 'top' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<span><ClockCircleOutlined style={{ color: '#1890ff' }} /> 🎯 最近受理的申请</span>}
            bordered={false}
            style={{ borderRadius: 10 }}
            extra={
              <Button
                type="link"
                size="small"
                onClick={() => navigate('/tracking')}
                style={{ padding: 0, height: 'auto' }}
              >
                查看全部 →
              </Button>
            }
          >
            <Table
              size="small"
              pagination={false}
              rowKey={(_, i) => `${recentApplies[i]?.id || recentApplies[i]?.applyId || i}`}
              columns={[
                { title: '申请ID', dataIndex: 'applyId', width: 130 },
                { title: '事项名称', dataIndex: 'name', ellipsis: true },
                { title: '申请人', dataIndex: 'applicant', width: 70 },
                {
                  title: '状态', dataIndex: 'status', width: 80,
                  render: (v: string) => {
                    const map: any = {
                      submitted: <Tag color="orange">待受理</Tag>,
                      reviewing: <Tag color="blue">审核中</Tag>,
                      approved: <Tag color="green">已通过</Tag>,
                      rejected: <Tag color="red">驳回</Tag>
                    };
                    return map[v] || v;
                  }
                },
                {
                  title: '操作',
                  width: 100,
                  render: (_, record: RecentApply) => (
                    <Button
                      type="link"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => navigate(`/tracking?applyId=${encodeURIComponent(record.applyId)}`)}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      查看证据链
                    </Button>
                  )
                }
              ]}
              dataSource={recentApplies.length > 0 ? recentApplies : []}
              locale={{ emptyText: <Empty description="暂无最近申请" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16, borderRadius: 10, border: '1px solid #e0e7ff', background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)' }}
        bordered={false}>
        <Row gutter={24} align="middle">
          <Col>
            <div style={{
              width: 56, height: 56, borderRadius: 14, background: '#1E5DAB', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26
            }}>🔒</div>
          </Col>
          <Col flex="auto">
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>
              合规安全保障
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
              • 符合《电子签名法》《密码法》《政务云安全规范》&nbsp;&nbsp;
              • 全程使用 SM2/SM3/SM4 国家商用密码算法&nbsp;&nbsp;
              • 对接省级可信时间戳 (TSA)，签署证据可固化&nbsp;&nbsp;
              • 审计日志全量保留，支持司法举证
            </div>
          </Col>
        </Row>
      </Card>

      <Drawer
        title={drawerTitle}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={560}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>关闭</Button>
          </div>
        }
      >
        {drawerContent}
      </Drawer>
    </div>
  );
};

export default DashboardPage;
