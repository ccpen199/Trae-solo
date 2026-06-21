import React, { useState } from 'react';
import {
  FileSearch,
  Building2,
  Scale,
  Plus,
  Download,
  RefreshCw,
  Share2,
  FileText,
  FileSpreadsheet,
  Search,
  TrendingUp,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Input,
  Select,
  Checkbox,
  Radio,
  message,
  Space,
  Tooltip,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import DataCard from '@/components/common/DataCard';

const { Option } = Select;

interface ReportType {
  key: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const reportTypes: ReportType[] = [
  {
    key: 'due_diligence',
    name: '尽职调查报告',
    description: '全面调查企业工商、财务、法律等维度信息，为投资决策提供依据',
    icon: <FileSearch className="w-6 h-6" />,
    color: 'text-primary-900',
    bgColor: 'bg-primary-50',
  },
  {
    key: 'credit_report',
    name: '企业信用报告',
    description: '评估企业信用等级、履约能力、经营状况，揭示潜在信用风险',
    icon: <Building2 className="w-6 h-6" />,
    color: 'text-accent-gold',
    bgColor: 'bg-amber-50',
  },
  {
    key: 'litigation_analysis',
    name: '涉诉分析报告',
    description: '深度分析企业涉诉记录、案件类型、执行情况，评估诉讼风险',
    icon: <Scale className="w-6 h-6" />,
    color: 'text-accent-red',
    bgColor: 'bg-red-50',
  },
];

const reportSections = [
  { key: 'basic_info', label: '基本信息' },
  { key: 'shareholders', label: '股东结构' },
  { key: 'lawsuits', label: '涉诉记录' },
  { key: 'execution', label: '执行信息' },
  { key: 'risk_analysis', label: '风险分析' },
  { key: 'recommendations', label: '专业建议' },
];

const mockReports = [
  {
    id: '1',
    name: '深圳腾讯科技有限公司尽职调查报告',
    type: 'due_diligence',
    typeName: '尽职调查',
    company: '深圳腾讯科技有限公司',
    format: 'PDF',
    generatedAt: '2026-06-15',
    status: 'completed',
  },
  {
    id: '2',
    name: '阿里巴巴集团信用评估报告',
    type: 'credit_report',
    typeName: '企业信用',
    company: '阿里巴巴集团控股有限公司',
    format: 'Word',
    generatedAt: '2026-06-12',
    status: 'completed',
  },
  {
    id: '3',
    name: '华为技术有限公司涉诉分析',
    type: 'litigation_analysis',
    typeName: '涉诉分析',
    company: '华为技术有限公司',
    format: 'PDF',
    generatedAt: '2026-06-10',
    status: 'completed',
  },
  {
    id: '4',
    name: '字节跳动科技尽职调查报告',
    type: 'due_diligence',
    typeName: '尽职调查',
    company: '北京字节跳动科技有限公司',
    format: 'PDF',
    generatedAt: '2026-06-08',
    status: 'generating',
  },
  {
    id: '5',
    name: '小米科技有限责任公司信用报告',
    type: 'credit_report',
    typeName: '企业信用',
    company: '小米科技有限责任公司',
    format: 'Word',
    generatedAt: '2026-06-05',
    status: 'failed',
  },
];

const typeDistributionOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      data: [
        { value: 45, name: '尽职调查', itemStyle: { color: '#0A1628' } },
        { value: 32, name: '企业信用', itemStyle: { color: '#C9A962' } },
        { value: 23, name: '涉诉分析', itemStyle: { color: '#B23A48' } },
      ],
    },
  ],
};

const monthlyTrendOption = {
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLine: { lineStyle: { color: '#DEE2E6' } },
    axisLabel: { color: '#6B7280' },
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: '#F8F9FA' } },
    axisLabel: { color: '#6B7280' },
  },
  series: [
    {
      name: '生成数量',
      type: 'bar',
      data: [12, 18, 15, 22, 25, 28],
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#0A1628' },
            { offset: 1, color: '#194BA0' },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 30,
    },
  ],
};

