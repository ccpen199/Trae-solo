import { Row, Col, Card, Tag, Badge, Steps, Button, Divider } from 'antd';
import {
  TrademarkCircleOutlined,
  FileProtectOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  RightOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  WarningOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { Line, Pie } from '@ant-design/charts';
import { useNavigate } from 'react-router-dom';

const domainCards = [
  {
    title: '商标',
    icon: <TrademarkCircleOutlined />,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    shadow: '0 4px 14px rgba(102,126,234,0.35)',
    total: 1286,
    trend: 'up' as const,
    percent: '12.5%',
    link: '/trademark/tracker',
    breakdown: [
      { label: '审核中', count: 34, color: '#1890ff', link: '/trademark/tracker' },
      { label: '已注册', count: 218, color: '#52c41a', link: '/trademark/tracker' },
      { label: '已驳回', count: 12, color: '#f5222d', link: '/trademark/tracker' },
      { label: '续展中', count: 18, color: '#fa8c16', link: '/trademark/tracker' },
    ],
  },
  {
    title: '专利',
    icon: <FileProtectOutlined />,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    shadow: '0 4px 14px rgba(245,87,108,0.35)',
    total: 523,
    trend: 'up' as const,
    percent: '8.3%',
    link: '/patent/fee-reminder',
    breakdown: [
      { label: '年费待缴', count: 6, color: '#fa8c16', link: '/patent/fee-reminder' },
      { label: '答辩中', count: 3, color: '#1890ff', link: '/patent/value-assessment' },
      { label: '已授权', count: 45, color: '#52c41a', link: '/patent/ipc-nav' },
      { label: '即将到期', count: 3, color: '#f5222d', link: '/patent/fee-reminder' },
    ],
  },
  {
    title: '版权',
    icon: <SafetyCertificateOutlined />,
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    shadow: '0 4px 14px rgba(79,172,254,0.35)',
    total: 892,
    trend: 'down' as const,
    percent: '3.2%',
    link: '/copyright/hash-deposit',
    breakdown: [
      { label: '已存证', count: 86, color: '#52c41a', link: '/copyright/hash-deposit' },
      { label: '侵权线索', count: 7, color: '#f5222d', link: '/copyright/infringement' },
      { label: '维权中', count: 4, color: '#1890ff', link: '/copyright/evidence' },
      { label: '证据包', count: 5, color: '#fa8c16', link: '/copyright/evidence' },
    ],
  },
  {
    title: '待处理',
    icon: <ExclamationCircleOutlined />,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    shadow: '0 4px 14px rgba(250,112,154,0.35)',
    total: 47,
    trend: 'down' as const,
    percent: '18.6%',
    link: '/admin/agent-workbench',
    breakdown: [
      { label: '紧急', count: 8, color: '#f5222d', link: '/admin/agent-workbench' },
      { label: '高优', count: 12, color: '#fa8c16', link: '/admin/agent-workbench' },
      { label: '中等', count: 18, color: '#1890ff', link: '/admin/agent-workbench' },
      { label: '低优', count: 9, color: '#52c41a', link: '/admin/agent-workbench' },
    ],
  },
];

const trendLineData = [
  { month: '1月', type: '商标', value: 186 },
  { month: '1月', type: '专利', value: 82 },
  { month: '1月', type: '版权', value: 145 },
  { month: '2月', type: '商标', value: 205 },
  { month: '2月', type: '专利', value: 91 },
  { month: '2月', type: '版权', value: 132 },
  { month: '3月', type: '商标', value: 237 },
  { month: '3月', type: '专利', value: 78 },
  { month: '3月', type: '版权', value: 158 },
  { month: '4月', type: '商标', value: 198 },
  { month: '4月', type: '专利', value: 105 },
  { month: '4月', type: '版权', value: 140 },
  { month: '5月', type: '商标', value: 256 },
  { month: '5月', type: '专利', value: 96 },
  { month: '5月', type: '版权', value: 167 },
  { month: '6月', type: '商标', value: 224 },
  { month: '6月', type: '专利', value: 113 },
  { month: '6月', type: '版权', value: 150 },
];

const pieData = [
  { type: '审核中', value: 34 },
  { type: '已通过', value: 218 },
  { type: '已驳回', value: 12 },
  { type: '已放弃', value: 5 },
  { type: '续展中', value: 18 },
];

const domainDrillDown = [
  {
    domain: '商标域',
    subtitle: '注册节点追踪',
    color: '#667eea',
    items: [
      { label: '审核中', count: 34, link: '/trademark/tracker' },
      { label: '驳回复审', count: 5, link: '/trademark/tracker' },
      { label: '续展到期', count: 18, link: '/trademark/tracker' },
      { label: '异议答辩', count: 3, link: '/trademark/tracker' },
    ],
  },
  {
    domain: '专利域',
    subtitle: '年费与答辩',
    color: '#f5576c',
    items: [
      { label: '年费即将到期', count: 3, link: '/patent/fee-reminder' },
      { label: '答辩截止', count: 2, link: '/patent/value-assessment' },
      { label: '价值评估待复查', count: 4, link: '/patent/value-assessment' },
    ],
  },
  {
    domain: '版权域',
    subtitle: '存证与维权',
    color: '#4facfe',
    items: [
      { label: '待确认侵权线索', count: 7, link: '/copyright/infringement' },
      { label: '证据包生成中', count: 2, link: '/copyright/evidence' },
      { label: '存证待补材料', count: 3, link: '/copyright/hash-deposit' },
    ],
  },
];

const statusDrillDown = [
  { label: '审核中', count: 34, color: '#1890ff', link: '/trademark/tracker' },
  { label: '已通过', count: 218, color: '#52c41a', link: '/trademark/tracker' },
  { label: '已驳回', count: 12, color: '#f5222d', link: '/trademark/tracker' },
  { label: '已放弃', count: 5, color: '#8c8c8c', link: '/trademark/tracker' },
  { label: '续展中', count: 18, color: '#fa8c16', link: '/trademark/tracker' },
];

const recentActivities = [
  {
    time: '今天 14:32',
    content: '商标"云启科技"注册申请已提交',
    statusFlow: [
      { title: '申请提交', status: 'finish' as const },
      { title: '形式审查', status: 'process' as const },
      { title: '实质审查', status: 'wait' as const },
      { title: '初审公告', status: 'wait' as const },
      { title: '注册公告', status: 'wait' as const },
    ],
    assignee: '张代理',
    nextAction: '等待形式审查结果',
    link: '/trademark/tracker',
    tag: '节点追踪',
    tagColor: 'blue',
    resultIcon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    resultText: '形式审查预计3个工作日内完成，系统将在状态变更时主动推送通知',
  },
  {
    time: '今天 11:15',
    content: '专利 ZL2026301xxxxx 年费代缴已完成',
    statusFlow: [
      { title: '费用计算', status: 'finish' as const },
      { title: '代缴执行', status: 'finish' as const },
      { title: '缴费确认', status: 'finish' as const },
    ],
    assignee: '李助理',
    nextAction: '年费缴纳回执已收到，归档完成',
    link: '/patent/fee-reminder',
    tag: '缴费回执',
    tagColor: 'green',
    resultIcon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    resultText: '缴费确认号 FEE20260609001，国知局已确认到账，代理费¥200已开具',
  },
  {
    time: '昨天 16:40',
    content: '版权作品"智慧城市管理系统 V3.0"哈希存证成功',
    statusFlow: [
      { title: '作品上传', status: 'finish' as const },
      { title: '哈希计算', status: 'finish' as const },
      { title: '区块链存证', status: 'finish' as const },
      { title: '证书生成', status: 'finish' as const },
    ],
    assignee: '张代理',
    nextAction: '存证证书已生成，可下载查看',
    link: '/copyright/hash-deposit',
    tag: '存证证书',
    tagColor: 'blue',
    resultIcon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    resultText: '证书编号 CERT-20260609-003，区块链确认数12，存证不可篡改',
  },
  {
    time: '昨天 09:22',
    content: '商标"星河数据"异议答辩材料已上传',
    statusFlow: [
      { title: '异议通知', status: 'finish' as const },
      { title: '材料准备', status: 'finish' as const },
      { title: '答辩提交', status: 'process' as const },
      { title: '审查结果', status: 'wait' as const },
    ],
    assignee: '王律师',
    nextAction: '答辩书提交截止 06-20，待确认邮寄',
    link: '/trademark/tracker',
    tag: '答辩追踪',
    tagColor: 'orange',
    resultIcon: <SyncOutlined style={{ color: '#fa8c16' }} />,
    resultText: '答辩材料已上传，待邮寄纸质版至商标局，截止06-20',
  },
  {
    time: '06-07 15:10',
    content: '专利价值评估报告已生成',
    statusFlow: [
      { title: '数据采集', status: 'finish' as const },
      { title: '模型评估', status: 'finish' as const },
      { title: '报告生成', status: 'finish' as const },
    ],
    assignee: '系统自动',
    nextAction: '综合评分88分（高价值），建议续费维护',
    link: '/patent/value-assessment',
    tag: '评估报告',
    tagColor: 'green',
    resultIcon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    resultText: '评分88分（高价值），引用数92/法律状态95/技术热度90，建议续费维护',
  },
  {
    time: '06-06 10:05',
    content: '侵权线索自动抓取发现3条新疑似侵权链接',
    statusFlow: [
      { title: '线索发现', status: 'finish' as const },
      { title: '相似度比对', status: 'finish' as const },
      { title: '人工确认', status: 'process' as const },
      { title: '证据打包', status: 'wait' as const },
    ],
    assignee: '赵审核员',
    nextAction: '3条线索待确认，其中淘宝96.8%需优先处理',
    link: '/copyright/infringement',
    tag: '侵权复查',
    tagColor: 'red',
    resultIcon: <WarningOutlined style={{ color: '#f5222d' }} />,
    resultText: '3条线索待人工确认：淘宝96.8%(高危)、B站94.1%(高危)、小红书91.3%(中危)',
  },
];

const todoItems = [
  {
    title: '商标"云端智联"续展申请',
    priority: '紧急',
    tagColor: 'red',
    progress: 30,
    link: '/trademark/tracker',
    assignee: '张代理',
    deadline: '2026-07-15',
    nextAction: '提交续展申请书',
    statusIcon: <WarningOutlined style={{ color: '#f5222d' }} />,
    processRecord: '2026-06-08 张代理 已准备续展申请书草稿',
  },
  {
    title: '专利 ZL2025200xxxxx 答辩截止',
    priority: '紧急',
    tagColor: 'red',
    progress: 25,
    link: '/patent/fee-reminder',
    assignee: '王律师',
    deadline: '2026-06-20',
    nextAction: '补充技术对比分析并提交答辩书',
    statusIcon: <WarningOutlined style={{ color: '#f5222d' }} />,
    processRecord: '2026-06-07 王律师 补充技术对比分析第2稿',
  },
  {
    title: '版权存证材料补充',
    priority: '高',
    tagColor: 'orange',
    progress: 60,
    link: '/copyright/hash-deposit',
    assignee: '李助理',
    deadline: '2026-06-25',
    nextAction: '3件作品待补充权属证明文件',
    statusIcon: <SyncOutlined style={{ color: '#fa8c16' }} />,
    processRecord: '2026-06-08 李助理 已上传2/3件权属证明',
  },
  {
    title: '商标"星河数据"异议答辩书',
    priority: '高',
    tagColor: 'orange',
    progress: 50,
    link: '/trademark/contracts',
    assignee: '王律师',
    deadline: '2026-06-20',
    nextAction: '对方异议理由：近似商标，需准备对比证据',
    statusIcon: <SyncOutlined style={{ color: '#fa8c16' }} />,
    processRecord: '2026-06-07 王律师 完成近似商标对比证据',
  },
  {
    title: '专利年费清单核对',
    priority: '中',
    tagColor: 'blue',
    progress: 70,
    link: '/patent/fee-reminder',
    assignee: '李助理',
    deadline: '2026-06-30',
    nextAction: '12件专利年费待核对，3件7天内到期',
    statusIcon: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
    processRecord: '2026-06-06 李助理 已核对9/12件专利年费',
  },
  {
    title: '客户合同续签审批',
    priority: '低',
    tagColor: 'default',
    progress: 80,
    link: '/admin/agent-workbench',
    assignee: '张代理',
    deadline: '2026-07-31',
    nextAction: '华为年度代理合同续签，法务已审核通过',
    statusIcon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    processRecord: '2026-06-05 法务部 审核通过，待张代理签署',
  },
];

const businessWorkbenches = [
  {
    domain: '商标注册办理台',
    caseNo: 'TM-2026-09001234',
    owner: '张代理',
    stage: '形式审查',
    result: '申请书、委托书、类别核验已通过',
    review: '复查记录：近似商标 3 件，人工确认 1 件需规避',
    action: '查看进度',
    link: '/trademark/tracker',
    color: 'blue',
  },
  {
    domain: '专利年费/答辩办理台',
    caseNo: 'ZL2025200XXXXX',
    owner: '王律师',
    stage: '答辩准备',
    result: '年费账单、技术对比、答辩截止日已归档',
    review: '复查记录：12 件年费待核对，3 件 7 天内到期',
    action: '前往处理',
    link: '/patent/fee-reminder',
    color: 'magenta',
  },
  {
    domain: '版权存证/维权办理台',
    caseNo: 'CR-CHAIN-20260609',
    owner: '李助理',
    stage: '证据包生成',
    result: '哈希存证、侵权线索、证据包下载已串联',
    review: '复查记录：淘宝 96.8% 线索优先取证',
    action: '查看证据',
    link: '/copyright/evidence',
    color: 'cyan',
  },
  {
    domain: '代理后台闭环',
    caseNo: 'AGENT-WB-0626',
    owner: '张代理',
    stage: '合同/费用/沟通',
    result: '客户沟通、费用账单、合同续签与补贴政策已承接',
    review: '复查记录：逾期账单 1 笔，待支付 4 笔',
    action: '进入工作台',
    link: '/admin/agent-workbench',
    color: 'gold',
  },
];

const lineConfig = {
  data: trendLineData,
  xField: 'month',
  yField: 'value',
  colorField: 'type',
  smooth: true,
  height: 280,
  style: { lineWidth: 2 },
  interaction: { tooltip: { marker: false } },
};

const pieConfig = {
  data: pieData,
  angleField: 'value',
  colorField: 'type',
  height: 280,
  innerRadius: 0.6,
  label: {
    text: 'type',
    style: { fontWeight: 'bold' },
  },
  legend: { color: { position: 'bottom' as const } },
  interaction: { tooltip: { marker: false } },
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 4 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        padding: '12px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 12,
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CrownOutlined style={{ fontSize: 22 }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>代理人工作台</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>张代理 · 星河知识产权代理事务所 · 今日待办 6 项</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button ghost size="small" onClick={() => navigate('/admin/agent-workbench')}>进入工作台</Button>
          <Button ghost size="small" onClick={() => navigate('/admin/subsidy-engine')}>补贴申报</Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        {domainCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.title}>
            <Card
              variant="borderless"
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: card.shadow,
                cursor: 'pointer',
              }}
              styles={{ body: { padding: 0 } }}
              onClick={() => navigate(card.link)}
            >
              <div style={{ background: card.gradient, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 2 }}>
                    {card.title}
                  </div>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      color: '#fff',
                    }}
                  >
                    {card.icon}
                  </div>
                </div>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
                  {card.total.toLocaleString()}
                  <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 8, opacity: 0.9 }}>
                    {card.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {card.percent}
                  </span>
                </div>
              </div>
              <div style={{ padding: '10px 16px', background: '#fff' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {card.breakdown.map((item) => (
                    <Tag
                      key={item.label}
                      color={item.color}
                      style={{ cursor: 'pointer', margin: 0, fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.link);
                      }}
                    >
                      {item.label} {item.count}
                    </Tag>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="分域案件办理台"
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
      >
        <Row gutter={[12, 12]}>
          {businessWorkbenches.map((item) => (
            <Col xs={24} md={12} xl={6} key={item.domain}>
              <Card size="small" style={{ height: '100%', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                  <strong>{item.domain}</strong>
                  <Tag color={item.color}>{item.stage}</Tag>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>{item.caseNo} · {item.owner}</div>
                <div style={{ fontSize: 13, color: '#262626', lineHeight: 1.6 }}>{item.result}</div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#595959', lineHeight: 1.6 }}>{item.review}</div>
                <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }} onClick={() => navigate(item.link)}>
                  {item.action} <RightOutlined />
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>业务趋势</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/trademark/tracker')}>商标 →</Tag>
                  <Tag color="magenta" style={{ cursor: 'pointer' }} onClick={() => navigate('/patent/fee-reminder')}>专利 →</Tag>
                  <Tag color="cyan" style={{ cursor: 'pointer' }} onClick={() => navigate('/copyright/hash-deposit')}>版权 →</Tag>
                </div>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
          >
            <Line {...lineConfig} />
            <Divider style={{ margin: '16px 0 12px' }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>分域案件钻取</div>
            <Row gutter={[12, 12]}>
              {domainDrillDown.map((domain) => (
                <Col xs={24} md={8} key={domain.domain}>
                  <Card
                    size="small"
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: domain.color,
                            display: 'inline-block',
                          }}
                        />
                        <span>{domain.domain}</span>
                        <span style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 400 }}>{domain.subtitle}</span>
                      </div>
                    }
                    style={{ borderRadius: 8 }}
                    styles={{ body: { padding: '8px 12px' } }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {domain.items.map((item) => (
                        <div
                          key={item.label}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                          }}
                          onClick={() => navigate(item.link)}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ fontSize: 13, color: '#262626' }}>{item.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Badge
                              count={item.count}
                              style={{ backgroundColor: domain.color, fontSize: 11 }}
                              overflowCount={999}
                            />
                            <RightOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>案件状态分布</span>
                <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/trademark/tracker')}>查看案件 →</Tag>
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
          >
            <Pie {...pieConfig} />
            <Divider style={{ margin: '16px 0 12px' }} />
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>按状态钻取</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {statusDrillDown.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => navigate(item.link)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: item.color,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{ fontSize: 13, color: '#262626' }}>{item.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{item.count}</span>
                    <RightOutlined style={{ fontSize: 11, color: '#bfbfbf' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 600 }}>近期动态 · 状态流转</span>}
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recentActivities.map((act, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    background: idx % 2 === 0 ? '#fafafa' : '#fff',
                    borderRadius: 10,
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => navigate(act.link)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f0f0f0')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.85)' }}>
                        {act.content}
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>
                        {act.time} · <UserOutlined /> {act.assignee}
                      </div>
                    </div>
                    <Tag color={act.tagColor} style={{ cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                      {act.tag} →
                    </Tag>
                  </div>
                  <Steps
                    size="small"
                    current={act.statusFlow.findIndex((s) => s.status === 'process')}
                    items={act.statusFlow.map((step) => ({
                      title: step.title,
                      status: step.status,
                    }))}
                    style={{ marginTop: 8 }}
                  />
                  <div style={{ fontSize: 12, color: '#667eea', marginTop: 8, fontWeight: 500 }}>
                    下一步：{act.nextAction}
                  </div>
                  <Divider style={{ margin: '10px 0 8px' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    {act.resultIcon}
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.65)' }}>处理结果：</span>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)', lineHeight: 1.6 }}>{act.resultText}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 600 }}>待办事项 · 处理流程</span>
                <Badge count={todoItems.length} style={{ backgroundColor: '#667eea' }} />
              </div>
            }
            variant="borderless"
            style={{ borderRadius: 12, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todoItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: idx % 2 === 0 ? '#fafafa' : '#fff',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onClick={() => navigate(item.link)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#667eea')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#f0f0f0')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {item.statusIcon}
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{item.title}</span>
                    </div>
                    <Tag color={item.tagColor}>{item.priority}</Tag>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <span><UserOutlined /> {item.assignee}</span>
                      <span><ClockCircleOutlined /> 截止 {item.deadline}</span>
                    </div>
                  </div>
                  <Divider style={{ margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>
                      {item.nextAction}
                    </span>
                    <span style={{ color: '#667eea', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      前往处理 →
                    </span>
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ClockCircleOutlined style={{ fontSize: 11 }} />
                    <span>处理记录：{item.processRecord}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
