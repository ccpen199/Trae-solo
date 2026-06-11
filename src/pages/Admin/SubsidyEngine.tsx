import React, { useState } from 'react';
import {
  Card,
  Steps,
  Table,
  Tag,
  Button,
  Progress,
  Row,
  Col,
  Descriptions,
  Statistic,
  Checkbox,
  Upload,
  message,
  Drawer,
  Modal,
  Timeline,
  Badge,
} from 'antd';
import {
  BankOutlined,
  TrophyOutlined,
  FileSearchOutlined,
  RocketOutlined,
  UploadOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  CalendarOutlined,
  CheckOutlined,
  RightOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const companyInfo = {
  name: '星河智能科技有限公司',
  industry: '人工智能/软件',
  size: '中型企业（200-500人）',
  location: '北京市海淀区',
  trademarks: 28,
  patents: 45,
  copyrights: 63,
  established: '2018年',
  establishedYears: 3,
};

interface Policy {
  id: number;
  name: string;
  issuer: string;
  amountRange: string;
  deadline: string;
  matchScore: number;
  requirements: string[];
  tags: string[];
  matchDetails: { dimension: string; companyValue: string; required: string; passed: boolean }[];
}

const policies: Policy[] = [
  {
    id: 1,
    name: '高新技术企业认定',
    issuer: '科技部',
    amountRange: '25万-50万',
    deadline: '2026-09-30',
    matchScore: 95,
    requirements: ['企业营业执照副本', '知识产权证书', '研发费用审计报告', '高新技术产品收入证明', '科研人员占比证明'],
    tags: ['重点推荐', '税收优惠'],
    matchDetails: [
      { dimension: '企业规模', companyValue: '中型', required: '不限', passed: true },
      { dimension: '知识产权数量', companyValue: '28件商标+45件专利', required: '≥1件', passed: true },
      { dimension: '行业', companyValue: '信息技术', required: '高新技术领域', passed: true },
      { dimension: '研发占比', companyValue: '8.5%', required: '≥3%', passed: true },
      { dimension: '成立年限', companyValue: '3年', required: '≥1年', passed: true },
    ],
  },
  {
    id: 2,
    name: '北京市专精特新中小企业',
    issuer: '北京市经信局',
    amountRange: '10万-30万',
    deadline: '2026-08-15',
    matchScore: 88,
    requirements: ['企业营业执照', '专精特新认定申请表', '研发投入证明', '知识产权证明', '管理体系认证'],
    tags: ['市级政策'],
    matchDetails: [
      { dimension: '企业规模', companyValue: '中型', required: '中小微企业', passed: true },
      { dimension: '知识产权数量', companyValue: '28件商标', required: '有自主知识产权', passed: true },
      { dimension: '行业', companyValue: '信息技术', required: '重点领域', passed: true },
      { dimension: '成立年限', companyValue: '3年', required: '≥2年', passed: true },
      { dimension: '管理体系', companyValue: '未认证', required: 'ISO9001等', passed: false },
    ],
  },
  {
    id: 3,
    name: '中关村高新技术企业',
    issuer: '中关村管委会',
    amountRange: '5万-15万',
    deadline: '2026-12-31',
    matchScore: 82,
    requirements: ['营业执照', '知识产权证书', '研发人员证明', '技术创新证明'],
    tags: ['园区政策'],
    matchDetails: [
      { dimension: '企业规模', companyValue: '中型', required: '不限', passed: true },
      { dimension: '知识产权数量', companyValue: '45件专利', required: '≥1件', passed: true },
      { dimension: '行业', companyValue: '信息技术', required: '高新技术领域', passed: true },
      { dimension: '注册地', companyValue: '海淀区', required: '中关村园区', passed: true },
    ],
  },
  {
    id: 4,
    name: '软件企业增值税即征即退',
    issuer: '国家税务总局',
    amountRange: '退税额不等',
    deadline: '2026-06-30',
    matchScore: 78,
    requirements: ['软件著作权登记证书', '软件产品登记证书', '增值税纳税申报表', '企业财务报表'],
    tags: ['税收优惠'],
    matchDetails: [
      { dimension: '知识产权数量', companyValue: '63件版权', required: '有软著', passed: true },
      { dimension: '行业', companyValue: '软件', required: '软件企业', passed: true },
      { dimension: '成立年限', companyValue: '3年', required: '≥5年', passed: false },
    ],
  },
  {
    id: 5,
    name: '海淀区初创企业扶持资金',
    issuer: '海淀区政府',
    amountRange: '20万-80万',
    deadline: '2026-10-31',
    matchScore: 72,
    requirements: ['营业执照', '投融资证明', '知识产权证明', '团队构成说明', '商业计划书'],
    tags: ['区级政策', '资金扶持'],
    matchDetails: [
      { dimension: '注册地', companyValue: '海淀区', required: '海淀区', passed: true },
      { dimension: '成立年限', companyValue: '3年', required: '≤3年', passed: true },
      { dimension: '知识产权', companyValue: '28件商标', required: '有知识产权', passed: true },
      { dimension: '融资轮次', companyValue: 'A轮', required: '天使轮/种子轮', passed: false },
    ],
  },
  {
    id: 6,
    name: '国家知识产权示范企业',
    issuer: '国家知识产权局',
    amountRange: '30万-100万',
    deadline: '2027-03-31',
    matchScore: 65,
    requirements: ['营业执照', '知识产权管理制度', '专利导航报告', '知识产权培训记录', '专利奖补申请材料', '知识产权贯标证书'],
    tags: ['国家级', '荣誉认定'],
    matchDetails: [
      { dimension: '知识产权数量', companyValue: '45件专利', required: '≥50件', passed: false },
      { dimension: '行业', companyValue: '信息技术', required: '不限', passed: true },
      { dimension: '成立年限', companyValue: '3年', required: '≥5年', passed: false },
      { dimension: '贯标认证', companyValue: '未认证', required: '已贯标', passed: false },
    ],
  },
  {
    id: 7,
    name: '北京市科技型中小企业',
    issuer: '北京市科委',
    amountRange: '5万-10万',
    deadline: '2026-11-30',
    matchScore: 90,
    requirements: ['营业执照', '研发费用明细', '科技人员名单', '知识产权证明'],
    tags: ['市级政策', '入门级'],
    matchDetails: [
      { dimension: '企业规模', companyValue: '中型', required: '中小微企业', passed: true },
      { dimension: '知识产权数量', companyValue: '45件专利', required: '有知识产权', passed: true },
      { dimension: '行业', companyValue: '信息技术', required: '科技领域', passed: true },
      { dimension: '研发投入', companyValue: '8.5%', required: '≥3%', passed: true },
    ],
  },
];

interface MaterialItem {
  id: number;
  name: string;
  status: '已上传' | '未上传' | '需补充';
  reviewStatus: '通过' | '需补充' | '退回' | '未审核';
  reviewComment: string;
  reviewTimeline: { step: string; time: string; status: 'done' | 'active' | 'pending' }[];
}

interface Application {
  id: number;
  policyName: string;
  currentStep: number;
  applyDate: string;
  steps: string[];
  estimatedDate: string;
  appStatus: '审核中' | '已通过' | '待补充' | '已提交';
  progressTimeline: { time: string; event: string }[];
}

const applications: Application[] = [
  {
    id: 1,
    policyName: '高新技术企业认定',
    currentStep: 3,
    applyDate: '2026-04-15',
    steps: ['材料准备', '网上申报', '形式审查', '专家评审', '公示', '发证'],
    estimatedDate: '2026-10-30',
    appStatus: '审核中',
    progressTimeline: [
      { time: '2026-04-15', event: '材料准备完成' },
      { time: '2026-04-20', event: '网上申报提交' },
      { time: '2026-05-10', event: '形式审查通过' },
      { time: '2026-06-01', event: '进入专家评审阶段' },
    ],
  },
  {
    id: 2,
    policyName: '软件企业增值税即征即退',
    currentStep: 2,
    applyDate: '2026-05-20',
    steps: ['材料准备', '网上申报', '税务审核', '退税办理'],
    estimatedDate: '2026-08-15',
    appStatus: '待补充',
    progressTimeline: [
      { time: '2026-05-20', event: '材料准备完成' },
      { time: '2026-05-25', event: '网上申报提交' },
      { time: '2026-06-05', event: '税务审核退回，需补充财务报表' },
    ],
  },
  {
    id: 3,
    policyName: '北京市科技型中小企业',
    currentStep: 4,
    applyDate: '2026-03-10',
    steps: ['材料准备', '网上申报', '形式审查', '公示', '入库登记'],
    estimatedDate: '2026-07-30',
    appStatus: '已通过',
    progressTimeline: [
      { time: '2026-03-10', event: '材料准备完成' },
      { time: '2026-03-15', event: '网上申报提交' },
      { time: '2026-04-01', event: '形式审查通过' },
      { time: '2026-05-15', event: '公示期结束，无异议' },
      { time: '2026-05-20', event: '入库登记完成' },
    ],
  },
  {
    id: 4,
    policyName: '中关村高新技术企业',
    currentStep: 1,
    applyDate: '2026-06-05',
    steps: ['材料准备', '网上申报', '园区审核', '发证'],
    estimatedDate: '2026-09-30',
    appStatus: '已提交',
    progressTimeline: [
      { time: '2026-06-05', event: '材料准备完成' },
      { time: '2026-06-08', event: '网上申报提交' },
    ],
  },
];

const materialStatusMap: Record<string, { color: string; icon: React.ReactNode }> = {
  已上传: { color: '#52c41a', icon: <CheckCircleFilled style={{ color: '#52c41a' }} /> },
  未上传: { color: '#ff4d4f', icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} /> },
  需补充: { color: '#faad14', icon: <ExclamationCircleFilled style={{ color: '#faad14' }} /> },
};

