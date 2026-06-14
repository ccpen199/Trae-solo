import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Progress,
  message,
  Skeleton,
  Empty,
  Typography,
  Row,
  Col,
  Descriptions,
  Modal,
  QRCode,
  Divider,
  List,
} from 'antd';
import {
  ScanOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import { createBenefitCertification, getCertifications } from '../../api/insurance';

const { Title, Text } = Typography;

const benefitTypes = [
  { id: 1, name: '养老保险待遇', type: 'pension', status: 'pending', deadline: '2024-03-31' },
  { id: 2, name: '失业保险待遇', type: 'unemployment', status: 'completed', deadline: '2024-02-28' },
  { id: 3, name: '医疗保险待遇', type: 'medical', status: 'pending', deadline: '2024-03-31' },
];

const mockCertifications = [
  {
    id: 1,
    certifyTime: '2024-01-10 14:30:00',
    method: 'face',
    result: 'success',
    benefitType: '养老保险待遇',
    validFrom: '2024-01-10',
    validTo: '2024-07-10',
  },
  {
    id: 2,
    certifyTime: '2023-12-15 09:20:00',
    method: 'bigdata',
    result: 'success',
    benefitType: '失业保险待遇',
    validFrom: '2023-12-15',
    validTo: '2024-06-15',
  },
  {
    id: 3,
    certifyTime: '2023-11-05 16:45:00',
    method: 'face',
    result: 'failed',
    benefitType: '养老保险待遇',
    remark: '人脸识别失败，请重新认证',
  },
];

const bigDataSources = [
  { name: '民政部门', status: 'verified', description: '生存状态验证' },
  { name: '公安部门', status: 'verified', description: '户籍信息验证' },
  { name: '医保部门', status: 'verifying', description: '就医记录验证' },
  { name: '交通部门', status: 'pending', description: '出行记录验证' },
];

const Certifications = () => {
  const [activeTab, setActiveTab] = useState('face');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);
  const [currentCertificate, setCurrentCertificate] = useState(null);
  const [autoCertProgress, setAutoCertProgress] = useState(65);

  const { loading, data: certifications, refresh } = useRequest(getCertifications, {
    onError: () => {
      message.error('获取认证记录失败');
    },
  });

  const { loading: submitLoading, run: submitCertification } = useRequest(createBenefitCertification, {
    manual: true,
    onSuccess: (result) => {
      message.success('认证成功');
      setCurrentCertificate(result);
      setCertificateModalVisible(true);
      refresh();
    },
    onError: () => {
      message.error('认证失败，请重试');
    },
  });

  const displayData = certifications || mockCertifications;

  const getMethodLabel = (method) => {
    const methodMap = {
      face: { text: '刷脸认证', icon: <ScanOutlined /> },
      bigdata: { text: '大数据认证', icon: <DatabaseOutlined /> },
    };
    return methodMap[method] || methodMap.face;
  };

  const getResultTag = (result) => {
    const resultMap = {
      success: { color: 'success', text: '认证通过', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '认证失败', icon: <CloseCircleOutlined /> },
      pending: { color: 'warning', text: '认证中', icon: <ClockCircleOutlined /> },
    };
    const resultInfo = resultMap[result] || resultMap.pending;
    return <Tag icon={resultInfo.icon} color={resultInfo.color}>{resultInfo.text}</Tag>;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: '待认证' },
      completed: { color: 'success', text: '已认证' },
      expired: { color: 'error', text: '已过期' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleFaceScan = () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          const success = Math.random() > 0.1;
          if (success) {
            submitCertification({ method: 'face', benefitType: '养老保险待遇' });
          } else {
            message.error('人脸识别失败，请确保光线充足，面部清晰可见');
          }
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleBigDataCert = async () => {
    message.info('正在进行大数据交叉认证，请稍候...');
    setAutoCertProgress(0);

    const interval = setInterval(() => {
      setAutoCertProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const success = Math.random() > 0.05;
          if (success) {
            submitCertification({ method: 'bigdata', benefitType: '养老保险待遇' });
          } else {
            message.error('大数据认证失败，请尝试刷脸认证');
          }
          return 100;
        }
        return prev + 2;
      });
    }, 100);
  };

  const handleViewCertificate = (record) => {
    setCurrentCertificate(record);
    setCertificateModalVisible(true);
  };

  const columns = [
    {
      title: '认证时间',
      dataIndex: 'certifyTime',
      key: 'certifyTime',
      sorter: (a, b) => new Date(a.certifyTime) - new Date(b.certifyTime),
      width: 180,
    },
    {
      title: '认证方式',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method) => {
        const methodInfo = getMethodLabel(method);
        return (
          <Space>
            {methodInfo.icon}
            {methodInfo.text}
          </Space>
        );
      },
    },
    {
      title: '待遇类型',
      dataIndex: 'benefitType',
      key: 'benefitType',
    },
    {
      title: '认证结果',
      dataIndex: 'result',
      key: 'result',
      width: 120,
      render: (result) => getResultTag(result),
    },
    {
      title: '有效期',
      dataIndex: 'validFrom',
      key: 'validity',
      render: (_, record) => {
        if (record.validFrom && record.validTo) {
          return `${record.validFrom} 至 ${record.validTo}`;
        }
        return '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        record.result === 'success' && record.validFrom ? (
          <Button type="link" onClick={() => handleViewCertificate(record)}>
            查看凭证
          </Button>
        ) : null
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  const faceTabContent = (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ScanOutlined style={{ color: '#1E6FDB' }} />
                刷脸认证
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  background: isScanning
                    ? 'linear-gradient(135deg, #1E6FDB 0%, #0F4C9E 100%)'
                    : '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 80,
                  color: isScanning ? '#fff' : '#999',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isScanning ? (
                  <ScanOutlined style={{ animation: 'pulse 1s infinite' }} />
                ) : (
                  <ScanOutlined />
                )}
                {isScanning && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(255,255,255,0.3)',
                      height: `${scanProgress}%`,
                      transition: 'height 0.1s',
                    }}
                  />
                )}
              </div>
              {isScanning ? (
                <div style={{ marginBottom: 16 }}>
                  <Progress
                    percent={scanProgress}
                    strokeColor="#1E6FDB"
                    showInfo={false}
                    style={{ width: 200, margin: '0 auto' }}
                  />
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    正在进行人脸识别，请保持正面朝向摄像头...
                  </Text>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    请确保光线充足，面部清晰可见，佩戴眼镜者请摘除眼镜
                  </Text>
                </div>
              )}
              <Button
                type="primary"
                size="large"
                icon={<ScanOutlined />}
                onClick={handleFaceScan}
                disabled={isScanning}
                loading={submitLoading}
                style={{ minWidth: 200 }}
              >
                {isScanning ? '识别中...' : '开始刷脸认证'}
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#FAAD14' }} />
                待认证待遇
              </Space>
            }
          >
            <List
              dataSource={benefitTypes}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.name}
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        认证截止日期：{item.deadline}
                      </Text>
                    }
                  />
                  {item.status === 'pending' && (
                    <Button type="primary" size="small">
                      去认证
                    </Button>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const bigDataTabContent = (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#1E6FDB' }} />
                大数据交叉认证
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  margin: '0 auto 24px',
                  borderRadius: '50%',
                  background: '#f0f7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  color: '#1E6FDB',
                }}
              >
                <DatabaseOutlined />
              </div>

              <Title level={4} style={{ marginBottom: 16 }}>自动认证进度</Title>
              <Progress
                percent={autoCertProgress}
                strokeColor="#1E6FDB"
                style={{ width: 300, margin: '0 auto 24px' }}
              />

              <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                系统正在通过多部门数据交叉核验您的待遇领取资格，无需您进行任何操作
              </Text>

              <Button
                type="primary"
                size="large"
                icon={<DatabaseOutlined />}
                onClick={handleBigDataCert}
                loading={submitLoading}
                style={{ minWidth: 200 }}
              >
                立即触发自动认证
              </Button>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <InfoCircleOutlined style={{ color: '#1E6FDB' }} />
                数据源说明
              </Space>
            </Title>
            <List
              dataSource={bigDataSources}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.name}
                        {item.status === 'verified' && <Tag color="success">已核验</Tag>}
                        {item.status === 'verifying' && <Tag color="processing">核验中</Tag>}
                        {item.status === 'pending' && <Tag color="default">待核验</Tag>}
                      </Space>
                    }
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#FAAD14' }} />
                待认证待遇
              </Space>
            }
          >
            <List
              dataSource={benefitTypes}
              renderItem={(item) => (
                <List.Item
                  style={{
                    padding: '16px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        {item.name}
                        {getStatusTag(item.status)}
                      </Space>
                    }
                    description={
                      <Text type="secondary">
                        认证截止日期：{item.deadline}
                      </Text>
                    }
                  />
                  {item.status === 'pending' && (
                    <Button type="primary" size="small">
                      去认证
                    </Button>
                  )}
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>待遇资格认证</Title>
      </div>

      <Card
        tabList={[
          {
            key: 'face',
            tab: (
              <Space>
                <ScanOutlined />
                刷脸认证
              </Space>
            ),
          },
          {
            key: 'bigdata',
            tab: (
              <Space>
                <DatabaseOutlined />
                大数据交叉认证
              </Space>
            ),
          },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
        style={{ marginBottom: 24 }}
      >
        {activeTab === 'face' ? faceTabContent : bigDataTabContent}
      </Card>

      <Card
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1E6FDB' }} />
            认证历史记录
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={displayData}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          locale={{ emptyText: <Empty description="暂无认证记录" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1E6FDB' }} />
            电子认证凭证
          </Space>
        }
        open={certificateModalVisible}
        onCancel={() => setCertificateModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setCertificateModalVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary">
            下载凭证
          </Button>,
        ]}
        width={600}
      >
        {currentCertificate && (
          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1E6FDB' }} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                社会保险待遇资格认证凭证
              </Title>
              <Text type="secondary">
                凭证编号：{currentCertificate.id?.toString().padStart(8, '0') || 'CERT20240101'}
              </Text>
            </div>

            <Descriptions bordered column={1} size="middle" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="待遇类型">{currentCertificate.benefitType}</Descriptions.Item>
              <Descriptions.Item label="认证方式">
                {getMethodLabel(currentCertificate.method).text}
              </Descriptions.Item>
              <Descriptions.Item label="认证时间">{currentCertificate.certifyTime}</Descriptions.Item>
              <Descriptions.Item label="认证结果">
                {getResultTag(currentCertificate.result)}
              </Descriptions.Item>
              {currentCertificate.validFrom && (
                <>
                  <Descriptions.Item label="有效期起">{currentCertificate.validFrom}</Descriptions.Item>
                  <Descriptions.Item label="有效期止">{currentCertificate.validTo}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 8 }}>
                <QRCode
                  value={`https://verify.example.com/cert/${currentCertificate.id}`}
                  size={120}
                  color="#1E6FDB"
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  扫码验证真伪
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999' }}>
                <div>本凭证由社会保险经办机构出具，具有法律效力</div>
                <div>生成时间：{new Date().toLocaleString()}</div>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  padding: '4px 12px',
                  border: '2px solid #1E6FDB',
                  borderRadius: 4,
                  color: '#1E6FDB',
                  fontSize: 14,
                  fontWeight: 'bold',
                }}
              >
                社会保险经办机构电子印章
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certifications;
