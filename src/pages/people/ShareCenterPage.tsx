import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Share2, Eye, TrendingUp, Copy, Check, Search, Filter, Download } from 'lucide-react';
import { getShareMaterials, getShareStatistics, generateShareLink } from '../../services/api';
import type { ShareMaterial, ShareStatistics } from '../../../shared/types';

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  poster: { label: '海报', icon: '🖼️', color: 'bg-purple-100 text-purple-700' },
  article: { label: '文章', icon: '📄', color: 'bg-blue-100 text-blue-700' },
  video: { label: '视频', icon: '🎬', color: 'bg-rose-100 text-rose-700' },
  image: { label: '图片', icon: '🖼️', color: 'bg-amber-100 text-amber-700' },
};

export default function ShareCenterPage() {
  const [materials, setMaterials] = useState<ShareMaterial[]>([]);
  const [statistics, setStatistics] = useState<ShareStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<ShareMaterial | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [materialsRes, statsRes] = await Promise.all([
        getShareMaterials(),
        getShareStatistics(),
      ]);
      if (materialsRes.code === 0) setMaterials(materialsRes.data);
      if (statsRes.code === 0) setStatistics(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async (material: ShareMaterial) => {
    try {
      const res = await generateShareLink({
        originalUrl: material.fileUrl,
        materialType: material.type,
      });
      if (res.code === 0) {
        await navigator.clipboard.writeText(res.data.shareUrl || res.data.shortCode);
        setCopiedId(material.id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
    }
  };

  const funnelOption = statistics ? {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        type: 'funnel',
        left: '10%',
        width: '80%',
        min: 0,
        max: statistics.totalViews,
        minSize: '0%',
        maxSize: '100%',
        sort: 'descending',
        gap: 2,
        label: {
          show: true,
          position: 'inside',
          formatter: '{b}\n{c}',
          fontSize: 12,
          color: '#fff'
        },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        emphasis: {
          label: {
            fontSize: 14
          }
        },
        data: [
          { value: statistics.totalShares, name: '分享次数', itemStyle: { color: '#059669' } },
          { value: statistics.totalViews, name: '浏览次数', itemStyle: { color: '#10b981' } },
          { value: statistics.totalConversions, name: '转化次数', itemStyle: { color: '#34d399' } },
        ]
      }
    ]
  } : {};

  const trendOption = statistics ? {
    tooltip: { trigger: 'axis' },
    legend: { data: ['分享数', '浏览数'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: statistics.dailyData.map(d => d.date.slice(5)),
      axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '分享数',
        type: 'bar',
        data: statistics.dailyData.map(d => d.shares),
        itemStyle: { color: '#059669', borderRadius: [4, 4, 0, 0] },
        barWidth: 12,
      },
      {
        name: '浏览数',
        type: 'line',
        smooth: true,
        data: statistics.dailyData.map(d => d.views),
        itemStyle: { color: '#2563eb' },
        lineStyle: { width: 3 },
        symbol: 'circle',
        symbolSize: 8,
      }
    ]
  } : {};

  const categories = [
    { key: 'all', label: '全部' },
    { key: 'poster', label: '海报' },
    { key: 'article', label: '文章' },
    { key: 'video', label: '视频' },
    { key: 'image', label: '图片' },
  ];

  const filteredMaterials = materials.filter(m => {
    const matchKeyword = !searchKeyword || m.title.includes(searchKeyword);
    const matchCategory = activeCategory === 'all' || m.type === activeCategory;
    return matchKeyword && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
              <Share2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总分享数</p>
              <p className="text-2xl font-bold text-gray-900 animate-number">{statistics?.totalShares || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-brand-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总浏览数</p>
              <p className="text-2xl font-bold text-gray-900 animate-number">{statistics?.totalViews || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">转化数</p>
              <p className="text-2xl font-bold text-gray-900 animate-number">{statistics?.totalConversions || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
              <span className="text-xl">%</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">转化率</p>
              <p className="text-2xl font-bold text-gray-900 animate-number">{statistics?.conversionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">转化漏斗分析</h3>
          <ReactECharts option={funnelOption} style={{ height: 280 }} />
        </div>
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近7天传播趋势</h3>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </div>
      </div>

      {statistics && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热门素材排行</h3>
          <div className="space-y-3">
            {statistics.topMaterials.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-gray-100 text-gray-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" /> {item.views} 浏览
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {item.conversions} 转化
                    </span>
                  </div>
                </div>
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
                    style={{ width: `${(item.views / statistics.topMaterials[0].views) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索素材..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </button>
        </div>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === cat.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaterials.map((material) => (
          <div
            key={material.id}
            className="card overflow-hidden group cursor-pointer transition-all duration-300 hover:-translate-y-1"
            onClick={() => setSelectedMaterial(material)}
          >
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
              <img
                src={material.thumbnailUrl}
                alt={material.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ display: material.thumbnailUrl.startsWith('/images') ? 'flex' : 'none' }}>
                {typeConfig[material.type]?.icon}
              </div>
              <span className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium ${typeConfig[material.type]?.color}`}>
                {typeConfig[material.type]?.label}
              </span>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateLink(material);
                  }}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  {copiedId === material.id ? (
                    <><Check className="w-4 h-4" /> 已复制</>
                  ) : (
                    <><Copy className="w-4 h-4" /> 生成链接</>
                  )}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{material.title}</h4>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3">{material.description}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {material.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Share2 className="w-4 h-4" /> {material.shareCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMaterial(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="aspect-video bg-gray-100 relative">
              <div className="absolute inset-0 flex items-center justify-center text-6xl">
                {typeConfig[selectedMaterial.type]?.icon}
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${typeConfig[selectedMaterial.type]?.color}`}>
                    {typeConfig[selectedMaterial.type]?.label}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900">{selectedMaterial.title}</h3>
                </div>
                <button onClick={() => setSelectedMaterial(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mb-6">{selectedMaterial.description}</p>
              <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {selectedMaterial.viewCount.toLocaleString()} 浏览</span>
                <span className="flex items-center gap-1"><Share2 className="w-4 h-4" /> {selectedMaterial.shareCount.toLocaleString()} 分享</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerateLink(selectedMaterial)}
                  className="btn btn-primary flex-1"
                >
                  {copiedId === selectedMaterial.id ? (
                    <><Check className="w-4 h-4 mr-2" /> 链接已复制</>
                  ) : (
                    <><Copy className="w-4 h-4 mr-2" /> 生成分享链接</>
                  )}
                </button>
                <button className="btn btn-secondary">
                  <Download className="w-4 h-4 mr-2" /> 下载素材
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
