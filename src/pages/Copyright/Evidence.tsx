import React, { useState } from 'react';
import {
  Table,
  Checkbox,
  Button,
  Card,
  Steps,
  Tag,
  Row,
  Col,
  Descriptions,
  Modal,
  Typography,
  Space,
  message,
  Progress,
} from 'antd';
import {
  FileZipOutlined,
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  SwapOutlined,
  FileProtectOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ClueItem {
  id: string;
  originalWork: string;
  infringementType: string;
  platform: string;
  similarity: number;
  detectionTime: string;
  selected: boolean;
}

const mockClues: ClueItem[] = [
  {
    id: '1',
    originalWork: '品牌视觉设计稿V3',
    infringementType: '图文抄袭',
    platform: '淘宝',
    similarity: 96.8,
    detectionTime: '2026-06-09 08:32:15',
    selected: true,
  },
  {
    id: '2',
    originalWork: '产品宣传视频-夏季版',
    infringementType: '视频搬运',
    platform: '抖音',
    similarity: 89.2,
    detectionTime: '2026-06-08 22:18:44',
    selected: true,
  },
  {
    id: '3',
    originalWork: '品牌视觉设计稿V3',
    infringementType: '图文抄袭',
    platform: '微信公众号',
    similarity: 82.5,
    detectionTime: '2026-06-08 14:05:33',
    selected: false,
  },
  {
    id: '4',
    originalWork: 'APP界面交互设计',
    infringementType: '图文抄袭',
    platform: '小红书',
    similarity: 91.3,
    detectionTime: '2026-06-07 19:47:12',
    selected: true,
  },
  {
    id: '5',
    originalWork: '企业宣传片-国际版',
    infringementType: '视频搬运',
    platform: 'B站',
    similarity: 94.1,
    detectionTime: '2026-06-05 16:33:41',
    selected: false,
  },
  {
    id: '6',
    originalWork: '产品3D渲染图',
    infringementType: '图文抄袭',
    platform: '拼多多',
    similarity: 87.4,
    detectionTime: '2026-06-04 09:14:07',
    selected: true,
  },
];

interface EvidencePackage {
  id: string;
  name: string;
  generationTime: string;
  evidenceCount: number;
  status: '已完成' | '生成中' | '待生成';
  downloadUrl: string;
  blockchainHash: string;
  packageId: string;
  currentStep: number;
}

const initialPackages: EvidencePackage[] = [
  {
    id: '1',
    name: '品牌视觉设计侵权证据包',
    generationTime: '2026-06-09 15:42:18',
    evidenceCount: 5,
    status: '已完成',
    downloadUrl: '#',
    blockchainHash: '0x8f3a2b7c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    packageId: 'EP-2026-0609-00042',
    currentStep: 3,
  },
  {
    id: '2',
    name: '产品宣传视频侵权证据包',
    generationTime: '2026-06-08 23:10:55',
    evidenceCount: 3,
    status: '已完成',
    downloadUrl: '#',
    blockchainHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    packageId: 'EP-2026-0608-00039',
    currentStep: 3,
  },
  {
    id: '3',
    name: 'APP界面交互侵权证据包',
    generationTime: '2026-06-07 20:28:33',
    evidenceCount: 2,
    status: '生成中',
    downloadUrl: '',
    blockchainHash: '',
    packageId: 'EP-2026-0607-00035',
    currentStep: 1,
  },
  {
    id: '4',
    name: '综合侵权证据包-2026年6月',
    generationTime: '2026-06-06 12:15:47',
    evidenceCount: 8,
    status: '已完成',
    downloadUrl: '#',
    blockchainHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    packageId: 'EP-2026-0606-00028',
    currentStep: 3,
  },
  {
    id: '5',
    name: '3D渲染图侵权证据包',
    generationTime: '-',
    evidenceCount: 0,
    status: '待生成',
    downloadUrl: '',
    blockchainHash: '',
    packageId: '-',
    currentStep: -1,
  },
];

const mockDownloadRecords = [
  { key: '1', time: '2026-06-09 16:20:00', downloader: '张伟', purpose: '诉讼提交' },
  { key: '2', time: '2026-06-09 10:15:30', downloader: '李明', purpose: '律师函附件' },
  { key: '3', time: '2026-06-08 14:33:12', downloader: '王芳', purpose: '内部存档' },
  { key: '4', time: '2026-06-07 09:08:45', downloader: '张伟', purpose: '调解谈判' },
];

const stepLabels = ['证据收集', '区块链认证', '加密打包', '完成下载'];
const stepIcons = [
  <FileProtectOutlined />,
  <SafetyCertificateOutlined />,
  <FileZipOutlined />,
  <CheckCircleOutlined />,
];

const Evidence: React.FC = () => {
  const [clues, setClues] = useState(mockClues);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [packages, setPackages] = useState(initialPackages);

  const selectedClues = clues.filter((c) => c.selected);

  const toggleSelect = (id: string) => {
    setClues((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const toggleAll = () => {
    const allSelected = clues.every((c) => c.selected);
    setClues((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  };

  const handleGenerate = () => {
    if (selectedClues.length === 0) {
      message.warning('请至少选择一条侵权线索');
      return;
    }
    setGenerating(true);
    setProgress(0);
    setCurrentStep(0);

    const timer1 = setTimeout(() => {
      setProgress(30);
      setCurrentStep(1);
    }, 600);
    const timer2 = setTimeout(() => {
      setProgress(65);
      setCurrentStep(2);
    }, 1500);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setCurrentStep(3);
    }, 2400);
    const timer4 = setTimeout(() => {
      setGenerating(false);
      setCurrentStep(3);
      const newPkg: EvidencePackage = {
        id: String(Date.now()),
        name: `新生成证据包-${new Date().toLocaleDateString('zh-CN')}`,
        generationTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        evidenceCount: selectedClues.length,
        status: '已完成',
        downloadUrl: '#',
        blockchainHash: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        packageId: `EP-2026-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
        currentStep: 3,
      };
      setPackages((prev) => [newPkg, ...prev]);
      message.success('证据包已生成完毕');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  const clueColumns = [
    {
      title: (
        <Checkbox checked={clues.every((c) => c.selected)} indeterminate={selectedClues.length > 0 && !clues.every((c) => c.selected)} onChange={toggleAll} />
      ),
      dataIndex: 'selected',
      key: 'selected',
      width: 48,
      render: (_: boolean, record: ClueItem) => (
        <Checkbox checked={record.selected} onChange={() => toggleSelect(record.id)} />
      ),
    },
    {
      title: '原作品',
      dataIndex: 'originalWork',
      key: 'originalWork',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '侵权类型',
      dataIndex: 'infringementType',
      key: 'infringementType',
      render: (text: string) => <Tag color="volcano">{text}</Tag>,
    },
    {
      title: '来源平台',
      dataIndex: 'platform',
      key: 'platform',
    },
    {
      title: '相似度',
      dataIndex: 'similarity',
      key: 'similarity',
      sorter: (a: ClueItem, b: ClueItem) => a.similarity - b.similarity,
      render: (val: number) => (
        <Text strong style={{ color: val >= 90 ? '#f5222d' : val >= 80 ? '#faad14' : '#52c41a' }}>
          {val}%
        </Text>
      ),
    },
    {
      title: '检测时间',
      dataIndex: 'detectionTime',
      key: 'detectionTime',
    },
  ];

  const packageColumns = [
    {
      title: '证据包名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '证据包ID',
      dataIndex: 'packageId',
      key: 'packageId',
      render: (text: string) => <Text code style={{ fontSize: 11 }}>{text}</Text>,
    },
    {
      title: '生成时间',
      dataIndex: 'generationTime',
      key: 'generationTime',
    },
    {
      title: '包含证据',
      dataIndex: 'evidenceCount',
      key: 'evidenceCount',
      render: (count: number) => <Tag color="blue">{count} 条</Tag>,
    },
    {
      title: '区块链哈希',
      dataIndex: 'blockchainHash',
      key: 'blockchainHash',
      render: (text: string) =>
        text ? (
          <Text code style={{ fontSize: 11 }}>{text.slice(0, 14)}...{text.slice(-6)}</Text>
        ) : (
          '-'
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const map: Record<string, { color: string; icon: React.ReactNode }> = {
          已完成: { color: 'success', icon: <CheckCircleOutlined /> },
          生成中: { color: 'processing', icon: <ClockCircleOutlined /> },
          待生成: { color: 'default', icon: <ClockCircleOutlined /> },
        };
        const cfg = map[status];
        return <Tag color={cfg?.color} icon={cfg?.icon}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: EvidencePackage) => (
        <Space>
          {record.status === '已完成' && (
            <>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
                预览
              </Button>
              <Button
                type="link"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => message.success('证据包下载已开始')}
              >
                下载
              </Button>
            </>
          )}
          {record.status === '生成中' && (
            <Progress type="circle" percent={67} size={28} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0 4px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{
              header: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderBottom: 'none',
                padding: '16px 24px',
              },
            }}
            title={
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                <FileZipOutlined style={{ marginRight: 8 }} />
                选择侵权线索
              </span>
            }
            extra={
              <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                已选 <Text strong style={{ color: '#fff' }}>{selectedClues.length}</Text> 条
              </Text>
            }
          >
            <Table
              dataSource={clues}
              columns={clueColumns}
              rowKey="id"
              pagination={false}
              size="middle"
              rowClassName={(record) => (record.selected ? 'ant-table-row-selected' : '')}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text type="secondary">
                共 {clues.length} 条侵权线索，已选择 {selectedClues.length} 条
              </Text>
              <Button
                type="primary"
                icon={<FileZipOutlined />}
                size="large"
                onClick={handleGenerate}
                loading={generating}
                disabled={selectedClues.length === 0}
                style={{ borderRadius: 8, height: 44, paddingInline: 32, fontWeight: 600 }}
              >
                {generating ? '正在生成...' : '生成证据包'}
              </Button>
            </div>

            {generating && (
              <div style={{ marginTop: 16 }}>
                <Progress
                  percent={progress}
                  status={progress < 100 ? 'active' : 'success'}
                  strokeColor={{ from: '#667eea', to: '#764ba2' }}
                  style={{ marginBottom: 12 }}
                />
                <Steps
                  current={currentStep}
                  size="small"
                  items={stepLabels.map((label, i) => ({
                    title: label,
                    icon: stepIcons[i],
                  }))}
                />
              </div>
            )}
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <FileZipOutlined style={{ marginRight: 8, color: '#667eea' }} />
                证据包预览
              </span>
            }
            extra={
              <Button
                icon={<SafetyCertificateOutlined />}
                style={{ borderRadius: 8 }}
                onClick={() => setVerifyOpen(true)}
              >
                验证完整性
              </Button>
            }
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Title level={5} style={{ marginBottom: 16 }}>
                  证据清单
                </Title>
                <Table
                  dataSource={selectedClues.map((c, i) => ({ ...c, index: i + 1 }))}
                  columns={[
                    { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
                    { title: '原作品', dataIndex: 'originalWork', key: 'originalWork' },
                    { title: '侵权类型', dataIndex: 'infringementType', key: 'infringementType', render: (t: string) => <Tag color="volcano">{t}</Tag> },
                    { title: '平台', dataIndex: 'platform', key: 'platform' },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Col>
              <Col xs={24} md={12}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderLeft: '3px solid #667eea' }}
                    title={<Text strong style={{ fontSize: 13 }}>原作品信息</Text>}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="作品名称">品牌视觉设计稿V3</Descriptions.Item>
                      <Descriptions.Item label="存证时间">2026-06-09 14:23:15</Descriptions.Item>
                      <Descriptions.Item label="哈希值">
                        <Text code style={{ fontSize: 11 }}>a3f7b2c9d4e8...d8e1f4</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderLeft: '3px solid #f5222d' }}
                    title={<Text strong style={{ fontSize: 13 }}>侵权对比截图</Text>}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div
                        style={{
                          width: 80,
                          height: 60,
                          borderRadius: 6,
                          background: '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                        }}
                      >
                        原作品
                      </div>
                      <SwapOutlined style={{ color: '#999' }} />
                      <div
                        style={{
                          width: 80,
                          height: 60,
                          borderRadius: 6,
                          background: '#ff6b6b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 11,
                        }}
                      >
                        侵权内容
                      </div>
                    </div>
                  </Card>

                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderLeft: '3px solid #52c41a' }}
                    title={<Text strong style={{ fontSize: 13 }}>时间戳认证</Text>}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="认证时间">2026-06-09 15:42:18</Descriptions.Item>
                      <Descriptions.Item label="时间戳机构">中国金融认证中心</Descriptions.Item>
                      <Descriptions.Item label="证书编号">TS-2026-0609-00042</Descriptions.Item>
                    </Descriptions>
                  </Card>

                  <Card
                    size="small"
                    style={{ borderRadius: 8, borderLeft: '3px solid #722ed1' }}
                    title={<Text strong style={{ fontSize: 13 }}>区块链存证证明</Text>}
                  >
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="链上交易ID">
                        <Text code style={{ fontSize: 11 }}>0x8f3a2b7c...c2d3e4f5</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="区块高度">#18,432,567</Descriptions.Item>
                      <Descriptions.Item label="确认数">12,847</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <FileZipOutlined style={{ marginRight: 8, color: '#667eea' }} />
                已生成证据包
              </span>
            }
          >
            <Table
              dataSource={packages}
              columns={packageColumns}
              rowKey="id"
              pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 个证据包` }}
              expandable={{
                expandedRowRender: (record: EvidencePackage) => {
                  if (record.status === '待生成') return null;
                  return (
                    <div style={{ padding: '12px 0' }}>
                      <Text strong style={{ display: 'block', marginBottom: 12 }}>
                        证据包状态追踪
                      </Text>
                      <Steps
                        current={record.currentStep}
                        size="small"
                        items={stepLabels.map((label, i) => ({
                          title: label,
                          icon: stepIcons[i],
                        }))}
                      />
                    </div>
                  );
                },
              }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <CloudDownloadOutlined style={{ marginRight: 8, color: '#667eea' }} />
                下载记录
              </span>
            }
          >
            <Table
              dataSource={mockDownloadRecords}
              columns={[
                { title: '下载时间', dataIndex: 'time', key: 'time' },
                { title: '下载人', dataIndex: 'downloader', key: 'downloader', render: (t: string) => <Text strong>{t}</Text> },
                { title: '用途', dataIndex: 'purpose', key: 'purpose', render: (t: string) => <Tag color="blue">{t}</Tag> },
              ]}
              rowKey="key"
              pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条下载记录` }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="证据包预览"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={720}
        footer={[
          <Button key="close" onClick={() => setPreviewOpen(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => message.success('证据包下载已开始')}>
            下载证据包
          </Button>,
        ]}
      >
        <div style={{ padding: '8px 0' }}>
          <Descriptions title="证据包信息" bordered column={2} size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="证据包名称" span={2}>品牌视觉设计侵权证据包</Descriptions.Item>
            <Descriptions.Item label="生成时间">2026-06-09 15:42:18</Descriptions.Item>
            <Descriptions.Item label="包含证据">5 条</Descriptions.Item>
            <Descriptions.Item label="时间戳认证">TS-2026-0609-00042</Descriptions.Item>
            <Descriptions.Item label="区块链交易ID">
              <Text code style={{ fontSize: 11 }}>0x8f3a2b7c...c2d3e4f5</Text>
            </Descriptions.Item>
            <Descriptions.Item label="文件格式">加密PDF</Descriptions.Item>
            <Descriptions.Item label="文件大小">24.8 MB</Descriptions.Item>
          </Descriptions>

          <Title level={5}>证据清单</Title>
          <Table
            dataSource={[
              { key: '1', index: 1, type: '图文抄袭', platform: '淘宝', similarity: '96.8%' },
              { key: '2', index: 2, type: '图文抄袭', platform: '微信公众号', similarity: '82.5%' },
              { key: '3', index: 3, type: '图文抄袭', platform: '小红书', similarity: '91.3%' },
              { key: '4', index: 4, type: '图文抄袭', platform: '拼多多', similarity: '87.4%' },
              { key: '5', index: 5, type: '视频搬运', platform: 'B站', similarity: '94.1%' },
            ]}
            columns={[
              { title: '序号', dataIndex: 'index', key: 'index', width: 60 },
              { title: '侵权类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag color="volcano">{t}</Tag> },
              { title: '来源平台', dataIndex: 'platform', key: 'platform' },
              { title: '相似度', dataIndex: 'similarity', key: 'similarity' },
            ]}
            pagination={false}
            size="small"
          />
        </div>
      </Modal>

      <Modal
        title={
          <span>
            <SafetyCertificateOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            证据包完整性验证
          </span>
        }
        open={verifyOpen}
        onCancel={() => setVerifyOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setVerifyOpen(false)}>
            确定
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={4} style={{ color: '#52c41a', marginBottom: 12 }}>
            验证通过
          </Title>
          <div
            style={{
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 8,
              padding: 16,
              textAlign: 'left',
            }}
          >
            <Text style={{ fontSize: 14, lineHeight: 2 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              证据包完整性验证通过，区块链哈希一致，时间戳认证有效
            </Text>
          </div>
          <Descriptions column={1} size="small" bordered style={{ marginTop: 16 }}>
            <Descriptions.Item label="区块链哈希校验">
              <Tag color="success">一致</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="时间戳认证">
              <Tag color="success">有效</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="证据完整性">
              <Tag color="success">通过</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="验证时间">2026-06-09 16:30:00</Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    </div>
  );
};

export default Evidence;
