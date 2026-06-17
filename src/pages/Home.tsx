import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Tag, Progress, List, Avatar, Badge, Row, Col, Statistic } from 'antd';
import {
  FileText,
  CheckCircle,
  Clock,
  Smile,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertCircle,
  Activity,
  Timer,
  ThumbsUp,
  XCircle,
  Search,
} from 'lucide-react';
import * as echarts from 'echarts';
import { mockStatCards, mockPerformanceData, mockServices, mockApplications } from '../mock/data';
import type { StatCardData, ServiceItem, Application, PerformanceData } from '../shared/types';

const gradientMap = {
  blue: 'from-blue-500 to-blue-700',
  green: 'from-green-500 to-green-700',
  orange: 'from-orange-500 to-orange-700',
  purple: 'from-purple-500 to-purple-700',
};

const iconMap: Record<string, React.ElementType> = {
  FileText,
  CheckCircle,
  Clock,
  Smile,
};

const statusMap: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  submitted: { text: '已提交', color: 'blue' },
  reviewing: { text: '审核中', color: 'gold' },
  supplement: { text: '需补件', color: 'red' },
  approved: { text: '已通过', color: 'green' },
  rejected: { text: '已驳回', color: 'red' },
};

const StatCard = ({ card }: { card: StatCardData }) => {
  const IconComponent = iconMap[card.icon];
  const gradientClass = gradientMap[card.gradient];

  return (
    <Card
      className={`bg-gradient-to-r ${gradientClass} text-white border-0 shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:-translate-y-1`}
      bodyStyle={{ padding: '24px' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/80 text-sm mb-2">{card.title}</p>
          <p className="text-3xl font-bold mb-2">{card.value}</p>
          {card.change !== undefined && card.trend && (
            <div className="flex items-center text-sm">
              {card.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className={card.trend === 'up' ? 'text-green-200' : 'text-red-200'}>
                {card.trend === 'up' ? '+' : ''}{card.change}%
              </span>
              <span className="text-white/60 ml-2">较昨日</span>
            </div>
          )}
        </div>
        <div className="bg-white/20 p-3 rounded-lg">
          {IconComponent && <IconComponent className="w-8 h-8 text-white" />}
        </div>
      </div>
    </Card>
  );
};

const ServiceCard = ({ service, onOpen }: { service: ServiceItem; onOpen: () => void }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      className="h-full border border-gov-gray-200 hover:shadow-card-hover transition-all duration-300 cursor-pointer group"
      bodyStyle={{ padding: '20px' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="bg-primary-50 p-2 rounded-lg">
          <FileText className="w-5 h-5 text-primary-600" />
        </div>
        <Tag color="blue" className="m-0">
          {service.category}
        </Tag>
      </div>
      <h4 className="font-semibold text-gov-gray-700 mb-2 group-hover:text-primary-600 transition-colors">
        {service.name}
      </h4>
      <p className="text-sm text-gov-gray-500 mb-3 line-clamp-2">{service.description}</p>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-gov-gray-400">
          <Timer className="w-3.5 h-3.5 mr-1" />
          {service.handlingTime}
        </div>
        <div className="flex items-center text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
          立即办理
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </Card>
  );
};

const ApplicationItem = ({ app }: { app: Application }) => {
  const statusInfo = statusMap[app.status];

  return (
    <List.Item className="px-0 py-4 hover:bg-gov-gray-50 -mx-4 px-4 rounded-lg transition-colors">
      <List.Item.Meta
        avatar={
          <Avatar className="bg-primary-100">
            <FileText className="w-5 h-5 text-primary-600" />
          </Avatar>
        }
        title={
          <div className="flex items-center justify-between">
            <span className="font-medium text-gov-gray-700">{app.serviceName}</span>
            <Tag color={statusInfo.color as any}>{statusInfo.text}</Tag>
          </div>
        }
        description={
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm text-gov-gray-500 mb-2">
              <span>申请时间：{new Date(app.createdAt).toLocaleDateString('zh-CN')}</span>
              <span>预计：{app.estimatedTime}</span>
            </div>
            <Progress
              percent={Math.round((app.currentStep / app.totalSteps) * 100)}
              size="small"
              strokeColor="#165DFF"
              showInfo={false}
            />
            <div className="text-xs text-gov-gray-400 mt-1">
              第 {app.currentStep} 步 / 共 {app.totalSteps} 步
            </div>
          </div>
        }
      />
    </List.Item>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [serviceKeyword, setServiceKeyword] = useState('');

  const [performanceSummary] = useState(() => {
    const latest = mockPerformanceData[mockPerformanceData.length - 1];
    const avgCompletionRate =
      mockPerformanceData.reduce((sum, d) => sum + d.completionRate, 0) / mockPerformanceData.length;
    const totalRejections = mockPerformanceData.reduce((sum, d) => sum + d.rejectionCount, 0);
    const avgHandlingTime =
      mockPerformanceData.reduce((sum, d) => sum + d.averageHandlingTime, 0) / mockPerformanceData.length;

    return {
      todayTotal: latest.totalApplications,
      todayCompleted: latest.completedCount,
      avgCompletionRate: avgCompletionRate.toFixed(1),
      totalRejections,
      avgHandlingTime: avgHandlingTime.toFixed(1),
      satisfaction: 98.5,
    };
  });

  const recommendedServices = useMemo(() => {
    const keyword = serviceKeyword.trim().toLowerCase();
    if (!keyword) return mockServices;

    return mockServices.filter(service =>
      [service.name, service.description, service.department, service.category].some(value =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [serviceKeyword]);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const dates = mockPerformanceData.map((d) => d.date.slice(5));
    const totalData = mockPerformanceData.map((d) => d.totalApplications);
    const completedData = mockPerformanceData.map((d) => d.completedCount);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#E5E6EB',
        borderWidth: 1,
        textStyle: { color: '#1D2129' },
        formatter: (params: any) => {
          const date = params[0].axisValue;
          let result = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`;
          params.forEach((param: any) => {
            result += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: 600;">${param.value}</span>
            </div>`;
          });
          return result;
        },
      },
      legend: {
        data: ['总办件量', '办结量'],
        bottom: 0,
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#E5E6EB' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#F2F3F5', type: 'dashed' } },
        axisLabel: { color: '#86909C', fontSize: 11 },
      },
      series: [
        {
          name: '总办件量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3, color: '#165DFF' },
          itemStyle: { color: '#165DFF' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22, 93, 255, 0.25)' },
              { offset: 1, color: 'rgba(22, 93, 255, 0.02)' },
            ]),
          },
          data: totalData,
        },
        {
          name: '办结量',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { width: 3, color: '#00B42A' },
          itemStyle: { color: '#00B42A' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(0, 180, 42, 0.2)' },
              { offset: 1, color: 'rgba(0, 180, 42, 0.02)' },
            ]),
          },
          data: completedData,
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gov-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gov-gray-700 mb-1">政务服务中心</h1>
          <p className="text-gov-gray-500">欢迎使用省级一体化政务服务平台</p>
        </div>

        <Card className="shadow-card mb-6" bodyStyle={{ padding: '16px' }}>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gov-gray-400" />
              <input
                type="search"
                value={serviceKeyword}
                onChange={(event) => setServiceKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    navigate(`/services?keyword=${encodeURIComponent(serviceKeyword.trim())}`);
                  }
                }}
                placeholder="搜索事项、材料、办理部门"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gov-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-gov-gray-700 placeholder:text-gov-gray-400"
              />
            </div>
            <button
              onClick={() => navigate(`/services?keyword=${encodeURIComponent(serviceKeyword.trim())}`)}
              className="gov-btn-primary px-6 py-3"
            >
              搜索事项
            </button>
          </div>
        </Card>

        <Row gutter={[16, 16]} className="mb-6">
          {mockStatCards.map((card, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <StatCard card={card} />
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card
              title={
                <div className="flex items-center">
                  <Activity className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-semibold">近30天办件趋势</span>
                </div>
              }
              className="shadow-card"
            >
              <div ref={chartRef} style={{ height: '350px', width: '100%' }} />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-semibold">效能监测概览</span>
                </div>
              }
              className="shadow-card h-full"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-lg mr-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gov-gray-500">今日总办件</p>
                      <p className="text-xl font-bold text-gov-gray-700">{performanceSummary.todayTotal}</p>
                    </div>
                  </div>
                  <Badge status="processing" text="进行中" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg mr-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gov-gray-500">今日办结</p>
                      <p className="text-xl font-bold text-gov-gray-700">{performanceSummary.todayCompleted}</p>
                    </div>
                  </div>
                  <Badge status="success" text="正常" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-purple-100 p-2 rounded-lg mr-3">
                      <ThumbsUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gov-gray-500">平均办结率</p>
                      <p className="text-xl font-bold text-gov-gray-700">{performanceSummary.avgCompletionRate}%</p>
                    </div>
                  </div>
                  <Progress
                    percent={Number(performanceSummary.avgCompletionRate)}
                    type="dashboard"
                    size={50}
                    strokeColor="#722ED1"
                    showInfo={false}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-2 rounded-lg mr-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gov-gray-500">平均办理时长</p>
                      <p className="text-xl font-bold text-gov-gray-700">{performanceSummary.avgHandlingTime}分钟</p>
                    </div>
                  </div>
                  <Badge status="success" text="优秀" />
                </div>

                <div className="flex items-center justify-between p-3 bg-gov-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-red-100 p-2 rounded-lg mr-3">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gov-gray-500">累计退件</p>
                      <p className="text-xl font-bold text-gov-gray-700">{performanceSummary.totalRejections}件</p>
                    </div>
                  </div>
                  <Badge status="warning" text="需关注" />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-primary-600 mr-2" />
                <span className="font-semibold">热门事项推荐</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="text-primary-600 text-sm flex items-center cursor-pointer hover:text-primary-700"
              >
                查看全部 <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          }
          className="shadow-card mb-6"
        >
          <Row gutter={[16, 16]}>
            {recommendedServices.map((service) => (
              <Col xs={24} sm={12} lg={6} key={service.id}>
                <ServiceCard service={service} onOpen={() => navigate(`/services/${service.id}`)} />
              </Col>
            ))}
          </Row>
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-primary-600 mr-2" />
                <span className="font-semibold">我的待办</span>
              </div>
              <a className="text-primary-600 text-sm flex items-center cursor-pointer hover:text-primary-700">
                查看全部 <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          }
          className="shadow-card"
        >
          <List
            dataSource={mockApplications}
            renderItem={(app) => <ApplicationItem app={app} />}
            locale={{ emptyText: '暂无待办事项' }}
          />
        </Card>
      </div>
    </div>
  );
}
