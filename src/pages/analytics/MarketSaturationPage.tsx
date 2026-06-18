import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, AlertTriangle, TrendingUp, Users, MapPin, Download, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import { getMarketSaturation } from '../../services/api';
import type { MarketSaturationData } from '../../../shared/types';

export default function MarketSaturationPage() {
  const [data, setData] = useState<MarketSaturationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getMarketSaturation();
      if (res.code === 0) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  };

  const heatmapOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `
          <div style="padding: 8px;">
            <strong>${params.name}</strong><br/>
            饱和度: ${params.value}%<br/>
            直销员: ${params.data?.members || 0}人<br/>
            潜力等级: ${params.data?.potential || '中'}
          </div>
        `;
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      left: 'left',
      top: 'bottom',
      text: ['高', '低'],
      calculable: true,
      inRange: {
        color: ['#a7f3d0', '#34d399', '#10b981', '#059669', '#047857']
      }
    },
    geo: {
      map: 'china',
      roam: true,
      label: {
        show: true,
        fontSize: 10,
        color: '#6b7280'
      },
      itemStyle: {
        areaColor: '#f0fdf4',
        borderColor: '#059669',
        borderWidth: 1
      },
      emphasis: {
        itemStyle: {
          areaColor: '#d1fae5'
        },
        label: {
          color: '#059669'
        }
      }
    },
    series: [
      {
        type: 'map',
        map: 'china',
        data: [
          { name: '北京', value: 85, members: 1250, potential: '饱和' },
          { name: '天津', value: 72, members: 680, potential: '中' },
          { name: '上海', value: 92, members: 1580, potential: '饱和' },
          { name: '重庆', value: 45, members: 420, potential: '高' },
          { name: '河北', value: 58, members: 890, potential: '中' },
          { name: '河南', value: 52, members: 780, potential: '高' },
          { name: '山东', value: 65, members: 1200, potential: '中' },
          { name: '山西', value: 38, members: 280, potential: '高' },
          { name: '陕西', value: 42, members: 350, potential: '高' },
          { name: '甘肃', value: 22, members: 120, potential: '极高' },
          { name: '青海', value: 15, members: 68, potential: '极高' },
          { name: '四川', value: 48, members: 650, potential: '高' },
          { name: '湖南', value: 55, members: 720, potential: '中' },
          { name: '湖北', value: 50, members: 680, potential: '中' },
          { name: '广东', value: 78, members: 1450, potential: '中' },
          { name: '广西', value: 32, members: 280, potential: '高' },
          { name: '云南', value: 28, members: 220, potential: '极高' },
          { name: '贵州', value: 25, members: 180, potential: '极高' },
          { name: '江苏', value: 75, members: 1320, potential: '中' },
          { name: '浙江', value: 82, members: 1450, potential: '饱和' },
          { name: '安徽', value: 45, members: 520, potential: '高' },
          { name: '福建', value: 58, members: 680, potential: '中' },
          { name: '江西', value: 38, members: 380, potential: '高' },
          { name: '辽宁', value: 55, members: 650, potential: '中' },
          { name: '吉林', value: 42, members: 420, potential: '高' },
          { name: '黑龙江', value: 48, members: 520, potential: '高' },
          { name: '内蒙古', value: 28, members: 180, potential: '极高' },
          { name: '新疆', value: 18, members: 95, potential: '极高' },
          { name: '西藏', value: 8, members: 32, potential: '极高' },
          { name: '海南', value: 35, members: 220, potential: '高' },
          { name: '台湾', value: 0, members: 0, potential: '极高' },
          { name: '香港', value: 45, members: 350, potential: '高' },
          { name: '澳门', value: 38, members: 120, potential: '高' },
          { name: '宁夏', value: 25, members: 95, potential: '极高' },
        ]
      }
    ]
  };

  const stats = [
    { label: '已开发省份', value: 28, icon: MapPin, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '饱和区域', value: 4, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: '高潜力区域', value: 12, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '预警区域', value: 3, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

  const potentialColors: Record<string, { color: string; bg: string }> = {
    '极高': { color: 'text-purple-700', bg: 'bg-purple-100' },
    '高': { color: 'text-amber-700', bg: 'bg-amber-100' },
    '中': { color: 'text-blue-700', bg: 'bg-blue-100' },
    '饱和': { color: 'text-gray-700', bg: 'bg-gray-100' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const regionData = [
    { province: '北京', saturation: 85, members: 1250, potential: '饱和', trend: -2.1, suggestion: '优化结构，提升人均产出' },
    { province: '上海', saturation: 92, members: 1580, potential: '饱和', trend: 0.8, suggestion: '深耕细分市场，提升复购' },
    { province: '浙江', saturation: 82, members: 1450, potential: '饱和', trend: 3.5, suggestion: '维护现有团队，稳中有升' },
    { province: '广东', saturation: 78, members: 1450, potential: '中', trend: 5.2, suggestion: '加大培训投入，提升转化' },
    { province: '江苏', saturation: 75, members: 1320, potential: '中', trend: 4.8, suggestion: '加强团队建设，扩张市场' },
    { province: '山东', saturation: 65, members: 1200, potential: '中', trend: 6.2, suggestion: '重点开发，快速扩张' },
    { province: '四川', saturation: 48, members: 650, potential: '高', trend: 12.5, suggestion: '战略重点，资源倾斜' },
    { province: '河南', saturation: 52, members: 780, potential: '高', trend: 10.8, suggestion: '加大招商力度，快速起盘' },
    { province: '湖北', saturation: 50, members: 680, potential: '中', trend: 8.5, suggestion: '稳步推进，打好基础' },
    { province: '湖南', saturation: 55, members: 720, potential: '中', trend: 7.2, suggestion: '复制成功经验，加速拓展' },
    { province: '甘肃', saturation: 22, members: 120, potential: '极高', trend: 25.6, suggestion: '优先布局，抢先占领市场' },
    { province: '云南', saturation: 28, members: 220, potential: '极高', trend: 22.3, suggestion: '培育核心领导人，星火燎原' },
    { province: '贵州', saturation: 25, members: 180, potential: '极高', trend: 28.1, suggestion: '政策支持，打造样板市场' },
    { province: '新疆', saturation: 18, members: 95, potential: '极高', trend: 32.5, suggestion: '重点扶持，打造西部标杆' },
    { province: '西藏', saturation: 8, members: 32, potential: '极高', trend: 45.2, suggestion: '探索新模式，战略性布局' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">区域市场饱和度预警</h1>
          <p className="text-gray-500 mt-1">实时监控全国市场开发情况，精准定位高潜力区域</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索省份..." className="input pl-10 w-64" />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
          <button className="btn btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 animate-number">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">全国市场饱和度热力图</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-200"></span>
              低
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-500"></span>
              中
            </span>
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-green-700"></span>
              高
            </span>
          </div>
        </div>
        <ReactECharts option={heatmapOption} style={{ height: 450 }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">区域开发详情</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              数据更新于 10分钟前
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">省份</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">饱和度</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">直销员数</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">增长趋势</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">潜力等级</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">开发建议</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regionData.filter(r => r.potential === '极高' || r.potential === '高' || r.saturation >= 75).slice(0, 10).map((item, idx) => {
                  const potConfig = potentialColors[item.potential];
                  const saturationColor = item.saturation >= 80 ? 'bg-red-500' : item.saturation >= 50 ? 'bg-amber-500' : 'bg-green-500';

                  return (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedRegion(item.province)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary-600" />
                          <span className="font-medium text-gray-900">{item.province}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full ${saturationColor} rounded-full`} style={{ width: `${item.saturation}%` }}></div>
                          </div>
                          <span className="font-semibold text-gray-900">{item.saturation}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{item.members.toLocaleString()}人</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium flex items-center gap-1 ${item.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 rotate-180" />}
                          {item.trend >= 0 ? '+' : ''}{item.trend}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${potConfig.bg} ${potConfig.color}`}>
                          {item.potential}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.suggestion}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">高潜力区域推荐</h3>
            <div className="space-y-3">
              {regionData.filter(r => r.potential === '极高').slice(0, 5).map((item, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-r from-purple-50 to-amber-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">{item.province}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {item.potential}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-gray-500">饱和度</p>
                      <p className="font-semibold text-gray-900">{item.saturation}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">人员</p>
                      <p className="font-semibold text-gray-900">{item.members}人</p>
                    </div>
                    <div>
                      <p className="text-gray-500">增速</p>
                      <p className="font-semibold text-green-600">+{item.trend}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">饱和区域预警</h3>
            <div className="space-y-3">
              {regionData.filter(r => r.potential === '饱和').map((item, idx) => (
                <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      {item.province}
                    </span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      饱和度 {item.saturation}%
                    </span>
                  </div>
                  <p className="text-sm text-red-700">{item.suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">市场开发建议</h3>
            <div className="space-y-3">
              <div className="p-3 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-800">
                  <strong>战略方向：</strong>建议重点开发西北、西南市场，这些区域目前饱和度低，增长迅速，潜力巨大。
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>饱和区域：</strong>北上广深等一线城市应从规模扩张转向质量提升，提高人均产出。
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>资源配置：</strong>建议将60%的招商资源投向高潜力区域，快速抢占市场先机。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedRegion(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">{selectedRegion} 市场详情</h3>
              <button onClick={() => setSelectedRegion(null)} className="p-2 hover:bg-gray-100 rounded-lg">✕</button>
            </div>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">市场饱和度</p>
                <p className="text-2xl font-bold text-primary-600">
                  {regionData.find(r => r.province === selectedRegion)?.saturation}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">直销员数</p>
                <p className="text-2xl font-bold text-brand-600">
                  {regionData.find(r => r.province === selectedRegion)?.members.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">增长趋势</p>
                <p className="text-2xl font-bold text-green-600">
                  +{regionData.find(r => r.province === selectedRegion)?.trend}%
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500">潜力等级</p>
                <p className="text-2xl font-bold text-purple-600">
                  {regionData.find(r => r.province === selectedRegion)?.potential}
                </p>
              </div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
              <p className="text-amber-800">
                <strong>开发建议：</strong>{regionData.find(r => r.province === selectedRegion)?.suggestion}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedRegion(null)} className="btn btn-secondary">关闭</button>
              <button className="btn btn-primary">
                查看详细报告 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
