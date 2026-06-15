import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Steps,
  Upload,
  Progress,
  Modal,
  List,
  Typography,
  Badge,
  Tooltip,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  UserAddOutlined,
  BookOutlined,
  BankOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { Gift, Users, BookOpen, HeartHandshake } from 'lucide-react';
import StatsCard from '@/components/common/StatsCard';
import { mockData } from '@/mock/data';
import type { SubsidyApplication } from '../../../shared/types';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const INDUSTRIAL_BLUE = '#165DFF';
const VITAL_ORANGE = '#FF7D00';
const SUCCESS_GREEN = '#00B42A';

const SUBSIDY_TYPES = [
  {
    key: 'ENTERPRISE_HIRE',
    name: '企业吸纳就业补贴',
    icon: <Users size={28} />,
    iconBg: 'bg-industrial-blue-100',
    iconColor: 'text-industrial-blue-600',
    amountRange: '¥3,000 - ¥15,000/人',
    description: '企业招用登记失业人员、高校毕业生等重点群体，可享受一次性吸纳就业补贴',
    conditions: [
      '招用登记失业半年以上人员',
      '签订1年以上劳动合同',
      '连续缴纳社保满6个月',
      '申请时仍在岗',
    ],
  },
  {
    key: 'GRADUATE_EMPLOY',
    name: '高校毕业生就业补贴',
    icon: <BookOpen size={28} />,
    iconBg: 'bg-vital-orange-100',
    iconColor: 'text-vital-orange-600',
    amountRange: '¥2,000 - ¥8,000/人',
    description: '企业招用毕业2年内高校毕业生，可享受高校毕业生就业补贴',
    conditions: [
      '招用毕业2年内高校毕业生',
      '签订1年以上劳动合同',
      '连续缴纳社保满3个月',
      '岗位专业对口优先',
    ],
  },
  {
    key: 'SKILL_UPGRADE',
    name: '技能提升补贴',
    icon: <Gift size={28} />,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    amountRange: '¥1,000 - ¥6,000/人',
    description: '企业组织职工参加职业技能培训并取得证书，可享受技能提升补贴',
    conditions: [
      '职工在本企业连续缴纳社保满12个月',
      '取得中级及以上职业资格证书',
      '培训工种与岗位匹配',
      '证书核发之日起12个月内申请',
    ],
  },
  {
    key: 'SOCIAL_INSURANCE',
    name: '社保补贴',
    icon: <HeartHandshake size={28} />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    amountRange: '按实际缴纳50%补贴',
    description: '小微企业、就业困难人员创办企业招用重点群体，可享受社保补贴',
    conditions: [
      '招用就业困难人员、零就业家庭成员',
      '小微企业招用毕业年度高校毕业生',
      '签订1年以上劳动合同',
      '按规定缴纳社保',
    ],
  },
];

const STATUS_COLOR: Record<string, string> = {
  草稿: 'default',
  已提交: 'processing',
  审核中: 'processing',
  已通过: 'success',
  已驳回: 'error',
  已发放: 'success',
};

