import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Input,
  Select,
  Form,
  Modal,
  Descriptions,
  Row,
  Col,
  message,
  DatePicker,
  Alert,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { ipApi } from '@/api';
import type { IPCertificate } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CERT_STATUS: Record<string, { text: string; color: string }> = {
  pending: { text: '存证中', color: 'processing' },
  certified: { text: '已存证', color: 'success' },
  failed: { text: '存证失败', color: 'error' },
};

const AdminIPManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState<IPCertificate[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentCert, setCurrentCert] = useState<IPCertificate | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async (page = 1, pageSize = 10, params?: any) => {
    try {
      setLoading(true);
      const data = await ipApi.getIPCertificates({ page, pageSize, ...params });
      setCertificates(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载存证记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const values = form.getFieldsValue();
    const params: any = {};
    if (values.keyword) params.keyword = values.keyword;
    if (values.status) params.status = values.status;
    if (values.type) params.type = values.type;
    loadCertificates(1, pagination.pageSize, params);
  };

  const handleReset = () => {
    form.resetFields();
    loadCertificates(1, pagination.pageSize);
  };

  const handleViewDetail = (cert: IPCertificate) => {
    setCurrentCert(cert);
    setDetailVisible(true);
  };

  const handleDownload = async (id: string) => {
    try {
      await ipApi.downloadCertificate(id);
      message.success('证书下载中...');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const columns = [
    {
      title: '存证编号',
      dataIndex: 'certificateNo',
      key: 'certificateNo',
      width: 160,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '作品名称',
      dataIndex: 'taskTitle',
      key: 'taskTitle',
      minWidth: 200,
    },
    {
      title: '存证类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          copyright: '版权存证',
          trademark: '商标存证',
          patent: '专利存证',
          design: '外观设计',
          other: '其他',
        };
        return <Tag>{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '存证方',
      dataIndex: ['owner', 'nickname'],
      key: 'owner',
      width: 120,
    },
    {
      title: '区块链哈希',
      dataIndex: 'blockchainHash',
      key: 'hash',
      width: 180,
      render: (text: string) => (
        <Text code className="text-xs">
          {text?.slice(0, 20)}...
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = CERT_STATUS[status] || CERT_STATUS.pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '存证时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: IPCertificate) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'certified' && (
            <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record.id)}>
              证书
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={3} style={{ margin: 0 }}>知识产权存证管理</Title>
          <Text type="secondary">管理平台知识产权存证记录和证书</Text>
        </div>
        <Space>
          <Button icon={<ExportOutlined />}>导出数据</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>刷新</Button>
        </Space>
      </div>

      <Alert
        message="区块链存证"
        description="所有作品稿件提交后自动进行区块链存证，生成唯一区块链哈希值，确保知识产权不可篡改"
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        className="mb-6"
      />

      <Card className="mb-6">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="存证编号/作品名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" allowClear>
                  {Object.entries(CERT_STATUS).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="type" label="类型">
                <Select placeholder="全部" allowClear>
                  <Option value="copyright">版权存证</Option>
                  <Option value="trademark">商标存证</Option>
                  <Option value="patent">专利存证</Option>
                  <Option value="design">外观设计</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
                  <Button onClick={handleReset}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={certificates}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadCertificates(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="存证详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          currentCert?.status === 'certified' && (
            <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownload(currentCert.id)}>
              下载证书
            </Button>
          ),
        ]}
        width={720}
        destroyOnClose
      >
        {currentCert && (
          <div>
            <div className="text-center mb-6">
              <SafetyCertificateOutlined className="text-6xl text-blue-600 mb-4" />
              <Title level={4}>区块链存证证书</Title>
            </div>

            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="存证编号" span={2}>
                <Text code>{currentCert.certificateNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="作品名称" span={2}>
                {currentCert.taskTitle}
              </Descriptions.Item>
              <Descriptions.Item label="存证类型">
                {currentCert.type === 'copyright' ? '版权存证' :
                currentCert.type === 'trademark' ? '商标存证' :
                currentCert.type === 'patent' ? '专利存证' : '其他'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = CERT_STATUS[currentCert.status] || CERT_STATUS.pending;
                  return <Tag color={s.color}>{s.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="存证方">
                {currentCert.owner?.nickname}
              </Descriptions.Item>
              <Descriptions.Item label="关联任务">
                {currentCert.task?.taskNo}
              </Descriptions.Item>
              <Descriptions.Item label="存证时间" span={2}>
                {dayjs(currentCert.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="到期时间" span={2}>
                {currentCert.expiredAt ? dayjs(currentCert.expiredAt).format('YYYY-MM-DD') : '长期有效'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">区块链信息</Divider>
            <Alert
              message="区块链存证信息"
              description={
                <div>
                  <Paragraph className="m-0 mb-2">
                  <Text strong>区块高度：</Text>
                  {currentCert.blockHeight || '-'}
                </Paragraph>
                <Paragraph className="m-0 mb-2">
                  <Text strong>交易哈希：</Text>
                  <Text code>{currentCert.transactionHash || '-'}</Text>
                </Paragraph>
                <Paragraph className="m-0">
                  <Text strong>区块哈希：</Text>
                  <Text code>{currentCert.blockchainHash || '-'}</Text>
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />

            {currentCert.evidence && currentCert.evidence.length > 0 && (
              <>
                <Divider orientation="left">存证文件</Divider>
                <div className="space-y-2">
                  {currentCert.evidence.map((file, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileTextOutlined className="text-blue-600" />
                      <Text>{file.name}</Text>
                      <Button type="link" href={file.url} target="_blank">
                        查看
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminIPManagement;
