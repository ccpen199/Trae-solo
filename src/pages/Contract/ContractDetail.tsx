import { useState, useMemo } from 'react';
import {
  Layout,
  Tabs,
  Card,
  Descriptions,
  Button,
  Row,
  Col,
  Avatar,
  Tag,
  Divider,
  Table,
  Collapse,
  Space,
  Tooltip,
  message,
  Empty,
  Badge,
  List,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  BankOutlined,
  FileProtectOutlined,
  HomeOutlined,
  UserOutlined,
  SafetyOutlined,
  FileSearchOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  LinkOutlined,
  FilePdfOutlined,
  PaperClipOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useAppStore } from '@/store';
import type { Contract, SettlementPlanItem } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';
import Timeline from '@/components/common/Timeline';
import ProgressRing from '@/components/common/ProgressRing';
import DataCard from '@/components/common/DataCard';
import { formatMoney, maskIdCard, maskPhone } from '@/utils';
import { cn } from '@/lib/utils';

const { Content } = Layout;
const { TabPane } = Tabs;

/** CA信息卡接口 */
interface CAInfo {
  name: string;
  idCard: string;
  phone: string;
  caProvider: string;
  certSerial: string;
  validFrom: string;
  validTo: string;
  publicKeyFingerprint: string;
  signAlgorithm: string;
  digitalSignature: string;
  signStatus: 'pending' | 'signed' | 'rejected';
  signTime?: string;
}

