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
  Cascader,
  Upload,
  Input,
  Row,
  Col,
  message,
  Skeleton,
  Empty,
  Typography,
  Descriptions,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import useRequest from '../../hooks/useRequest';
import useAuth from '../../hooks/useAuth';
import { createRegistration, getRegistrations } from '../../api/insurance';

const { Title, Text } = Typography;
const { Option } = Select;

const insuranceOptions = [
  { value: 'pension', label: '养老保险' },
  { value: 'medical', label: '医疗保险' },
  { value: 'unemployment', label: '失业保险' },
  { value: 'injury', label: '工伤保险' },
  { value: 'maternity', label: '生育保险' },
];

const registrationTypes = [
  { value: 'new', label: '新参保' },
  { value: 'renew', label: '续保' },
  { value: 'transfer', label: '转入' },
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
      { value: 'fengtai', label: '丰台区' },
    ],
  },
  {
    value: 'shanghai',
    label: '上海市',
    children: [
      { value: 'huangpu', label: '黄浦区' },
      { value: 'xuhui', label: '徐汇区' },
      { value: 'changning', label: '长宁区' },
      { value: 'jingan', label: '静安区' },
    ],
  },
];

const mockRegistrations = [
  {
    id: 1,
    applyTime: '2024-01-10 14:30:00',
    insuranceTypes: ['pension', 'medical'],
    type: 'new',
    region: '北京市/朝阳区',
    status: 'approved',
    remark: '审核通过',
  },
  {
    id: 2,
    applyTime: '2024-01-05 10:15:00',
    insuranceTypes: ['unemployment'],
    type: 'renew',
    region: '北京市/海淀区',
    status: 'pending',
    remark: '待审核',
  },
  {
    id: 3,
    applyTime: '2023-12-20 16:45:00',
    insuranceTypes: ['pension', 'medical', 'unemployment', 'injury', 'maternity'],
    type: 'transfer',
    region: '上海市/徐汇区',
    status: 'rejected',
    remark: '材料不完整，请补充身份证正反面照片',
  },
];

const dummyRequest = ({ onSuccess }) => {
  setTimeout(() => {
    onSuccess('ok');
  }, 1000);
};

const Registrations = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuth();

  const { loading, data: registrations, refresh } = useRequest(getRegistrations, {
    onError: () => {
      message.error('获取登记记录失败');
    },
  });

  const { loading: submitLoading, run: submitRegistration } = useRequest(createRegistration, {
    manual: true,
    onSuccess: () => {
      message.success('参保登记申请提交成功');
      setModalVisible(false);
      form.resetFields();
      refresh();
    },
    onError: () => {
      message.error('提交失败，请重试');
    },
  });

  const displayData = registrations || mockRegistrations;

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'warning', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'success', text: '审核通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'error', text: '已驳回', icon: <CloseCircleOutlined /> },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    return <Tag icon={statusInfo.icon} color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getInsuranceTypeLabel = (value) => {
    const option = insuranceOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  const getTypeLabel = (value) => {
    const type = registrationTypes.find(t => t.value === value);
    return type ? type.label : value;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        insuranceTypes: values.insuranceTypes,
        region: values.region.join('/'),
      };
      await submitRegistration(formattedValues);
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setModalVisible(true);
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
      dataIndex: 'insuranceTypes',
      key: 'insuranceTypes',
      render: (types) => (
        <Space wrap>
          {types.map(type => (
            <Tag key={type} color="blue">{getInsuranceTypeLabel(type)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '参保类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value) => getTypeLabel(value),
    },
    {
      title: '参保地区',
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusTag(status),
    },
    {
      title: '审核意见',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>参保登记</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新申请
        </Button>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="个人信息" column={3} size="middle">
          <Descriptions.Item label="姓名">{user?.name || '张三'}</Descriptions.Item>
          <Descriptions.Item label="身份证号">{user?.idCard || '110101********1234'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{user?.phone || '138****5678'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1E6FDB' }} />
            历史登记记录
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
          locale={{ emptyText: <Empty description="暂无登记记录" /> }}
        />
      </Card>

      <Modal
        title="参保登记申请"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" loading={submitLoading} onClick={handleSubmit}>
            提交申请
          </Button>,
        ]}
        width={700}
      >
        <Divider style={{ margin: '0 0 16px 0' }} />
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: user?.name || '张三',
            idCard: user?.idCard || '110101********1234',
            phone: user?.phone || '138****5678',
          }}
        >
          <Title level={5} style={{ marginBottom: 16, color: '#1E6FDB' }}>基本信息</Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="idCard"
                label="身份证号"
                rules={[{ required: true, message: '请输入身份证号' }]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />
          <Title level={5} style={{ marginBottom: 16, color: '#1E6FDB' }}>参保信息</Title>

          <Form.Item
            name="insuranceTypes"
            label="险种选择"
            rules={[{ required: true, message: '请选择至少一个险种' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择险种（可多选）"
              optionFilterProp="children"
            >
              {insuranceOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="参保类型"
                rules={[{ required: true, message: '请选择参保类型' }]}
              >
                <Select placeholder="请选择参保类型">
                  {registrationTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="region"
                label="参保地区"
                rules={[{ required: true, message: '请选择参保地区' }]}
              >
                <Cascader
                  options={regionOptions}
                  placeholder="请选择参保地区"
                  showSearch
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />
          <Title level={5} style={{ marginBottom: 16, color: '#1E6FDB' }}>材料上传</Title>

          <Form.Item
            name="idCard"
            label="身份证正反面"
            rules={[{ required: true, message: '请上传身份证照片' }]}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={2}
              accept="image/*"
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
            name="household"
            label="户口本（首页+本人页）"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e && e.fileList)}
          >
            <Upload
              listType="picture-card"
              maxCount={2}
              accept="image/*"
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
            注：所有上传的材料将严格保密，仅用于社保业务审核。
          </Text>
        </Form>
      </Modal>
    </div>
  );
};

export default Registrations;
