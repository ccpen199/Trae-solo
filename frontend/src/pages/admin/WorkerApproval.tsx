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
  Avatar,
  Image,
  Tooltip,
  Badge,
  Rate,
} from 'antd';
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  StarOutlined,
  PhoneOutlined,
  TeamOutlined,
  IdcardOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api';
import { Worker, WorkerRoleMap, WorkerRole, SkillCertificate } from '../../types';

const { Option } = Select;
const { TextArea } = Input;

interface ApprovalWorker extends Worker {
  avatar?: string;
  id_card_number?: string;
  apply_time?: string;
  certificates?: SkillCertificate[];
  service_cities?: string[];
}

export default function WorkerApproval() {
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<ApprovalWorker[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentWorker, setCurrentWorker] = useState<ApprovalWorker | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectForm] = Form.useForm();

  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchApprovalList();
  }, [page, pageSize]);

  const fetchApprovalList = async () => {
    setLoading(true);
    try {
      const result = await adminApi.approvalList();
      const list = result.list || result.workers || [];
      setWorkers(list);
      setTotal(result.total || list.length || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (record: ApprovalWorker) => {
    Modal.confirm({
      title: '确认通过审核',
      content: (
        <div>
          <p>确认通过 <strong>{record.name}</strong> 的资质审核？</p>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={12}>
              <div style={{ color: '#666', fontSize: 12 }}>阿姨角色</div>
              <Tag color="geekblue">{WorkerRoleMap[record.role as WorkerRole] || record.role}</Tag>
            </Col>
            <Col span={12}>
              <div style={{ color: '#666', fontSize: 12 }}>身份证号</div>
              <div style={{ fontFamily: 'monospace' }}>{record.id_card_number || '-'}</div>
            </Col>
          </Row>
          <p style={{ color: '#fa8c16', fontSize: 12, marginTop: 12 }}>
            通过后阿姨将可以正式接单服务。
          </p>
        </div>
      ),
      okText: '确认通过',
      okButtonProps: { type: 'primary' as const },
      cancelText: '取消',
      onOk: async () => {
        setApproveLoading(record.id);
        try {
          await adminApi.approveWorker(record.id);
          message.success('审核通过成功');
          fetchApprovalList();
        } catch (error) {
          console.error(error);
        } finally {
          setApproveLoading(null);
        }
      },
    });
  };

  const handleReject = (record: ApprovalWorker) => {
    setCurrentWorker(record);
    setRejectModalOpen(true);
    rejectForm.resetFields();
  };

  const handleSubmitReject = async () => {
    try {
      const values = await rejectForm.validateFields();
      setRejectLoading(true);
      await adminApi.rejectWorker(currentWorker!.id);
      message.success('驳回成功');
      setRejectModalOpen(false);
      rejectForm.resetFields();
      setCurrentWorker(null);
      fetchApprovalList();
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      console.error(error);
    } finally {
      setRejectLoading(false);
    }
  };

  const renderExpandDetail = (record: ApprovalWorker) => {
    const certs = record.certificates || record.certificates_data || [];
    const cities = record.service_cities || record.service_cities_data || [];
    const skills = record.skills || [];

    return (
      <div style={{ padding: '12px 24px', background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={24}>
          <Col xs={24} md={8}>
            <Card
              size="small"
              title={
                <Space>
                  <StarOutlined style={{ color: '#fa8c16' }} />
                  <span>技能标签</span>
                </Space>
              }
              className="card-hover"
              style={{ height: '100%' }}
            >
              {skills.length > 0 ? (
                <Space size={[8, 8]} wrap>
                  {skills.map((skill, idx) => (
                    <Tag key={idx} color="orange" style={{ margin: 0 }}>
                      {skill}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <div style={{ color: '#999', fontSize: 13 }}>暂无技能标签</div>
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              size="small"
              title={
                <Space>
                  <GlobalOutlined style={{ color: '#1677ff' }} />
                  <span>服务城市</span>
                </Space>
              }
              className="card-hover"
              style={{ height: '100%' }}
            >
              {cities.length > 0 ? (
                <Space size={[8, 8]} wrap>
                  {cities.map((city, idx) => (
                    <Tag key={idx} color="blue" style={{ margin: 0 }}>
                      {city}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <div style={{ color: '#999', fontSize: 13 }}>暂无服务城市</div>
              )}
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card
              size="small"
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                  <span>资质证书</span>
                  <Badge count={certs.length} size="small" style={{ marginLeft: 4 }} />
                </Space>
              }
              className="card-hover"
              style={{ height: '100%' }}
            >
              {certs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {certs.map((cert: SkillCertificate, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        padding: 10,
                        background: cert.verified ? '#f6ffed' : '#fffbe6',
                        border: `1px solid ${cert.verified ? '#b7eb8f' : '#ffe58f'}`,
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 13, color: '#262626' }}>
                            {cert.certificate_type}
                            {cert.verified ? (
                              <Tag color="green" style={{ marginLeft: 6, fontSize: 10 }}>
                                已验证
                              </Tag>
                            ) : (
                              <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>
                                待验证
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                            编号：{cert.certificate_number}
                          </div>
                          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                            颁发：{cert.issuing_authority} · {cert.issue_date}
                          </div>
                          {cert.expiry_date && (
                            <div style={{ fontSize: 11, color: '#fa8c16', marginTop: 2 }}>
                              有效期至：{cert.expiry_date}
                            </div>
                          )}
                        </div>
                        {cert.image_url && (
                          <Tooltip title="查看证书图片">
                            <Image
                              width={48}
                              height={48}
                              src={cert.image_url}
                              style={{ borderRadius: 4, objectFit: 'cover' }}
                              placeholder
                              fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23d9d9d9' stroke-width='2'%3E%3Crect x='3' y='3' width='18' height='18' rx='2'/%3E%3Ccircle cx='12' cy='12' r='3'/%3E%3C/svg%3E"
                            />
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#999', fontSize: 13 }}>暂无资质证书</div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 130,
      fixed: 'left' as const,
      render: (text: string, record: ApprovalWorker) => (
        <Space>
          <Avatar
            size={36}
            icon={<UserOutlined />}
            style={{ background: '#52c41a' }}
            src={record.avatar}
          />
          <div>
            <div style={{ fontWeight: 500, color: '#262626' }}>{text}</div>
            <div style={{ fontSize: 11, color: '#999' }}>{record.gender === 'male' ? '男' : '女'} · {record.age}岁</div>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => (
        <Tag color="geekblue" icon={<TeamOutlined />} style={{ margin: 0 }}>
          {WorkerRoleMap[role as WorkerRole] || role}
        </Tag>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      align: 'center' as const,
      render: (val: number) => (
        <span style={{ fontWeight: 500 }}>{val || '-'}</span>
      ),
    },
    {
      title: '身份证号',
      dataIndex: 'id_card_number',
      key: 'id_card_number',
      width: 200,
      render: (text: string) => (
        <Space size={4}>
          <IdcardOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#595959' }}>
            {text || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (text: string) => (
        <Space size={4}>
          <PhoneOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>
            {text || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '综合评分',
      key: 'rating',
      width: 160,
      render: (_: any, record: ApprovalWorker) => (
        <Space>
          <Rate disabled allowHalf value={record.rating || 0} style={{ fontSize: 14 }} />
          <span style={{ fontWeight: 600, color: '#fa8c16' }}>
            {record.rating?.toFixed(1) || '0.0'}
          </span>
        </Space>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'apply_time',
      key: 'apply_time',
      width: 170,
      render: (text: string, record: ApprovalWorker) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: '#999' }} />
          <span style={{ fontSize: 13 }}>
            {text || (record as any).created_at || (record as any).apply_time || '-'}
          </span>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 110,
      render: () => (
        <Tag color="orange" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
          待审核
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ApprovalWorker) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            loading={approveLoading === record.id}
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleReject(record)}
          >
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Card
        className="card-hover"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: 0 }}
        title={
          <Space>
            <FileTextOutlined style={{ color: '#722ed1', fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>阿姨资质审核</span>
            {total > 0 && (
              <Badge count={total} style={{ backgroundColor: '#fa8c16' }} />
            )}
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchApprovalList()}>
              刷新
            </Button>
          </Space>
        }
      >
        <div style={{ padding: 16 }}>
          <Spin spinning={loading}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={workers}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条待审核`,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无待审核的阿姨"
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
              scroll={{ x: 1350 }}
            />
          </Spin>
        </div>
      </Card>

      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#f5222d' }} />
            <span>驳回审核申请</span>
          </Space>
        }
        open={rejectModalOpen}
        onCancel={() => {
          setRejectModalOpen(false);
          setCurrentWorker(null);
          rejectForm.resetFields();
        }}
        onOk={handleSubmitReject}
        confirmLoading={rejectLoading}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={520}
        destroyOnClose
      >
        {currentWorker && (
          <>
            <Descriptions
              column={1}
              size="small"
              bordered
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label="阿姨姓名">
                <Space>
                  <Avatar size={24} icon={<UserOutlined />} style={{ background: '#52c41a' }} />
                  <span style={{ fontWeight: 500 }}>{currentWorker.name}</span>
                  <Tag color="geekblue">
                    {WorkerRoleMap[currentWorker.role as WorkerRole] || currentWorker.role}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <PhoneOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {currentWorker.phone}
              </Descriptions.Item>
              <Descriptions.Item label="身份证号">
                <span style={{ fontFamily: 'monospace' }}>
                  {currentWorker.id_card_number || '-'}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <Form
              form={rejectForm}
              layout="vertical"
            >
              <Form.Item
                name="reject_reason"
                label="驳回原因"
                rules={[
                  { required: true, message: '请填写驳回原因' },
                  { min: 5, message: '驳回原因至少5个字符' },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请详细说明驳回的原因，如：资料不完整、证书过期、信息有误等..."
                  maxLength={500}
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
