import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Tag,
  Table,
  Space,
  Divider,
  Alert,
  Progress,
  Descriptions,
  List,
  Statistic,
  Steps,
  Timeline,
  Tooltip,
  Badge,
  Empty,
  Avatar,
  Tabs,
  Result,
  Skeleton,
} from 'antd';
import {
  UserAddOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  HomeOutlined,
  ReloadOutlined,
  PlusOutlined,
  PayCircleOutlined,
} from '@ant-design/icons';
import { family, payment } from '@/api';
import type { FamilyMutualAid, FamilyUsageRecord, PaymentOrder } from '@/types';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

interface FamilyMemberWithOrders extends FamilyMutualAid {
  orders: PaymentOrder[];
}

const relationshipConfig = {
  parent: { name: '父母', icon: '👴', color: '#165DFF' },
  child: { name: '子女', icon: '👶', color: '#52c41a' },
  spouse: { name: '配偶', icon: '💑', color: '#eb2f96' },
  sibling: { name: '兄弟姐妹', icon: '👫', color: '#722ed1' },
};

const verifyStatusConfig = {
  pending_verify: {
    color: 'warning',
    text: '核验中',
    icon: <ClockCircleOutlined />,
    desc: '公安人口库正在核验亲属关系',
  },
  active: {
    color: 'success',
    text: '已生效',
    icon: <CheckCircleOutlined />,
    desc: '亲属关系核验通过，共济额度可用',
  },
  rejected: {
    color: 'error',
    text: '核验失败',
    icon: <CloseCircleOutlined />,
    desc: '亲属关系核验不通过，请检查信息后重新申请',
  },
  terminated: {
    color: 'default',
    text: '已解绑',
    icon: <CloseCircleOutlined />,
    desc: '共济绑定已解除',
  },
};

const verifySteps = [
  { title: '提交申请', description: '填写亲属信息' },
  { title: '公安核验', description: '人口库比对' },
  { title: '开通共济', description: '设置授权额度' },
  { title: '生效使用', description: '可用于支付' },
];

const mockMembers: FamilyMutualAid[] = [
  {
    id: 1,
    relativeName: '王建国',
    relativeIdCard: '430101196501011234',
    relationship: 'parent',
    authAmount: 5000,
    usedAmount: 1280,
    status: 'active',
    createdAt: '2024-01-15 10:30:00',
  },
  {
    id: 2,
    relativeName: '李明华',
    relativeIdCard: '430101199505056789',
    relationship: 'child',
    authAmount: 3000,
    usedAmount: 380,
    status: 'active',
    createdAt: '2024-02-20 14:15:00',
  },
  {
    id: 3,
    relativeName: '张桂芳',
    relativeIdCard: '430101196808084321',
    relationship: 'parent',
    authAmount: 5000,
    usedAmount: 0,
    status: 'pending_verify',
    createdAt: '2024-03-08 09:00:00',
  },
];

const mockUsageRecords: FamilyUsageRecord[] = [
  { id: 1, familyMemberId: 1, orderId: 1, amount: 380, usageType: 'medical_pay', status: 'success', usedAt: '2024-03-01 10:20:00' },
  { id: 2, familyMemberId: 1, orderId: 2, amount: 900, usageType: 'pension_pay', status: 'success', usedAt: '2024-02-15 14:30:00' },
  { id: 3, familyMemberId: 2, orderId: 3, amount: 380, usageType: 'medical_pay', status: 'success', usedAt: '2024-03-05 11:00:00' },
];

const mockOrders: PaymentOrder[] = [
  { id: 1, orderNo: 'ORD202403010001', insuranceType: 'medical', amount: 380, status: 'paid', payYear: 2024, payGrade: 1, familyMemberId: 1, taxInvoiceStatus: 'issued', financeStatus: 'warehoused', medicalCreditStatus: 'credited', createdAt: '2024-03-01 10:20:00' },
  { id: 2, orderNo: 'ORD202402150002', insuranceType: 'pension', amount: 900, status: 'paid', payYear: 2024, payGrade: 2, familyMemberId: 1, taxInvoiceStatus: 'issued', financeStatus: 'warehoused', medicalCreditStatus: 'credited', createdAt: '2024-02-15 14:30:00' },
  { id: 3, orderNo: 'ORD202403050003', insuranceType: 'medical', amount: 380, status: 'paid', payYear: 2024, payGrade: 1, familyMemberId: 2, taxInvoiceStatus: 'issued', financeStatus: 'warehoused', medicalCreditStatus: 'credited', createdAt: '2024-03-05 11:00:00' },
];

