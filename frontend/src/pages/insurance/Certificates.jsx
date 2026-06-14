import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Skeleton,
  Empty,
  Typography,
  Row,
  Col,
  Descriptions,
  Divider,
  QRCode,
} from 'antd';
import {
  PlusOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  InsuranceOutlined,
  DollarOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useRequest from '../../hooks/useRequest';
import { createCertificate, getCertificates } from '../../api/insurance';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const certificateTypes = [
  {
    id: 'payment',
    name: '参保缴费凭证',
    description: '证明参保人在本地区的社会保险缴费情况',
    icon: <InsuranceOutlined />,
    color: '#1E6FDB',
  },
  {
    id: 'benefit',
    name: '待遇领取证明',
    description: '证明参保人正在领取社会保险待遇的情况',
    icon: <DollarOutlined />,
    color: '#52C41A',
  },
  {
    id: 'rights',
    name: '个人权益记录单',
    description: '记录参保人社会保险个人权益的详细信息',
    icon: <ProfileOutlined />,
    color: '#FAAD14',
  },
  {
    id: 'participation',
    name: '参保情况证明',
    description: '证明参保人当前的社会保险参保状态',
    icon: <SafetyCertificateOutlined />,
    color: '#722ED1',
  },
];

const insuranceOptions = [
  { value: 'all', label: '全部险种' },
  { value: 'pension', label: '养老保险' },
  { value: 'medical', label: '医疗保险' },
  { value: 'unemployment', label: '失业保险' },
  { value: 'injury', label: '工伤保险' },
  { value: 'maternity', label: '生育保险' },
];

const usageOptions = [
  { value: 'transfer', label: '社保转移' },
  { value: 'loan', label: '贷款申请' },
  { value: 'visa', label: '签证办理' },
  { value: 'other', label: '其他用途' },
];

const mockCertificates = [
  {
    id: 1,
    type: 'payment',
    name: '参保缴费凭证',
    applyTime: '2024-01-15 14:30:00',
    insuranceType: 'pension',
    period: '2023-01-01 ~ 2023-12-31',
    usage: 'transfer',
    status: 'completed',
    verifyCode: 'CERT202401150001',
    downloadUrl: '#',
  },
  {
    id: 2,
    type: 'benefit',
    name: '待遇领取证明',
    applyTime: '2024-01-10 10:20:00',
    insuranceType: 'pension',
    period: '2024-01-01 ~ 2024-01-31',
    usage: 'loan',
    status: 'completed',
    verifyCode: 'CERT202401100002',
    downloadUrl: '#',
  },
  {
    id: 3,
    type: 'rights',
    name: '个人权益记录单',
    applyTime: '2024-01-05 16:45:00',
    insuranceType: 'all',
    period: '2023-01-01 ~ 2023-12-31',
    usage: 'other',
    status: 'processing',
    remark: '正在生成中，请稍候',
  },
  {
    id: 4,
    type: 'participation',
    name: '参保情况证明',
    applyTime: '2023-12-20 09:15:00',
    insuranceType: 'medical',
    period: '2023-12-01 ~ 2023-12-31',
    usage: 'visa',
    status: 'rejected',
    remark: '时间范围超出可查询范围，请重新选择',
  },
];

const Certificates = () => {
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [form] = Form.useForm();

  const { loading, data: certificates, refresh } = useRequest(getCertificates, {
    onError: () => {
      message.error('获取凭证记录失败');
    },
  });

  const { loading: submitLoading, run: submitCertificate } = useRequest(createCertificate, {
    manual: true,
    onSuccess: () => {
      message.success('凭证申请提交成功，正在生成中...');
      setApplyModalVisible(false);
      form.resetFields();
      setSelectedType(null);
      refresh();
    },
    onError: () => {
      message.error('申请失败，请重试');
    },
  });

  const displayData = certificates || mockCertificates;

  const getTypeInfo = (type) => {
    return certificateTypes.find(t => t.id === type) || certificateTypes[0];
  };

  const getInsuranceTypeLabel = (value) => {
    const option = insuranceOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getUsageLabel = (value) => {
    const option = usageOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '待处理', icon: <ClockCircleOutlined /> },
      processing: { color: 'processing', text: '生成中', icon: <ClockCircleOutlined spin /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: '已驳回', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleApply = (type) => {
    setSelectedType(type);
    form.resetFields();
    form.setFieldsValue({
      type: type.id,
      insuranceType: 'all',
      dateRange: [dayjs().subtract(1, 'year'), dayjs()],
    });
    setApplyModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        name: selectedType?.name,
      };
      await submitCertificate(formattedValues);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePreview = (record) => {
    setSelectedCertificate(record);
    setPreviewModalVisible(true);
  };

  const handleDownload = (record) => {
    message.success(`正在下载 ${record.name}...`);
  };

  const columns = [
    {
      title: '凭证类型',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type) => {
        const typeInfo = getTypeInfo(type);
        return (
          <Space>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: typeInfo.color,
              }}
            />
            {typeInfo.name}
          </Space>
        );
      },
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      sorter: (a, b) => new Date(a.applyTime) - new Date(b.applyTime),
      width: 180,
    },
    {
      title: '险种',
      dataIndex: 'insuranceType',
      key: 'insuranceType',
      width: 100,
      render: (value) => getInsuranceTypeLabel(value),
    },
    {
      title: '时间范围',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: '用途',
      dataIndex: 'usage',
      key: 'usage',
      width: 100,
      render: (value) => getUsageLabel(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '验真码',
      dataIndex: 'verifyCode',
      key: 'verifyCode',
      width: 160,
      render: (code) => code ? (
        <Text copyable style={{ fontFamily: 'monospace' }}>{code}</Text>
      ) : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'completed' && (
            <>
              <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>
                预览
              </Button>
              <Button type="link" size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>
                下载
              </Button>
            </>
          )}
          {record.status === 'rejected' && (
            <Button type="link" size="small" onClick={() => handleApply(getTypeInfo(record.type))}>
              重新申请
            </Button>
          )}
        </Space>
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>电子凭证</Title>
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            可申请的凭证类型
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          {certificateTypes.map((type) => (
            <Col xs={24} sm={12} lg={6} key={type.id}>
              <Card
                hoverable
                onClick={() => handleApply(type)}
                bodyStyle={{ padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `${type.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: type.color,
                      flexShrink: 0,
                    }}
                  >
                    {type.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Title level={5} style={{ margin: '0 0 8px 0' }}>{type.name}</Title>
                    <Text type="secondary" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {type.description}
                    </Text>
                    <Button type="link" style={{ padding: 0, marginTop: 8 }} onClick={() => handleApply(type)}>
                      立即申请 <PlusOutlined />
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            已申请凭证
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
          locale={{ emptyText: <Empty description="暂无申请记录" /> }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1E6FDB' }} />
            申请{selectedType?.name || '凭证'}
          </Space>
        }
        open={applyModalVisible}
        onCancel={() => {
          setApplyModalVisible(false);
          setSelectedType(null);
        }}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => {
            setApplyModalVisible(false);
            setSelectedType(null);
          }}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            提交申请
          </Button>,
        ]}
      >
        <Divider style={{ margin: '0 0 16px 0' }} />
        {selectedType && (
          <div style={{ marginBottom: 24, padding: 16, background: '#f0f7ff', borderRadius: 8 }}>
            <Space>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: `${selectedType.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: selectedType.color,
                }}
              >
                {selectedType.icon}
              </div>
              <div>
                <Text strong>{selectedType.name}</Text>
                <div style={{ fontSize: 12, color: '#999' }}>{selectedType.description}</div>
              </div>
            </Space>
          </div>
        )}
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            insuranceType: 'all',
          }}
        >
          <Form.Item
            name="type"
            hidden
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="insuranceType"
            label="险种选择"
            rules={[{ required: true, message: '请选择险种' }]}
          >
            <Select placeholder="请选择险种">
              {insuranceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="时间范围"
            rules={[{ required: true, message: '请选择时间范围' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              maxDate={dayjs()}
            />
          </Form.Item>

          <Form.Item
            name="usage"
            label="用途"
            rules={[{ required: true, message: '请选择用途' }]}
          >
            <Select placeholder="请选择用途">
              {usageOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注说明"
          >
            <TextArea
              rows={3}
              placeholder="请输入备注说明（选填）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <EyeOutlined style={{ color: '#1E6FDB' }} />
            凭证预览
          </Space>
        }
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => selectedCertificate && handleDownload(selectedCertificate)}>
            下载PDF
          </Button>,
        ]}
      >
        {selectedCertificate && (
          <div style={{ padding: 16, background: '#fafafa', borderRadius: 8 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1E6FDB' }} />
              <Title level={4} style={{ marginTop: 16, marginBottom: 8 }}>
                {selectedCertificate.name}
              </Title>
              <Text type="secondary">
                验真码：
                <Text copyable style={{ fontFamily: 'monospace', color: '#1E6FDB' }}>
                  {selectedCertificate.verifyCode}
                </Text>
              </Text>
            </div>

            <Descriptions bordered column={1} size="middle" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="姓名">张三</Descriptions.Item>
              <Descriptions.Item label="身份证号">110101********1234</Descriptions.Item>
              <Descriptions.Item label="凭证类型">{selectedCertificate.name}</Descriptions.Item>
              <Descriptions.Item label="险种">{getInsuranceTypeLabel(selectedCertificate.insuranceType)}</Descriptions.Item>
              <Descriptions.Item label="时间范围">{selectedCertificate.period}</Descriptions.Item>
              <Descriptions.Item label="用途">{getUsageLabel(selectedCertificate.usage)}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedCertificate.applyTime}</Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '24px 0' }} />

            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <FileTextOutlined style={{ color: '#1E6FDB' }} />
                缴费明细
              </Space>
            </Title>

            <Table
              size="small"
              pagination={false}
              columns={[
                { title: '月份', dataIndex: 'month', key: 'month' },
                { title: '缴费基数', dataIndex: 'base', key: 'base', render: (v) => `¥${v.toLocaleString()}` },
                { title: '单位缴纳', dataIndex: 'company', key: 'company', render: (v) => `¥${v.toLocaleString()}` },
                { title: '个人缴纳', dataIndex: 'personal', key: 'personal', render: (v) => `¥${v.toLocaleString()}` },
                { title: '合计', dataIndex: 'total', key: 'total', render: (v) => <Text strong>¥{v.toLocaleString()}</Text> },
              ]}
              dataSource={[
                { month: '2023-01', base: 7500, company: 1125, personal: 600, total: 1725 },
                { month: '2023-02', base: 7500, company: 1125, personal: 600, total: 1725 },
                { month: '2023-03', base: 7500, company: 1125, personal: 600, total: 1725 },
                { month: '2023-04', base: 7500, company: 1125, personal: 600, total: 1725 },
                { month: '2023-05', base: 7500, company: 1125, personal: 600, total: 1725 },
                { month: '2023-06', base: 7500, company: 1125, personal: 600, total: 1725 },
              ]}
              locale={{ emptyText: <Empty description="暂无数据" image={null} descriptionStyle={{ color: '#999' }} /> }}
            />

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <div style={{ display: 'inline-block', padding: 16, background: '#fff', borderRadius: 8 }}>
                <QRCode
                  value={`https://verify.example.com/certificate/${selectedCertificate.verifyCode}`}
                  size={120}
                  color="#1E6FDB"
                />
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  扫码验证真伪
                </Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>
                  验证链接：https://verify.example.com/certificate/{selectedCertificate.verifyCode}
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

export default Certificates;
