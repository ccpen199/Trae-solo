import { useParams, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Timeline,
  Card,
  Space,
  Tabs,
  Divider,
  message,
  Progress,
  Modal,
  Alert,
  Input,
} from 'antd';
import type { TabsProps } from 'antd';
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  FileCheck,
  Download,
  Eye,
  LinkIcon,
} from 'lucide-react';
import { useGlobalStore } from '@/store/useGlobalStore';
import { mockPolicies } from '@/mock';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import type { InsurancePolicy, PolicyStatus } from '@/types';

const { TextArea } = Input;

export default function InsuranceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPolicyById, getOrderById } = useGlobalStore();
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const policy = useMemo<InsurancePolicy | undefined>(() => {
    if (!id) return undefined;
    return getPolicyById(id) || mockPolicies.find((p) => p.id === id);
  }, [id, getPolicyById]);

  const order = useMemo(() => {
    if (!policy?.orderId) return undefined;
    return getOrderById(policy.orderId);
  }, [policy, getOrderById]);

  const coverageItems = useMemo(() => {
    return [
      '基础护理服务保障',
      '专业医疗护理保障',
      '意外伤害医疗保障',
      '紧急救援服务',
      '第三方责任保障',
    ];
  }, []);

  const insuranceTimelineItems = useMemo(() => {
    if (!policy) return [];
    const baseTime = dayjs(policy.createdAt);
    return [
      {
        title: '① 服务创建',
        time: baseTime.format('YYYY-MM-DD HH:mm'),
        status: 'completed' as const,
      },
      {
        title: '② 风险评估',
        time: baseTime.add(15, 'minute').format('YYYY-MM-DD HH:mm'),
        status: 'completed' as const,
      },
      {
        title: '③ 自动投保',
        time: baseTime.add(20, 'minute').format('YYYY-MM-DD HH:mm'),
        status: 'completed' as const,
      },
      {
        title: '④ 保单生效',
        time: dayjs(policy.period.start).format('YYYY-MM-DD HH:mm'),
        status: (policy.status === 'active' || policy.status === 'expired' || policy.status === 'claimed')
          ? ('completed' as const)
          : ('current' as const),
      },
    ];
  }, [policy]);

  const claimTimelineItems = useMemo(() => {
    if (!policy || policy.status !== 'claimed') return [];
    const baseTime = dayjs(policy.period.end).subtract(10, 'day');
    return [
      { title: '报案', time: baseTime.format('YYYY-MM-DD HH:mm'), status: 'completed' as const },
      { title: '受理', time: baseTime.add(1, 'day').format('YYYY-MM-DD HH:mm'), status: 'completed' as const },
      { title: '审核', time: baseTime.add(3, 'day').format('YYYY-MM-DD HH:mm'), status: 'completed' as const },
      { title: '赔付', time: baseTime.add(7, 'day').format('YYYY-MM-DD HH:mm'), status: (policy.claimStatus === 'approved' ? ('completed' as const) : ('current' as const)) },
    ];
  }, [policy]);

  const handleClaim = () => {
    setClaimModalOpen(true);
  };

  const handleClaimSubmit = () => {
    message.success('理赔申请已提交，请等待审核');
    setClaimModalOpen(false);
  };

  const handleDownloadPolicy = () => {
    message.success('保单下载中...');
  };

  if (!policy) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Alert
          icon={<AlertCircle className="h-5 w-5" />}
          message="保单不存在"
          description="未找到对应的保单信息，请检查链接是否正确"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  const tabItems: TabsProps['items'] = [
    {
      key: 'process',
      label: '投保流程',
      children: (
        <Card className="shadow-sm">
          <div className="py-4">
            <Timeline
              mode="left"
              items={insuranceTimelineItems.map((item) => ({
                color: item.status === 'completed' ? 'green' : 'blue',
                dot:
                  item.status === 'completed' ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-blue-500" />
                  ),
                children: (
                  <div>
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-500 mt-1">{item.time}</div>
                  </div>
                ),
              }))}
            />
          </div>
        </Card>
      ),
    },
    {
      key: 'claim',
      label: '理赔状态',
      children: (
        <Card className="shadow-sm">
          {policy.status === 'claimed' ? (
            <div className="py-4">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">理赔进度</span>
                  <span className="text-sm text-slate-500">
                    {policy.claimStatus === 'approved' ? '已赔付' : '处理中'}
                  </span>
                </div>
                <Progress
                  percent={policy.claimStatus === 'approved' ? 100 : 75}
                  status={policy.claimStatus === 'rejected' ? 'exception' : undefined}
                  strokeColor={policy.claimStatus === 'approved' ? '#10B981' : '#3B82F6'}
                />
              </div>
              <Divider className="my-2" />
              <Timeline
                mode="left"
                items={claimTimelineItems.map((item) => ({
                  color: item.status === 'completed' ? 'green' : 'blue',
                  dot:
                    item.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500 animate-pulse" />
                    ),
                  children: (
                    <div>
                      <div className="font-medium text-slate-900">{item.title}</div>
                      {item.time && <div className="text-sm text-slate-500 mt-1">{item.time}</div>}
                    </div>
                  ),
                }))}
              />
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center">
              <FileText className="h-12 w-12 text-slate-300 mb-3" />
              <div className="text-slate-500">暂无理赔记录</div>
            </div>
          )}
          {policy.status === 'active' && (
            <div className="pt-4 border-t border-slate-100 flex justify-center">
              <Button
                type="primary"
                size="large"
                icon={<FileCheck className="h-4 w-4" />}
                onClick={handleClaim}
              >
                申请理赔
              </Button>
            </div>
          )}
        </Card>
      ),
    },
    {
      key: 'materials',
      label: '相关材料',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">关联订单</div>
                <div className="text-sm text-slate-500 truncate font-mono">{policy.orderNo}</div>
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => navigate(`/orders/${policy.orderId}`)}
              block
            >
              查看
            </Button>
          </Card>

          <Card className="shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">服务记录</div>
                <div className="text-sm text-slate-500">
                  {order ? '已完成服务记录' : '查看服务详情'}
                </div>
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => navigate(`/service/${policy.orderId}/record`)}
              block
            >
              查看
            </Button>
          </Card>

          <Card className="shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Download className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900">电子发票</div>
                <div className="text-sm text-slate-500">保费电子凭证</div>
              </div>
            </div>
            <Button
              type="primary"
              size="small"
              icon={<Eye className="h-3.5 w-3.5" />}
              onClick={() => message.success('电子发票下载中...')}
              block
            >
              查看
            </Button>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        showBack={true}
        title="保单详情"
        description={policy.policyNo}
        icon={<Shield className="h-6 w-6" />}
        actions={[
          {
            key: 'download',
            label: '下载保单',
            icon: <Download className="h-4 w-4" />,
            onClick: handleDownloadPolicy,
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-medical-600" />
              <span className="font-semibold">承保信息</span>
            </div>
          }
          className="shadow-sm"
        >
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="保单号">
              <span className="font-mono font-medium text-slate-900">{policy.policyNo}</span>
            </Descriptions.Item>
            <Descriptions.Item label="被保险人">
              <span className="font-medium text-slate-900">{policy.insuredName}</span>
            </Descriptions.Item>
            <Descriptions.Item label="身份证号">
              <span className="font-mono font-medium text-slate-900">{policy.insuredIdCard || '110101********1234'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              <span className="font-mono font-medium text-slate-900">{order?.patientInfo.phone || '138****8000'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="保险公司">
              <span className="font-medium text-slate-900">{policy.insurerName}</span>
            </Descriptions.Item>
            <Descriptions.Item label="险种">
              <span className="font-medium text-slate-900">{policy.productName}</span>
            </Descriptions.Item>
            <Descriptions.Item label="保费(¥)">
              <span className="font-medium text-slate-900">¥{policy.premium.toFixed(2)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="保额(¥)">
              <span className="font-medium text-emerald-600">¥{policy.coverage.toLocaleString()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <StatusBadge type="policy" status={policy.status as PolicyStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="保障期限">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-8">起：</span>
                  <span className="font-medium text-slate-700">{policy.period.start}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-8">止：</span>
                  <span className="font-medium text-slate-700">{policy.period.end}</span>
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="投保时间">
              <span className="font-medium text-slate-900">
                {dayjs(policy.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="关联订单号">
              <button
                onClick={() => navigate(`/orders/${policy.orderId}`)}
                className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                <LinkIcon className="h-3 w-3" />
                {policy.orderNo}
              </button>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-medical-600" />
              <span className="font-semibold">保障范围</span>
            </div>
          }
          className="shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <div className="text-xs text-slate-400 mb-2">保障项目</div>
              <Space size={[8, 8]} wrap>
                {coverageItems.map((item, index) => (
                  <Tag
                    key={index}
                    color="blue"
                    className={cn(
                      'm-0 px-3 py-1',
                      'bg-blue-50 text-blue-700 border-blue-200'
                    )}
                  >
                    {item}
                  </Tag>
                ))}
              </Space>
            </div>

            <Divider className="my-2" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-slate-400">免赔额</div>
                <div className="font-medium text-slate-900">¥200.00</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400">最高赔付</div>
                <div className="font-medium text-emerald-600">
                  ¥{policy.coverage.toLocaleString()}
                </div>
              </div>
            </div>

            <Divider className="my-2" />

            <div>
              <div className="text-xs text-slate-400 mb-2">特别约定</div>
              <TextArea
                disabled
                value={`1. 本保单仅承保经平台认证护士在服务过程中因过失导致的意外伤害及医疗事故；
2. 服务过程需开启全程录像，无有效录像记录的理赔申请不予受理；
3. 保障范围以本保单约定的服务项目为限，超出服务范围的操作不在保障范围内。`}
                autoSize={{ minRows: 5, maxRows: 5 }}
                className="bg-slate-50"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm" styles={{ body: { padding: 0 } }}>
        <Tabs
          defaultActiveKey="process"
          items={tabItems}
          className="px-2 pt-2"
        />
      </Card>

      <Modal
        title="申请理赔"
        open={claimModalOpen}
        onOk={handleClaimSubmit}
        onCancel={() => setClaimModalOpen(false)}
        okText="提交申请"
        cancelText="取消"
      >
        <div className="space-y-4">
          <Alert
            message="理赔须知"
            description="请确保服务过程有完整的录像记录，否则理赔申请可能被驳回。"
            type="info"
            showIcon
          />
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">理赔说明</div>
            <TextArea
              placeholder="请详细描述理赔原因和情况..."
              autoSize={{ minRows: 4, maxRows: 6 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
