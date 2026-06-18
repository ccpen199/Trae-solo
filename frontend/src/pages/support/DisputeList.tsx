import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Input,
  Select,
  Modal,
  Form,
  message,
  Spin,
  Table,
  Empty,
  Descriptions,
  Alert,
} from 'antd';
import {
  WarningOutlined,
  ReloadOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { supportApi } from '../../api';
import { DisputeTicket } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

const DisputeStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待受理', color: 'orange' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' },
  closed: { text: '已关闭', color: 'default' },
};

export default function DisputeList() {
  const [loading, setLoading] = useState(false);
  const [disputes, setDisputes] = useState<DisputeTicket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const [processLoading, setProcessLoading] = useState<string | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<DisputeTicket | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveForm] = Form.useForm();

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchDisputes();
  }, [page, pageSize, filterStatus]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        pageSize,
      };
      if (filterStatus) {
        params.status = filterStatus;
      }
      const result = await supportApi.disputes(params);
      setDisputes(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (record: DisputeTicket) => {
    Modal.confirm({
      title: '受理纠纷工单',
      content: (
        <div>
          <p>确认受理工单 <strong>{record.id}</strong>？</p>
          <p style={{ color: '#666', fontSize: 12 }}>
            受理后将进入处理流程，请尽快跟进解决。
          </p>
        </div>
      ),
      okText: '确认受理',
      cancelText: '取消',
      onOk: async () => {
        setProcessLoading(record.id);
        try {
          await supportApi.processDispute(record.id);
          message.success('工单已受理');
          fetchDisputes();
        } catch (error) {
          console.error(error);
        } finally {
          setProcessLoading(null);
        }
      },
    });
  };

  const handleResolve = (record: DisputeTicket) => {
    setCurrentDispute(record);
    setResolveModalOpen(true);
    resolveForm.resetFields();
  };

  const handleSubmitResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      setResolveLoading(true);
      await supportApi.resolveDispute(currentDispute!.id, values.resolution);
      message.success('处理结果已提交');
      setResolveModalOpen(false);
      resolveForm.resetFields();
      setCurrentDispute(null);
      fetchDisputes();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setResolveLoading(false);
    }
  };

  const getReporterInfo = (record: DisputeTicket) => {
    if (record.reporter_type === 'worker') {
      return (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <span>{record.worker_name || '阿姨'}</span>
          <Tag color="green" style={{ margin: 0 }}>家政阿姨</Tag>
        </Space>
      );
    }
    return (
      <Space>
        <UserOutlined style={{ color: '#1677ff' }} />
        <span>{record.employer_name || '雇主'}</span>
        <Tag color="blue" style={{ margin: 0 }}>雇主</Tag>
      </Space>
    );
  };

  const columns = [
    {
      title: '工单号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', color: '#1677ff', fontWeight: 500 }}>
          {text}
        </span>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Space>
          <WarningOutlined style={{ color: '#fa8c16' }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '关联订单',
      dataIndex: 'order_title',
      key: 'order_title',
      width: 200,
      ellipsis: true,
      render: (text: string, record: DisputeTicket) => (
        <Space size={4}>
          <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, color: '#333' }}>{text || '-'}</div>
            <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
              {record.order_id}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: '报告方',
      key: 'reporter',
      width: 160,
      render: (_: any, record: DisputeTicket) => getReporterInfo(record),
    },
    {
      title: '订单金额',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: any) => (
        <span style={{ fontWeight: 600, color: '#fa8c16' }}>
          ¥{(record.order_amount || 0).toLocaleString()}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (text: string) => (
        <Space size={4}>
          <ClockCircleOutlined style={{ color: '#999' }} />
          <span style={{ fontSize: 13 }}>{text}</span>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const info = DisputeStatusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color} style={{ padding: '3px 10px' }}>{info.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: DisputeTicket) => {
        const actions = [];
        if (record.status === 'pending') {
          actions.push(
            <Button
              key="process"
              type="primary"
              size="small"
              icon={<SolutionOutlined />}
              loading={processLoading === record.id}
              onClick={() => handleProcess(record)}
            >
              受理
            </Button>
          );
        }
        if (record.status === 'processing') {
          actions.push(
            <Button
              key="resolve"
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record)}
            >
              处理
            </Button>
          );
        }
        return <Space>{actions}</Space>;
      },
    },
  ];

  const renderExpandDetail = (record: DisputeTicket) => (
    <div style={{ padding: '12px 24px', background: '#fafafa', borderRadius: 8 }}>
      <Row gutter={24}>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1677ff' }} />
                <span>纠纷详情</span>
              </Space>
            }
            className="card-hover"
            style={{ height: '100%' }}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="工单标题">
                <span style={{ fontWeight: 500 }}>{record.title}</span>
              </Descriptions.Item>
              <Descriptions.Item label="报告方">
                {getReporterInfo(record)}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                <Space>
                  <ShoppingCartOutlined style={{ color: '#13c2c2' }} />
                  <span>{record.order_title || '-'}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="提交时间">
                <ClockCircleOutlined style={{ color: '#999' }} /> {record.created_at}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            size="small"
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa8c16' }} />
                <span>纠纷描述与证据</span>
              </Space>
            }
            className="card-hover"
            style={{ height: '100%' }}
          >
            <Alert
              type="warning"
              showIcon
              message="详细描述"
              description={
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    color: '#333',
                  }}
                >
                  {record.description || '暂无详细描述'}
                </div>
              }
              style={{ marginBottom: 12 }}
            />
            <div>
              <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                证据材料：
              </div>
              <Row gutter={[8, 8]}>
                {(record as any).evidence_urls?.length > 0 ? (
                  (record as any).evidence_urls.map((url: string, idx: number) => (
                    <Col key={idx} xs={8}>
                      <div
                        style={{
                          height: 80,
                          background: 'linear-gradient(135deg, #e6f4ff 0%, #bae0ff 100%)',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          color: '#1677ff',
                          border: '1px solid #91caff',
                        }}
                      >
                        证据图片 {idx + 1}
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col span={24}>
                    <div style={{ color: '#999', fontSize: 12, padding: '8px 0' }}>
                      暂无证据材料
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
      {record.resolution && (
        <div style={{ marginTop: 16 }}>
          <Card
            size="small"
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <span>处理结果</span>
              </Space>
            }
            className="card-hover"
            style={{ borderColor: '#b7eb8f', background: '#f6ffed' }}
          >
            <div
              style={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                color: '#262626',
                padding: '8px 0',
              }}
            >
              {record.resolution}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <WarningOutlined style={{ color: '#fa8c16', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>纠纷仲裁工单</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchDisputes()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Card
            size="small"
            className="card-hover"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: 12 }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} sm={12}>
                <Space>
                  <FilterOutlined style={{ color: '#999' }} />
                  <span style={{ color: '#666' }}>工单状态：</span>
                  <Select
                    placeholder="全部状态"
                    allowClear
                    style={{ width: 180 }}
                    value={filterStatus}
                    onChange={(val) => {
                      setFilterStatus(val);
                      setPage(1);
                    }}
                  >
                    {Object.entries(DisputeStatusMap).map(([key, val]) => (
                      <Option key={key} value={key}>
                        <Tag color={val.color}>{val.text}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
            </Row>
          </Card>

          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={disputes}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无纠纷工单"
                  />
                ),
              }}
              expandable={{
                expandedRowRender: renderExpandDetail,
                expandedRowKeys,
                onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
                expandIcon: ({ expanded, onExpand, record }) => (
                  <Button
                    type="link"
                    size="small"
                    onClick={(e) => onExpand(record, e)}
                  >
                    {expanded ? '收起详情' : '查看详情'}
                  </Button>
                ),
              }}
              scroll={{ x: 1300 }}
            />
          </Spin>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>处理纠纷工单</span>
          </Space>
        }
        open={resolveModalOpen}
        onCancel={() => {
          setResolveModalOpen(false);
          setCurrentDispute(null);
          resolveForm.resetFields();
        }}
        onOk={handleSubmitResolve}
        confirmLoading={resolveLoading}
        okText="提交处理结果"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        {currentDispute && (
          <>
            <Alert
              type="info"
              showIcon
              message="工单信息"
              description={
                <Space wrap>
                  <span>工单号：<strong style={{ fontFamily: 'monospace' }}>{currentDispute.id}</strong></span>
                  <span>标题：<strong>{currentDispute.title}</strong></span>
                </Space>
              }
              style={{ marginBottom: 16 }}
            />
            <Form
              form={resolveForm}
              layout="vertical"
            >
              <Form.Item
                name="resolution"
                label="处理结果"
                rules={[
                  { required: true, message: '请填写处理结果' },
                  { min: 10, message: '处理结果描述至少10个字符' },
                ]}
              >
                <TextArea
                  rows={6}
                  placeholder="请详细描述您的处理结果和解决方案，包括责任判定、赔偿方案、后续措施等..."
                  maxLength={2000}
                  showCount
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