const FamilyPage: React.FC = () => {
  const [members, setMembers] = useState<FamilyMutualAid[]>([]);
  const [usageRecords, setUsageRecords] = useState<FamilyUsageRecord[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [unbindModalVisible, setUnbindModalVisible] = useState(false);

  const [selectedMember, setSelectedMember] = useState<FamilyMutualAid | null>(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<string>('members');

  useEffect(() => {
    setMembers(mockMembers);
    setUsageRecords(mockUsageRecords);
    setOrders(mockOrders);
    setUseFallback(true);
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [membersRes, recordsRes, ordersRes] = await Promise.all([
        family.getMembers(),
        family.getUsageRecords(),
        payment.getOrders(),
      ]);
      
      let hasData = false;
      
      if (membersRes?.success) {
        const data = membersRes.data?.items || membersRes.data || [];
        setMembers(data);
        if (data.length > 0) hasData = true;
      }
      if (recordsRes?.success) {
        const data = recordsRes.data?.items || recordsRes.data || [];
        setUsageRecords(data);
        if (data.length > 0) hasData = true;
      }
      if (ordersRes?.success) {
        const data = ordersRes.data?.items || ordersRes.data || [];
        setOrders(data);
        if (data.length > 0) hasData = true;
      }
      
      if (hasData) {
        setUseFallback(false);
        setError(null);
      } else {
        console.info('接口无数据，使用示例数据展示家庭共济页面');
      }
    } catch (error) {
      console.error('Load family data failed:', error);
      setError('数据加载失败，已使用示例数据展示');
    } finally {
      setLoading(false);
    }
  };

  const getMemberOrders = (memberId: number) => {
    return orders.filter((o) => o.familyMemberId === memberId);
  };

  const getMemberWithOrders = (): FamilyMemberWithOrders[] => {
    return members.map((m) => ({
      ...m,
      orders: getMemberOrders(m.id),
    }));
  };

  const handleAddMember = async (values: any) => {
    setActionLoading(true);
    try {
      const response = await family.bindMember({
        relativeName: values.relativeName,
        relativeIdCard: values.relativeIdCard,
        relationship: values.relationship,
        authAmount: values.authAmount,
      });
      if (response.success) {
        message.success('绑定申请提交成功，等待公安核验');
        setAddModalVisible(false);
        addForm.resetFields();
        loadData();
      }
    } catch (error) {
      console.error('Add member failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditMember = async (values: any) => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      const response = await family.adjustAuthAmount(selectedMember.id, {
        authAmount: values.authAmount,
      });
      if (response.success) {
        message.success('授权额度调整成功');
        setEditModalVisible(false);
        editForm.resetFields();
        loadData();
      }
    } catch (error) {
      console.error('Edit member failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyMember = async (memberId: number) => {
    setActionLoading(true);
    try {
      const response = await family.verifyMember(memberId);
      if (response.success) {
        message.success('核验完成');
        setVerifyModalVisible(false);
        loadData();
      }
    } catch (error) {
      console.error('Verify member failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbindMember = async () => {
    if (!selectedMember) return;
    setActionLoading(true);
    try {
      const response = await family.unbindMember(selectedMember.id);
      if (response.success) {
        message.success('解绑成功');
        setUnbindModalVisible(false);
        setSelectedMember(null);
        loadData();
      }
    } catch (error) {
      console.error('Unbind member failed:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const showEditModal = (member: FamilyMutualAid) => {
    setSelectedMember(member);
    editForm.setFieldsValue({ authAmount: member.authAmount });
    setEditModalVisible(true);
  };

  const showDetailModal = (member: FamilyMutualAid) => {
    setSelectedMember(member);
    setDetailModalVisible(true);
  };

  const showVerifyModal = (member: FamilyMutualAid) => {
    setSelectedMember(member);
    setVerifyModalVisible(true);
  };

  const showUnbindModal = (member: FamilyMutualAid) => {
    setSelectedMember(member);
    setUnbindModalVisible(true);
  };

  const getUsagePercentage = (used: number, auth: number) => {
    return auth > 0 ? Math.round((used / auth) * 100) : 0;
  };

  const getMemberRecords = (memberId: number) => {
    return usageRecords.filter((r) => r.familyMemberId === memberId);
  };

  const canUseForPayment = (member: FamilyMutualAid, amount: number) => {
    if (member.status !== 'active') return { can: false, reason: '账户未生效' };
    const available = member.authAmount - member.usedAmount;
    if (available < amount) return { can: false, reason: '可用额度不足' };
    return { can: true, reason: '可以支付' };
  };

  const stats = () => {
    const activeCount = members.filter((m) => m.status === 'active').length;
    const totalAuth = members.reduce((sum, m) => sum + m.authAmount, 0);
    const totalUsed = members.reduce((sum, m) => sum + m.usedAmount, 0);
    const totalAvailable = totalAuth - totalUsed;

    return (
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="共济成员数"
              value={members.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#165DFF' }}
              suffix={`/ 已生效 ${activeCount}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#165DFF' }}>
            <Statistic
              title="累计授权额度"
              value={totalAuth}
              prefix="¥"
              valueStyle={{ color: '#165DFF' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#faad14' }}>
            <Statistic
              title="累计已用额度"
              value={totalUsed}
              prefix="¥"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card className="shadow-sm border-l-4" style={{ borderLeftColor: '#52c41a' }}>
            <Statistic
              title="当前可用额度"
              value={totalAvailable}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const memberCard = (member: FamilyMutualAid) => {
    const relation = relationshipConfig[member.relationship as keyof typeof relationshipConfig];
    const status = verifyStatusConfig[member.status as keyof typeof verifyStatusConfig];
    const available = member.authAmount - member.usedAmount;
    const usagePercent = getUsagePercentage(member.usedAmount, member.authAmount);
    const memberOrders = getMemberOrders(member.id);
    const paymentCheck = canUseForPayment(member, 380);

    return (
      <Card
        key={member.id}
        className="shadow-sm hover:shadow-md transition-shadow"
        bodyStyle={{ padding: 0 }}
      >
        <div
          className="p-4 text-white relative overflow-hidden"
          style={{
            background: status.color === 'success'
              ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
              : status.color === 'warning'
              ? 'linear-gradient(135deg, #faad14 0%, #d48806 100%)'
              : status.color === 'error'
              ? 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)'
              : 'linear-gradient(135deg, #8c8c8c 0%, #595959 100%)',
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{relation?.icon}</span>
                <div>
                  <div className="font-bold text-lg">{member.relativeName}</div>
                  <div className="text-xs opacity-80">{relation?.name} · {member.relativeIdCard}</div>
                </div>
              </div>
            </div>
            <Tag icon={status.icon} color={status.color} style={{ background: 'rgba(255,255,255,0.2)', border: 'none' }}>
              {status.text}
            </Tag>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <div className="text-xs text-gray-500">授权额度</div>
              <div className="text-xl font-bold text-blue-600">¥{member.authAmount.toLocaleString()}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500">可用额度</div>
              <div className={`text-xl font-bold ${available > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                ¥{available.toLocaleString()}
              </div>
            </div>
          </div>

          <Progress
            percent={usagePercent}
            size="small"
            status={usagePercent > 90 ? 'exception' : 'normal'}
            strokeColor={{
              '0%': '#52c41a',
              '100%': '#165DFF',
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>已用 ¥{member.usedAmount.toLocaleString()}</span>
            <span>{usagePercent}%</span>
          </div>

          {member.status === 'active' && (
            <Alert
              className="mt-3"
              type={paymentCheck.can ? 'success' : 'warning'}
              showIcon
              size="small"
              message={
                <div className="flex items-center justify-between">
                  <span>{paymentCheck.can ? '账户正常，可用于支付' : paymentCheck.reason}</span>
                  <Tooltip title="示例：按居民医保最低缴费380元预估">
                    <Tag color={paymentCheck.can ? 'success' : 'warning'}>
                      {paymentCheck.can ? '可支付' : '不可支付'} ¥380
                    </Tag>
                  </Tooltip>
                </div>
              }
            />
          )}

          {member.status === 'pending_verify' && (
            <Alert
              className="mt-3"
              type="info"
              showIcon
              size="small"
              message={status.desc}
              action={
                <Button
                  size="small"
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => handleVerifyMember(member.id)}
                >
                  重新核验
                </Button>
              }
            />
          )}

          {member.status === 'rejected' && (
            <Alert
              className="mt-3"
              type="error"
              showIcon
              size="small"
              message={status.desc}
              action={
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setAddModalVisible(true)}
                >
                  重新申请
                </Button>
              }
            />
          )}

          <Divider style={{ margin: '16px 0' }} />

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {memberOrders.length > 0 ? (
                <span>关联 {memberOrders.length} 笔支付订单</span>
              ) : (
                <span>暂无支付记录</span>
              )}
            </div>
            <Space>
              <Button
                size="small"
                type="link"
                icon={<EyeOutlined />}
                onClick={() => showDetailModal(member)}
              >
                详情
              </Button>
              {member.status === 'active' && (
                <Button
                  size="small"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => showEditModal(member)}
                >
                  调整额度
                </Button>
              )}
              {member.status === 'pending_verify' && (
                <Button
                  size="small"
                  type="link"
                  icon={<SafetyCertificateOutlined />}
                  onClick={() => showVerifyModal(member)}
                >
                  核验流程
                </Button>
              )}
              {member.status === 'active' && (
                <Button
                  size="small"
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => showUnbindModal(member)}
                >
                  解绑
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Card>
    );
  };

  const verifyFlowCard = () => (
    <Card
      title={
        <span style={{ fontFamily: 'Noto Serif SC, serif', fontSize: '16px' }}>
          亲属关系核验流程说明
        </span>
      }
      className="shadow-sm mb-6"
    >
      <div className="mb-4">
        <Alert
          message="关于家庭共济"
          description="家庭共济账户允许参保人员将其个人账户结余资金，用于支付配偶、父母、子女等直系亲属的社会保险费用。绑定需经公安部门人口库核验亲属关系。"
          type="info"
          showIcon
        />
      </div>
      <Steps
        current={3}
        labelPlacement="vertical"
        items={verifySteps.map((step, index) => ({
          title: step.title,
          description: step.description,
          status: 'finish',
          icon: (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ background: '#52c41a' }}
            >
              {index + 1}
            </div>
          ),
        }))}
      />
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="font-medium text-blue-700 mb-2">✓ 支持的亲属关系</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• 父母（60周岁以上优先）</div>
            <div>• 子女（未满18周岁优先）</div>
            <div>• 配偶（法定婚姻关系）</div>
            <div>• 兄弟姐妹（特殊情况）</div>
          </div>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="font-medium text-green-700 mb-2">✓ 共济使用范围</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• 城乡居民医疗保险缴费</div>
            <div>• 城乡居民养老保险缴费</div>
            <div>• 灵活就业人员社保缴费</div>
            <div>• 住院费用个人负担部分</div>
          </div>
        </div>
      </div>
    </Card>
  );

  const usageRecordsColumns = [
    {
      title: '使用时间',
      dataIndex: 'usedAt',
      key: 'usedAt',
      width: 180,
    },
    {
      title: '使用人',
      dataIndex: 'familyMemberId',
      key: 'familyMemberId',
      render: (id: number) => {
        const member = members.find((m) => m.id === id);
        return member ? (
          <Tag color={relationshipConfig[member.relationship as keyof typeof relationshipConfig]?.color}>
            {relationshipConfig[member.relationship as keyof typeof relationshipConfig]?.icon} {member.relativeName}
          </Tag>
        ) : '-';
      },
    },
    {
      title: '关联订单',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (orderId: number) => {
        const order = orders.find((o) => o.id === orderId);
        return order ? (
          <span>
            <code className="text-primary">{order.orderNo}</code>
            <Tag className="ml-2">{order.insuranceType === 'medical' ? '医保' : '养老'}</Tag>
          </span>
        ) : '-';
      },
    },
    {
      title: '使用金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <span className="font-bold text-blue-600">-¥{amount.toLocaleString()}</span>
      ),
    },
    {
      title: '用途',
      dataIndex: 'usageType',
      key: 'usageType',
      render: (type: string) => {
        const typeMap: Record<string, string> = {
          medical_pay: '医保缴费',
          pension_pay: '养老缴费',
          hospital_pay: '住院支付',
          other: '其他',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'default'}>
          {status === 'success' ? '已完成' : '处理中'}
        </Tag>
      ),
    },
  ];

  if (error && !useFallback) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Result
          status="error"
          title="页面加载失败"
          subTitle={error}
          extra={[
            <Button type="primary" onClick={loadData}>
              重新加载
            </Button>,
            <Button onClick={() => {
              setMembers(mockMembers);
              setUsageRecords(mockUsageRecords);
              setOrders(mockOrders);
              setUseFallback(true);
            }}>
              使用示例数据
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert
          type="warning"
          showIcon
          message={error}
          description="当前展示为示例数据，部分操作可能不可用。可点击刷新按钮重新加载。"
          action={
            <Button size="small" onClick={loadData}>
              刷新
            </Button>
          }
          closable
          onClose={() => setError(null)}
        />
      )}
      
      {useFallback && !error && (
        <Alert
          type="info"
          showIcon
          message="示例数据展示"
          description="当前展示为示例数据，绑定、解绑等操作会创建真实记录。"
          icon={<InfoCircleOutlined />}
          action={
            <Button size="small" onClick={loadData}>
              重新加载
            </Button>
          }
          closable
        />
      )}

      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #165DFF 0%, #0E42B3 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'Noto Serif SC, serif' }}
            >
              家庭共济账户
            </h1>
            <p className="text-blue-100">绑定家庭成员，共享社保账户额度，经公安核验后可用于缴费支付</p>
          </div>
          <TeamOutlined className="text-6xl opacity-30" />
        </div>
      </div>

      {verifyFlowCard()}

      {stats()}

      <Card
        className="shadow-sm"
        bodyStyle={{ padding: 0 }}
        tabBarExtraContent={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setAddModalVisible(true)}
          >
            添加亲属
          </Button>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          style={{ padding: '0 24px' }}
          items={[
            { key: 'members', label: `共济成员 (${members.length})` },
            { key: 'records', label: `使用记录 (${usageRecords.length})` },
          ]}
        />

        <div style={{ padding: '24px' }}>
          {activeTab === 'members' && (
            <>
              {loading ? (
                <Row gutter={[16, 16]}>
                  {[1, 2, 3].map((i) => (
                    <Col xs={24} md={12} lg={8} key={i}>
                      <Card className="shadow-sm" loading={true}>
                        <div style={{ height: '200px' }} />
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : members.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {members.map((member) => (
                    <Col xs={24} md={12} lg={8} key={member.id}>
                      {memberCard(member)}
                    </Col>
                  ))}
                </Row>
              ) : (
                <Empty
                  description={
                    <div className="text-center">
                      <TeamOutlined className="text-6xl text-gray-300 mb-4" />
                      <p className="text-gray-500 mb-4">暂无共济成员</p>
                      <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAddModalVisible(true)}>
                        添加第一位亲属
                      </Button>
                    </div>
                  }
                />
              )}
            </>
          )}

          {activeTab === 'records' && (
            <Table
              dataSource={usageRecords}
              columns={usageRecordsColumns}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          )}
        </div>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserAddOutlined className="text-blue-600" />
            <span style={{ fontFamily: 'Noto Serif SC, serif' }}>添加家庭成员</span>
          </div>
        }
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setAddModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={actionLoading}
            onClick={() => addForm.submit()}
          >
            提交申请
          </Button>,
        ]}
        width={500}
      >
        <Alert
          message="信息校验说明"
          description="填写的亲属信息将提交公安人口库进行核验，请确保身份证号和姓名准确无误。核验通过后方可使用共济额度。"
          type="info"
          showIcon
          className="mb-4"
        />
        <Form form={addForm} layout="vertical" onFinish={handleAddMember}>
          <Form.Item
            name="relativeName"
            label="亲属姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入亲属真实姓名" />
          </Form.Item>
          <Form.Item
            name="relativeIdCard"
            label="身份证号"
            rules={[
              { required: true, message: '请输入身份证号' },
              { len: 18, message: '身份证号必须为18位' },
            ]}
          >
            <Input prefix={<IdcardOutlined />} placeholder="请输入18位身份证号" />
          </Form.Item>
          <Form.Item
            name="relationship"
            label="亲属关系"
            rules={[{ required: true, message: '请选择亲属关系' }]}
          >
            <Select placeholder="请选择亲属关系">
              {Object.entries(relationshipConfig).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.icon} {value.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="authAmount"
            label="授权年度额度（元）"
            rules={[{ required: true, message: '请输入授权额度' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={100}
              max={50000}
              step={100}
              placeholder="请输入年度授权额度（100-50000元）"
              prefix="¥"
            />
          </Form.Item>
          <Alert
            message="核验流程"
            description="提交后将进入公安核验流程（约1-3个工作日），核验通过后共济账户自动生效。"
            type="success"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title="调整授权额度"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={actionLoading}
            onClick={() => editForm.submit()}
          >
            确认调整
          </Button>,
        ]}
      >
        {selectedMember && (
          <div className="mb-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Avatar
                size="large"
                style={{
                  background: relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.color,
                }}
              >
                {selectedMember.relativeName.charAt(0)}
              </Avatar>
              <div>
                <div className="font-medium">{selectedMember.relativeName}</div>
                <div className="text-xs text-gray-500">
                  {relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.name} · 当前可用额度: ¥{(selectedMember.authAmount - selectedMember.usedAmount).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
        <Form form={editForm} layout="vertical" onFinish={handleEditMember}>
          <Form.Item
            name="authAmount"
            label="新的年度授权额度（元）"
            rules={[{ required: true, message: '请输入授权额度' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={100}
              max={50000}
              step={100}
              prefix="¥"
            />
          </Form.Item>
          <Alert
            message="注意"
            description="调整后的额度将从下一个缴费周期开始生效，已使用的额度不受影响。"
            type="warning"
            showIcon
          />
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-600" />
            <span>亲属关系核验流程</span>
          </div>
        }
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setVerifyModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="retry"
            type="primary"
            icon={<ReloadOutlined />}
            loading={actionLoading}
            onClick={() => selectedMember && handleVerifyMember(selectedMember.id)}
          >
            发起重新核验
          </Button>,
        ]}
        width={600}
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="font-medium text-yellow-800 mb-2">
                <ClockCircleOutlined className="mr-2" />
                核验进行中
              </div>
              <p className="text-sm text-yellow-700">
                正在通过公安人口库核验 {selectedMember.relativeName} 与您的亲属关系，预计1-3个工作日完成。
              </p>
            </div>

            <Steps
              direction="vertical"
              size="small"
              current={1}
              items={[
                {
                  title: '申请提交',
                  description: `申请时间: ${selectedMember.createdAt}`,
                  status: 'finish',
                },
                {
                  title: '公安人口库核验',
                  description: '正在比对身份证信息和亲属关系',
                  status: 'process',
                  subTitle: '约1-3个工作日',
                },
                {
                  title: '核验结果通知',
                  description: '核验通过后将发送短信通知，共济账户自动生效',
                  status: 'wait',
                },
                {
                  title: '共济账户开通',
                  description: '可使用授权额度支付社保费用',
                  status: 'wait',
                },
              ]}
            />

            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="申请人">{selectedMember.relativeName}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{selectedMember.relativeIdCard}</Descriptions.Item>
              <Descriptions.Item label="关系类型">
                {relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.name}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">{selectedMember.createdAt}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <EyeOutlined className="text-blue-600" />
            <span>共济账户详情</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
        ]}
        width={700}
      >
        {selectedMember && (
          <div className="space-y-6">
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: `${relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.color}10`,
                borderLeft: `4px solid ${relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.color}`,
              }}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar
                    size={56}
                    style={{
                      background: relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.color,
                    }}
                  >
                    {selectedMember.relativeName.charAt(0)}
                  </Avatar>
                  <div>
                    <div className="font-bold text-xl">{selectedMember.relativeName}</div>
                    <div className="text-sm text-gray-500">
                      {relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.name} · {selectedMember.relativeIdCard}
                    </div>
                  </div>
                </div>
                <Tag
                  icon={verifyStatusConfig[selectedMember.status as keyof typeof verifyStatusConfig].icon}
                  color={verifyStatusConfig[selectedMember.status as keyof typeof verifyStatusConfig].color}
                >
                  {verifyStatusConfig[selectedMember.status as keyof typeof verifyStatusConfig].text}
                </Tag>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={8}>
                <Card className="text-center">
                  <Statistic
                    title="年度授权额度"
                    value={selectedMember.authAmount}
                    prefix="¥"
                    valueStyle={{ color: '#165DFF' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center">
                  <Statistic
                    title="累计已用"
                    value={selectedMember.usedAmount}
                    prefix="¥"
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={8}>
                <Card className="text-center">
                  <Statistic
                    title="当前可用"
                    value={selectedMember.authAmount - selectedMember.usedAmount}
                    prefix="¥"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>

            <div>
              <div className="font-medium mb-3 flex items-center gap-2">
                <PayCircleOutlined className="text-blue-600" />
                关联支付订单
              </div>
              {getMemberOrders(selectedMember.id).length > 0 ? (
                <List
                  size="small"
                  dataSource={getMemberOrders(selectedMember.id)}
                  renderItem={(order) => (
                    <List.Item key={order.id}>
                      <List.Item.Meta
                        avatar={<FileTextOutlined className="text-blue-600" />}
                        title={
                          <div className="flex items-center gap-2">
                            <code className="text-primary">{order.orderNo}</code>
                            <Tag color={order.status === 'paid' ? 'success' : 'warning'}>
                              {order.status === 'paid' ? '已支付' : '待支付'}
                            </Tag>
                          </div>
                        }
                        description={`${order.insuranceType === 'medical' ? '医保' : '养老'} · ${order.payYear}年度 · 第${order.payGrade}档`}
                      />
                      <div className="font-bold text-blue-600">
                        -¥{order.amount.toLocaleString()}
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无关联订单" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>

            <div>
              <div className="font-medium mb-3 flex items-center gap-2">
                <FileTextOutlined className="text-blue-600" />
                共济使用记录
              </div>
              {getMemberRecords(selectedMember.id).length > 0 ? (
                <Timeline
                  size="small"
                  items={getMemberRecords(selectedMember.id).map((record) => ({
                    color: record.status === 'success' ? 'green' : 'blue',
                    children: (
                      <div>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            {record.usageType === 'medical_pay' ? '医保缴费' : '养老缴费'}
                          </span>
                          <span className="font-bold text-red-500">
                            -¥{record.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">{record.usedAt}</div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <Empty description="暂无使用记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="确认解绑"
        open={unbindModalVisible}
        onCancel={() => {
          setUnbindModalVisible(false);
          setSelectedMember(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setUnbindModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            danger
            type="primary"
            loading={actionLoading}
            onClick={handleUnbindMember}
          >
            确认解绑
          </Button>,
        ]}
      >
        {selectedMember && (
          <div className="space-y-4">
            <Alert
              message="解绑后将无法恢复"
              description="解绑后该亲属的共济账户将立即失效，未使用的授权额度将退回主账户，但已支付的订单不受影响。"
              type="error"
              showIcon
            />
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-medium mb-2">即将解绑的成员：</div>
              <div className="flex items-center gap-3">
                <Avatar
                  style={{
                    background: relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.color,
                  }}
                >
                  {selectedMember.relativeName.charAt(0)}
                </Avatar>
                <div>
                  <div className="font-medium">{selectedMember.relativeName}</div>
                  <div className="text-sm text-gray-500">
                    {relationshipConfig[selectedMember.relationship as keyof typeof relationshipConfig]?.name}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-bold text-green-600">
                    可用额度: ¥{(selectedMember.authAmount - selectedMember.usedAmount).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">将退回主账户</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FamilyPage;
