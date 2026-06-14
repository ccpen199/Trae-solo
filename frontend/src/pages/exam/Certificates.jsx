import { useState } from 'react';
import {
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Row,
  Col,
  Typography,
  Skeleton,
  Empty,
  message,
  Divider,
  Descriptions,
  QRCode,
  Alert,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  IdcardOutlined,
  FileTextOutlined,
  VerifiedOutlined,
  BarcodeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { getCertificates, verifyCertificate } from '../../api/exam';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const mockCertificates = [
  {
    id: 1,
    name: '中华人民共和国一级建造师执业资格证书',
    certificateNumber: 'JZS202311000001',
    type: 'professional_qualification',
    typeName: '职业资格证书',
    issueDate: '2023-12-15',
    validUntil: '2028-12-14',
    status: 'valid',
    examName: '2023年一级建造师资格考试',
    major: '建筑工程',
    issuer: '中华人民共和国人力资源和社会保障部',
    holderName: '张三',
    holderIdCard: '110101199001011234',
    level: '一级',
  },
  {
    id: 2,
    name: '中华人民共和国教师资格证书',
    certificateNumber: 'JSZG202205000002',
    type: 'teacher',
    typeName: '教师资格证书',
    issueDate: '2022-05-20',
    validUntil: '长期',
    status: 'valid',
    examName: '2022年上半年中小学教师资格考试',
    major: '高级中学 信息技术',
    issuer: '中华人民共和国教育部',
    holderName: '张三',
    holderIdCard: '110101199001011234',
    level: '高级中学教师资格',
  },
  {
    id: 3,
    name: '执业医师资格证书',
    certificateNumber: 'YS202108000003',
    type: 'medical',
    typeName: '医师资格证书',
    issueDate: '2021-08-10',
    validUntil: '2026-08-09',
    status: 'expired',
    examName: '2021年医师资格考试',
    major: '临床执业医师',
    issuer: '中华人民共和国国家卫生健康委员会',
    holderName: '张三',
    holderIdCard: '110101199001011234',
    level: '执业医师',
  },
  {
    id: 4,
    name: '事业单位聘用证书',
    certificateNumber: 'SYDW202003000004',
    type: 'public_institution',
    typeName: '事业单位证书',
    issueDate: '2020-03-15',
    validUntil: '2023-03-14',
    status: 'cancelled',
    examName: '2019年下半年事业单位公开招聘',
    major: '信息中心技术岗',
    issuer: '省人力资源和社会保障厅',
    holderName: '张三',
    holderIdCard: '110101199001011234',
    level: '七级职员',
    cancelReason: '个人原因离职',
  },
];

const Certificates = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [verifyForm] = Form.useForm();
  const [verifyResult, setVerifyResult] = useState(null);

  const { loading, data: certificates, refresh } = useRequest(getCertificates, {
    onError: () => {
      message.error('获取证书列表失败');
    },
  });

  const { loading: verifyLoading, run: verify } = useRequest(verifyCertificate, {
    manual: true,
    onSuccess: (result) => {
      setVerifyResult(result);
      message.success('核验成功');
    },
    onError: () => {
      message.error('核验失败，请重试');
    },
  });

  const displayData = certificates || mockCertificates;

  const getTypeColor = (type) => {
    const colorMap = {
      civil_servant: '#1E6FDB',
      public_institution: '#52C41A',
      professional_qualification: '#FAAD14',
      teacher: '#722ED1',
      medical: '#13C2C2',
      other: '#8C8C8C',
    };
    return colorMap[type] || '#8C8C8C';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      valid: { color: 'success', text: '有效', icon: <CheckCircleOutlined /> },
      expired: { color: 'warning', text: '已过期', icon: <ExclamationCircleOutlined /> },
      cancelled: { color: 'error', text: '已注销', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.valid;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleViewDetail = (certificate) => {
    setSelectedCertificate(certificate);
    setDetailModalVisible(true);
  };

  const handleDownload = (certificate) => {
    message.success(`正在下载「${certificate.name}」电子证书...`);
  };

  const handleVerify = async () => {
    try {
      const values = await verifyForm.validateFields();
      const mockResult = {
        ...mockCertificates[0],
        verifyStatus: 'genuine',
        verifyTime: new Date().toLocaleString(),
      };
      setVerifyResult(mockResult);
      message.success('核验成功');
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const getVerifyStatusTag = (status) => {
    const statusMap = {
      genuine: { color: 'success', text: '真实有效', icon: <VerifiedOutlined /> },
      fake: { color: 'error', text: '伪造证书', icon: <CloseCircleOutlined /> },
      expired: { color: 'warning', text: '已过期', icon: <ExclamationCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.genuine;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>证书管理</Title>
        <Text type="secondary">查看和下载电子证书，进行证书核验</Text>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <Space>
              <FileTextOutlined />
              我的证书
            </Space>
          }
          key="list"
        >
          {displayData.length === 0 ? (
            <Card>
              <Empty description="暂无证书信息" />
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {displayData.map(cert => (
                <Col xs={24} lg={12} key={cert.id}>
                  <Card
                    hoverable
                    actions={[
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(cert)}
                      >
                        查看详情
                      </Button>,
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(cert)}
                        disabled={cert.status !== 'valid'}
                      >
                        下载证书
                      </Button>,
                    ]}
                  >
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: 60,
                          height: 80,
                          background: `linear-gradient(135deg, ${getTypeColor(cert.type)} 0%, ${getTypeColor(cert.type)}dd 100%)`,
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <SafetyCertificateOutlined style={{ fontSize: 32, color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Space style={{ marginBottom: 8 }}>
                          <Tag color={getTypeColor(cert.type)}>{cert.typeName}</Tag>
                          {getStatusTag(cert.status)}
                        </Space>
                        <Title
                          level={5}
                          style={{
                            margin: '0 0 8px 0',
                            fontSize: 15,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {cert.name}
                        </Title>
                        <Text
                          type="secondary"
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            display: 'block',
                            marginBottom: 8,
                          }}
                        >
                          <BarcodeOutlined style={{ marginRight: 4 }} />
                          {cert.certificateNumber}
                        </Text>
                        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.8 }}>
                          <div>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            颁发日期：{dayjs(cert.issueDate).format('YYYY-MM-DD')}
                          </div>
                          <div>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            有效期至：{cert.validUntil}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </TabPane>

        <TabPane
          tab={
            <Space>
              <VerifiedOutlined />
              证书核验
            </Space>
          }
          key="verify"
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={10}>
              <Card
                title={
                  <Space>
                    <SearchOutlined style={{ color: '#1E6FDB' }} />
                    证书信息核验
                  </Space>
                }
              >
                <Alert
                  message="核验说明"
                  description="请输入证书编号和持证人身份证号进行证书真伪核验"
                  type="info"
                  showIcon
                  style={{ marginBottom: 24 }}
                />
                <Form
                  form={verifyForm}
                  layout="vertical"
                >
                  <Form.Item
                    name="certificateNumber"
                    label="证书编号"
                    rules={[{ required: true, message: '请输入证书编号' }]}
                  >
                    <Input
                      prefix={<BarcodeOutlined />}
                      placeholder="请输入证书编号"
                      maxLength={20}
                    />
                  </Form.Item>
                  <Form.Item
                    name="idCard"
                    label="持证人身份证号"
                    rules={[
                      { required: true, message: '请输入身份证号' },
                      { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '身份证号格式不正确' },
                    ]}
                  >
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="请输入持证人身份证号"
                      maxLength={18}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleVerify}
                      loading={verifyLoading}
                      block
                      style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
                    >
                      立即核验
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={14}>
              <Card
                title={
                  <Space>
                    <VerifiedOutlined style={{ color: '#1E6FDB' }} />
                    核验结果
                  </Space>
                }
              >
                {verifyResult ? (
                  <div>
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 24,
                        background: verifyResult.verifyStatus === 'genuine' ? '#f6ffed' : '#fff2f0',
                        borderRadius: 8,
                        marginBottom: 24,
                      }}
                    >
                      {verifyResult.verifyStatus === 'genuine' ? (
                        <>
                          <VerifiedOutlined style={{ fontSize: 48, color: '#52C41A', marginBottom: 12 }} />
                          <div style={{ fontSize: 20, color: '#52C41A', fontWeight: 'bold', marginBottom: 8 }}>
                            证书真实有效
                          </div>
                          <div style={{ color: '#666' }}>
                            该证书信息与官方数据库一致
                          </div>
                        </>
                      ) : (
                        <>
                          <CloseCircleOutlined style={{ fontSize: 48, color: '#F5222D', marginBottom: 12 }} />
                          <div style={{ fontSize: 20, color: '#F5222D', fontWeight: 'bold', marginBottom: 8 }}>
                            证书信息不符
                          </div>
                          <div style={{ color: '#666' }}>
                            未查询到该证书信息，请核实证书编号和身份证号
                          </div>
                        </>
                      )}
                      <div style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
                        核验时间：{verifyResult.verifyTime}
                      </div>
                    </div>

                    {verifyResult.verifyStatus === 'genuine' && (
                      <>
                        <Title level={5} style={{ marginBottom: 16 }}>证书信息</Title>
                        <Descriptions bordered column={1} size="small">
                          <Descriptions.Item label="证书名称">
                            <Space>
                              {verifyResult.name}
                              {getVerifyStatusTag(verifyResult.verifyStatus)}
                            </Space>
                          </Descriptions.Item>
                          <Descriptions.Item label="证书编号">
                            <Text style={{ fontFamily: 'monospace' }}>{verifyResult.certificateNumber}</Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="持证人姓名">{verifyResult.holderName}</Descriptions.Item>
                          <Descriptions.Item label="证件号码">{verifyResult.holderIdCard}</Descriptions.Item>
                          <Descriptions.Item label="资格级别">{verifyResult.level}</Descriptions.Item>
                          <Descriptions.Item label="专业">{verifyResult.major}</Descriptions.Item>
                          <Descriptions.Item label="颁发机构">{verifyResult.issuer}</Descriptions.Item>
                          <Descriptions.Item label="颁发日期">
                            {dayjs(verifyResult.issueDate).format('YYYY-MM-DD')}
                          </Descriptions.Item>
                          <Descriptions.Item label="有效期至">{verifyResult.validUntil}</Descriptions.Item>
                        </Descriptions>
                      </>
                    )}
                  </div>
                ) : (
                  <Empty description="请输入证书信息进行核验" image={null} />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#1E6FDB' }} />
            证书详情
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedCertificate && handleDownload(selectedCertificate)}
            disabled={selectedCertificate?.status !== 'valid'}
            style={{ background: '#1E6FDB', borderColor: '#1E6FDB' }}
          >
            下载电子证书
          </Button>,
        ]}
      >
        {selectedCertificate && (
          <div>
            <div
              style={{
                background: `linear-gradient(135deg, ${getTypeColor(selectedCertificate.type)} 0%, ${getTypeColor(selectedCertificate.type)}dd 100%)`,
                color: '#fff',
                padding: 24,
                borderRadius: 8,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <Title level={4} style={{ color: '#fff', margin: '0 0 8px 0' }}>
                {selectedCertificate.name}
              </Title>
              <Space>
                <Tag color="rgba(255,255,255,0.3)" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
                  {selectedCertificate.typeName}
                </Tag>
                {getStatusTag(selectedCertificate.status)}
              </Space>
            </div>

            {selectedCertificate.status === 'cancelled' && selectedCertificate.cancelReason && (
              <Alert
                message="注销信息"
                description={`注销原因：${selectedCertificate.cancelReason}`}
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            {selectedCertificate.status === 'expired' && (
              <Alert
                message="证书已过期"
                description="该证书已超过有效期，请及时办理续期或重新考取"
                type="warning"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="证书编号" span={2}>
                <Text strong style={{ fontFamily: 'monospace', fontSize: 16 }}>
                  {selectedCertificate.certificateNumber}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="持证人姓名">{selectedCertificate.holderName}</Descriptions.Item>
              <Descriptions.Item label="证件号码">{selectedCertificate.holderIdCard}</Descriptions.Item>
              <Descriptions.Item label="资格级别">{selectedCertificate.level}</Descriptions.Item>
              <Descriptions.Item label="专业">{selectedCertificate.major}</Descriptions.Item>
              <Descriptions.Item label="颁发机构">{selectedCertificate.issuer}</Descriptions.Item>
              <Descriptions.Item label="颁发日期">
                {dayjs(selectedCertificate.issueDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="有效期至">{selectedCertificate.validUntil}</Descriptions.Item>
              <Descriptions.Item label="获取方式">
                通过「{selectedCertificate.examName}」考试取得
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div style={{ textAlign: 'center', padding: 24, background: '#fafafa', borderRadius: 8 }}>
              <div style={{ display: 'inline-block', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <QRCode
                  value={`https://verify.example.com/certificate/${selectedCertificate.certificateNumber}`}
                  size={140}
                  color="#1E6FDB"
                  style={{ marginBottom: 12 }}
                />
                <div style={{ fontSize: 12, color: '#999', marginBottom: 4 }}>扫码验证真伪</div>
                <div style={{ fontSize: 11, color: '#bbb', wordBreak: 'break-all', maxWidth: 160 }}>
                  https://verify.example.com/certificate/{selectedCertificate.certificateNumber}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
                <div>本证书由发证机关统一制作，具有法律效力</div>
                <div>查询时间：{new Date().toLocaleString()}</div>
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '10px 24px',
                  border: '3px solid #1E6FDB',
                  borderRadius: 4,
                  color: '#1E6FDB',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}
              >
                {selectedCertificate.issuer}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Certificates;
