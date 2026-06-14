import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Steps,
  Form,
  Select,
  Cascader,
  Upload,
  Modal,
  Timeline,
  Progress,
  message,
  Skeleton,
  Empty,
  Typography,
  Descriptions,
  Divider,
  Radio,
} from 'antd';
import {
  ArrowRightOutlined,
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import { createTransfer, getTransfers } from '../../api/insurance';

const { Title, Text } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { Group } = Radio;

const insuranceOptions = [
  { value: 'pension', label: '养老保险' },
  { value: 'medical', label: '医疗保险' },
  { value: 'unemployment', label: '失业保险' },
];

const transferTypes = [
  { value: 'cross_province', label: '跨省转移' },
  { value: 'cross_city', label: '跨市转移' },
  { value: 'same_city', label: '同城转移' },
];

const regionOptions = [
  {
    value: 'beijing',
    label: '北京市',
    children: [
      { value: 'dongcheng', label: '东城区' },
      { value: 'xicheng', label: '西城区' },
      { value: 'chaoyang', label: '朝阳区' },
      { value: 'haidian', label: '海淀区' },
    ],
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'changning', label: '长宁区' },
    ],
  },
  {
    value: 'guangdong',
    label: '广东省',
    children: [
      { value: 'guangzhou', label: '广州市' },
      { value: 'shenzhen', label: '深圳市' },
      { value: 'dongguan', label: '东莞市' },
    ],
  },
  {
    value: 'jiangsu',
    label: '江苏省',
    children: [
      { value: 'nanjing', label: '南京市' },
      { value: 'suzhou', label: '苏州市' },
      { value: 'wuxi', label: '无锡市' },
    ],
  },
];

const mockTransfers = [
  {
    id: 1,
    applyTime: '2024-01-10 14:30:00',
    insuranceType: 'pension',
    fromRegion: '上海市/徐汇区',
    toRegion: '北京市/朝阳区',
    transferType: 'cross_province',
    status: 'processing',
    currentStep: 2,
    progress: [
      { time: '2024-01-10 14:30', status: 'done', title: '提交申请', description: '已提交社保转移申请' },
      { time: '2024-01-11 09:15', status: 'done', title: '转出地审核', description: '上海市社保局已审核通过' },
      { time: '2024-01-12 16:30', status: 'process', title: '转移接续', description: '正在办理基金转移和账户接续' },
      { time: '', status: 'wait', title: '转入地确认', description: '等待北京市社保局确认接收' },
      { time: '', status: 'wait', title: '完成', description: '转移完成' },
    ],
  },
  {
    id: 2,
    applyTime: '2023-11-05 10:20:00',
    insuranceType: 'medical',
    fromRegion: '广东省/深圳市',
    toRegion: '北京市/海淀区',
    transferType: 'cross_province',
    status: 'completed',
    currentStep: 5,
    progress: [
      { time: '2023-11-05 10:20', status: 'done', title: '提交申请', description: '已提交社保转移申请' },
      { time: '2023-11-06 14:30', status: 'done', title: '转出地审核', description: '深圳市社保局已审核通过' },
      { time: '2023-11-10 09:15', status: 'done', title: '转移接续', description: '已完成基金转移和账户接续' },
      { time: '2023-11-12 16:30', status: 'done', title: '转入地确认', description: '北京市社保局已确认接收' },
      { time: '2023-11-15 10:00', status: 'done', title: '完成', description: '转移完成，账户已合并' },
    ],
  },
  {
    id: 3,
    applyTime: '2023-09-20 16:45:00',
    insuranceType: 'pension',
    fromRegion: '江苏省/苏州市',
    toRegion: '北京市/朝阳区',
    transferType: 'cross_province',
    status: 'rejected',
    currentStep: 1,
    remark: '缴费记录不完整，请补充相关证明材料',
    progress: [
      { time: '2023-09-20 16:45', status: 'done', title: '提交申请', description: '已提交社保转移申请' },
      { time: '2023-09-22 10:30', status: 'error', title: '转出地审核', description: '审核不通过，缴费记录不完整' },
    ],
  },
];

const dummyRequest = ({ onSuccess }) => {
  setTimeout(() => {
    onSuccess('ok');
  }, 1000);
};

