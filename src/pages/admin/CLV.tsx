import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, TrendingUp, Users, DollarSign, Crown, Target, ArrowRight, Award } from 'lucide-react';
import { api } from '../../lib/api';
import type { CLVData } from '../../../shared/types';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; min: number }> = {
  premium: { label: '钻石客户', color: 'text-purple-600', bg: 'bg-purple-500', min: 3000 },
  high: { label: '高价值客户', color: 'text-blue-600', bg: 'bg-blue-500', min: 1500 },
  medium: { label: '潜力客户', color: 'text-orange-600', bg: 'bg-orange-500', min: 500 },
  low: { label: '普通客户', color: 'text-neutral-600', bg: 'bg-neutral-400', min: 0 },
};

export default function AdminCLV() {
  const [data, setData] = useState<{ list: CLVData[]; stats: any } | null>(null);

  useEffect(() => {
    api.admin.clv().then((d) => setData(d as any));
  }, []);

  if (!data) return <div className="p-10 text-center text-neutral-400">加载中...</div>;

  const tierCounts = data.stats.byTier || [];
  const totalCustomers = data.stats.totalCustomers || 0;
  const totalValue = data.stats.totalValue || 0;

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 人 ({d}%)' },
    legend: { bottom: 0, itemWidth: 12, itemHeight: 12, textStyle: { color: '#4E5969', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '42%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11, color: '#4E5969' },
      data: [
        { name: '钻石客户', value: tierCounts.find((t: any) => t.tier === 'premium')?.cnt || 0, itemStyle: { color: '#9333EA' } },
        { name: '高价值客户', value: tierCounts.find((t: any) => t.tier === 'high')?.cnt || 0, itemStyle: { color: '#0058FF' } },
        { name: '潜力客户', value: tierCounts.find((t: any) => t.tier === 'medium')?.cnt || 0, itemStyle: { color: '#FF6B1A' } },
        { name: '普通客户', value: tierCounts.find((t: any) => t.tier === 'low')?.cnt || 1, itemStyle: { color: '#C9CDD4' } },
      ],
    }],
  };

  const tierBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: ['普通', '潜力', '高价值', '钻石'],
      axisLine: { lineStyle: { color: '#E5E6EB' } },
      axisLabel: { color: '#86909C' },
    },
    yAxis: {
      type: 'value',
      name: '平均CLV (元)',
      splitLine: { lineStyle: { color: '#F2F3F5' } },
      axisLabel: { color: '#86909C' },
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      data: [
        { value: 320, itemStyle: { color: '#C9CDD4', borderRadius: [6, 6, 0, 0] } },
        { value: 780, itemStyle: { color: '#FF6B1A', borderRadius: [6, 6, 0, 0] } },
        { value: 2250, itemStyle: { color: '#0058FF', borderRadius: [6, 6, 0, 0] } },
        { value: 4200, itemStyle: { color: '#9333EA', borderRadius: [6, 6, 0, 0] } },
      ],
      label: { show: true, position: 'top', formatter: '¥{c}', color: '#4E5969', fontSize: 11 },
    }],
  };

  const kpis = [
    { label: '总客户数', value: totalCustomers, icon: Users, color: 'bg-blue-50 text-blue-500' },
    { label: '累计客户价值', value: `¥${(totalValue / 10000).toFixed(1)}万`, icon: DollarSign, color: 'bg-green-50 text-green-500' },
    { label: '平均CLV', value: `¥${totalCustomers > 0 ? Math.round(totalValue / totalCustomers) : 0}`, icon: BarChart3, color: 'bg-orange-50 text-orange-500' },
    { label: '高价值客户占比', value: '32%', icon: Crown, color: 'bg-purple-50 text-purple-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-700 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            客户生命周期价值 (CLV) 分析
          </h1>
          <p className="text-sm text-neutral-500 mt-1">基于历史订单、消费频次与流失风险预测客户终身价值</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-full text-xs text-purple-600">
          <Award className="w-3.5 h-3.5" />
          RFM 模型计算
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
            <div className={`w-11 h-11 rounded-xl ${k.color} flex items-center justify-center mb-4`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold text-neutral-700 mb-1">{k.value}</div>
            <div className="text-sm text-neutral-500">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <h3 className="font-bold text-neutral-700 mb-4">客户分层占比</h3>
          <ReactECharts option={pieOption} style={{ height: 300 }} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
          <h3 className="font-bold text-neutral-700 mb-4">各层级平均 CLV 对比</h3>
          <ReactECharts option={tierBarOption} style={{ height: 300 }} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Crown className="w-10 h-10 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">PREMIUM</span>
          </div>
          <div className="text-sm opacity-80 mb-1">钻石客户</div>
          <div className="text-3xl font-bold mb-3">
            {tierCounts.find((t: any) => t.tier === 'premium')?.cnt || 0} 人
          </div>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <TrendingUp className="w-4 h-4" />
            累计贡献 ¥{((tierCounts.find((t: any) => t.tier === 'premium')?.total_score || 0) / 10000).toFixed(1)}万
          </div>
        </div>

        <div className="bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-10 h-10 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">HIGH VALUE</span>
          </div>
          <div className="text-sm opacity-80 mb-1">高价值客户</div>
          <div className="text-3xl font-bold mb-3">
            {tierCounts.find((t: any) => t.tier === 'high')?.cnt || 0} 人
          </div>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <TrendingUp className="w-4 h-4" />
            累计贡献 ¥{((tierCounts.find((t: any) => t.tier === 'high')?.total_score || 0) / 10000).toFixed(1)}万
          </div>
        </div>

        <div className="bg-gradient-to-br from-accent-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 opacity-80" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">MEDIUM</span>
          </div>
          <div className="text-sm opacity-80 mb-1">潜力客户</div>
          <div className="text-3xl font-bold mb-3">
            {tierCounts.find((t: any) => t.tier === 'medium')?.cnt || 0} 人
          </div>
          <div className="flex items-center gap-1 text-sm opacity-90">
            <ArrowRight className="w-4 h-4" />
            可通过营销活动转化为高价值客户
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-neutral-700">高价值客户明细 TOP 10</h3>
          <span className="text-xs text-neutral-400">按 CLV 分值降序排列</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500 border-b border-neutral-200">
                <th className="py-3 px-4 font-medium">排名</th>
                <th className="py-3 px-4 font-medium">客户ID</th>
                <th className="py-3 px-4 font-medium">订单数</th>
                <th className="py-3 px-4 font-medium">累计消费</th>
                <th className="py-3 px-4 font-medium">客单价</th>
                <th className="py-3 px-4 font-medium">月均下单</th>
                <th className="py-3 px-4 font-medium">流失风险</th>
                <th className="py-3 px-4 font-medium">CLV 评分</th>
                <th className="py-3 px-4 font-medium">层级</th>
              </tr>
            </thead>
            <tbody>
              {data.list.slice(0, 10).map((c, i) => {
                const tier = TIER_CONFIG[c.tier];
                return (
                  <tr key={c.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 px-4">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-100 text-yellow-600' :
                        i === 1 ? 'bg-neutral-100 text-neutral-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-brand-50 text-brand-500'
                      }`}>
                        {i + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700">#{String(c.customerId).padStart(6, '0')}</td>
                    <td className="py-3 px-4 text-neutral-700">{c.totalOrders}</td>
                    <td className="py-3 px-4 font-semibold text-neutral-700">¥{c.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-neutral-600">¥{c.avgOrderValue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-neutral-600">{c.orderFrequency.toFixed(2)} 次</td>
                    <td className="py-3 px-4">
                      <span className={`tag ${c.churnRisk > 0.3 ? 'tag-red' : c.churnRisk > 0.15 ? 'tag-orange' : 'tag-green'}`}>
                        {(c.churnRisk * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-700">¥{c.clvScore.toFixed(2)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`tag ${tier?.bg} text-white !px-2.5`}>{tier?.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