const Reports: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const [companyName, setCompanyName] = useState('');
  const [checkedSections, setCheckedSections] = useState<string[]>(['basic_info', 'risk_analysis']);
  const [reportFormat, setReportFormat] = useState<string>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateReport = (type: string) => {
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleGenerate = async () => {
    if (!companyName.trim()) {
      message.error('请输入公司名称');
      return;
    }
    if (!selectedType) {
      message.error('请选择报告类型');
      return;
    }
    if (checkedSections.length === 0) {
      message.error('请至少选择一个报告章节');
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
    setIsModalOpen(false);
    message.success('报告生成任务已提交，请稍候查看');
    setCompanyName('');
    setCheckedSections(['basic_info', 'risk_analysis']);
    setReportFormat('PDF');
  };

  const handleDownload = (record: typeof mockReports[0]) => {
    message.success(`正在下载 ${record.name}`);
  };

  const handleRegenerate = (record: typeof mockReports[0]) => {
    message.success(`正在重新生成 ${record.name}`);
  };

  const handleShare = (record: typeof mockReports[0]) => {
    message.success(`分享链接已复制到剪贴板`);
  };

  const columns = [
    {
      title: '报告名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: typeof mockReports[0]) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            record.format === 'PDF' ? 'bg-red-50 text-accent-red' : 'bg-blue-50 text-blue-600'
          }`}>
            {record.format === 'PDF' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
          </div>
          <span className="font-medium text-neutral-ink-900 line-clamp-1">{text}</span>
        </div>
      ),
    },
    {
      title: '报告类型',
      dataIndex: 'typeName',
      key: 'typeName',
      render: (text: string) => (
        <Tag color="gold" className="!m-0">{text}</Tag>
      ),
    },
    {
      title: '所属公司',
      dataIndex: 'company',
      key: 'company',
      render: (text: string) => (
        <span className="text-neutral-ink-700">{text}</span>
      ),
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      render: (text: string) => (
        <span className={`lc-badge ${
          text === 'PDF' ? 'bg-red-100 text-accent-red' : 'bg-blue-100 text-blue-700'
        }`}>
          {text}
        </span>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (text: string) => (
        <div className="flex items-center gap-1.5 text-neutral-ink-500">
          <Clock className="w-3.5 h-3.5" />
          {text}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { text: string; icon: React.ReactNode; className: string }> = {
          completed: {
            text: '已完成',
            icon: <CheckCircle2 className="w-3.5 h-3.5" />,
            className: 'bg-green-100 text-green-700',
          },
          generating: {
            text: '生成中',
            icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
            className: 'bg-blue-100 text-blue-700',
          },
          failed: {
            text: '生成失败',
            icon: <XCircle className="w-3.5 h-3.5" />,
            className: 'bg-red-100 text-accent-red',
          },
        };
        const cfg = config[status];
        return (
          <span className={`lc-status-tag ${cfg.className}`}>
            {cfg.icon}
            {cfg.text}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: typeof mockReports[0]) => (
        <Space size={8}>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<Download className="w-4 h-4" />}
              onClick={() => handleDownload(record)}
              disabled={record.status !== 'completed'}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
          <Tooltip title="重新生成">
            <Button
              type="text"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={() => handleRegenerate(record)}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
          <Tooltip title="分享">
            <Button
              type="text"
              icon={<Share2 className="w-4 h-4" />}
              onClick={() => handleShare(record)}
              disabled={record.status !== 'completed'}
              className="!h-8 !w-8 !p-0"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-900">法律报告中心</h1>
          <p className="text-neutral-ink-500 mt-1">专业法律尽职调查、企业信用与涉诉分析报告</p>
        </div>
        <Button
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => handleCreateReport('')}
          className="!h-10"
        >
          生成报告
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reportTypes.map((type) => (
          <Card
            key={type.key}
            className="lc-card border-0 hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
            onClick={() => handleCreateReport(type.key)}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${type.bgColor} ${type.color} group-hover:scale-110 transition-transform`}>
              {type.icon}
            </div>
            <h3 className="font-serif text-lg font-semibold text-primary-900 mb-2">{type.name}</h3>
            <p className="text-sm text-neutral-ink-500 mb-4 leading-relaxed min-h-[48px]">{type.description}</p>
            <div className="flex items-center text-sm text-primary-600 font-medium group-hover:gap-2 gap-1 transition-all">
              <Plus className="w-4 h-4" />
              立即创建
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <DataCard
          title="累计生成报告"
          value={128}
          icon={<FileText className="w-5 h-5" />}
          color="primary"
          trend={{ value: 12, isUp: true }}
        />
        <DataCard
          title="本月下载量"
          value={86}
          icon={<Download className="w-5 h-5" />}
          color="gold"
          trend={{ value: 23, isUp: true }}
        />
        <DataCard
          title="最受欢迎类型"
          value="尽职调查"
          icon={<TrendingUp className="w-5 h-5" />}
          color="success"
          description="占比 45%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lc-card border-0 lg:col-span-2"
          title={<span className="font-serif text-base font-semibold">月度报告生成趋势</span>}
        >
          <ReactECharts option={monthlyTrendOption} style={{ height: 280 }} />
        </Card>
        <Card
          className="lc-card border-0"
          title={<span className="font-serif text-base font-semibold">报告类型分布</span>}
        >
          <ReactECharts option={typeDistributionOption} style={{ height: 280 }} />
        </Card>
      </div>

      <Card
        className="lc-card border-0"
        title={<span className="font-serif text-base font-semibold">报告历史记录</span>}
        extra={<BarChart3 className="w-4 h-4 text-primary-500" />}
      >
        <Table
          columns={columns}
          dataSource={mockReports}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          className="lc-table"
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-900 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-serif text-base font-semibold text-primary-900">生成法律报告</div>
              <div className="text-xs text-neutral-ink-500">填写信息生成专业法律分析报告</div>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button
              type="primary"
              icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              onClick={handleGenerate}
              loading={isGenerating}
            >
              {isGenerating ? '正在生成...' : '生成报告'}
            </Button>
          </div>
        }
        width={640}
      >
        <div className="space-y-5 pt-2">
          <div>
            <label className="lc-input-label">目标公司</label>
            <Input
              size="large"
              prefix={<Search className="w-4 h-4 text-neutral-ink-400" />}
              placeholder="请输入公司名称进行搜索"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="lc-input"
            />
          </div>

          <div>
            <label className="lc-input-label">报告类型</label>
            <Select
              size="large"
              placeholder="请选择报告类型"
              value={selectedType || undefined}
              onChange={(v) => setSelectedType(v)}
              className="w-full"
            >
              {reportTypes.map((type) => (
                <Option key={type.key} value={type.key}>{type.name}</Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="lc-input-label">报告章节</label>
            <Checkbox.Group
              value={checkedSections}
              onChange={(v) => setCheckedSections(v as string[])}
              className="w-full"
            >
              <div className="grid grid-cols-2 gap-3">
                {reportSections.map((section) => (
                  <Checkbox key={section.key} value={section.key} className="!h-9 !flex !items-center">
                    {section.label}
                  </Checkbox>
                ))}
              </div>
            </Checkbox.Group>
          </div>

          <div>
            <label className="lc-input-label">输出格式</label>
            <Radio.Group value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
              <Radio.Button value="PDF" className="!h-10 !flex !items-center !px-5">
                <FileText className="w-4 h-4 mr-2" />
                PDF 格式
              </Radio.Button>
              <Radio.Button value="Word" className="!h-10 !flex !items-center !px-5">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Word 格式
              </Radio.Button>
            </Radio.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