const Transfers = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [progressModalVisible, setProgressModalVisible] = useState(false);

  const { loading, data: transfers, refresh } = useRequest(getTransfers, {
    onError: () => {
      message.error('获取转移记录失败');
    },
  });

  const { loading: submitLoading, run: submitTransfer } = useRequest(createTransfer, {
    manual: true,
    onSuccess: () => {
      message.success('社保转移申请提交成功');
      setModalVisible(false);
      form.resetFields();
      setCurrentStep(0);
      refresh();
    },
    onError: () => {
      message.error('提交失败，请重试');
    },
  });

  const displayData = transfers || mockTransfers;

  const getInsuranceTypeLabel = (value) => {
    const option = insuranceOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getTransferTypeLabel = (value) => {
    const type = transferTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'default', text: '待处理', icon: <ClockCircleOutlined /> },
      processing: { color: 'processing', text: '处理中', icon: <SyncOutlined spin /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: '已驳回', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleAdd = () => {
    form.resetFields();
    setCurrentStep(0);
    setModalVisible(true);
  };

  const handleNext = async () => {
    try {
      const fields = [
        ['insuranceType', 'fromRegion'],
        ['toRegion', 'transferType'],
        ['materials'],
      ];
      await form.validateFields(fields[currentStep]);
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        const values = await form.validateFields();
        const formattedValues = {
          ...values,
          fromRegion: values.fromRegion.join('/'),
          toRegion: values.toRegion.join('/'),
        };
        await submitTransfer(formattedValues);
      }
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleViewProgress = (record) => {
    setSelectedRecord(record);
    setProgressModalVisible(true);
  };

  const columns = [
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
      title: '转移方向',
      key: 'direction',
      render: (_, record) => (
        <Space size="small">
          <EnvironmentOutlined style={{ color: '#F5222D' }} />
          <span>{record.fromRegion}</span>
          <ArrowRightOutlined style={{ color: '#1E6FDB' }} />
          <EnvironmentOutlined style={{ color: '#52C41A' }} />
          <span>{record.toRegion}</span>
        </Space>
      ),
    },
    {
      title: '转移类型',
      dataIndex: 'transferType',
      key: 'transferType',
      width: 100,
      render: (value) => getTransferTypeLabel(value),
    },
    {
      title: '当前状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: '进度',
      key: 'progress',
      width: 200,
      render: (_, record) => (
        <Progress
          percent={(record.currentStep / 5) * 100}
          size="small"
          strokeColor="#1E6FDB"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => handleViewProgress(record)}>
            查看进度
          </Button>
          {record.status === 'rejected' && (
            <Button type="link">重新申请</Button>
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

  const stepItems = [
    {
      title: '选择转移险种和转出地',
      content: (
        <div style={{ padding: '24px 0' }}>
          <Form.Item
            name="insuranceType"
            label="转移险种"
            rules={[{ required: true, message: '请选择转移险种' }]}
          >
            <Select placeholder="请选择转移险种">
              {insuranceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="fromRegion"
            label="转出地"
            rules={[{ required: true, message: '请选择转出地' }]}
          >
            <Cascader
              options={regionOptions}
              placeholder="请选择转出地"
              showSearch
            />
          </Form.Item>
        </div>
      ),
    },
    {
      title: '选择转入地和转移类型',
      content: (
        <div style={{ padding: '24px 0' }}>
          <Form.Item
            name="toRegion"
            label="转入地"
            rules={[{ required: true, message: '请选择转入地' }]}
          >
            <Cascader
              options={regionOptions}
              placeholder="请选择转入地"
              showSearch
            />
          </Form.Item>
          <Form.Item
            name="transferType"
            label="转移类型"
            rules={[{ required: true, message: '请选择转移类型' }]}
          >
            <Group>
              {transferTypes.map(type => (
                <Radio.Button key={type.value} value={type.value}>
                  {type.label}
                </Radio.Button>
              ))}
            </Group>
          </Form.Item>
        </div>
      ),
    },
    {
      title: '上传证明材料',
      content: (
        <div style={{ padding: '24px 0' }}>
          <Form.Item
            name="materials"
            label="参保缴费凭证"
            rules={[{ required: true, message: '请上传参保缴费凭证' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={5}
              accept="image/*,.pdf"
              customRequest={dummyRequest}
              beforeUpload={() => true}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>
          <Form.Item
            name="otherMaterials"
            label="其他证明材料"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              multiple
              customRequest={dummyRequest}
              beforeUpload={() => true}
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Text type="secondary" style={{ fontSize: 12 }}>
            支持 JPG、PNG、PDF 格式，单个文件不超过 10MB
          </Text>
        </div>
      ),
    },
    {
      title: '确认提交',
      content: (
        <div style={{ padding: '24px 0' }}>
          <Card title="请确认以下信息" style={{ background: '#fafafa' }}>
            <Descriptions column={1} size="middle">
              <Descriptions.Item label="转移险种">
                {getInsuranceTypeLabel(form.getFieldValue('insuranceType'))}
              </Descriptions.Item>
              <Descriptions.Item label="转出地">
                {form.getFieldValue('fromRegion')?.join('/') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="转入地">
                {form.getFieldValue('toRegion')?.join('/') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="转移类型">
                {getTransferTypeLabel(form.getFieldValue('transferType'))}
              </Descriptions.Item>
              <Descriptions.Item label="材料上传">
                {form.getFieldValue('materials')?.length || 0} 份参保缴费凭证
                {form.getFieldValue('otherMaterials')?.length
                  ? `，${form.getFieldValue('otherMaterials').length} 份其他材料`
                  : ''}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Text type="warning" style={{ display: 'block', marginTop: 16 }}>
            请确认以上信息准确无误，提交后将进入审核流程，信息不可修改。
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>社保转移</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新申请
        </Button>
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            我的转移记录
          </Space>
        }
        style={{ marginBottom: 24 }}
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
          locale={{ emptyText: <Empty description="暂无转移记录" /> }}
        />
      </Card>

      <Modal
        title="社保转移申请"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCurrentStep(0);
        }}
        width={700}
        footer={null}
      >
        <Steps current={currentStep} size="small" style={{ marginBottom: 24 }}>
          {stepItems.map((item, index) => (
            <Step key={index} title={item.title} />
          ))}
        </Steps>

        <Divider style={{ margin: '0 0 16px 0' }} />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            insuranceType: 'pension',
            transferType: 'cross_province',
          }}
        >
          {stepItems[currentStep].content}
        </Form>

        <Divider style={{ margin: '16px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button disabled={currentStep === 0} onClick={handlePrev}>
            上一步
          </Button>
          <Space>
            <Button onClick={() => {
              setModalVisible(false);
              setCurrentStep(0);
            }}>
              取消
            </Button>
            <Button type="primary" loading={submitLoading} onClick={handleNext}>
              {currentStep === 3 ? '提交申请' : '下一步'}
            </Button>
          </Space>
        </div>
      </Modal>

      <Modal
        title="转移进度追踪"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setProgressModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRecord && (
          <div>
            <Card style={{ marginBottom: 24, background: '#fafafa' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="转移单号">
                  TRANS{selectedRecord.id.toString().padStart(8, '0')}
                </Descriptions.Item>
                <Descriptions.Item label="转移险种">
                  {getInsuranceTypeLabel(selectedRecord.insuranceType)}
                </Descriptions.Item>
                <Descriptions.Item label="转移方向">
                  {selectedRecord.fromRegion} → {selectedRecord.toRegion}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Title level={5} style={{ marginBottom: 16 }}>办理进度</Title>
            <Timeline
              mode="left"
              items={selectedRecord.progress.map((item) => ({
                color: item.status === 'done' ? 'green' : item.status === 'process' ? 'blue' : item.status === 'error' ? 'red' : 'gray',
                dot: item.status === 'process' ? <SyncOutlined spin /> : undefined,
                children: (
                  <div style={{ padding: '8px 0' }}>
                    <Text strong>{item.title}</Text>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {item.time || '-'}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4 }}>
                      {item.description}
                    </div>
                    {item.status === 'error' && selectedRecord.remark && (
                      <div style={{ fontSize: 13, color: '#F5222D', marginTop: 8 }}>
                        <CloseCircleOutlined /> {selectedRecord.remark}
                      </div>
                    )}
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Transfers;
