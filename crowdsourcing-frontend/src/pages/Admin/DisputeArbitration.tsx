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
  Timeline,
  Alert,
  Radio,
  Divider,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  WarningOutlined,
  UserOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { disputeApi } from '@/api';
import type { Dispute } from '@/types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const DISPUTE_STATUS: Record<string, { text: string; color: string }> = {
  pending: { text: '待处理', color: 'warning' },
  investigating: { text: '调查中', color: 'processing' },
  resolved: { text: '已裁决', color: 'success' },
  rejected: { text: '已驳回', color: 'default' },
};

const DISPUTE_TYPE: Record<string, string> = {
  payment: '支付纠纷',
  quality: '质量纠纷',
  deadline: '交付时间',
  scope: '需求范围',
  communication: '沟通问题',
  other: '其他',
};

const ARBITRATION_RESULT: Record<string, { text: string; color: string }> = {
  plaintiff: { text: '申诉方胜诉', color: 'success' },
  defendant: { text: '被诉方胜诉', color: 'error' },
  partial: { text: '部分支持', color: 'warning' },
};

const AdminDisputeArbitration: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [detailVisible, setDetailVisible] = useState(false);
  const [arbitrationVisible, setArbitrationVisible] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const [form] = Form.useForm();
  const [arbitrationForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, []);

  const loadDisputes = async (page = 1, pageSize = 10, params?: any) => {
    try {
      setLoading(true);
      const data = await disputeApi.getDisputes({ page, pageSize, ...params });
      setDisputes(data.list || []);
      setPagination({ ...pagination, current: page, pageSize, total: data.total || 0 });
    } catch (error) {
      message.error('加载争议列表失败');
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
    loadDisputes(1, pagination.pageSize, params);
  };

  const handleReset = () => {
    form.resetFields();
    loadDisputes(1, pagination.pageSize);
  };

  const handleViewDetail = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    setDetailVisible(true);
  };

  const handleArbitration = (dispute: Dispute) => {
    setCurrentDispute(dispute);
    arbitrationForm.resetFields();
    setArbitrationVisible(true);
  };

  const handleSubmitArbitration = async () => {
    try {
      const values = await arbitrationForm.validateFields();
      setSubmitting(true);

      await disputeApi.arbitrate(currentDispute!.id, {
        result: values.result,
        reason: values.reason,
        compensationAmount: values.compensationAmount || 0,
      });

      message.success('裁决已提交');
      setArbitrationVisible(false);
      loadDisputes(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: '争议编号',
      dataIndex: 'disputeNo',
      key: 'disputeNo',
      width: 140,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '任务信息',
      key: 'task',
      minWidth: 180,
      render: (_: any, record: Dispute) => (
        <div>
          <Text strong className="block">{record.task?.title}</Text>
          <Text type="secondary" className="text-xs">{record.task?.taskNo}</Text>
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag>{DISPUTE_TYPE[type] || type}</Tag>,
    },
    {
      title: '争议金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <Text strong type="danger">
          ¥{amount?.toLocaleString('zh-CN') || '0'}
        </Text>
      ),
    },
    {
      title: '申诉方',
      dataIndex: ['plaintiff', 'nickname'],
      key: 'plaintiff',
      width: 100,
    },
    {
      title: '被诉方',
      dataIndex: ['defendant', 'nickname'],
      key: 'defendant',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const s = DISPUTE_STATUS[status] || DISPUTE_STATUS.pending;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_: any, record: Dispute) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {(record.status === 'pending' || record.status === 'investigating') && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleArbitration(record)}>
              仲裁
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
          <Title level={3} style={{ margin: 0 }}>争议仲裁</Title>
          <Text type="secondary">公平公正处理平台交易纠纷</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>刷新</Button>
      </div>

      <Alert
        message="仲裁须知"
        description={
          <ul className="m-0 pl-4">
            <li>请仔细查看双方提供的证据材料，包括聊天记录、稿件文件、合同约定等</li>
            <li>仲裁结果具有最终效力，请谨慎裁决</li>
            <li>裁决后系统将自动执行资金划转</li>
          </ul>
        }
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        className="mb-6"
      />

      <Card className="mb-6">
        <Form form={form} layout="inline">
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="争议编号/任务名称" allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" allowClear>
                  {Object.entries(DISPUTE_STATUS).map(([key, value]) => (
                    <Option key={key} value={key}>{value.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={5}>
              <Form.Item name="type" label="类型">
                <Select placeholder="全部" allowClear>
                  {Object.entries(DISPUTE_TYPE).map(([key, value]) => (
                    <Option key={key} value={key}>{value}</Option>
                  ))}
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
          dataSource={disputes}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => loadDisputes(page, pageSize),
          }}
        />
      </Card>

      <Modal
        title="争议详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          currentDispute && (currentDispute.status === 'pending' || currentDispute.status === 'investigating') && (
            <Button key="arbitrate" type="primary" icon={<CheckCircleOutlined />} onClick={() => {
              setDetailVisible(false);
              handleArbitration(currentDispute);
            }}>
              进行仲裁
            </Button>
          ),
        ]}
        width={800}
        destroyOnClose
      >
        {currentDispute && (
          <div>
            <Descriptions bordered column={2} className="mb-4">
              <Descriptions.Item label="争议编号">
                <Text code>{currentDispute.disputeNo}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = DISPUTE_STATUS[currentDispute.status] || DISPUTE_STATUS.pending;
                  return <Tag color={s.color}>{s.text}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="争议类型">
                <Tag>{DISPUTE_TYPE[currentDispute.type] || currentDispute.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="争议金额">
                <Text strong type="danger">
                  ¥{currentDispute.amount?.toLocaleString('zh-CN') || '0'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="申诉方">
                {currentDispute.plaintiff?.nickname}
              </Descriptions.Item>
              <Descriptions.Item label="被诉方">
                {currentDispute.defendant?.nickname}
              </Descriptions.Item>
              <Descriptions.Item label="关联任务" span={2}>
                {currentDispute.task?.title} ({currentDispute.task?.taskNo})
              </Descriptions.Item>
              <Descriptions.Item label="期望解决" span={2}>
                {currentDispute.expectedResolution}
              </Descriptions.Item>
              <Descriptions.Item label="提交时间" span={2}>
                {dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">申诉描述</Divider>
            <Paragraph className="mb-4">{currentDispute.description}</Paragraph>

            {currentDispute.evidence && currentDispute.evidence.length > 0 && (
              <>
                <Divider orientation="left">证据材料</Divider>
                <div className="space-y-2 mb-4">
                  {currentDispute.evidence.map((file, index) => (
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

            {currentDispute.arbitrationResult && (
              <>
                <Divider orientation="left">仲裁结果</Divider>
                <Alert
                  message={ARBITRATION_RESULT[currentDispute.arbitrationResult]?.text || '已裁决'}
                  description={
                    <div>
                      <Paragraph className="m-0 mb-2">
                        <Text strong>裁决理由：</Text>
                        {currentDispute.arbitrationReason}
                      </Paragraph>
                      {currentDispute.compensationAmount > 0 && (
                        <Paragraph className="m-0">
                          <Text strong>赔偿金额：</Text>
                          <Text type="danger" strong>
                            ¥{currentDispute.compensationAmount?.toLocaleString('zh-CN')}
                          </Text>
                        </Paragraph>
                      )}
                    </div>
                  }
                  type={
                    currentDispute.arbitrationResult === 'plaintiff'
                      ? 'success'
                      : currentDispute.arbitrationResult === 'defendant'
                      ? 'error'
                      : 'warning'
                  }
                  showIcon
                />
              </>
            )}

            <Divider orientation="left">处理进度</Divider>
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: (
                    <div>
                      <Text strong>申诉已提交</Text>
                      <Text type="secondary" className="block text-sm">
                        {dayjs(currentDispute.createdAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                    </div>
                  ),
                },
                currentDispute.status !== 'pending'
                  ? {
                      color: 'blue',
                      children: (
                        <div>
                          <Text strong>仲裁员已介入</Text>
                          <Text type="secondary" className="block text-sm">
                            调查收集证据中
                          </Text>
                        </div>
                      ),
                    }
                  : undefined,
                currentDispute.status === 'resolved' || currentDispute.status === 'rejected'
                  ? {
                      color:
                        currentDispute.status === 'resolved' ? 'green' : 'red',
                      children: (
                        <div>
                          <Text strong>已完成裁决</Text>
                          <Text type="secondary" className="block text-sm">
                            {dayjs(currentDispute.resolvedAt || currentDispute.updatedAt).format(
                              'YYYY-MM-DD HH:mm'
                            )}
                          </Text>
                        </div>
                      ),
                    }
                  : undefined,
              ].filter(Boolean)}
            />
          </div>
        )}
      </Modal>

      <Modal
        title="争议仲裁"
        open={arbitrationVisible}
        onCancel={() => setArbitrationVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setArbitrationVisible(false)}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={handleSubmitArbitration}
          >
            提交裁决
          </Button>,
        ]}
        width={600}
        destroyOnClose
      >
        {currentDispute && (
          <div>
            <Alert
              message="争议信息"
              description={
                <div>
                  <Paragraph className="m-0">
                    <Text strong>任务：</Text>{currentDispute.task?.title}
                  </Paragraph>
                  <Paragraph className="m-0">
                    <Text strong>争议金额：</Text>
                    <Text type="danger">¥{currentDispute.amount?.toLocaleString('zh-CN')}</Text>
                  </Paragraph>
                  <Paragraph className="m-0">
                    <Text strong>申诉方：</Text>{currentDispute.plaintiff?.nickname}
                  </Paragraph>
                  <Paragraph className="m-0">
                    <Text strong>被诉方：</Text>{currentDispute.defendant?.nickname}
                  </Paragraph>
                </div>
              }
              type="info"
              showIcon
              className="mb-4"
            />

            <Form form={arbitrationForm} layout="vertical">
              <Form.Item
                name="result"
                label="仲裁结果"
                rules={[{ required: true, message: '请选择仲裁结果' }]}
              >
                <Radio.Group>
                  <Radio.Button value="plaintiff">
                    <CheckCircleOutlined className="text-green-500 mr-1" />
                    申诉方胜诉
                  </Radio.Button>
                  <Radio.Button value="defendant">
                    <CloseCircleOutlined className="text-red-500 mr-1" />
                    被诉方胜诉
                  </Radio.Button>
                  <Radio.Button value="partial">
                    <WarningOutlined className="text-yellow-500 mr-1" />
                    部分支持
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prev, curr) => prev.result !== curr.result}
              >
                {({ getFieldValue }) =>
                  getFieldValue('result') !== 'defendant' ? (
                    <Form.Item
                      name="compensationAmount"
                      label="赔偿金额 (元)"
                      rules={[{ required: true, message: '请输入赔偿金额' }]}
                    >
                      <Input
                        type="number"
                        placeholder="请输入赔偿金额"
                        max={currentDispute.amount}
                      />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item
                name="reason"
                label="裁决理由"
                rules={[{ required: true, message: '请输入裁决理由' }]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细说明裁决的理由和依据"
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              <Alert
                message="重要提示"
                description="裁决提交后将立即生效，系统将自动执行资金划转，请谨慎操作"
                type="warning"
                showIcon
              />
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDisputeArbitration;