/** 附件项接口 */
interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadTime: string;
  icon: React.ReactNode;
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { contracts } = useAppStore();

  const [activeTab, setActiveTab] = useState('overview');

  /** 根据ID查找合同 */
  const contract: Contract | undefined = useMemo(() => {
    return contracts.find((c) => c.id === id);
  }, [contracts, id]);

  /** 生成签约时间轴 */
  const signTimeline = useMemo(() => {
    if (!contract) return [];
    const baseTime = dayjs(contract.createTime);
    return [
      {
        time: baseTime.format('YYYY-MM-DD HH:mm'),
        title: '生成合同模板',
        description: `合同编号 ${contract.contractNo} 由系统自动生成，已注入住建委标准条款`,
        status: 'success' as const,
      },
      {
        time: baseTime.add(5, 'minute').format('YYYY-MM-DD HH:mm'),
        title: '注入住建委备案条款',
        description: '已同步上海市住房和城乡建设管理委员会租赁标准条款 v3.2',
        status: 'success' as const,
      },
      {
        time: contract.caSignInfo?.tenantSignTime
          ? dayjs(contract.caSignInfo.tenantSignTime).format('YYYY-MM-DD HH:mm')
          : baseTime.add(2, 'hour').format('YYYY-MM-DD HH:mm'),
        title: `租客 ${contract.tenantName} CA 签署`,
        description:
          contract.caSignInfo?.tenantSignStatus === 'signed'
            ? `证书序列号: ${contract.caSignInfo?.contractHash?.slice(0, 16) || 'SN202406001'}... 已完成数字签名`
            : '等待租客签署中',
        status:
          contract.caSignInfo?.tenantSignStatus === 'signed'
            ? ('success' as const)
            : contract.caSignInfo?.tenantSignStatus === 'rejected'
            ? ('danger' as const)
            : ('processing' as const),
      },
      {
        time: contract.caSignInfo?.landlordSignTime
          ? dayjs(contract.caSignInfo.landlordSignTime).format('YYYY-MM-DD HH:mm')
          : baseTime.add(4, 'hour').format('YYYY-MM-DD HH:mm'),
        title: `房东 ${contract.landlordName} CA 签署`,
        description:
          contract.caSignInfo?.landlordSignStatus === 'signed'
            ? `证书序列号: ${contract.caSignInfo?.contractHash?.slice(0, 16) || 'SN202406002'}... 已完成数字签名`
            : '等待房东签署中',
        status:
          contract.caSignInfo?.landlordSignStatus === 'signed'
            ? ('success' as const)
            : contract.caSignInfo?.landlordSignStatus === 'rejected'
            ? ('danger' as const)
            : contract.status === 'signing' || contract.status === 'active'
            ? ('success' as const)
            : ('processing' as const),
      },
      {
        time: baseTime.add(6, 'hour').format('YYYY-MM-DD HH:mm'),
        title: '时间戳固化',
        description: `可信时间戳 TSA 签发，哈希算法 SHA-256，存证编号 ${contract.caSignInfo?.evidenceNo || 'TSA20240615001'}`,
        status: contract.status === 'active' ? ('success' as const) : ('processing' as const),
      },
      {
        time: baseTime.add(8, 'hour').format('YYYY-MM-DD HH:mm'),
        title: '住建委备案提交',
        description: contract.caSignInfo?.evidenceNo
          ? `备案号 ${contract.caSignInfo.evidenceNo}，已同步至上海市住房租赁公共服务平台`
          : '等待备案材料齐全后自动提交',
        status: contract.caSignInfo?.evidenceNo ? ('success' as const) : ('warning' as const),
      },
    ];
  }, [contract]);

  /** 租客CA信息 */
  const tenantCA: CAInfo = useMemo(() => {
    if (!contract) {
      return {} as CAInfo;
    }
    return {
      name: contract.tenantName,
      idCard: contract.tenantIdCard,
      phone: contract.tenantPhone,
      caProvider: '上海市数字证书认证中心 (SHECA)',
      certSerial: `SN-${contract.id.slice(0, 8).toUpperCase()}-TENANT-001`,
      validFrom: dayjs(contract.createTime).format('YYYY-MM-DD'),
      validTo: dayjs(contract.createTime).add(3, 'year').format('YYYY-MM-DD'),
      publicKeyFingerprint: `SHA256:${contract.id.slice(0, 8)}:${contract.contractNo.slice(-8)}`,
      signAlgorithm: 'SM2withSM3 (国密算法)',
      digitalSignature: `MEYCIQDK${contract.id.slice(0, 12).toUpperCase()}...(共512字节签名值)`,
      signStatus: contract.caSignInfo?.tenantSignStatus || 'pending',
      signTime: contract.caSignInfo?.tenantSignTime,
    };
  }, [contract]);

  /** 房东CA信息 */
  const landlordCA: CAInfo = useMemo(() => {
    if (!contract) {
      return {} as CAInfo;
    }
    return {
      name: contract.landlordName,
      idCard: '310101198505123456',
      phone: contract.landlordPhone,
      caProvider: '上海市数字证书认证中心 (SHECA)',
      certSerial: `SN-${contract.id.slice(0, 8).toUpperCase()}-LANDLORD-001`,
      validFrom: dayjs(contract.createTime).format('YYYY-MM-DD'),
      validTo: dayjs(contract.createTime).add(5, 'year').format('YYYY-MM-DD'),
      publicKeyFingerprint: `SHA256:${contract.id.slice(8, 16)}:${contract.contractNo.slice(0, 8)}`,
      signAlgorithm: 'RSA-2048 with SHA-256',
      digitalSignature: `MIIBIjANBgkq${contract.id.slice(0, 12).toUpperCase()}...(共256字节签名值)`,
      signStatus: contract.caSignInfo?.landlordSignStatus || 'pending',
      signTime: contract.caSignInfo?.landlordSignTime,
    };
  }, [contract]);

  /** 分账计划表列定义 */
  const settlementColumns = [
    {
      title: '期数',
      dataIndex: 'period',
      key: 'period',
      width: 70,
      render: (val: number) => (
        <span className="font-mono font-semibold text-ink-700 tabular-nums">第{val}期</span>
      ),
    },
    {
      title: '应付日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD'),
    },
    {
      title: '租金',
      dataIndex: 'amount',
      key: 'rent',
      width: 110,
      render: (val: number) => (
        <span className="font-mono font-semibold text-ink-800 tabular-nums">
          {formatMoney(val, { decimals: 0 })}
        </span>
      ),
    },
    {
      title: '服务费',
      key: 'serviceFee',
      width: 100,
      render: (_: unknown, record: SettlementPlanItem) => (
        <span className="font-mono text-warning-600 tabular-nums">
          {formatMoney(Math.round(record.amount * 0.06), { decimals: 0 })}
        </span>
      ),
    },
    {
      title: '应划转金额',
      key: 'transferAmount',
      width: 120,
      render: (_: unknown, record: SettlementPlanItem) => (
        <span className="font-mono font-bold text-brand-700 tabular-nums">
          {formatMoney(Math.round(record.amount * 0.94), { decimals: 0 })}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const map: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: '未付' },
          paid: { color: 'processing', text: '已入托管' },
          overdue: { color: 'error', text: '逾期' },
          exempt: { color: 'warning', text: '已豁免' },
        };
        const cfg = map[status] || { color: 'default', text: status };
        return <Badge color={cfg.color as any} text={cfg.text} />;
      },
    },
    {
      title: '实际划转日期',
      dataIndex: 'paidDate',
      key: 'paidDate',
      width: 130,
      render: (val?: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '银行凭证',
      key: 'voucher',
      width: 100,
      render: () => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => message.success('正在打开银行电子回单...')}
        >
          查看
        </Button>
      ),
    },
  ];

  /** 分账流水时间轴 */
  const transferTimeline = useMemo(() => {
    if (!contract) return [];
    return [
      {
        time: dayjs(contract.startDate).add(0, 'day').format('YYYY-MM-DD HH:mm'),
        title: '第1期租金划转完成',
        description: `银行流水号: BANK20240601001234 · 金额: ${formatMoney(Math.round(contract.monthlyRent * 0.94), { decimals: 0 })} · 收款账户尾号 ****8891`,
        status: 'success' as const,
      },
      {
        time: dayjs(contract.startDate).add(0, 'day').subtract(1, 'hour').format('YYYY-MM-DD HH:mm'),
        title: '第1期租金入托管账户',
        description: `租客 ${contract.tenantName} 通过微信支付 ${formatMoney(contract.monthlyRent, { decimals: 0 })}，交易号 WX${contract.id.slice(-10)}`,
        status: 'success' as const,
      },
    ];
  }, [contract]);

  /** 附件列表 */
  const attachments: AttachmentItem[] = [
    {
      id: '1',
      name: '房屋交割验收单.pdf',
      type: '交割单',
      size: '2.4 MB',
      uploadTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
      icon: <FilePdfOutlined className="text-danger-500" />,
    },
    {
      id: '2',
      name: '房源现场照片.zip',
      type: '照片',
      size: '15.8 MB',
      uploadTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
      icon: <PaperClipOutlined className="text-brand-500" />,
    },
    {
      id: '3',
      name: '家具家电清单.pdf',
      type: '清单',
      size: '856 KB',
      uploadTime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'),
      icon: <FilePdfOutlined className="text-danger-500" />,
    },
    {
      id: '4',
      name: '补充协议-免押条款.pdf',
      type: '补充协议',
      size: '1.2 MB',
      uploadTime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'),
      icon: <FileProtectOutlined className="text-warning-500" />,
    },
  ];

  /** 复制到剪贴板 */
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} 已复制到剪贴板`);
  };

  /** 下载PDF */
  const handleDownloadPDF = () => {
    message.success(`正在生成 ${contract?.contractNo} 的签署版 PDF ...`);
  };

  if (!contract) {
    return (
      <Layout className="min-h-screen bg-transparent">
        <Content className="p-6">
          <Empty description="未找到该合同，可能已被删除" />
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回列表
          </Button>
        </Content>
      </Layout>
    );
  }

  /** CA信息卡组件 */
  const CAInfoCard = ({ info, role }: { info: CAInfo; role: 'tenant' | 'landlord' }) => (
    <Card
      className={cn(
        'animate-fade-in-up h-full shadow-card',
        role === 'tenant' ? 'border-t-4 border-t-brand-500' : 'border-t-4 border-t-warning-500'
      )}
      bordered={false}
      title={
        <Space>
          <Avatar
            size={32}
            className={cn(
              role === 'tenant' ? 'bg-brand-500' : 'bg-warning-500',
              'text-white'
            )}
            icon={<UserOutlined />}
          />
          <div>
            <div className="font-semibold text-ink-800">{info.name}</div>
            <div className="text-xs text-ink-400">{role === 'tenant' ? '承租方 (租客)' : '出租方 (房东)'}</div>
          </div>
        </Space>
      }
      extra={
        <Space>
          <Tag
            color={info.signStatus === 'signed' ? 'success' : info.signStatus === 'rejected' ? 'error' : 'warning'}
            icon={info.signStatus === 'signed' ? <CheckCircleOutlined /> : <ReloadOutlined />}
          >
            {info.signStatus === 'signed' ? '已签署' : info.signStatus === 'rejected' ? '已拒绝' : '待签署'}
          </Tag>
        </Space>
      }
    >
      <Descriptions column={1} size="small" className="mb-4">
        <Descriptions.Item label="证书颁发机构">{info.caProvider}</Descriptions.Item>
        <Descriptions.Item label="证书序列号">
          <Space>
            <code className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-700">{info.certSerial}</code>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(info.certSerial, '证书序列号')}
            />
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="证书有效期">
          <span className="font-mono tabular-nums">{info.validFrom} ~ {info.validTo}</span>
        </Descriptions.Item>
        <Descriptions.Item label="公钥指纹">
          <code className="rounded bg-ink-100 px-2 py-0.5 text-xs text-ink-700 break-all">
            {info.publicKeyFingerprint}
          </code>
        </Descriptions.Item>
        <Descriptions.Item label="签名算法">{info.signAlgorithm}</Descriptions.Item>
      </Descriptions>

      <Collapse
        size="small"
        ghost
        items={[
          {
            key: 'signature',
            label: <span className="text-sm text-ink-500">数字签名值 ({info.digitalSignature.length}+ 字符)</span>,
            children: (
              <div className="rounded border border-ink-100 bg-ink-50 p-3">
                <code className="block break-all text-xs text-ink-600">{info.digitalSignature}</code>
              </div>
            ),
          },
        ]}
      />

      <div className="mt-4 rounded-lg border border-success-200 bg-success-50 p-3">
        <div className="flex items-center gap-2">
          <SafetyOutlined className="text-xl text-success-600" />
          <div>
            <div className="text-sm font-semibold text-success-700">证书链验证通过</div>
            <div className="text-[10px] text-success-600">
              根证书 → 中间证书 → 用户证书 · 完整信任链 · OCSP 在线状态正常
            </div>
          </div>
        </div>
      </div>

      {info.signTime && (
        <div className="mt-3 text-center text-xs text-ink-400">
          签署时间:{' '}
          <span className="font-mono tabular-nums text-ink-600">
            {dayjs(info.signTime).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        </div>
      )}
    </Card>
  );

  return (
    <Layout className="min-h-screen bg-transparent">
      <Content className="p-6">
        <div className="animate-fade-in-up space-y-6">
          {/* 顶部面包屑导航 */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
                返回列表
              </Button>
              <div>
                <h1 className="mb-0.5 font-serif text-xl font-bold text-brand-800">
                  {contract.contractNo}
                </h1>
                <p className="m-0 text-xs text-ink-500">{contract.title}</p>
              </div>
            </Space>
            <Space>
              <StatusBadge status={contract.status} type="contract" />
              <Button icon={<DownloadOutlined />} type="primary" onClick={handleDownloadPDF}>
                下载合同
              </Button>
            </Space>
          </div>

          {/* Tabs 主内容 */}
          <Card
            className="animate-fade-in-up shadow-card"
            bordered={false}
            bodyStyle={{ padding: 0 }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              items={[
                {
                  key: 'overview',
                  label: (
                    <Space>
                      <FileTextOutlined />
                      签约概览
                    </Space>
                  ),
                  children: (
                    <div className="p-6 space-y-6">
                      {/* 签约概览-顶部大卡片 */}
                      <Card
                        className="animate-fade-in-up"
                        bordered={false}
                        style={{
                          background:
                            'linear-gradient(135deg, #0F4C81 0%, #4787C7 60%, #75A5D5 100%)',
                        }}
                      >
                        <Row gutter={24}>
                          <Col xs={24} lg={8}>
                            <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5">
                              <div className="mb-2 text-xs text-white/70">合同编号</div>
                              <div className="mb-4 font-mono text-2xl font-bold text-white tabular-nums">
                                {contract.contractNo}
                              </div>
                              <div className="mb-2 text-xs text-white/70">合同状态</div>
                              <StatusBadge
                                status={contract.status}
                                type="contract"
                              />
                              <div className="mt-4 space-y-1 text-xs text-white/80">
                                <div>
                                  创建时间:{' '}
                                  {dayjs(contract.createTime).format('YYYY-MM-DD HH:mm')}
                                </div>
                                {contract.signTime && (
                                  <div>
                                    签署时间:{' '}
                                    {dayjs(contract.signTime).format('YYYY-MM-DD HH:mm')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Col>

                          <Col xs={12} lg={8}>
                            <div className="h-full rounded-xl bg-white/10 backdrop-blur-sm p-5">
                              <div className="mb-3 flex items-center gap-2">
                                <Avatar
                                  size={40}
                                  className="bg-brand-400 text-white"
                                  icon={<UserOutlined />}
                                />
                                <div>
                                  <div className="font-semibold text-white">{contract.tenantName}</div>
                                  <div className="text-xs text-white/70">承租方 (租客)</div>
                                </div>
                              </div>
                              <Descriptions column={1} size="small" className="[&_.ant-descriptions-item-label]:!text-white/70 [&_.ant-descriptions-item-content]:!text-white">
                                <Descriptions.Item label="手机号">
                                  {maskPhone(contract.tenantPhone)}
                                </Descriptions.Item>
                                <Descriptions.Item label="身份证">
                                  {maskIdCard(contract.tenantIdCard)}
                                </Descriptions.Item>
                                <Descriptions.Item label="信用分">
                                  <Tag color="gold" className="border-0">
                                    {contract.tenantCreditScore} 分
                                  </Tag>
                                </Descriptions.Item>
                              </Descriptions>
                            </div>
                          </Col>

                          <Col xs={12} lg={8}>
                            <div className="h-full rounded-xl bg-white/10 backdrop-blur-sm p-5">
                              <div className="mb-3 flex items-center gap-2">
                                <Avatar
                                  size={40}
                                  className="bg-warning-500 text-white"
                                  icon={<HomeOutlined />}
                                />
                                <div>
                                  <div className="font-semibold text-white">{contract.landlordName}</div>
                                  <div className="text-xs text-white/70">出租方 (房东)</div>
                                </div>
                              </div>
                              <Descriptions column={1} size="small" className="[&_.ant-descriptions-item-label]:!text-white/70 [&_.ant-descriptions-item-content]:!text-white">
                                <Descriptions.Item label="手机号">
                                  {maskPhone(contract.landlordPhone)}
                                </Descriptions.Item>
                                <Descriptions.Item label="履约保障">
                                  <Tag color="cyan" className="border-0">
                                    {contract.guaranteePlan === 'premium'
                                      ? '尊享版'
                                      : contract.guaranteePlan === 'standard'
                                      ? '标准版'
                                      : '基础版'}
                                  </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="保障费用">
                                  {formatMoney(contract.guaranteeFee)}
                                </Descriptions.Item>
                              </Descriptions>
                            </div>
                          </Col>
                        </Row>

                        <Divider className="!border-white/20" />

                        <div className="rounded-xl bg-white/10 backdrop-blur-sm p-5">
                          <div className="mb-3 flex items-center gap-2 text-white">
                            <HomeOutlined />
                            <span className="font-semibold">租赁标的</span>
                          </div>
                          <Row gutter={16}>
                            <Col xs={24} md={14}>
                              <div className="font-medium text-white">{contract.propertyTitle}</div>
                              <div className="mt-1 text-xs text-white/80">{contract.propertyAddress}</div>
                            </Col>
                            <Col xs={24} md={10}>
                              <div className="grid grid-cols-2 gap-3 text-xs text-white/90">
                                <div>
                                  <span className="text-white/60">押金: </span>
                                  <span className="font-mono tabular-nums">
                                    {formatMoney(contract.depositAmount, { decimals: 0 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-white/60">月租金: </span>
                                  <span className="font-mono font-semibold tabular-nums">
                                    {formatMoney(contract.monthlyRent, { decimals: 0 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-white/60">租期: </span>
                                  <span>{contract.leaseMonths}个月</span>
                                </div>
                                <div>
                                  <span className="text-white/60">付款: </span>
                                  <span>{contract.paymentCycle}</span>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Card>

                      {/* 签约时间轴 + 摘要信息 */}
                      <Row gutter={24}>
                        <Col xs={24} lg={14}>
                          <Card
                            className="animate-fade-in-up shadow-card h-full"
                            bordered={false}
                            title={
                              <Space>
                                <FileSearchOutlined className="text-brand-500" />
                                <span className="font-semibold">签约时间轴</span>
                              </Space>
                            }
                          >
                            <Timeline items={signTimeline} />
                          </Card>
                        </Col>

                        <Col xs={24} lg={10}>
                          <Card
                            className="animate-fade-in-up shadow-card"
                            bordered={false}
                            title={
                              <Space>
                                <FileProtectOutlined className="text-brand-500" />
                                <span className="font-semibold">合同摘要</span>
                              </Space>
                            }
                          >
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="租约期限">
                                <div className="font-mono tabular-nums">
                                  {dayjs(contract.startDate).format('YYYY-MM-DD')} ~{' '}
                                  {dayjs(contract.endDate).format('YYYY-MM-DD')}
                                </div>
                                <div className="mt-1">
                                  <ProgressRing
                                    progress={Math.min(
                                      100,
                                      Math.round(
                                        (dayjs().diff(dayjs(contract.startDate), 'day') /
                                          dayjs(contract.endDate).diff(dayjs(contract.startDate), 'day')) *
                                          100
                                      )
                                    )}
                                    size={60}
                                    strokeWidth={5}
                                    color="#0F4C81"
                                  />
                                </div>
                              </Descriptions.Item>
                              <Descriptions.Item label="月租金">
                                <span className="font-mono text-lg font-bold text-ink-800 tabular-nums">
                                  {formatMoney(contract.monthlyRent)}
                                </span>
                              </Descriptions.Item>
                              <Descriptions.Item label="押金 (原价)">
                                <span className="line-through text-ink-400">
                                  {formatMoney(contract.depositAmount)}
                                </span>
                              </Descriptions.Item>
                              <Descriptions.Item label="押金 (减免后)">
                                <span className="font-mono font-semibold text-success-600 tabular-nums">
                                  {formatMoney(contract.actualDepositAmount)}
                                </span>
                                {contract.depositReductionRatio > 0 && (
                                  <Tag color="gold" className="ml-2 border-0 text-xs">
                                    免押 {Math.round(contract.depositReductionRatio * 100)}%
                                  </Tag>
                                )}
                              </Descriptions.Item>
                              <Descriptions.Item label="服务费">
                                {formatMoney(Math.round(contract.monthlyRent * 0.06 * contract.leaseMonths))}
                              </Descriptions.Item>
                              <Descriptions.Item label="支付方式">
                                {contract.paymentCycle} · {contract.paymentType || '微信/支付宝'}
                              </Descriptions.Item>
                            </Descriptions>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  ),
                },
                {
                  key: 'contract',
                  label: (
                    <Space>
                      <FileProtectOutlined />
                      合同文本
                    </Space>
                  ),
                  children: (
                    <div className="p-6 space-y-6">
                      {/* 合同文本阅读区 */}
                      <Card
                        className="animate-fade-in-up relative shadow-card"
                        bordered={false}
                        title={
                          <Space>
                            <FileTextOutlined className="text-brand-500" />
                            <span className="font-semibold">上海市住房租赁合同（住建委标准版）</span>
                          </Space>
                        }
                      >
                        {/* 水印角标 */}
                        <div className="pointer-events-none absolute right-6 top-6 z-10">
                          <div className="rotate-12 rounded-lg border-2 border-dashed border-success-300 bg-success-50/80 px-4 py-2">
                            <div className="flex items-center gap-1.5 text-success-600">
                              <CheckCircleOutlined />
                              <span className="text-xs font-bold">已注入备案条款</span>
                            </div>
                            <div className="mt-0.5 text-center text-[10px] text-success-500">
                              沪住建备 v3.2
                            </div>
                          </div>
                        </div>

                        <div
                          className="max-h-[60vh] overflow-y-auto rounded-lg border border-ink-100 bg-white p-8"
                          style={{
                            fontFamily: "'Noto Serif SC', 'STSong', 'SimSun', serif",
                            lineHeight: 1.8,
                            fontSize: '15px',
                            color: '#1a1a2e',
                          }}
                        >
                          <h2 className="mb-6 text-center text-2xl font-bold text-ink-900">
                            上海市住房租赁合同
                          </h2>
                          <p className="mb-4 text-center text-sm text-ink-500">
                            合同编号：{contract.contractNo}　　　
                            备案号：{contract.caSignInfo?.evidenceNo || '待备案'}
                          </p>

                          <p className="mb-6">
                            依据《中华人民共和国民法典》《上海市住房租赁条例》《上海市居住房屋租赁管理办法》等法律法规的规定，甲、乙双方在平等、自愿、公平和诚实信用的基础上，经协商一致，就房屋租赁事宜订立本合同。
                          </p>

                          <h3 className="mb-3 mt-6 text-lg font-bold text-ink-800">
                            第一条 房屋基本情况
                          </h3>
                          <p className="mb-4 indent-8">
                            1.1 甲方（出租方）将坐落于本市 <b>{contract.propertyAddress}</b> 的房屋（以下简称"该房屋"）出租给乙方（承租方）使用。该房屋建筑面积以权证记载为准。
                          </p>
                          <p className="mb-4 indent-8">
                            1.2 房屋用途：居住；租赁面积：住宅用房。甲方保证已依法取得该房屋的出租权利，并已履行必要的备案义务。
                          </p>

                          <h3 className="mb-3 mt-6 text-lg font-bold text-ink-800">
                            第二条 租赁期限
                          </h3>
                          <p className="mb-4 indent-8">
                            2.1 租赁期限自 <b>{dayjs(contract.startDate).format('YYYY年MM月DD日')}</b> 起至 <b>{dayjs(contract.endDate).format('YYYY年MM月DD日')}</b> 止，共计 {contract.leaseMonths} 个月。
                          </p>
                          <p className="mb-4 indent-8">
                            2.2 租赁期满，甲方有权收回该房屋，乙方应如期返还。乙方需继续承租的，应于租赁期满前30日向甲方提出书面续租请求，经甲方同意后重新签订租赁合同。
                          </p>

                          <h3 className="mb-3 mt-6 text-lg font-bold text-ink-800">
                            第三条 租金及支付方式
                          </h3>
                          <p className="mb-4 indent-8">
                            3.1 该房屋月租金为人民币 <b>{formatMoney(contract.monthlyRent, { decimals: 0 })}</b>（大写：{contract.monthlyRent.toLocaleString('zh-CN')}元整）。租赁期内租金保持不变。
                          </p>
                          <p className="mb-4 indent-8">
                            3.2 租金支付方式：<b>{contract.paymentCycle}</b>。乙方应于每期到期前5日将租金支付至双方约定的资金托管账户。
                          </p>
                          <p className="mb-4 indent-8">
                            3.3 押金：乙方应于签约时支付押金人民币 <b>{formatMoney(contract.actualDepositAmount, { decimals: 0 })}</b>。基于乙方信用分 {contract.tenantCreditScore} 分，享受押金减免 {Math.round(contract.depositReductionRatio * 100)}%。
                          </p>

                          <h3 className="mb-3 mt-6 text-lg font-bold text-ink-800">
                            第四条 其他约定（信用免押特别条款）
                          </h3>
                          <p className="mb-4 indent-8">
                            4.1 因乙方信用状况良好，甲方同意给予押金减免。但乙方若发生累计逾期支付超过15日、擅自改变房屋用途、造成房屋结构性损坏等违约行为，甲方有权要求乙方补足押金并追究违约责任。
                          </p>
                          <p className="mb-4 indent-8">
                            4.2 本合同未尽事宜，双方可签订补充条款。补充条款及附件均为本合同不可分割的一部分，与本合同具有同等法律效力。
                          </p>
                          <p className="mb-4 indent-8">
                            4.3 本合同采用电子签名方式订立，与纸质合同具有同等法律效力。双方确认电子签约流程符合《电子签名法》相关规定。
                          </p>

                          <div className="mt-12 border-t-2 border-dashed border-ink-200 pt-6">
                            <p className="mb-2 text-center text-sm font-medium text-ink-500">
                              —— 以下为签署区 ——
                            </p>
                            <Row gutter={48} className="mt-8">
                              <Col xs={24} sm={12} className="mb-8 sm:mb-0">
                                <div className="border-b border-ink-200 pb-3 text-center font-semibold">
                                  出租方（甲方）签字
                                </div>
                                <div className="mt-4 h-24 flex items-center justify-center">
                                  {contract.caSignInfo?.landlordSignStatus === 'signed' ? (
                                    <div className="text-center">
                                      <div className="mb-1 font-serif text-3xl italic text-brand-700">
                                        {contract.landlordName}
                                      </div>
                                      <div className="text-[10px] text-ink-400">
                                        CA 数字签名 · 已验证
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-ink-400">[ 等待签署 ]</span>
                                  )}
                                </div>
                              </Col>
                              <Col xs={24} sm={12}>
                                <div className="border-b border-ink-200 pb-3 text-center font-semibold">
                                  承租方（乙方）签字
                                </div>
                                <div className="mt-4 h-24 flex items-center justify-center">
                                  {contract.caSignInfo?.tenantSignStatus === 'signed' ? (
                                    <div className="text-center">
                                      <div className="mb-1 font-serif text-3xl italic text-warning-700">
                                        {contract.tenantName}
                                      </div>
                                      <div className="text-[10px] text-ink-400">
                                        CA 数字签名 · 已验证
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-ink-400">[ 等待签署 ]</span>
                                  )}
                                </div>
                              </Col>
                            </Row>

                            <Divider />

                            <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
                              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-700">
                                <SafetyCertificateOutlined />
                                可信时间戳存证
                              </div>
                              <div className="space-y-1 text-xs text-ink-500">
                                <div>
                                  <span className="inline-block w-20 text-ink-400">签发机构：</span>
                                  国家授时中心联合信任时间戳服务中心 (TSA)
                                </div>
                                <div>
                                  <span className="inline-block w-20 text-ink-400">存证编号：</span>
                                  <code className="font-mono text-brand-700 tabular-nums">
                                    {contract.caSignInfo?.evidenceNo || 'TSA-' + contract.id.slice(0, 12).toUpperCase()}
                                  </code>
                                </div>
                                <div>
                                  <span className="inline-block w-20 text-ink-400">哈希值：</span>
                                  <code className="font-mono break-all text-xs text-ink-600 tabular-nums">
                                    SHA256: {contract.caSignInfo?.contractHash || contract.id + contract.contractNo}
                                  </code>
                                </div>
                              </div>
                              <div className="mt-3 flex items-center gap-2 text-[11px] text-success-600">
                                <LinkOutlined />
                                该合同已上链存证，可通过区块链浏览器验证完整交易记录
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'ca',
                  label: (
                    <Space>
                      <SafetyCertificateOutlined />
                      电子签约 CA 认证
                    </Space>
                  ),
                  children: (
                    <div className="p-6 space-y-6">
                      <Row gutter={24}>
                        <Col xs={24} lg={12}>
                          <CAInfoCard info={tenantCA} role="tenant" />
                        </Col>
                        <Col xs={24} lg={12}>
                          <CAInfoCard info={landlordCA} role="landlord" />
                        </Col>
                      </Row>

                      <div className="animate-fade-in-up text-center">
                        <Button
                          type="primary"
                          size="large"
                          icon={<DownloadOutlined />}
                          onClick={handleDownloadPDF}
                        >
                          下载已签署 PDF（含 CA 证书链）
                        </Button>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'settlement',
                  label: (
                    <Space>
                      <BankOutlined />
                      租金托管与分账
                    </Space>
                  ),
                  children: (
                    <div className="p-6 space-y-6">
                      {/* 托管账户信息 */}
                      <Row gutter={16}>
                        <Col xs={24} sm={12} lg={6}>
                          <DataCard
                            title="托管账户号"
                            value="**** **** **** 8891"
                            prefix={<BankOutlined />}
                            accentColor="#0F4C81"
                          />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <DataCard
                            title="当前余额"
                            value={formatMoney(contract.monthlyRent * 0.94 * 0.5, { decimals: 0, symbol: '' })}
                            unit="元"
                            prefix={<FileTextOutlined />}
                            accentColor="#00A86B"
                          />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <DataCard
                            title="累计入账"
                            value={formatMoney(contract.monthlyRent * 1, { decimals: 0, symbol: '' })}
                            unit="元"
                            prefix={<CheckCircleOutlined />}
                            accentColor="#4787C7"
                          />
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <DataCard
                            title="累计划转"
                            value={formatMoney(contract.monthlyRent * 0.94 * 1, { decimals: 0, symbol: '' })}
                            unit="元"
                            prefix={<ReloadOutlined />}
                            accentColor="#F7931E"
                          />
                        </Col>
                      </Row>

                      {/* 分账计划表 */}
                      <Card
                        className="animate-fade-in-up shadow-card"
                        bordered={false}
                        title={
                          <Space>
                            <FileTextOutlined className="text-brand-500" />
                            <span className="font-semibold">分账计划表</span>
                          </Space>
                        }
                      >
                        <Table<SettlementPlanItem>
                          rowKey="id"
                          size="middle"
                          columns={settlementColumns}
                          dataSource={contract.settlementPlan}
                          pagination={false}
                          scroll={{ x: 900 }}
                        />
                      </Card>

                      {/* 分账流水时间轴 */}
                      <Card
                        className="animate-fade-in-up shadow-card"
                        bordered={false}
                        title={
                          <Space>
                            <ClockCircleOutlined className="text-brand-500" />
                            <span className="font-semibold">分账流水时间轴</span>
                          </Space>
                        }
                      >
                        <Timeline items={transferTimeline} />
                      </Card>
                    </div>
                  ),
                },
                {
                  key: 'attachment',
                  label: (
                    <Space>
                      <PaperClipOutlined />
                      补充与附件
                    </Space>
                  ),
                  children: (
                    <div className="p-6 space-y-6">
                      {/* 附件列表 */}
                      <Card
                        className="animate-fade-in-up shadow-card"
                        bordered={false}
                        title={
                          <Space>
                            <PaperClipOutlined className="text-brand-500" />
                            <span className="font-semibold">附件列表</span>
                            <Tag color="blue">{attachments.length}</Tag>
                          </Space>
                        }
                      >
                        <List
                          itemLayout="horizontal"
                          dataSource={attachments}
                          renderItem={(item) => (
                            <List.Item
                              actions={[
                                <Button type="link" size="small" icon={<EyeOutlined />} key="view">
                                  预览
                                </Button>,
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<DownloadOutlined />}
                                  key="download"
                                >
                                  下载
                                </Button>,
                              ]}
                            >
                              <List.Item.Meta
                                avatar={
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-50 text-xl">
                                    {item.icon}
                                  </div>
                                }
                                title={
                                  <Space>
                                    <a className="font-medium text-ink-700">{item.name}</a>
                                    <Tag color="cyan" className="border-0 text-[10px]">
                                      {item.type}
                                    </Tag>
                                  </Space>
                                }
                                description={
                                  <span className="text-xs text-ink-400">
                                    {item.size} · 上传于 {item.uploadTime}
                                  </span>
                                }
                              />
                            </List.Item>
                          )}
                        />
                      </Card>

                      {/* 操作按钮组 */}
                      <Card
                        className="animate-fade-in-up shadow-card"
                        bordered={false}
                        title={
                          <Space>
                            <EditOutlined className="text-brand-500" />
                            <span className="font-semibold">合同生命周期操作</span>
                          </Space>
                        }
                      >
                        <Space wrap>
                          <Button type="primary" size="large" icon={<EditOutlined />}>
                            申请续租
                          </Button>
                          <Button
                            size="large"
                            danger
                            icon={<StopOutlined />}
                            onClick={() => message.warning('解约流程将产生违约金，请确认后提交')}
                          >
                            申请解约
                          </Button>
                          <Button size="large" icon={<FileProtectOutlined />}>
                            补充协议
                          </Button>
                          <Button size="large" icon={<PaperClipOutlined />}>
                            上传附件
                          </Button>
                        </Space>
                      </Card>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
