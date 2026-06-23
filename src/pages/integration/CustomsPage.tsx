import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  InputNumber,
  DatePicker,
  Descriptions,
  Alert,
} from 'antd';
import {
  GlobalOutlined,
  PlusOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useAppStore } from '@/store/appStore';
import { CustomsDeclaration } from '@/types';

const { Title } = Typography;
const { Option } = Select;

const CustomsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDeclaration, setSelectedDeclaration] = useState<CustomsDeclaration | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [form] = Form.useForm();

  const declarations = useAppStore((state) => state.customsDeclarations);

  const statusMap: Record<string, { text: string; color: string; icon: JSX.Element }> = {
    draft: { text: '草稿', color: 'default', icon: <FileSearchOutlined /> },
    submitted: { text: '已申报', color: 'blue', icon: <ExportOutlined /> },
    reviewing: { text: '审核中', color: 'processing', icon: <ClockCircleOutlined /> },
    cleared: { text: '已放行', color: 'success', icon: <CheckCircleOutlined /> },
    rejected: { text: '已退回', color: 'error', icon: <CloseCircleOutlined /> },
  };

  const totalDeclarations = declarations.length;
  const clearedCount = declarations.filter((d) => d.status === 'cleared').length;
  const reviewingCount = declarations.filter((d) => d.status === 'reviewing').length;
  const rejectedCount = declarations.filter((d) => d.status === 'rejected').length;

  const columns = [
    {
      title: '报关单号',
      dataIndex: 'declarationNo',
      key: 'declarationNo',
      render: (text: string, record: CustomsDeclaration) => (
        <a onClick={() => handleViewDetail(record)}>{text}</a>
      ),
    },
    {
      title: '关联运单',
      dataIndex: 'waybillNo',
      key: 'waybillNo',
    },
    {
      title: '海关编码',
      dataIndex: 'customsCode',
      key: 'customsCode',
    },
    {
      title: '货物描述',
      dataIndex: 'goodsDescription',
      key: 'goodsDescription',
    },
    {
      title: 'HS编码',
      dataIndex: 'hsCode',
      key: 'hsCode',
    },
    {
      title: '申报价值',
      key: 'value',
      render: (_: unknown, record: CustomsDeclaration) => (
        <span>
          {record.currency} {record.declaredValue.toLocaleString()}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const info = statusMap[status];
        return (
          <Tag color={info.color} icon={info.icon}>
            {info.text}
          </Tag>
        );
      },
    },
    {
      title: '申报时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: CustomsDeclaration) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status === 'draft' && (
            <Button type="link" size="small">提交申报</Button>
          )}
          {record.status === 'rejected' && (
            <Button type="link" size="small">修改重报</Button>
          )}
        </Space>
      ),
    },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      message.success('海关数据同步成功');
    }, 1500);
  };

  const handleViewDetail = (declaration: CustomsDeclaration) => {
    setSelectedDeclaration(declaration);
    setIsDetailModalOpen(true);
  };

  const handleSubmit = () => {
    message.success('报关单创建成功');
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <GlobalOutlined style={{ marginRight: 8 }} />
          海关数据交换
        </Title>
        <Space>
          <Button icon={<SyncOutlined />} loading={isSyncing} onClick={handleSync}>
            同步海关数据
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            新建报关单
          </Button>
        </Space>
      </div>

      <Alert
        message="已与深圳海关、广州海关、上海海关系统对接"
        description="支持电子报关单申报、状态查询、放行通知等数据实时交换"
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="报关单总数"
              value={totalDeclarations}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已放行"
              value={clearedCount}
              suffix="单"
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="审核中"
              value={reviewingCount}
              suffix="单"
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已退回"
              value={rejectedCount}
              suffix="单"
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table columns={columns} dataSource={declarations} rowKey="id" pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title="新建报关单"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
        okText="创建报关单"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Title level={5}>基本信息</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="关联运单"
                name="waybillNo"
                rules={[{ required: true, message: '请选择关联运单' }]}
              >
                <Select placeholder="请选择运单">
                  <Option value="KY2024061900006">KY2024061900006</Option>
                  <Option value="KY2024061900007">KY2024061900007</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="申报海关"
                name="customsCode"
                rules={[{ required: true, message: '请选择海关' }]}
              >
                <Select placeholder="请选择">
                  <Option value="5340">深圳海关 (5340)</Option>
                  <Option value="5300">广州海关 (5300)</Option>
                  <Option value="2200">上海海关 (2200)</Option>
                  <Option value="0100">北京海关 (0100)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>货物信息</Title>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                label="货物描述"
                name="goodsDescription"
                rules={[{ required: true, message: '请输入货物描述' }]}
              >
                <Input placeholder="请输入详细的货物描述" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="HS编码"
                name="hsCode"
                rules={[{ required: true, message: '请输入HS编码' }]}
              >
                <Input placeholder="例如: 8542.3900" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="申报价值"
                name="declaredValue"
                rules={[{ required: true, message: '请输入申报价值' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} step={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="币制"
                name="currency"
                initialValue="USD"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="USD">美元 (USD)</Option>
                  <Option value="CNY">人民币 (CNY)</Option>
                  <Option value="EUR">欧元 (EUR)</Option>
                  <Option value="JPY">日元 (JPY)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
            </Col>
          </Row>

          <Title level={5}>贸易方式</Title>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="贸易方式"
                name="tradeMode"
                initialValue="general_trade"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="general_trade">一般贸易</Option>
                  <Option value="processing_trade">加工贸易</Option>
                  <Option value="bonded">保税货物</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="征免性质"
                name="taxType"
                initialValue="general_tax"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="general_tax">一般征税</Option>
                  <Option value="exempt">免税</Option>
                  <Option value="reduced">减税</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="报关单详情"
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={null}
        width={700}
      >
        {selectedDeclaration && (
          <div>
            <div
              style={{
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    {selectedDeclaration.declarationNo}
                  </span>
                  <Tag
                    color={statusMap[selectedDeclaration.status].color}
                    style={{ marginLeft: 12 }}
                  >
                    {statusMap[selectedDeclaration.status].text}
                  </Tag>
                </div>
                <div style={{ color: '#999', fontSize: 12 }}>
                  申报海关：{selectedDeclaration.customsCode}
                </div>
              </div>
            </div>

            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="关联运单">
                {selectedDeclaration.waybillNo}
              </Descriptions.Item>
              <Descriptions.Item label="HS编码">
                {selectedDeclaration.hsCode}
              </Descriptions.Item>
              <Descriptions.Item label="货物描述">
                {selectedDeclaration.goodsDescription}
              </Descriptions.Item>
              <Descriptions.Item label="申报价值">
                {selectedDeclaration.currency} {selectedDeclaration.declaredValue.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="申报时间">
                {selectedDeclaration.submitTime || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="放行时间">
                {selectedDeclaration.clearTime || '-'}
              </Descriptions.Item>
            </Descriptions>

            {selectedDeclaration.remark && (
              <Alert
                message="备注信息"
                description={selectedDeclaration.remark}
                type="warning"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomsPage;
