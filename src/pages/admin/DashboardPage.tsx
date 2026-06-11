import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useQuery } from '@tanstack/react-query';
import { dataApi, contentApi, auditApi, serviceApi } from '../../lib/api';
import StatCard from '../../components/ui/StatCard';

const DashboardPage: React.FC = () => {
  const [couponStats, setCouponStats] = useState<any>(null);
  const [flowTrend, setFlowTrend] = useState<any[]>([]);
  const [heritageStats, setHeritageStats] = useState<any[]>([]);

  const { data: contentData } = useQuery({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const res = await contentApi.getList({ page: 1, pageSize: 100 });
      return res.data;
    },
  });

  const { data: auditStats } = useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const res = await auditApi.getStatistics();
      return res.data;
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const [couponRes, flowRes, heritageRes] = await Promise.all([
        dataApi.getCouponStatistics({ startDate, endDate }),
        dataApi.getScenicFlowTrend({ startDate, endDate, aggregation: 'day' }),
        dataApi.getHeritageStatsByLevel(),
      ]);
      
      setCouponStats(couponRes.data);
      setFlowTrend(flowRes.data);
      setHeritageStats(heritageRes.data);
    };
    fetchData();
  }, []);

  const visitorChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['游客量', '饱和度'], right: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      data: flowTrend.map((d: any) => d.date?.slice(5) || ''),
      axisLine: { lineStyle: { color: '#E5E7EB' } },
      axisLabel: { color: '#6B7280' },
    },
    yAxis: [
      { type: 'value', name: '游客量', axisLine: { lineStyle: { color: '#C8102E' } }, splitLine: { lineStyle: { color: '#F3F4F6' } } },
      { type: 'value', name: '饱和度', max: 100, axisLine: { lineStyle: { color: '#2D5A52' } }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '游客量',
        type: 'bar',
        data: flowTrend.map((d: any) => d.visitorCount || 0),
        itemStyle: { color: '#C8102E', borderRadius: [4, 4, 0, 0] },
      },
      {
        name: '饱和度',
        type: 'line',
        yAxisIndex: 1,
        data: flowTrend.map((d: any) => d.saturation || 0),
        smooth: true,
        itemStyle: { color: '#2D5A52' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(45,90,82,0.3)' }, { offset: 1, color: 'rgba(45,90,82,0.05)' }] },
        },
      },
    ],
  };

  const heritageChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}项 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}项' },
      data: heritageStats.map((h: any, i: number) => ({
        value: h.count,
        name: h.name,
        itemStyle: { color: ['#C8102E', '#2D5A52', '#F0A500', '#1A4B8C'][i % 4] },
      })),
    }],
  };

  const contentTypeChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['图文', '视频', 'VR导览', '信息图'], axisLine: { lineStyle: { color: '#E5E7EB' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: '#F3F4F6' } } },
    series: [{
      type: 'bar',
      data: contentData ? [
        contentData.items?.filter((c: any) => c.type === 'article').length || 0,
        contentData.items?.filter((c: any) => c.type === 'video').length || 0,
        contentData.items?.filter((c: any) => c.type === 'vr').length || 0,
        contentData.items?.filter((c: any) => c.type === 'infographic').length || 0,
      ] : [0, 0, 0, 0],
      itemStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#C8102E' }, { offset: 1, color: '#E85A70' }] },
        borderRadius: [8, 8, 0, 0],
      },
      barWidth: '50%',
    }],
  };

  const statusData = contentData ? [
    { name: '已发布', value: contentData.items?.filter((c: any) => c.status === 'published').length || 0, color: '#22C55E' },
    { name: '待审核', value: contentData.items?.filter((c: any) => c.status === 'pending_audit').length || 0, color: '#F0A500' },
    { name: '草稿', value: contentData.items?.filter((c: any) => c.status === 'draft').length || 0, color: '#9CA3AF' },
    { name: '已驳回', value: contentData.items?.filter((c: any) => c.status === 'rejected').length || 0, color: '#EF4444' },
  ] : [];

  const contentStatusChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['50%', '80%'],
      label: { show: true, position: 'outside', formatter: '{b}\n{d}%' },
      data: statusData.map((s: any) => ({ ...s, itemStyle: { color: s.color } })),
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">运行监测总览</h1>
          <p className="text-ink-500 text-sm mt-1">文旅中台核心指标实时监控</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            实时运行中
          </span>
          <span className="text-sm text-ink-500">更新时间：{new Date().toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日游客总量"
          value="156,789"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          trend={{ value: 12.5, label: '较昨日', isUp: true }}
          miniChart={{ type: 'line', data: [12000, 15000, 18000, 16000, 19000, 22000, 25000], color: '#C8102E' }}
          color="#C8102E"
        />
        <StatCard
          title="累计发布内容"
          value={contentData?.total?.toLocaleString() || '0'}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
          trend={{ value: 8.3, label: '较上周', isUp: true }}
          miniChart={{ type: 'bar', data: [12, 18, 15, 22, 28, 25, 32], color: '#2D5A52' }}
          color="#2D5A52"
        />
        <StatCard
          title="待审核内容"
          value={auditStats?.totalPending || 0}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          trend={{ value: 5.2, label: '待处理', isUp: false }}
          miniChart={{ type: 'line', data: [8, 6, 10, 12, 9, 7, 11], color: '#F0A500' }}
          color="#F0A500"
        />
        <StatCard
          title="消费券核销率"
          value={couponStats ? `${couponStats.consumptionRate?.toFixed(1)}%` : '0%'}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>}
          trend={{ value: 3.8, label: '较上月', isUp: true }}
          miniChart={{ type: 'line', data: [65, 68, 72, 70, 75, 78, 82], color: '#1A4B8C' }}
          color="#1A4B8C"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card chinese-border">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">近30天景区客流趋势</h3>
          <ReactECharts option={visitorChart} style={{ height: '350px' }} />
        </div>
        <div className="card chinese-border">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">非遗级别分布</h3>
          <ReactECharts option={heritageChart} style={{ height: '350px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card chinese-border">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">内容类型分布</h3>
          <ReactECharts option={contentTypeChart} style={{ height: '300px' }} />
        </div>
        <div className="card chinese-border">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">内容状态分布</h3>
          <ReactECharts option={contentStatusChart} style={{ height: '300px' }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card chinese-border">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">今日审核统计</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">审核通过</span>
              <span className="text-2xl font-bold text-green-700">{auditStats?.todayApproved || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">审核驳回</span>
              <span className="text-2xl font-bold text-red-700">{auditStats?.todayRejected || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-700">待审总数</span>
              <span className="text-2xl font-bold text-amber-700">{auditStats?.totalPending || 0}</span>
            </div>
          </div>
        </div>
        <div className="card chinese-border lg:col-span-2">
          <h3 className="text-lg font-semibold text-ink-800 mb-4">消费券核销概览</h3>
          {couponStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-ink-50 rounded-lg">
                <p className="text-3xl font-bold text-primary-600">{couponStats.totalIssued?.toLocaleString() || 0}</p>
                <p className="text-sm text-ink-500 mt-1">累计发放(张)</p>
              </div>
              <div className="text-center p-4 bg-landscape-50 rounded-lg">
                <p className="text-3xl font-bold text-landscape-600">{couponStats.totalConsumed?.toLocaleString() || 0}</p>
                <p className="text-sm text-ink-500 mt-1">累计核销(张)</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <p className="text-3xl font-bold text-amber-600">{couponStats.consumptionRate?.toFixed(1) || 0}%</p>
                <p className="text-sm text-ink-500 mt-1">核销率</p>
              </div>
              <div className="text-center p-4 bg-porcelain-50 rounded-lg">
                <p className="text-3xl font-bold text-porcelain-600">¥{couponStats.totalAmount?.toLocaleString() || 0}</p>
                <p className="text-sm text-ink-500 mt-1">核销金额</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
