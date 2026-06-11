import React, { useState } from 'react';
import {
  Upload,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Card,
  Row,
  Col,
  Typography,
  Space,
  message,
  theme,
  Drawer,
  Timeline,
} from 'antd';
import {
  InboxOutlined,
  SafetyCertificateOutlined,
  FileProtectOutlined,
  CopyOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const mockDeposits = [
  {
    id: '1',
    name: '品牌视觉设计稿V3',
    type: '图片作品',
    hash: 'a3f7b2c9d4e8f1a6b5c3d7e2f4a8b1c6d9e3f7a2b5c8d1e4f6a9b2c5d8e1f4',
    time: '2026-06-09 14:23:15',
    txId: '0x8f3a2b7c4d5e6f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
    status: '已存证' as const,
    size: '2.4 MB',
  },
  {
    id: '2',
    name: '产品宣传视频-夏季版',
    type: '视频作品',
    hash: 'b4e8c3d2a1f7e6b5c4d3a2f1e8b7c6d5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9',
    time: '2026-06-08 09:15:42',
    txId: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    status: '已存证' as const,
    size: '156.7 MB',
  },
  {
    id: '3',
    name: '用户协议文档',
    type: '文字作品',
    hash: 'c5f9d4e3b2a1c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3',
    time: '2026-06-08 11:32:08',
    txId: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    status: '存证中' as const,
    size: '340 KB',
  },
  {
    id: '4',
    name: 'APP界面交互设计',
    type: '图片作品',
    hash: 'd6a0e5f4c3b2d1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6',
    time: '2026-06-07 16:45:33',
    txId: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    status: '已存证' as const,
    size: '8.1 MB',
  },
  {
    id: '5',
    name: '原创音乐-晨光序曲',
    type: '音频作品',
    hash: 'e7b1f6a5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a',
    time: '2026-06-06 20:12:57',
    txId: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e',
    status: '已存证' as const,
    size: '12.3 MB',
  },
  {
    id: '6',
    name: '技术白皮书V2.1',
    type: '文字作品',
    hash: 'f8c2a7b6e5d4c3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8',
    time: '2026-06-05 08:38:21',
    txId: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    status: '失败' as const,
    size: '1.8 MB',
  },
  {
    id: '7',
    name: '产品3D渲染图',
    type: '图片作品',
    hash: 'a9d3b8c7f6e5a4d3c2b1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9',
    time: '2026-06-04 13:55:44',
    txId: '0x6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
    status: '已存证' as const,
    size: '24.6 MB',
  },
  {
    id: '8',
    name: '企业宣传片-国际版',
    type: '视频作品',
    hash: 'b0e4c9d8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0',
    time: '2026-06-03 10:08:19',
    txId: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    status: '已存证' as const,
    size: '320.5 MB',
  },
  {
    id: '9',
    name: '数据可视化图表集',
    type: '图片作品',
    hash: 'c1f5d0e9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1',
    time: '2026-06-02 17:42:36',
    txId: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    status: '存证中' as const,
    size: '5.7 MB',
  },
];

const statusMap: Record<string, { color: string; icon?: React.ReactNode }> = {
  已存证: { color: 'success', icon: <SafetyCertificateOutlined /> },
  存证中: { color: 'processing', icon: <FileProtectOutlined /> },
  失败: { color: 'error' },
};

const mockVerificationHistory = [
  { key: '1', time: '2026-06-09 16:00:12', verifier: '系统自动', result: '通过', confirmations: 12 },
  { key: '2', time: '2026-06-09 10:22:45', verifier: '张伟', result: '通过', confirmations: 12 },
  { key: '3', time: '2026-06-08 15:33:18', verifier: '系统自动', result: '通过', confirmations: 12 },
  { key: '4', time: '2026-06-07 09:11:07', verifier: '李明', result: '未通过', confirmations: 3 },
  { key: '5', time: '2026-06-06 20:45:33', verifier: '系统自动', result: '通过', confirmations: 12 },
];

const mockPendingDeposits = [
  { key: '1', name: '春季活动海报设计', type: '图片作品', size: '3.2 MB', uploadTime: '2026-06-09 15:10:00' },
  { key: '2', name: '产品说明书V4.0', type: '文字作品', size: '1.1 MB', uploadTime: '2026-06-09 15:08:22' },
  { key: '3', name: '品牌主题曲-星光', type: '音频作品', size: '8.5 MB', uploadTime: '2026-06-09 14:55:41' },
];

const HashDeposit: React.FC = () => {
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<(typeof mockDeposits)[0] | null>(null);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<(typeof mockDeposits)[0] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const { token } = theme.useToken();

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/mock-upload',
    beforeUpload: () => {
      message.success('文件已提交存证，正在计算哈希值...');
      return false;
    },
  };

  const showCertificate = (record: (typeof mockDeposits)[0]) => {
    setCurrentRecord(record);
    setCertificateOpen(true);
  };

  const showDetail = (record: (typeof mockDeposits)[0]) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const handleReVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      message.success('验证完成：哈希值与区块链记录一致，存证有效');
    }, 1500);
  };

  const handleBatchDeposit = () => {
    message.success('3个文件已批量提交存证，正在计算哈希值...');
    setBatchModalOpen(false);
  };

  const columns = [
    {
      title: '作品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '作品类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: '哈希值',
      dataIndex: 'hash',
      key: 'hash',
      render: (text: string) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>
            {text.slice(0, 12)}...{text.slice(-8)}
          </Text>
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard?.writeText(text);
              message.success('哈希值已复制');
            }}
          />
        </Space>
      ),
    },
    {
      title: '存证时间',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: '区块链交易ID',
      dataIndex: 'txId',
      key: 'txId',
      render: (text: string) => (
        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          {text.slice(0, 14)}...{text.slice(-6)}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const cfg = statusMap[status];
        return (
          <Tag color={cfg?.color} icon={cfg?.icon}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: (typeof mockDeposits)[0]) => (
        <Space>
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            详情
          </Button>
          {record.status === '已存证' && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showCertificate(record)}
            >
              存证证书
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const verificationColumns = [
    { title: '验证时间', dataIndex: 'time', key: 'time' },
    { title: '验证人', dataIndex: 'verifier', key: 'verifier' },
    {
      title: '验证结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => (
        <Tag color={result === '通过' ? 'success' : 'error'} icon={result === '通过' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {result}
        </Tag>
      ),
    },
    { title: '区块链确认数', dataIndex: 'confirmations', key: 'confirmations', render: (v: number) => <Text strong>{v}</Text> },
  ];

  const batchColumns = [
    { title: '文件名称', dataIndex: 'name', key: 'name', render: (t: string) => <Text strong>{t}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '上传时间', dataIndex: 'uploadTime', key: 'uploadTime' },
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
                <SafetyCertificateOutlined style={{ marginRight: 8 }} />
                作品哈希存证
              </span>
            }
          >
            <Dragger
              {...uploadProps}
              style={{
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
                border: '2px dashed #c4b5fd',
                padding: '24px 0',
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#667eea', fontSize: 48 }} />
              </p>
              <p style={{ fontSize: 16, color: '#333', fontWeight: 500 }}>
                点击或拖拽文件到此区域上传
              </p>
              <p style={{ color: '#888', fontSize: 13 }}>
                支持图片、文档、视频、音频等格式，单文件最大 500MB
              </p>
              <Space style={{ marginTop: 8 }}>
                <Tag color="purple">PNG/JPG</Tag>
                <Tag color="purple">PDF/DOC</Tag>
                <Tag color="purple">MP4/MOV</Tag>
                <Tag color="purple">MP3/WAV</Tag>
              </Space>
            </Dragger>

            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                style={{ borderRadius: 8 }}
                onClick={() => setBatchModalOpen(true)}
              >
                批量存证
              </Button>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#f6f0ff',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <SafetyCertificateOutlined style={{ color: '#667eea' }} />
              <Text style={{ color: '#5b3da5', fontSize: 13 }}>
                上传文件后将自动计算 SHA-256 哈希值并写入区块链，存证结果不可篡改，具有法律效力
              </Text>
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <FileProtectOutlined style={{ marginRight: 8, color: '#667eea' }} />
                我的存证
              </span>
            }
            extra={
              <Space>
                <Tag color="success">已存证 {mockDeposits.filter((d) => d.status === '已存证').length}</Tag>
                <Tag color="processing">存证中 {mockDeposits.filter((d) => d.status === '存证中').length}</Tag>
                <Tag color="error">失败 {mockDeposits.filter((d) => d.status === '失败').length}</Tag>
              </Space>
            }
          >
            <Table
              dataSource={mockDeposits}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 5, showSizeChanger: true, showTotal: (t) => `共 ${t} 条记录` }}
              style={{ borderRadius: 8 }}
            />
          </Card>
        </Col>

        <Col span={24}>
          <Card
            style={{ borderRadius: 12 }}
            title={
              <span style={{ fontWeight: 600 }}>
                <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                存证验证记录
              </span>
            }
          >
            <Table
              dataSource={mockVerificationHistory}
              columns={verificationColumns}
              rowKey="key"
              pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条验证记录` }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={null}
        open={certificateOpen}
        onCancel={() => setCertificateOpen(false)}
        footer={null}
        width={640}
        styles={{ body: { padding: 0 } }}
      >
        {currentRecord && (
          <div
            style={{
              background: 'linear-gradient(180deg, #f8f5ff 0%, #fff 40%)',
              padding: '32px 40px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.15,
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 40, color: '#667eea' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined
                style={{ fontSize: 40, color: '#667eea', marginBottom: 8 }}
              />
              <Title level={3} style={{ margin: 0, color: '#333' }}>
                区块链存证证书
              </Title>
              <Text style={{ color: '#999' }}>Blockchain Deposit Certificate</Text>
            </div>

            <div
              style={{
                border: '2px solid #e8d8f8',
                borderRadius: 12,
                padding: 24,
                position: 'relative',
              }}
            >
              <Descriptions column={1} bordered size="small" labelStyle={{ fontWeight: 600, width: 140 }}>
                <Descriptions.Item label="作品名称">{currentRecord.name}</Descriptions.Item>
                <Descriptions.Item label="作品类型">{currentRecord.type}</Descriptions.Item>
                <Descriptions.Item label="文件大小">{currentRecord.size}</Descriptions.Item>
                <Descriptions.Item label="SHA-256哈希">
                  <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {currentRecord.hash}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="存证时间">{currentRecord.time}</Descriptions.Item>
                <Descriptions.Item label="区块链交易ID">
                  <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {currentRecord.txId}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="存证状态">
                  <Tag color="success" icon={<SafetyCertificateOutlined />}>
                    已存证
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div
              style={{
                marginTop: 20,
                border: '1px solid #d9f7be',
                borderRadius: 12,
                padding: 20,
                background: '#f6ffed',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text strong style={{ fontSize: 15, color: '#389e0d' }}>
                  <CheckCircleOutlined style={{ marginRight: 6 }} />
                  验证信息
                </Text>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={verifying}
                  onClick={handleReVerify}
                  style={{ borderRadius: 6 }}
                >
                  重新验证
                </Button>
              </div>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="验证时间">2026-06-09 16:00:12</Descriptions.Item>
                <Descriptions.Item label="验证结果">
                  <Tag color="success" icon={<CheckCircleOutlined />}>通过</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="区块链确认数">
                  <Text strong>12</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Text style={{ color: '#aaa', fontSize: 12 }}>
                本证书由区块链存证平台自动生成，哈希值与区块链记录一致，具有法律效力
              </Text>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <span>
            <CloudUploadOutlined style={{ marginRight: 8, color: '#667eea' }} />
            批量存证
          </span>
        }
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setBatchModalOpen(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" icon={<CloudUploadOutlined />} onClick={handleBatchDeposit} style={{ borderRadius: 8 }}>
            一键存证
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">以下文件已上传，可一键提交批量存证：</Text>
        </div>
        <Table
          dataSource={mockPendingDeposits}
          columns={batchColumns}
          rowKey="key"
          pagination={false}
          size="middle"
        />
      </Modal>

      <Drawer
        title={
          <span>
            <EyeOutlined style={{ marginRight: 8, color: '#667eea' }} />
            存证详情
          </span>
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={560}
      >
        {detailRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #667eea' }} title={<Text strong style={{ fontSize: 13 }}>哈希信息</Text>}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="完整哈希值">
                  <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {detailRecord.hash}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="作品名称">{detailRecord.name}</Descriptions.Item>
                <Descriptions.Item label="作品类型">{detailRecord.type}</Descriptions.Item>
                <Descriptions.Item label="文件大小">{detailRecord.size}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #722ed1' }} title={<Text strong style={{ fontSize: 13 }}>区块链交易详情</Text>}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="交易ID">
                  <Text code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    {detailRecord.txId}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="区块高度">#18,432,567</Descriptions.Item>
                <Descriptions.Item label="确认数">12,847</Descriptions.Item>
                <Descriptions.Item label="存证时间">{detailRecord.time}</Descriptions.Item>
                <Descriptions.Item label="链上状态">
                  <Tag color="success" icon={<CheckCircleOutlined />}>已确认</Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" style={{ borderRadius: 8, borderLeft: '3px solid #52c41a' }} title={<Text strong style={{ fontSize: 13 }}>验证历史</Text>}>
              <Timeline
                items={[
                  { color: 'green', children: <div><Text strong>验证通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2026-06-09 16:00:12 · 系统自动 · 确认数 12</Text></div> },
                  { color: 'green', children: <div><Text strong>验证通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2026-06-09 10:22:45 · 张伟 · 确认数 12</Text></div> },
                  { color: 'green', children: <div><Text strong>验证通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2026-06-08 15:33:18 · 系统自动 · 确认数 12</Text></div> },
                  { color: 'red', children: <div><Text strong>验证未通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2026-06-07 09:11:07 · 李明 · 确认数 3</Text></div> },
                  { color: 'green', children: <div><Text strong>验证通过</Text><br /><Text type="secondary" style={{ fontSize: 12 }}>2026-06-06 20:45:33 · 系统自动 · 确认数 12</Text></div> },
                ]}
              />
            </Card>

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              block
              size="large"
              style={{ borderRadius: 8 }}
              onClick={() => message.success('证书下载已开始')}
            >
              下载证书
            </Button>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default HashDeposit;