export default function Subsidy() {
  const { subsidyApplications, enterprises } = mockData;
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const myApplications = useMemo(() => {
    return subsidyApplications.slice(0, 8).map((app, i) => {
      const stepCount = 4;
      let currentStep = 0;
      if (app.status === '已提交') currentStep = 1;
      else if (app.status === '审核中') currentStep = 2;
      else if (app.status === '已通过') currentStep = 3;
      else if (app.status === '已发放') currentStep = 4;
      else if (app.status === '已驳回') currentStep = -1;

      return {
        key: app.id,
        id: app.id,
        type: app.type,
        applicantName: app.applicantName || enterprises[i % enterprises.length]?.name,
        amount: app.amount,
        status: app.status,
        currentStep,
        progressPercent: currentStep >= 0 ? Math.round((currentStep / stepCount) * 100) : 0,
        appliedAt: new Date(app.appliedAt).toLocaleDateString('zh-CN'),
      };
    });
  }, [subsidyApplications, enterprises]);

  const applicationColumns = [
    {
      title: '申请类型',
      dataIndex: 'type',
      key: 'type',
      render: (text: string) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },
    {
      title: '申请金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (val: number) => (
        <span className="font-mono-num font-medium" style={{ color: VITAL_ORANGE }}>
          ¥{val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '审核进度',
      dataIndex: 'progressPercent',
      key: 'progressPercent',
      render: (_: any, record: any) => (
        <div className="w-[180px]">
          <Progress
            percent={record.progressPercent}
            size="small"
            status={record.currentStep === -1 ? 'exception' : undefined}
            strokeColor={record.currentStep === -1 ? '#F53F3F' : record.progressPercent === 100 ? SUCCESS_GREEN : INDUSTRIAL_BLUE}
          />
          <div className="text-xs text-gray-500 mt-1">
            {record.currentStep === -1 ? '已驳回' : record.status === '已发放' ? '补贴已发放' : '审核中...'}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] || 'default'} className="!text-xs">
          {status}
        </Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (t: string) => <span className="text-sm text-gray-600">{t}</span>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<FileTextOutlined />}>
            详情
          </Button>
          {record.status === '草稿' && (
            <Button type="link" size="small">编辑</Button>
          )}
        </Space>
      ),
    },
  ];

  const handleApply = (typeKey: string) => {
    setSelectedType(typeKey);
    setApplyModalVisible(true);
  };

  const applySteps = [
    { title: '选择补贴类型', description: '确认符合申领条件' },
    { title: '填写申请信息', description: '完善企业及人员信息' },
    { title: '上传证明材料', description: '提交相关证件文件' },
    { title: '提交审核', description: '等待官方审核' },
    { title: '资金发放', description: '补贴到账' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="累计申请补贴"
          value={subsidyApplications.length}
          icon={<FileProtectOutlined />}
          theme="blue"
          suffix=" 笔"
        />
        <StatsCard
          title="审核通过"
          value={subsidyApplications.filter((s) => s.status === '已通过' || s.status === '已发放').length}
          icon={<CheckCircleOutlined />}
          theme="green"
          suffix=" 笔"
          trend={12.3}
        />
        <StatsCard
          title="累计获得金额"
          value={subsidyApplications.filter((s) => s.status === '已发放').reduce((sum, s) => sum + s.amount, 0)}
          icon={<BankOutlined />}
          theme="orange"
          prefix="¥"
        />
        <StatsCard
          title="待审核"
          value={subsidyApplications.filter((s) => s.status === '审核中' || s.status === '已提交').length}
          icon={<ClockCircleOutlined />}
          theme="purple"
          suffix=" 笔"
        />
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Gift size={18} style={{ color: INDUSTRIAL_BLUE }} />
            <span>补贴类型</span>
          </div>
        }
        className="!rounded-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUBSIDY_TYPES.map((type) => (
            <Card
              key={type.key}
              hoverable
              className="!rounded-xl !border !border-gray-100 hover:!shadow-lg transition-all"
              styles={{ body: { padding: 20 } }}
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${type.iconBg}`}>
                  <span className={type.iconColor}>{type.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 mb-1">{type.name}</div>
                  <div className="text-sm font-medium mb-2" style={{ color: VITAL_ORANGE }}>
                    {type.amountRange}
                  </div>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    className="text-xs text-gray-500 !mb-0"
                  >
                    {type.description}
                  </Paragraph>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Tooltip title={type.conditions.join('\n')}>
                    <span className="text-xs text-gray-400 flex items-center gap-1 cursor-help">
                      <SafetyCertificateOutlined />
                      申领条件
                    </span>
                  </Tooltip>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    style={{ backgroundColor: INDUSTRIAL_BLUE }}
                    onClick={() => handleApply(type.key)}
                  >
                    立即申请
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card
          className="lg:col-span-2 !rounded-xl"
          styles={{ body: { padding: 0 } }}
          title={
            <div className="flex items-center gap-2 px-5 pt-4">
              <FileTextOutlined style={{ color: INDUSTRIAL_BLUE, fontSize: 18 }} />
              <span>我的申请</span>
            </div>
          }
          extra={
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              className="!mr-5 !mt-4"
              style={{ backgroundColor: INDUSTRIAL_BLUE }}
            >
              新建申请
            </Button>
          }
        >
          <Table
            columns={applicationColumns}
            dataSource={myApplications}
            pagination={{ pageSize: 5, showTotal: (t) => `共 ${t} 条申请` }}
          />
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <ClockCircleOutlined style={{ color: VITAL_ORANGE, fontSize: 18 }} />
              <span>申领流程</span>
            </div>
          }
          className="!rounded-xl"
        >
          <Steps
            direction="vertical"
            size="small"
            current={2}
            items={applySteps.map((s, i) => ({
              title: <span className="text-sm font-medium">{s.title}</span>,
              description: <span className="text-xs text-gray-400">{s.description}</span>,
              status: i <= 2 ? 'finish' : i === 3 ? 'process' : 'wait',
            }))}
          />

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <InboxOutlined style={{ color: INDUSTRIAL_BLUE }} />
              材料上传区
            </div>
            <Upload.Dragger
              fileList={fileList}
              onChange={({ fileList: newList }) => setFileList(newList)}
              multiple
              beforeUpload={() => false}
              className="!bg-gray-50 hover:!bg-industrial-blue-50/50 !border-dashed !border-gray-200"
            >
              <p className="ant-upload-drag-icon text-industrial-blue-500">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text text-sm">点击或拖拽文件到此处上传</p>
              <p className="ant-upload-hint text-xs text-gray-400">
                支持 PDF、JPG、PNG 格式，单个文件不超过 10MB
              </p>
            </Upload.Dragger>
          </div>
        </Card>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <Gift size={18} style={{ color: INDUSTRIAL_BLUE }} />
            <span>{SUBSIDY_TYPES.find((t) => t.key === selectedType)?.name || '申请补贴'}</span>
          </div>
        }
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        onOk={() => setApplyModalVisible(false)}
        width={680}
        okText="提交申请"
        cancelText="取消"
      >
        <div className="mb-6">
          <Steps
            size="small"
            current={1}
            items={[
              { title: '确认条件' },
              { title: '填写信息' },
              { title: '上传材料' },
              { title: '提交审核' },
            ]}
          />
        </div>

        {selectedType && (
          <Descriptions column={1} size="small" bordered className="mb-4">
            <Descriptions.Item label="补贴类型">
              {SUBSIDY_TYPES.find((t) => t.key === selectedType)?.name}
            </Descriptions.Item>
            <Descriptions.Item label="补贴标准">
              <Text strong style={{ color: VITAL_ORANGE }}>
                {SUBSIDY_TYPES.find((t) => t.key === selectedType)?.amountRange}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="申领条件">
              <ul className="m-0 pl-4 text-sm text-gray-600">
                {SUBSIDY_TYPES.find((t) => t.key === selectedType)?.conditions.map((c, i) => (
                  <li key={i} className="mb-1">{c}</li>
                ))}
              </ul>
            </Descriptions.Item>
          </Descriptions>
        )}

        <div className="text-xs text-gray-400 bg-industrial-blue-50 rounded-lg p-3">
          <SafetyCertificateOutlined className="mr-1.5" />
          请如实填写信息并上传真实材料，虚假信息将纳入企业信用记录
        </div>
      </Modal>
    </div>
  );
}
