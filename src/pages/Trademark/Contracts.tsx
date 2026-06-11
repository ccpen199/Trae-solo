import { useState } from 'react';
import {
  Tabs,
  Card,
  Modal,
  Button,
  Progress,
  Avatar,
  Tag,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Steps,
  Drawer,
  Timeline,
  Table,
  message,
} from 'antd';
import {
  FileTextOutlined,
  EyeOutlined,
  SendOutlined,
  SwapOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  BellOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface TemplateItem {
  id: string;
  name: string;
  description: string;
  usageCount: number;
  icon: React.ReactNode;
  color: string;
}

interface SigningEntry {
  id: string;
  contractName: string;
  parties: [string, string];
  progress: number;
  status: string;
  statusColor: string;
  currentStep: number;
  signTimeline: { signer: string; role: string; time: string; ip: string; signed: boolean }[];
  remainingSigners: string[];
}

interface ContractRecord {
  key: string;
  contractNo: string;
  type: string;
  partyA: string;
  partyB: string;
  status: string;
  statusColor: string;
  createdDate: string;
}

const transferTemplates: TemplateItem[] = [
  { id: 't1', name: '商标转让合同（通用版）', description: '适用于一般商标转让场景，包含基本转让条款、权利义务及违约责任等内容', usageCount: 1286, icon: <SwapOutlined />, color: '#667eea' },
  { id: 't2', name: '商标转让合同（含质权）', description: '适用于已设置质权的商标转让，包含质权解除及优先受偿等特殊条款', usageCount: 423, icon: <SafetyCertificateOutlined />, color: '#764ba2' },
  { id: 't3', name: '商标转让合同（涉外版）', description: '适用于跨境商标转让，包含外汇结算、国际法律适用及争议解决条款', usageCount: 318, icon: <FileTextOutlined />, color: '#4facfe' },
  { id: 't4', name: '商标转让合同（批量转让）', description: '适用于多个商标同时转让的场景，含附件清单及批量转让特别条款', usageCount: 207, icon: <SwapOutlined />, color: '#43e97b' },
];

const licenseTemplates: TemplateItem[] = [
  { id: 'l1', name: '商标许可合同（独占许可）', description: '独占许可模式下被许可方享有排他性使用权，含许可范围及质量控制条款', usageCount: 956, icon: <SafetyCertificateOutlined />, color: '#fa709a' },
  { id: 'l2', name: '商标许可合同（排他许可）', description: '排他许可模式下许可方保留自身使用权，含许可期限及区域限制条款', usageCount: 742, icon: <FileTextOutlined />, color: '#f093fb' },
  { id: 'l3', name: '商标许可合同（普通许可）', description: '普通许可模式下可多人使用，含许可费计算方式及使用监督条款', usageCount: 1103, icon: <SendOutlined />, color: '#fee140' },
  { id: 'l4', name: '商标许可合同（特许经营）', description: '适用于特许经营模式，含品牌授权、经营规范及加盟管理条款', usageCount: 589, icon: <UserOutlined />, color: '#a18cd1' },
];

const activeSignings: SigningEntry[] = [
  {
    id: 's1', contractName: '星辰科技商标转让',
    parties: ['北京星辰科技有限公司', '上海云翼信息技术有限公司'],
    progress: 75, status: '签署中', statusColor: 'processing', currentStep: 2,
    signTimeline: [
      { signer: '张伟', role: '甲方代表', time: '2026-06-07 10:30', ip: '192.168.1.101', signed: true },
      { signer: '李明', role: '乙方代表', time: '2026-06-08 14:15', ip: '10.0.0.55', signed: true },
      { signer: '王芳', role: '乙方授权人', time: '', ip: '', signed: false },
    ],
    remainingSigners: ['王芳（乙方授权人）'],
  },
  {
    id: 's2', contractName: '蓝鲸数据独占许可',
    parties: ['深圳蓝鲸数据科技有限公司', '杭州锦程服饰有限公司'],
    progress: 50, status: '待对方签署', statusColor: 'warning', currentStep: 1,
    signTimeline: [
      { signer: '陈刚', role: '甲方代表', time: '2026-06-06 09:00', ip: '172.16.0.33', signed: true },
      { signer: '赵敏', role: '乙方代表', time: '', ip: '', signed: false },
    ],
    remainingSigners: ['赵敏（乙方代表）'],
  },
  {
    id: 's3', contractName: '锐视传媒排他许可',
    parties: ['广州锐视传媒有限公司', '成都味享餐饮管理有限公司'],
    progress: 25, status: '我方待签', statusColor: 'default', currentStep: 0,
    signTimeline: [
      { signer: '刘强', role: '甲方代表', time: '', ip: '', signed: false },
      { signer: '周丽', role: '乙方代表', time: '', ip: '', signed: false },
    ],
    remainingSigners: ['刘强（甲方代表）', '周丽（乙方代表）'],
  },
];

const myContracts: ContractRecord[] = [
  { key: '1', contractNo: 'HT-2026-001', type: '商标转让', partyA: '北京星辰科技有限公司', partyB: '上海云翼信息技术有限公司', status: '签署中', statusColor: 'processing', createdDate: '2026-06-05' },
  { key: '2', contractNo: 'HT-2026-002', type: '独占许可', partyA: '深圳蓝鲸数据科技有限公司', partyB: '杭州锦程服饰有限公司', status: '待对方签署', statusColor: 'warning', createdDate: '2026-06-04' },
  { key: '3', contractNo: 'HT-2026-003', type: '排他许可', partyA: '广州锐视传媒有限公司', partyB: '成都味享餐饮管理有限公司', status: '我方待签', statusColor: 'default', createdDate: '2026-06-03' },
  { key: '4', contractNo: 'HT-2026-004', type: '商标转让', partyA: '南京华创化工科技有限公司', partyB: '北京星辰科技有限公司', status: '已完成', statusColor: 'success', createdDate: '2026-05-20' },
  { key: '5', contractNo: 'HT-2026-005', type: '普通许可', partyA: '成都味享餐饮管理有限公司', partyB: '广州锐视传媒有限公司', status: '已完成', statusColor: 'success', createdDate: '2026-05-15' },
];

const mockContractContent = `商标转让合同

甲方（转让方）：_______________
乙方（受让方）：_______________

鉴于甲方合法拥有下述商标，现双方根据《中华人民共和国商标法》及相关法律法规，就商标转让事宜达成如下协议：

第一条 转让商标信息
1.1 商标名称：_______________
1.2 注册号：_______________
1.3 国际分类：第___类
1.4 核定使用商品/服务：_______________

第二条 转让价格及支付方式
2.1 双方商定本次商标转让价格为人民币________元（¥________）。
2.2 乙方应于本合同签署之日起___个工作日内支付全部转让费用。

第三条 权利义务
3.1 甲方应保证对转让商标享有合法、完整的所有权，不存在任何权属争议。
3.2 甲方应协助乙方办理商标转让登记手续。
3.3 乙方应按约定支付转让费用。

第四条 违约责任
4.1 任何一方违反本合同约定，应承担违约责任，并赔偿对方因此遭受的损失。

第五条 争议解决
5.1 因本合同引起的争议，双方应协商解决；协商不成的，提交仲裁委员会仲裁。

甲方签章：_______________    乙方签章：_______________
签署日期：_______________    签署日期：_______________`;

const TemplateCard: React.FC<{
  template: TemplateItem;
  onPreview: (t: TemplateItem) => void;
}> = ({ template, onPreview }) => (
  <Card
    hoverable
    style={{ borderRadius: 12, height: '100%' }}
    styles={{ body: { padding: 20, display: 'flex', flexDirection: 'column', height: '100%' } }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
      <Avatar
        size={44}
        style={{ background: `linear-gradient(135deg, ${template.color}, ${template.color}99)`, flexShrink: 0 }}
        icon={template.icon}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>{template.name}</Text>
        <Tag color="blue" style={{ marginRight: 0 }}>{template.usageCount} 次使用</Tag>
      </div>
    </div>
    <Paragraph type="secondary" style={{ fontSize: 13, flex: 1, marginBottom: 16 }} ellipsis={{ rows: 2 }}>
      {template.description}
    </Paragraph>
    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
      <Button icon={<EyeOutlined />} onClick={() => onPreview(template)}>预览</Button>
      <Button type="primary" icon={<SendOutlined />} style={{ background: template.color, borderColor: template.color }}>
        使用模板
      </Button>
    </Space>
  </Card>
);

const TrademarkContracts: React.FC = () => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [signDetailOpen, setSignDetailOpen] = useState(false);
  const [currentSigning, setCurrentSigning] = useState<SigningEntry | null>(null);

  const handlePreview = (template: TemplateItem) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const showSignDetail = (signing: SigningEntry) => {
    setCurrentSigning(signing);
    setSignDetailOpen(true);
  };

  const handleUrge = () => {
    message.success('催签通知已发送');
  };

  const signingSteps = ['发起签署', '甲方签署', '乙方签署', '完成'];

  const contractColumns = [
    { title: '合同编号', dataIndex: 'contractNo', key: 'contractNo', render: (t: string) => <Text code>{t}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '甲方', dataIndex: 'partyA', key: 'partyA' },
    { title: '乙方', dataIndex: 'partyB', key: 'partyB' },
    {
      title: '签署状态', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={myContracts.find((c) => c.status === status)?.statusColor || 'default'}>{status}</Tag>,
    },
    { title: '创建日期', dataIndex: 'createdDate', key: 'createdDate' },
    {
      title: '操作', key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" icon={<DownloadOutlined />}>下载</Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'transfer',
      label: <Space><SwapOutlined />转让合同</Space>,
      children: (
        <Row gutter={[16, 16]}>
          {transferTemplates.map((t) => (
            <Col key={t.id} xs={24} sm={12} lg={6}>
              <TemplateCard template={t} onPreview={handlePreview} />
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'license',
      label: <Space><SafetyCertificateOutlined />许可合同</Space>,
      children: (
        <Row gutter={[16, 16]}>
          {licenseTemplates.map((t) => (
            <Col key={t.id} xs={24} sm={12} lg={6}>
              <TemplateCard template={t} onPreview={handlePreview} />
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: 'myContracts',
      label: <Space><FileTextOutlined />我的合同</Space>,
      children: (
        <Table
          columns={contractColumns}
          dataSource={myContracts}
          pagination={false}
          size="middle"
        />
      ),
    },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 20 }}>转让/许可合同</Title>

      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Tabs items={tabItems} />
      </Card>

      <Card
        title={
          <Space>
            <SendOutlined />
            <span>在线签署</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Row gutter={[16, 16]}>
          {activeSignings.map((signing) => (
            <Col key={signing.id} xs={24} md={8}>
              <Card
                size="small"
                style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}
                styles={{ body: { padding: 16 } }}
              >
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 15 }}>{signing.contractName}</Text>
                </div>
                <div style={{ marginBottom: 12 }}>
                  {signing.parties.map((party, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <UserOutlined style={{ fontSize: 12, color: '#999' }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>{party}</Text>
                      {idx === 0 && <Tag color="blue" style={{ marginLeft: 4, fontSize: 11 }}>转让方</Tag>}
                      {idx === 1 && <Tag color="green" style={{ marginLeft: 4, fontSize: 11 }}>受让方</Tag>}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Tag color={signing.statusColor} icon={<ClockCircleOutlined />} style={{ marginRight: 0 }}>
                    {signing.status}
                  </Tag>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>{signing.progress}%</Text>
                </div>
                <Progress percent={signing.progress} showInfo={false} size="small" />
                <div style={{ marginTop: 12 }}>
                  <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => showSignDetail(signing)}>
                    签署详情
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={
          <Space>
            <FileTextOutlined />
            <span>合同预览 - {previewTemplate?.name}</span>
          </Space>
        }
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setPreviewOpen(false)}>关闭</Button>,
          <Button key="use" type="primary" style={{ background: '#667eea', borderColor: '#667eea' }} icon={<SendOutlined />}>
            使用此模板
          </Button>,
        ]}
      >
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: 8,
            padding: 24,
            maxHeight: 400,
            overflowY: 'auto',
            fontFamily: 'inherit',
          }}
        >
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontSize: 13, lineHeight: 1.8 }}>
            {mockContractContent}
          </pre>
        </div>
        <Divider />
        <Title level={5}>签署流程</Title>
        <Steps
          current={0}
          items={signingSteps.map((label) => ({ title: label }))}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <Space>
            <Text type="secondary">使用次数:</Text>
            <Text strong>{previewTemplate?.usageCount}</Text>
          </Space>
          <Space>
            <Text type="secondary">模板类型:</Text>
            <Tag color="blue">{previewTemplate?.name.includes('转让') ? '转让合同' : '许可合同'}</Tag>
          </Space>
        </div>
      </Modal>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>签署详情 - {currentSigning?.contractName}</span>
          </Space>
        }
        placement="right"
        width={560}
        open={signDetailOpen}
        onClose={() => setSignDetailOpen(false)}
      >
        {currentSigning && (
          <>
            <Steps
              current={currentSigning.currentStep}
              items={signingSteps.map((label) => ({ title: label }))}
              style={{ marginBottom: 24 }}
            />

            <Title level={5}>签署时间线</Title>
            <Timeline
              style={{ marginBottom: 24 }}
              items={currentSigning.signTimeline.map((item) => ({
                color: item.signed ? 'green' : 'gray',
                children: (
                  <div>
                    <div>
                      <Text strong>{item.signer}</Text>
                      <Tag color={item.signed ? 'success' : 'default'} style={{ marginLeft: 8, fontSize: 11 }}>
                        {item.signed ? '已签署' : '待签署'}
                      </Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{item.role}</Text>
                    {item.signed && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.time} · IP: {item.ip}
                        </Text>
                      </div>
                    )}
                  </div>
                ),
              }))}
            />

            <Title level={5}>待签署人</Title>
            <div style={{ marginBottom: 24 }}>
              {currentSigning.remainingSigners.map((signer, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 16px',
                    background: '#fff7e6',
                    borderRadius: 8,
                    border: '1px solid #ffe58f',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Space>
                    <UserOutlined />
                    <Text>{signer}</Text>
                  </Space>
                  <Tag color="warning">待签署</Tag>
                </div>
              ))}
            </div>

            <Button
              type="primary"
              icon={<BellOutlined />}
              block
              size="large"
              onClick={handleUrge}
              style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
            >
              催签
            </Button>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default TrademarkContracts;
