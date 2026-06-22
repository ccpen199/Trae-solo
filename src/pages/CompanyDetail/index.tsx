import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Download,
  FileText,
  FileDown,
  Copy,
  Bookmark,
  Share2,
  MapPin,
  Calendar,
  User,
  Scale,
  Gavel,
  TrendingUp,
  AlertTriangle,
  Shield,
  Briefcase,
  ChevronRight,
  File,
  CheckCircle2,
  Clock,
  Users,
  Building,
} from 'lucide-react';
import {
  Tabs,
  Tag,
  Button,
  Descriptions,
  Table,
  Progress,
  Empty,
  Timeline,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Divider,
} from 'antd';
import ReactECharts from 'echarts-for-react';
import RiskBadge from '@/components/common/RiskBadge';
import { mockCompanies } from '@/mock/data';
import {
  formatDate,
  formatMoney,
  formatPercent,
  downloadFile,
  copyToClipboard,
  truncateText,
} from '@/utils/format';
import { cn } from '@/lib/utils';
import {
  CASE_CAUSES,
  INDUSTRIES,
  PROVINCES,
  RISK_LEVEL_CONFIG,
} from '@/constants';
import type { Company, Lawsuit, Execution, Bid, Shareholder } from '@/types';

const COMPANY_INFO_TAB_KEY = 'info';
const SHAREHOLDERS_TAB_KEY = 'shareholders';
const LAWSUITS_TAB_KEY = 'lawsuits';
const EXECUTIONS_TAB_KEY = 'executions';
const BIDS_TAB_KEY = 'bids';

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(COMPANY_INFO_TAB_KEY);
  const [reportLoading, setReportLoading] = useState<'pdf' | 'word' | null>(null);

  const company = useMemo(() => {
    return mockCompanies.find((c) => c.id === id) || mockCompanies[0];
  }, [id]);

  const industryLabel = useMemo(() => {
    return INDUSTRIES.find((i) => i.value === company.industry)?.label || company.industry;
  }, [company.industry]);

  const provinceLabel = useMemo(() => {
    return PROVINCES.find((p) => p.value === company.province)?.label || company.province;
  }, [company.province]);

  const statusLabel = useMemo(() => {
    const statusMap: Record<string, { label: string; color: string }> = {
      active: { label: '存续', color: 'green' },
      cancelled: { label: '注销', color: 'default' },
      revoked: { label: '吊销', color: 'red' },
    };
    return statusMap[company.status] || { label: company.status, color: 'default' };
  }, [company.status]);

  const caseCauseLabel = (cause: string) => {
    return CASE_CAUSES.find((c) => c.value === cause)?.label || cause;
  };

  const caseStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      pending: { label: '待立案', color: 'default' },
      first: { label: '一审', color: 'blue' },
      second: { label: '二审', color: 'purple' },
      enforcement: { label: '执行', color: 'orange' },
      closed: { label: '已结案', color: 'green' },
    };
    return map[status] || { label: status, color: 'default' };
  };

  const roleLabel = (role: string) => {
    const map: Record<string, { label: string; color: string }> = {
      plaintiff: { label: '原告', color: 'blue' },
      defendant: { label: '被告', color: 'red' },
      third_party: { label: '第三人', color: 'default' },
    };
    return map[role] || { label: role, color: 'default' };
  };

  const executionStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      ongoing: { label: '执行中', color: 'orange' },
      completed: { label: '已执行完毕', color: 'green' },
      terminated: { label: '终止执行', color: 'default' },
    };
    return map[status] || { label: status, color: 'default' };
  };

  const bidStatusLabel = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      bidding: { label: '投标中', color: 'blue' },
      won: { label: '已中标', color: 'green' },
      lost: { label: '未中标', color: 'default' },
    };
    return map[status] || { label: status, color: 'default' };
  };

  const radarOption = useMemo(() => {
    const indicators = [
      { name: '涉诉风险', max: 100 },
      { name: '执行风险', max: 100 },
      { name: '经营风险', max: 100 },
      { name: '信用风险', max: 100 },
      { name: '履约能力', max: 100 },
      { name: '股权稳定性', max: 100 },
    ];

    const lawsuitRisk = Math.min(100, company.lawsuits.length * 20 + 20);
    const executionRisk = Math.min(100, company.executions.length * 35 + 15);
    const businessRisk = company.riskLevel === 'critical' ? 85 : company.riskLevel === 'high' ? 65 : company.riskLevel === 'medium' ? 45 : 25;
    const creditRisk = 100 - company.riskScore;
    const performanceAbility = company.riskScore;
    const equityStability = company.shareholders.length <= 2 ? 85 : company.shareholders.length <= 5 ? 70 : 55;

    return {
      tooltip: {
        trigger: 'item',
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#495057',
          fontSize: 12,
        },
        splitLine: {
          lineStyle: {
            color: '#DEE2E6',
          },
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['#FAFAFA', '#F5F5F5', '#EDEDED', '#E5E5E5'],
          },
        },
        axisLine: {
          lineStyle: {
            color: '#DEE2E6',
          },
        },
      },
      series: [
        {
          name: '风险评估',
          type: 'radar',
          data: [
            {
              value: [lawsuitRisk, executionRisk, businessRisk, creditRisk, performanceAbility, equityStability],
              name: company.name,
              itemStyle: {
                color: '#0A1628',
              },
              areaStyle: {
                color: {
                  type: 'radial',
                  x: 0.5, y: 0.5, r: 0.5,
                  colorStops: [
                    { offset: 0, color: 'rgba(10, 22, 40, 0.05)' },
                    { offset: 1, color: 'rgba(25, 75, 160, 0.3)' },
                  ],
                },
              },
              lineStyle: {
                color: '#0A1628',
                width: 2,
              },
            },
          ],
        },
      ],
    };
  }, [company]);

  const handleCopyCreditCode = async () => {
    try {
      await copyToClipboard(company.creditCode);
      message.success('统一社会信用代码已复制');
    } catch {
      message.error('复制失败');
    }
  };

  const handleDownloadEvidence = () => {
    message.info('正在准备证据包下载...');
  };

  const handleGenerateReport = async (type: 'pdf' | 'word') => {
    setReportLoading(type);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const content = `${company.name} 企业风险调查报告\n\n生成时间：${formatDate(new Date(), 'YYYY年MM月DD日 HH:mm')}\n\n企业名称：${company.name}\n统一社会信用代码：${company.creditCode}\n风险等级：${RISK_LEVEL_CONFIG[company.riskLevel].label}\n风险评分：${company.riskScore}\n\n本报告由法律智能平台自动生成。`;
      const filename = `${company.name}-风险调查报告.${type === 'pdf' ? 'txt' : 'txt'}`;
      downloadFile(content, filename, 'text/plain');
      message.success(`${type.toUpperCase()} 报告已生成`);
    } catch {
      message.error('报告生成失败');
    } finally {
      setReportLoading(null);
    }
  };

  const handleBookmark = () => {
    message.success('已添加到关注列表');
  };

  const handleShare = () => {
    message.info('分享链接已复制到剪贴板');
  };

  const lawsuitTimeline = useMemo(() => {
    return [...company.lawsuits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((lawsuit) => ({
        ...lawsuit,
        statusConfig: caseStatusLabel(lawsuit.status),
        roleConfig: roleLabel(lawsuit.role),
      }));
  }, [company.lawsuits]);

  const shareholdersColumns = [
    {
      title: '股东名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Shareholder) => (
        <div className="flex items-center gap-2">
          {record.type === 'person' ? (
            <User className="w-4 h-4 text-primary-500" />
          ) : (
            <Building className="w-4 h-4 text-accent-gold" />
          )}
          <span className="font-medium">{text}</span>
          <Tag color={record.type === 'person' ? 'blue' : 'gold'}>
            {record.type === 'person' ? '自然人' : '企业'}
          </Tag>
        </div>
      ),
    },
    {
      title: '持股比例',
      dataIndex: 'ratio',
      key: 'ratio',
      width: 200,
      render: (ratio: number) => (
        <div className="flex items-center gap-3">
          <Progress
            percent={ratio}
            size="small"
            strokeColor="#0A1628"
            showInfo={false}
            style={{ width: 100 }}
          />
          <span className="font-medium">{formatPercent(ratio, 0)}</span>
        </div>
      ),
    },
    {
      title: '认缴出资额',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
  ];

  const lawsuitsColumns = [
    {
      title: '案件名称',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <div>
          <p className="font-medium text-neutral-ink-900">{truncateText(text, 50)}</p>
        </div>
      ),
    },
    {
      title: '案号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 180,
      render: (text: string) => <span className="text-neutral-ink-600">{text}</span>,
    },
    {
      title: '案由',
      dataIndex: 'cause',
      key: 'cause',
      width: 120,
      render: (cause: string) => <Tag color="blue">{caseCauseLabel(cause)}</Tag>,
    },
    {
      title: '身份',
      dataIndex: 'role',
      key: 'role',
      width: 80,
      render: (role: string) => {
        const config = roleLabel(role);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '审理状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = caseStatusLabel(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '涉案金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (text?: string) => <span className="font-medium">{text || '-'}</span>,
    },
    {
      title: '立案日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (text: string) => <span className="text-neutral-ink-600">{formatDate(text)}</span>,
    },
    {
      title: '受理法院',
      dataIndex: 'court',
      key: 'court',
      width: 200,
      render: (text: string) => <span className="text-neutral-ink-600">{text}</span>,
    },
  ];

  const executionsColumns = [
    {
      title: '案号',
      dataIndex: 'caseNumber',
      key: 'caseNumber',
      width: 200,
      render: (text: string) => <span className="text-neutral-ink-600">{text}</span>,
    },
    {
      title: '执行法院',
      dataIndex: 'court',
      key: 'court',
      width: 250,
      render: (text: string) => <span className="text-neutral-ink-600">{text}</span>,
    },
    {
      title: '执行标的',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (text: string) => <span className="font-medium text-accent-red">{text}</span>,
    },
    {
      title: '立案时间',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (text: string) => <span className="text-neutral-ink-600">{formatDate(text)}</span>,
    },
    {
      title: '执行状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = executionStatusLabel(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  const bidsColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '招标人',
      dataIndex: 'tenderer',
      key: 'tenderer',
      width: 200,
      render: (text: string) => <span className="text-neutral-ink-600">{text}</span>,
    },
    {
      title: '项目金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (text: string) => <span className="font-medium text-green-600">{text}</span>,
    },
    {
      title: '中标日期',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (text: string) => <span className="text-neutral-ink-600">{formatDate(text)}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = bidStatusLabel(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
  ];

  const tabItems = [
    {
      key: COMPANY_INFO_TAB_KEY,
      label: (
        <span className="flex items-center gap-1.5">
          <Building2 className="w-4 h-4" />
          工商信息
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Descriptions
            title={
              <span className="font-serif text-base font-semibold text-primary-900">
                基本信息
              </span>
            }
            bordered
            column={2}
            size="middle"
          >
            <Descriptions.Item label="企业名称">
              <span className="font-medium">{company.name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="统一社会信用代码">
              <span className="flex items-center gap-2">
                <span className="font-mono">{company.creditCode}</span>
                <Tooltip title="复制">
                  <Button
                    type="text"
                    size="small"
                    icon={<Copy className="w-3.5 h-3.5" />}
                    onClick={handleCopyCreditCode}
                  />
                </Tooltip>
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="法定代表人">
              <span className="font-medium">{company.legalPerson}</span>
            </Descriptions.Item>
            <Descriptions.Item label="注册资本">
              <span className="font-medium">{company.registeredCapital}</span>
            </Descriptions.Item>
            <Descriptions.Item label="成立日期">
              <span className="font-medium">{formatDate(company.establishDate)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="经营状态">
              <Tag color={statusLabel.color}>{statusLabel.label}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="所属行业">
              <span className="font-medium">{industryLabel}</span>
            </Descriptions.Item>
            <Descriptions.Item label="所在地区">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-neutral-ink-400" />
                {provinceLabel} {company.city}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="注册地址" span={2}>
              <span className="font-medium">{company.address}</span>
            </Descriptions.Item>
            <Descriptions.Item label="经营范围" span={2}>
              <p className="text-neutral-ink-700 leading-relaxed m-0">
                {company.businessScope}
              </p>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <h3 className="lc-section-title">风险概览</h3>
          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card className="lc-card border-0" styles={{ body: { padding: 16 } }}>
                <ReactECharts option={radarOption} style={{ height: 320 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card className="lc-card border-0 mb-4" styles={{ body: { padding: 16 } }}>
                    <Statistic
                      title={<span className="text-neutral-ink-500">裁判文书</span>}
                      value={company.lawsuits.length}
                      suffix="件"
                      valueStyle={{ color: '#194BA0' }}
                      prefix={<Scale className="w-5 h-5" />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="lc-card border-0 mb-4" styles={{ body: { padding: 16 } }}>
                    <Statistic
                      title={<span className="text-neutral-ink-500">被执行信息</span>}
                      value={company.executions.length}
                      suffix="条"
                      valueStyle={{ color: '#B23A48' }}
                      prefix={<AlertTriangle className="w-5 h-5" />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="lc-card border-0 mb-4" styles={{ body: { padding: 16 } }}>
                    <Statistic
                      title={<span className="text-neutral-ink-500">招投标</span>}
                      value={company.bids.length}
                      suffix="条"
                      valueStyle={{ color: '#10B981' }}
                      prefix={<Briefcase className="w-5 h-5" />}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="lc-card border-0 mb-4" styles={{ body: { padding: 16 } }}>
                    <Statistic
                      title={<span className="text-neutral-ink-500">股东数量</span>}
                      value={company.shareholders.length}
                      suffix="人"
                      valueStyle={{ color: '#C9A962' }}
                      prefix={<Users className="w-5 h-5" />}
                    />
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: SHAREHOLDERS_TAB_KEY,
      label: (
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          股权结构
        </span>
      ),
      children: (
        <div>
          {company.shareholders.length > 0 ? (
            <Table
              columns={shareholdersColumns}
              dataSource={company.shareholders}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="暂无股东信息" />
          )}
        </div>
      ),
    },
    {
      key: LAWSUITS_TAB_KEY,
      label: (
        <span className="flex items-center gap-1.5">
          <Gavel className="w-4 h-4" />
          裁判文书
          {company.lawsuits.length > 0 && (
            <Tag color="blue" className="ml-1 !text-xs">
              {company.lawsuits.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div className="space-y-6">
          {company.lawsuits.length > 0 ? (
            <>
              <h3 className="lc-section-title">案件时间线</h3>
              <Card className="lc-card border-0">
                <Timeline
                  mode="left"
                  items={lawsuitTimeline.map((item: Lawsuit & { statusConfig: { label: string; color: string }; roleConfig: { label: string; color: string } }) => ({
                    color: item.status === 'closed' ? 'green' : item.status === 'enforcement' ? 'red' : 'blue',
                    dot: item.status === 'closed' ? <CheckCircle2 className="w-5 h-5" /> : item.status === 'enforcement' ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />,
                    label: (
                      <div className="text-sm text-neutral-ink-500">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        {formatDate(item.date)}
                      </div>
                    ),
                    children: (
                      <div className="lc-card p-4 mb-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-primary-900 m-0 flex-1 pr-4">
                            {item.title}
                          </h4>
                          <div className="flex gap-2 flex-shrink-0">
                            <Tag color={item.roleConfig.color}>{item.roleConfig.label}</Tag>
                            <Tag color={item.statusConfig.color}>{item.statusConfig.label}</Tag>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-ink-500">
                          <span>案号：{item.caseNumber}</span>
                          <span>案由：{caseCauseLabel(item.cause)}</span>
                          {item.amount && <span>标的：{item.amount}</span>}
                        </div>
                        <div className="text-sm text-neutral-ink-500 mt-1">
                          受理法院：{item.court}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="small"
                            icon={<FileText className="w-3.5 h-3.5" />}
                            onClick={() => message.info('正在打开裁判文书...')}
                          >
                            查看文书
                          </Button>
                          <Button
                            size="small"
                            icon={<Download className="w-3.5 h-3.5" />}
                            onClick={() => message.info('正在下载文书...')}
                          >
                            下载文书
                          </Button>
                        </div>
                      </div>
                    ),
                  }))}
                />
              </Card>

              <h3 className="lc-section-title">案件列表</h3>
              <Table
                columns={lawsuitsColumns}
                dataSource={company.lawsuits}
                rowKey="id"
                pagination={false}
              />
            </>
          ) : (
            <Empty description="暂无裁判文书记录" />
          )}
        </div>
      ),
    },
    {
      key: EXECUTIONS_TAB_KEY,
      label: (
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          执行信息
          {company.executions.length > 0 && (
            <Tag color="red" className="ml-1 !text-xs">
              {company.executions.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {company.executions.length > 0 ? (
            <Table
              columns={executionsColumns}
              dataSource={company.executions}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="暂无被执行信息" />
          )}
        </div>
      ),
    },
    {
      key: BIDS_TAB_KEY,
      label: (
        <span className="flex items-center gap-1.5">
          <Briefcase className="w-4 h-4" />
          招投标
          {company.bids.length > 0 && (
            <Tag color="green" className="ml-1 !text-xs">
              {company.bids.length}
            </Tag>
          )}
        </span>
      ),
      children: (
        <div>
          {company.bids.length > 0 ? (
            <Table
              columns={bidsColumns}
              dataSource={company.bids}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="暂无招投标记录" />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-neutral-ink-500 hover:text-primary-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">返回</span>
        </button>
        <div className="flex gap-2">
          <Button
            icon={<Bookmark className="w-4 h-4" />}
            onClick={handleBookmark}
          >
            关注
          </Button>
          <Button
            icon={<Share2 className="w-4 h-4" />}
            onClick={handleShare}
          >
            分享
          </Button>
          <Button
            icon={<Download className="w-4 h-4" />}
            onClick={handleDownloadEvidence}
          >
            证据下载
          </Button>
          <Button
            type="primary"
            icon={<FileText className="w-4 h-4" />}
            loading={reportLoading === 'pdf'}
            onClick={() => handleGenerateReport('pdf')}
          >
            生成PDF报告
          </Button>
          <Button
            icon={<FileDown className="w-4 h-4" />}
            loading={reportLoading === 'word'}
            onClick={() => handleGenerateReport('word')}
          >
            生成Word报告
          </Button>
        </div>
      </div>

      <div className="lc-card p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-lg primary-gradient flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-serif font-bold text-primary-900 m-0">
                {company.name}
              </h1>
              <RiskBadge level={company.riskLevel} score={company.riskScore} showScore />
              <Tag color={statusLabel.color}>{statusLabel.label}</Tag>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-neutral-ink-500">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                法定代表人：<span className="text-neutral-ink-700 font-medium">{company.legalPerson}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                成立日期：<span className="text-neutral-ink-700 font-medium">{formatDate(company.establishDate)}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" />
                注册资本：<span className="text-neutral-ink-700 font-medium">{company.registeredCapital}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                {industryLabel}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-neutral-ink-500">
              <MapPin className="w-4 h-4" />
              <span>{provinceLabel} {company.city} · {company.address}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-neutral-ink-500 mb-1">风险评分</div>
            <div className="text-4xl font-serif font-bold text-primary-900">
              {company.riskScore}
            </div>
            <Progress
              percent={company.riskScore}
              showInfo={false}
              strokeColor={
                company.riskLevel === 'low' ? '#10B981' :
                company.riskLevel === 'medium' ? '#F59E0B' :
                company.riskLevel === 'high' ? '#F97316' : '#B23A48'
              }
              style={{ width: 120, marginTop: 4 }}
            />
            <div className="text-xs text-neutral-ink-500 mt-1">
              {RISK_LEVEL_CONFIG[company.riskLevel].label}
            </div>
          </div>
        </div>

        <Divider className="my-5" />

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-neutral-ink-500">快捷操作：</span>
          <Button
            size="small"
            icon={<File className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab(COMPANY_INFO_TAB_KEY)}
          >
            工商档案
          </Button>
          <Button
            size="small"
            icon={<Users className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab(SHAREHOLDERS_TAB_KEY)}
          >
            股权穿透
          </Button>
          <Button
            size="small"
            icon={<Gavel className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab(LAWSUITS_TAB_KEY)}
          >
            诉讼分析
          </Button>
          <Button
            size="small"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab(EXECUTIONS_TAB_KEY)}
          >
            执行风险
          </Button>
          <Button
            size="small"
            icon={<Briefcase className="w-3.5 h-3.5" />}
            onClick={() => setActiveTab(BIDS_TAB_KEY)}
          >
            招投标记录
          </Button>
        </div>
      </div>

      <div className="lc-card">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className={cn(
            '[&_.ant-tabs-nav]:px-6',
            '[&_.ant-tabs-content]:p-6'
          )}
        />
      </div>
    </div>
  );
};

export default CompanyDetail;