const reviewStatusColor: Record<string, string> = {
  通过: '#52c41a',
  需补充: '#fa8c16',
  退回: '#ff4d4f',
  未审核: '#d9d9d9',
};

const matchScoreColor = (score: number) => {
  if (score >= 85) return '#52c41a';
  if (score >= 70) return '#1890ff';
  return '#faad14';
};

const appStatusColor: Record<string, string> = {
  审核中: 'processing',
  已通过: 'success',
  待补充: 'warning',
  已提交: 'default',
};

const upcomingDeadlines = [
  { date: '2026-06-30', policy: '软件企业增值税即征即退', daysLeft: 21 },
  { date: '2026-08-15', policy: '北京市专精特新中小企业', daysLeft: 67 },
  { date: '2026-09-30', policy: '高新技术企业认定', daysLeft: 113 },
  { date: '2026-10-31', policy: '海淀区初创企业扶持资金', daysLeft: 144 },
  { date: '2026-11-30', policy: '北京市科技型中小企业', daysLeft: 174 },
  { date: '2026-12-31', policy: '中关村高新技术企业', daysLeft: 205 },
];

const SubsidyEngine: React.FC = () => {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy>(policies[0]);
  const [policyDrawerVisible, setPolicyDrawerVisible] = useState(false);
  const [drawerPolicy, setDrawerPolicy] = useState<Policy | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState<string>('');

  const materials: MaterialItem[] = selectedPolicy.requirements.map((req, idx) => {
    const statusCycle: Array<'已上传' | '未上传' | '需补充'> = ['已上传', '未上传', '需补充'];
    const reviewCycle: Array<'通过' | '未审核' | '需补充'> = ['通过', '未审核', '需补充'];
    const status = statusCycle[idx % 3];
    const reviewStatus = reviewCycle[idx % 3];
    const reviewComments: Record<string, string> = {
      通过: '材料完整，符合要求',
      需补充: '缺少盖章页，请补充后重新上传',
      退回: '材料格式不符，请重新准备',
      未审核: '等待审核中',
    };
    const timelineMap: Record<string, { step: string; time: string; status: 'done' | 'active' | 'pending' }[]> = {
      已上传: [
        { step: '材料上传', time: '2026-06-05 09:30', status: 'done' },
        { step: 'AI预审', time: '2026-06-05 09:31', status: 'done' },
        { step: '人工复核', time: '2026-06-05 14:00', status: 'done' },
        { step: '通过', time: '2026-06-05 14:20', status: 'done' },
      ],
      未上传: [
        { step: '材料上传', time: '-', status: 'pending' },
        { step: 'AI预审', time: '-', status: 'pending' },
        { step: '人工复核', time: '-', status: 'pending' },
        { step: '通过/退回', time: '-', status: 'pending' },
      ],
      需补充: [
        { step: '材料上传', time: '2026-06-03 10:00', status: 'done' },
        { step: 'AI预审', time: '2026-06-03 10:01', status: 'done' },
        { step: '人工复核', time: '2026-06-03 15:30', status: 'done' },
        { step: '需补充', time: '2026-06-03 15:35', status: 'active' },
      ],
    };
    return {
      id: idx + 1,
      name: req,
      status,
      reviewStatus,
      reviewComment: reviewComments[reviewStatus],
      reviewTimeline: timelineMap[status],
    };
  });

  const uploadedCount = materials.filter((m) => m.status === '已上传').length;
  const completionPercent = Math.round((uploadedCount / materials.length) * 100);

  const openPolicyDrawer = (policy: Policy) => {
    setDrawerPolicy(policy);
    setPolicyDrawerVisible(true);
  };

  const openUploadModal = (materialName: string) => {
    setUploadingMaterial(materialName);
    setUploadModalVisible(true);
  };

  const applicationColumns = [
    { title: '政策名称', dataIndex: 'policyName', key: 'policyName', width: 200 },
    { title: '申报日期', dataIndex: 'applyDate', key: 'applyDate', width: 120 },
    {
      title: '当前节点',
      key: 'currentNode',
      width: 140,
      render: (_: unknown, record: Application) => record.steps[record.currentStep],
    },
    { title: '预计审批日期', dataIndex: 'estimatedDate', key: 'estimatedDate', width: 130 },
    {
      title: '状态',
      dataIndex: 'appStatus',
      key: 'appStatus',
      width: 100,
      render: (v: string) => <Badge status={appStatusColor[v] as 'processing' | 'success' | 'warning' | 'default'} text={v} />,
    },
  ];

  return (
    <div style={{ padding: 4 }}>
      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <BankOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            企业信息
          </span>
        }
        variant="borderless"
        style={{ borderRadius: 12 }}
        styles={{ body: { paddingBottom: 8 } }}
      >
        <Row gutter={[24, 16]}>
          <Col xs={24} lg={12}>
            <Descriptions column={{ xs: 1, sm: 2 }} size="middle">
              <Descriptions.Item label="企业名称">{companyInfo.name}</Descriptions.Item>
              <Descriptions.Item label="所属行业">{companyInfo.industry}</Descriptions.Item>
              <Descriptions.Item label="企业规模">{companyInfo.size}</Descriptions.Item>
              <Descriptions.Item label="所在地区">{companyInfo.location}</Descriptions.Item>
              <Descriptions.Item label="成立时间">{companyInfo.established}</Descriptions.Item>
            </Descriptions>
          </Col>
          <Col xs={24} lg={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="商标"
                  value={companyInfo.trademarks}
                  suffix="件"
                  valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="专利"
                  value={companyInfo.patents}
                  suffix="件"
                  valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="版权"
                  value={companyInfo.copyrights}
                  suffix="件"
                  valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                />
              </Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <Progress
                percent={72}
                strokeColor={{ from: '#1890ff', to: '#52c41a' }}
                format={() => '知产完善度 72%'}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <CalendarOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
            申报日历
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
        styles={{ body: { padding: '12px 24px 20px' } }}
      >
        <Row gutter={[12, 8]}>
          {upcomingDeadlines.map((item) => (
            <Col xs={24} sm={12} md={8} lg={4} key={item.policy}>
              <div
                style={{
                  padding: '10px 14px',
                  background: item.daysLeft <= 30 ? '#fff2f0' : item.daysLeft <= 90 ? '#fffbe6' : '#f6ffed',
                  borderRadius: 8,
                  borderLeft: `3px solid ${item.daysLeft <= 30 ? '#ff4d4f' : item.daysLeft <= 90 ? '#faad14' : '#52c41a'}`,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: '#262626', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.policy}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.date}</span>
                  <Tag color={item.daysLeft <= 30 ? 'error' : item.daysLeft <= 90 ? 'warning' : 'success'} style={{ margin: 0, fontSize: 11 }}>
                    剩余{item.daysLeft}天
                  </Tag>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            政策匹配
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
        styles={{ body: { padding: '12px 24px 24px' } }}
      >
        <Row gutter={[16, 16]}>
          {policies.map((policy) => {
            const isSelected = selectedPolicy.id === policy.id;
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={policy.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setSelectedPolicy(policy)}
                  style={{
                    borderRadius: 10,
                    border: isSelected ? `2px solid ${matchScoreColor(policy.matchScore)}` : '1px solid #f0f0f0',
                    boxShadow: isSelected ? `0 2px 12px ${matchScoreColor(policy.matchScore)}22` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  styles={{ body: { padding: 16 } }}
                  extra={
                    <Button
                      type="link"
                      size="small"
                      icon={<RightOutlined />}
                      onClick={(e) => { e.stopPropagation(); openPolicyDrawer(policy); }}
                    >
                      详情
                    </Button>
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#262626', lineHeight: 1.4, flex: 1, paddingRight: 8 }}>
                      {policy.name}
                    </span>
                    <div
                      style={{
                        minWidth: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: `3px solid ${matchScoreColor(policy.matchScore)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 16, fontWeight: 800, color: matchScoreColor(policy.matchScore), lineHeight: 1 }}>
                        {policy.matchScore}
                      </span>
                      <span style={{ fontSize: 9, color: '#8c8c8c', lineHeight: 1 }}>匹配</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>
                    发文机关：{policy.issuer}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#f5222d' }}>{policy.amountRange}</span>
                    <span style={{ fontSize: 11, color: '#bfbfbf' }}>截止 {policy.deadline}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {policy.tags.map((tag) => (
                      <Tag key={tag} color="blue" style={{ fontSize: 11, margin: 0 }}>{tag}</Tag>
                    ))}
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 4 }}>核心要求：</div>
                    {policy.requirements.slice(0, 3).map((req, i) => (
                      <div key={i} style={{ fontSize: 11, color: '#595959', paddingLeft: 4, lineHeight: 1.8 }}>
                        • {req}
                      </div>
                    ))}
                    {policy.requirements.length > 3 && (
                      <div style={{ fontSize: 11, color: '#1890ff', paddingLeft: 4 }}>
                        ...等{policy.requirements.length}项要求
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <FileSearchOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                材料预审 — {selectedPolicy.name}
              </span>
            }
            extra={
              <span style={{ fontSize: 13, color: '#8c8c8c' }}>
                完成进度 {completionPercent}%
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 12, height: '100%' }}
          >
            <Progress
              percent={completionPercent}
              strokeColor={{ from: '#722ed1', to: '#b37feb' }}
              style={{ marginBottom: 20 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {materials.map((mat) => (
                <div
                  key={mat.id}
                  style={{
                    padding: '12px 16px',
                    background: '#fafafa',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <Checkbox checked={mat.status === '已上传'} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#262626' }}>{mat.name}</span>
                    <Tag
                      icon={materialStatusMap[mat.status].icon}
                      color={materialStatusMap[mat.status].color}
                      style={{ margin: 0 }}
                    >
                      {mat.status}
                    </Tag>
                    {mat.reviewStatus !== '未审核' && (
                      <Tag color={reviewStatusColor[mat.reviewStatus]} style={{ margin: 0 }}>
                        {mat.reviewStatus}
                      </Tag>
                    )}
                    {mat.status !== '已上传' ? (
                      <Button size="small" icon={<UploadOutlined />} type="primary" ghost onClick={() => openUploadModal(mat.name)}>
                        上传
                      </Button>
                    ) : (
                      <Button size="small" type="link" style={{ padding: 0 }}>
                        查看
                      </Button>
                    )}
                  </div>
                  <div style={{ paddingLeft: 30 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#8c8c8c' }}>预审状态追踪：</span>
                      {mat.reviewTimeline.map((step, idx) => (
                        <React.Fragment key={step.step}>
                          <span style={{ fontSize: 11, color: step.status === 'done' ? '#52c41a' : step.status === 'active' ? '#1890ff' : '#d9d9d9', fontWeight: step.status === 'active' ? 600 : 400 }}>
                            {step.step}
                            {step.time !== '-' && <span style={{ fontSize: 10, color: '#bfbfbf', marginLeft: 2 }}>{step.time.split(' ')[1]}</span>}
                          </span>
                          {idx < mat.reviewTimeline.length - 1 && <span style={{ color: '#d9d9d9', fontSize: 10 }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    {mat.reviewStatus !== '未审核' && mat.reviewComment && (
                      <div style={{ fontSize: 11, color: mat.reviewStatus === '通过' ? '#52c41a' : mat.reviewStatus === '需补充' ? '#fa8c16' : '#ff4d4f', fontStyle: 'italic' }}>
                        审核意见：{mat.reviewComment}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 600, fontSize: 16 }}>
                <RocketOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                申报进度
              </span>
            }
            variant="borderless"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 24px 24px' } }}
          >
            <Table
              dataSource={applications}
              columns={applicationColumns}
              rowKey="id"
              size="small"
              pagination={false}
              style={{ marginBottom: 20 }}
              expandable={{
                expandedRowRender: (record: Application) => (
                  <div style={{ padding: '8px 0' }}>
                    <Timeline
                      items={record.progressTimeline.map((item, idx) => ({
                        color: idx === record.progressTimeline.length - 1 ? '#1890ff' : '#52c41a',
                        children: (
                          <div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{item.event}</span>
                            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 12 }}>{item.time}</span>
                          </div>
                        ),
                      }))}
                    />
                  </div>
                ),
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 8 }}>
              {applications.map((app) => (
                <div key={app.id}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#262626', marginBottom: 12 }}>
                    {app.policyName}
                  </div>
                  <Steps
                    size="small"
                    current={app.currentStep}
                    items={app.steps.map((step) => ({ title: step }))}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            <RocketOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            申报进度追踪
          </span>
        }
        variant="borderless"
        style={{ marginTop: 16, borderRadius: 12 }}
        styles={{ body: { padding: '12px 24px 24px' } }}
      >
        <Table
          dataSource={applications}
          columns={applicationColumns}
          rowKey="id"
          size="middle"
          pagination={false}
          expandable={{
            expandedRowRender: (record: Application) => (
              <div style={{ padding: '12px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 12 }}>申报进度时间线</div>
                <Timeline
                  items={record.progressTimeline.map((item, idx) => ({
                    color: idx === record.progressTimeline.length - 1 ? '#1890ff' : '#52c41a',
                    children: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{item.event}</span>
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.time}</span>
                      </div>
                    ),
                  }))}
                />
              </div>
            ),
          }}
        />
      </Card>

      <Drawer
        title={
          <span style={{ fontWeight: 600, fontSize: 16 }}>
            政策详情 — {drawerPolicy?.name}
          </span>
        }
        placement="right"
        width={560}
        open={policyDrawerVisible}
        onClose={() => setPolicyDrawerVisible(false)}
      >
        {drawerPolicy && (
          <>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="政策名称">{drawerPolicy.name}</Descriptions.Item>
              <Descriptions.Item label="发文机关">{drawerPolicy.issuer}</Descriptions.Item>
              <Descriptions.Item label="资助金额">
                <span style={{ color: '#f5222d', fontWeight: 600 }}>{drawerPolicy.amountRange}</span>
              </Descriptions.Item>
              <Descriptions.Item label="申报截止">
                <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{drawerPolicy.deadline}</span>
              </Descriptions.Item>
              <Descriptions.Item label="匹配度">
                <span style={{ color: matchScoreColor(drawerPolicy.matchScore), fontWeight: 700, fontSize: 18 }}>{drawerPolicy.matchScore}分</span>
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>申报要求</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {drawerPolicy.requirements.map((req, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#595959', paddingLeft: 8, lineHeight: 1.8 }}>
                    {i + 1}. {req}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#262626', marginBottom: 12 }}>匹配度分析</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {drawerPolicy.matchDetails.map((detail) => (
                  <div
                    key={detail.dimension}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: detail.passed ? '#f6ffed' : '#fff2f0',
                      borderRadius: 8,
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{detail.passed ? '✓' : '✗'}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#262626', width: 100, flexShrink: 0 }}>
                      {detail.dimension}
                    </span>
                    <span style={{ fontSize: 12, color: '#595959', flex: 1 }}>
                      企业: {detail.companyValue}
                    </span>
                    <span style={{ fontSize: 12, color: detail.passed ? '#52c41a' : '#ff4d4f' }}>
                      要求: {detail.required} {detail.passed ? '' : `需${detail.required}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              block
              onClick={() => {
                message.success(`已开始申报「${drawerPolicy.name}」`);
                setPolicyDrawerVisible(false);
              }}
              style={{ height: 48, fontSize: 16, fontWeight: 600 }}
            >
              一键申报
            </Button>
          </>
        )}
      </Drawer>

      <Modal
        title={`上传材料 — ${uploadingMaterial}`}
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        width={480}
      >
        <div style={{ marginTop: 16 }}>
          <Upload.Dragger
            multiple={false}
            beforeUpload={() => {
              message.success('文件上传成功');
              return false;
            }}
            style={{ marginBottom: 16 }}
          >
            <p style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }}>
              <UploadOutlined />
            </p>
            <p style={{ fontSize: 14, color: '#595959' }}>点击或拖拽文件到此区域上传</p>
            <p style={{ fontSize: 12, color: '#8c8c8c' }}>支持 PDF、JPG、PNG 格式，单文件不超过 20MB</p>
          </Upload.Dragger>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            block
            size="large"
            onClick={() => {
              message.success('材料已提交审核');
              setUploadModalVisible(false);
            }}
          >
            提交审核
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SubsidyEngine;
