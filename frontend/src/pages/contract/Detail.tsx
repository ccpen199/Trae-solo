import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  App,
  Badge,
  Avatar,
  Tooltip,
  Modal,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  HomeOutlined,
  ShopOutlined,
  PayCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../api/client';
import { useAuthStore } from '../../store/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface ContractDetail {
  id: string;
  demand_id: string;
  contract_no: string;
  total_amount: number;
  escrow_amount: number;
  start_date: string;
  end_date: string;
  warranty_years: number;
  terms: string;
  status: 'draft' | 'pending_sign' | 'signed' | 'terminated';
  owner_id: string;
  designer_id: string;
  store_id: string;
  owner_name: string;
  owner_phone: string;
  designer_name: string;
  store_name: string;
  store_phone: string;
  owner_signed_at?: string;
  store_signed_at?: string;
  created_at: string;
}

interface ProjectMilestone {
  id: string;
  contract_id: string;
  milestone_type: '水电隐蔽验收' | '泥木完工' | '竣工';
  planned_date: string;
  actual_date?: string;
  status: 'pending' | 'ready' | 'confirmed' | 'rejected';
  owner_confirmed?: boolean;
  designer_confirmed?: boolean;
  supervisor_confirmed?: boolean;
  payment_amount: number;
  payment_status: 'pending' | 'processing' | 'paid';
  paid_at?: string;
  created_at: string;
  owner_name?: string;
  designer_name?: string;
  supervisor_name?: string;
}

interface PaymentRecord {
  id: string;
  contract_id: string;
  milestone_id?: string;
  amount: number;
  payment_type: 'deposit' | 'milestone' | 'settlement';
  payee_role: string;
  payee_id: string;
  payee_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transaction_no?: string;
  created_at: string;
}

interface MaterialBOM {
  id: string;
  contract_id: string;
  material_name: string;
  specification: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status: 'planned' | 'ordered' | 'delivered' | 'installed';
  created_at: string;
}

interface ElectronicContract {
  id: string;
  contract_id: string;
  hash: string;
  blockchain_tx?: string;
  storage_url: string;
  expire_date: string;
  created_at: string;
}

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending_sign: { text: '待签署', color: 'warning' },
  signed: { text: '已签署', color: 'success' },
  terminated: { text: '已终止', color: 'error' },
};

const milestoneStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待开始', color: 'default' },
  ready: { text: '待验收', color: 'warning' },
  confirmed: { text: '已确认', color: 'success' },
  rejected: { text: '已拒绝', color: 'error' },
};

const paymentStatusMap: Record<string, { text: string; color: string }> = {
  pending: { text: '待支付', color: 'default' },
  processing: { text: '处理中', color: 'warning' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '支付失败', color: 'error' },
};

const paymentTypeMap: Record<string, string> = {
  deposit: '托管资金',
  milestone: '节点付款',
  settlement: '结算款',
};

const materialStatusMap: Record<string, { text: string; color: string }> = {
  planned: { text: '已规划', color: 'default' },
  ordered: { text: '已下单', color: 'blue' },
  delivered: { text: '已送达', color: 'cyan' },
  installed: { text: '已安装', color: 'success' },
};

const ContractDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);

  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [bomList, setBomList] = useState<MaterialBOM[]>([]);
  const [electronicContract, setElectronicContract] = useState<ElectronicContract | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchContractDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contractRes, milestonesRes, paymentsRes, bomRes] = await Promise.all([
        apiClient.get(`/contracts/${id}`),
        apiClient.get(`/contracts/${id}/milestones`),
        apiClient.get(`/contracts/${id}/payments`),
        apiClient.get(`/contracts/${id}/bom`),
      ]);
      setContract(contractRes.data);
      setMilestones(milestonesRes.data);
      setPayments(paymentsRes.data);
      setBomList(bomRes.data);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取合同详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetail();
  }, [id]);

  const handleSign = () => {
    confirm({
      title: '确认签署合同？',
      icon: <ExclamationCircleOutlined />,
      content: '签署后将生成电子合约存证，不可撤销。',
      onOk: async () => {
        if (!id) return;
        setActionLoading('sign');
        try {
          await apiClient.post(`/contracts/${id}/sign`);
          message.success('签署成功');
          fetchContractDetail();
        } catch (error: any) {
          message.error(error.response?.data?.error || '签署失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleSubmitInspection = (milestoneId: string) => {
    confirm({
      title: '提交验收申请？',
      content: '提交后将通知业主和设计师进行三方确认。',
      onOk: async () => {
        if (!id) return;
        setActionLoading(`inspection-${milestoneId}`);
        try {
          await apiClient.post(`/contracts/${id}/milestones/${milestoneId}/ready`);
          message.success('验收申请已提交');
          fetchContractDetail();
        } catch (error: any) {
          message.error(error.response?.data?.error || '提交失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handleConfirmMilestone = (milestoneId: string) => {
    confirm({
      title: '确认该节点验收通过？',
      content: '确认后将进入付款流程。',
      onOk: async () => {
        if (!id) return;
        setActionLoading(`confirm-${milestoneId}`);
        try {
          await apiClient.post(`/contracts/${id}/milestones/${milestoneId}/confirm`);
          message.success('确认成功');
          fetchContractDetail();
        } catch (error: any) {
          message.error(error.response?.data?.error || '确认失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const handlePayMilestone = (milestoneId: string, amount: number) => {
    confirm({
      title: '确认支付节点款项？',
      content: `将支付金额：¥${amount.toLocaleString()}`,
      onOk: async () => {
        if (!id) return;
        setActionLoading(`pay-${milestoneId}`);
        try {
          const res = await apiClient.post(`/contracts/${id}/milestones/${milestoneId}/pay`);
          message.success(`付款成功，交易号：${res.data.transaction_no}`);
          fetchContractDetail();
        } catch (error: any) {
          message.error(error.response?.data?.error || '付款失败');
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const canSign = () => {
    if (!contract || !user) return false;
    if (contract.status === 'signed' || contract.status === 'terminated') return false;
    if (user.role === 'owner' && contract.owner_id === user.id && !contract.owner_signed_at) return true;
    if (user.role === 'store_manager' && !contract.store_signed_at) return true;
    return false;
  };

  const getSignButtonText = () => {
    if (!contract || !user) return '签署';
    if (user.role === 'owner') return contract.owner_signed_at ? '已签署' : '业主签署';
    if (user.role === 'store_manager') return contract.store_signed_at ? '已签署' : '门店签署';
    return '签署';
  };

  const getConfirmRole = () => {
    if (!user) return '';
    if (user.role === 'owner') return 'owner';
    if (user.role === 'designer') return 'designer';
    if (user.role === 'supervisor') return 'supervisor';
    return '';
  };

  const renderConfirmStatus = (milestone: ProjectMilestone) => {
    const confirmRole = getConfirmRole();
    const confirmed = confirmRole === 'owner' ? milestone.owner_confirmed :
                      confirmRole === 'designer' ? milestone.designer_confirmed :
                      confirmRole === 'supervisor' ? milestone.supervisor_confirmed : false;

    if (milestone.status !== 'ready') return null;
    if (confirmed) {
      return (
        <Tag color="success" icon={<CheckCircleOutlined />}>
          已确认
        </Tag>
      );
    }
    if (confirmRole) {
      return (
        <Button
          type="primary"
          size="small"
          loading={actionLoading === `confirm-${milestone.id}`}
          onClick={(e) => {
            e.stopPropagation();
            handleConfirmMilestone(milestone.id);
          }}
        >
          确认验收
        </Button>
      );
    }
    return null;
  };

  const renderTripleConfirmBadges = (milestone: ProjectMilestone) => {
    return (
      <Space size={[8, 4]} wrap>
        <Tooltip title={`业主：${milestone.owner_name || '待确认'}`}>
          <Badge
            status={milestone.owner_confirmed ? 'success' : 'default'}
            text={<span style={{ fontSize: 12 }}>业主</span>}
          />
        </Tooltip>
        <Tooltip title={`设计师：${milestone.designer_name || '待确认'}`}>
          <Badge
            status={milestone.designer_confirmed ? 'success' : 'default'}
            text={<span style={{ fontSize: 12 }}>设计师</span>}
          />
        </Tooltip>
        <Tooltip title={`监理：${milestone.supervisor_name || '待确认'}`}>
          <Badge
            status={milestone.supervisor_confirmed ? 'success' : 'default'}
            text={<span style={{ fontSize: 12 }}>监理</span>}
          />
        </Tooltip>
      </Space>
    );
  };

  const bomColumns = [
    {
      title: '材料名称',
      dataIndex: 'material_name',
      key: 'material_name',
      width: 140,
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      key: 'specification',
      width: 200,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number, record: MaterialBOM) => `${qty} ${record.unit}`,
    },
    {
      title: '单价',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 100,
      render: (price: number) => `¥${price.toLocaleString()}`,
    },
    {
      title: '小计',
      dataIndex: 'total_price',
      key: 'total_price',
      width: 120,
      render: (price: number) => (
        <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{price.toLocaleString()}</span>
      ),
    },
    {
      title: '供应商',
      dataIndex: 'supplier_name',
      key: 'supplier_name',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = materialStatusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
  ];

  const paymentColumns = [
    {
      title: '付款类型',
      dataIndex: 'payment_type',
      key: 'payment_type',
      width: 100,
      render: (type: string) => paymentTypeMap[type] || type,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '收款方',
      dataIndex: 'payee_name',
      key: 'payee_name',
      width: 150,
    },
    {
      title: '交易号',
      dataIndex: 'transaction_no',
      key: 'transaction_no',
      width: 220,
      render: (tx: string) => tx ? <code style={{ fontSize: 12 }}>{tx}</code> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = paymentStatusMap[status];
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
  ];

  if (!contract) {
    return <div style={{ padding: 24 }}>加载中...</div>;
  }

  const bomTotal = bomList.reduce((sum, item) => sum + item.total_price, 0);
  const paidTotal = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <Card
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '12px 24px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/contracts')}
            >
              返回列表
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              合同详情
              <Tag color={statusMap[contract.status].color} style={{ marginLeft: 12 }}>
                {statusMap[contract.status].text}
              </Tag>
            </Title>
          </Space>
          <Space>
            {canSign() && (
              <Button
                type="primary"
                loading={actionLoading === 'sign'}
                onClick={handleSign}
              >
                {getSignButtonText()}
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <span>合同基本信息</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="合同编号">
                <span style={{ fontFamily: 'monospace' }}>{contract.contract_no}</span>
              </Descriptions.Item>
              <Descriptions.Item label="合同金额">
                <span style={{ color: '#f5222d', fontWeight: 600, fontSize: 16 }}>
                  ¥{contract.total_amount.toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="业主">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {contract.owner_name} ({contract.owner_phone})
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="设计师">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {contract.designer_name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="门店">
                <Space>
                  <Avatar size="small" icon={<ShopOutlined />} />
                  {contract.store_name} ({contract.store_phone})
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="质保期限">
                {contract.warranty_years} 年
              </Descriptions.Item>
              <Descriptions.Item label="开工日期">
                {dayjs(contract.start_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="竣工日期">
                {dayjs(contract.end_date).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="业主签署">
                {contract.owner_signed_at ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    {dayjs(contract.owner_signed_at).format('YYYY-MM-DD HH:mm')}
                  </Tag>
                ) : (
                  <Tag color="default" icon={<ClockCircleOutlined />}>待签署</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="门店签署">
                {contract.store_signed_at ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    {dayjs(contract.store_signed_at).format('YYYY-MM-DD HH:mm')}
                  </Tag>
                ) : (
                  <Tag color="default" icon={<ClockCircleOutlined />}>待签署</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={
              <Space>
                <WalletOutlined style={{ color: '#faad14' }} />
                <span>资金托管条款</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fffbe6' }}>
                  <Text type="secondary">托管金额</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#faad14', marginTop: 8 }}>
                    ¥{contract.escrow_amount.toLocaleString()}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    合同总额 20%
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <Text type="secondary">已支付</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a', marginTop: 8 }}>
                    ¥{paidTotal.toLocaleString()}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {contract.total_amount > 0 ? `${((paidTotal / contract.total_amount) * 100).toFixed(1)}%` : '0%'}
                  </Text>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                  <Text type="secondary">待支付</Text>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#1890ff', marginTop: 8 }}>
                    ¥{(contract.total_amount - paidTotal).toLocaleString()}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {contract.total_amount > 0 ? `${(((contract.total_amount - paidTotal) / contract.total_amount) * 100).toFixed(1)}%` : '0%'}
                  </Text>
                </Card>
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
              <Text type="secondary" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {contract.terms.split('第六条')[0].trim()}
              </Text>
            </div>
          </Card>

          <Card
            title={
              <Space>
                <HomeOutlined style={{ color: '#722ed1' }} />
                <span>工程节点进度</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Timeline
              mode="left"
              items={milestones.map((milestone, index) => {
                const statusInfo = milestoneStatusMap[milestone.status];
                const isLast = index === milestones.length - 1;
                const allConfirmed = milestone.owner_confirmed && milestone.designer_confirmed && milestone.supervisor_confirmed;

                return {
                  color: milestone.status === 'confirmed' ? 'green' :
                         milestone.status === 'ready' ? 'blue' : 'gray',
                  dot: milestone.status === 'confirmed' ? <CheckCircleOutlined style={{ fontSize: 16 }} /> :
                       milestone.status === 'ready' ? <ClockCircleOutlined style={{ fontSize: 16 }} /> : undefined,
                  label: (
                    <div style={{ width: 180 }}>
                      <div style={{ fontWeight: 500 }}>{milestone.milestone_type}</div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        计划：{dayjs(milestone.planned_date).format('MM-DD')}
                      </div>
                      {milestone.actual_date && (
                        <div style={{ fontSize: 12, color: '#52c41a', marginTop: 2 }}>
                          实际：{dayjs(milestone.actual_date).format('MM-DD')}
                        </div>
                      )}
                    </div>
                  ),
                  children: (
                    <Card
                      size="small"
                      style={{ marginBottom: isLast ? 0 : 16 }}
                      title={
                        <Space>
                          <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            付款金额：¥{milestone.payment_amount.toLocaleString()}
                          </Text>
                          <Tag
                            color={milestone.payment_status === 'paid' ? 'success' :
                                   milestone.payment_status === 'processing' ? 'warning' : 'default'}
                            icon={milestone.payment_status === 'paid' ? <CheckCircleOutlined /> : <PayCircleOutlined />}
                          >
                            {paymentStatusMap[milestone.payment_status].text}
                          </Tag>
                        </Space>
                      }
                      extra={
                        <Space>
                          {milestone.status === 'pending' && (user?.role === 'supervisor' || user?.role === 'store_manager') && (
                            <Button
                              type="primary"
                              size="small"
                              loading={actionLoading === `inspection-${milestone.id}`}
                              onClick={() => handleSubmitInspection(milestone.id)}
                            >
                              提交验收申请
                            </Button>
                          )}
                          {renderConfirmStatus(milestone)}
                          {milestone.status === 'confirmed' && milestone.payment_status === 'processing' && user?.role === 'owner' && (
                            <Button
                              type="primary"
                              size="small"
                              loading={actionLoading === `pay-${milestone.id}`}
                              onClick={() => handlePayMilestone(milestone.id, milestone.payment_amount)}
                            >
                              立即付款
                            </Button>
                          )}
                        </Space>
                      }
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>三方确认状态：</Text>
                        {allConfirmed ? (
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ marginLeft: 8 }}>
                            三方已确认
                          </Tag>
                        ) : (
                          renderTripleConfirmBadges(milestone)
                        )}
                      </div>
                      {milestone.paid_at && (
                        <div style={{ fontSize: 12, color: '#52c41a' }}>
                          <CheckCircleOutlined /> 付款时间：{dayjs(milestone.paid_at).format('YYYY-MM-DD HH:mm')}
                        </div>
                      )}
                    </Card>
                  ),
                };
              })}
            />
          </Card>

          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#13c2c2' }} />
                <span>材料BOM清单</span>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                  (合计：<span style={{ color: '#f5222d' }}>¥{bomTotal.toLocaleString()}</span>)
                </Text>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Table
              rowKey="id"
              columns={bomColumns}
              dataSource={bomList}
              size="small"
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Card>

          <Card
            title={
              <Space>
                <PayCircleOutlined style={{ color: '#eb2f96' }} />
                <span>付款记录</span>
              </Space>
            }
          >
            <Table
              rowKey="id"
              columns={paymentColumns}
              dataSource={payments}
              size="small"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                <span>电子合约存证</span>
              </Space>
            }
          >
            {contract.status === 'signed' ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <SafetyCertificateOutlined style={{ fontSize: 64, color: '#52c41a' }} />
                  <div style={{ marginTop: 8, fontWeight: 500 }}>合约已存证</div>
                </div>
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="存证哈希">
                    <code style={{ fontSize: 11, wordBreak: 'break-all' }}>
                      {electronicContract?.hash || '0x' + '0'.repeat(64)}
                    </code>
                  </Descriptions.Item>
                  <Descriptions.Item label="存储路径">
                    {electronicContract?.storage_url || `/storage/contracts/${contract.id}.pdf`}
                  </Descriptions.Item>
                  <Descriptions.Item label="存证时间">
                    {electronicContract?.created_at
                      ? dayjs(electronicContract.created_at).format('YYYY-MM-DD HH:mm')
                      : contract.store_signed_at
                        ? dayjs(contract.store_signed_at).format('YYYY-MM-DD HH:mm')
                        : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="有效期至">
                    {electronicContract?.expire_date
                      ? dayjs(electronicContract.expire_date).format('YYYY-MM-DD')
                      : dayjs(contract.created_at).add(10, 'year').format('YYYY-MM-DD')}
                  </Descriptions.Item>
                </Descriptions>
                <Button type="link" block style={{ marginTop: 12 }}>
                  下载电子合同
                </Button>
                <Button type="link" block>
                  查看区块链存证
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#999' }}>
                <ClockCircleOutlined style={{ fontSize: 48 }} />
                <div style={{ marginTop: 12 }}>合同签署后将生成电子存证</div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContractDetail;
