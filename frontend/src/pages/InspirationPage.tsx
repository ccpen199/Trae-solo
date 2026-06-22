import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiApi } from '../services/api';
import { formatCurrency, fromNow, getInitials, CONSTRUCTION_STAGE_LABELS, HOUSE_TYPE_LABELS } from '../utils/constants';
import type { Diary } from '../types';

export default function InspirationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res: any = await aiApi.getInspirationGraph({ limit: 100 });
        if (res?.success) setData(res.data);
      } catch (_) { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const styles = data?.distributions?.styles ? Object.entries(data.distributions.styles)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count) : [];

  const materials = data?.distributions?.materials ? Object.entries(data.distributions.materials)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count) : [];

  const brands = data?.distributions?.brands ? Object.entries(data.distributions.brands)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count) : [];

  const maxStyleCount = styles[0]?.count || 1;
  const maxMaterialCount = materials[0]?.count || 1;
  const maxBrandCount = brands[0]?.count || 1;

  if (loading) return <div className="text-center py-20 text-gray-500">生成灵感图谱中...</div>;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 sm:p-12 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">🎨 装修灵感图谱</h1>
        <p className="text-white/80 text-lg max-w-xl">AI智能分析社区真实装修案例，生成风格、材质、品牌的关联图谱，帮您找到装修灵感</p>
        {data?.statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-3xl font-bold">{data.statistics.totalDiaries}</p>
              <p className="text-white/70 text-sm mt-1">分析案例</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-3xl font-bold">{data.statistics.styleCount}</p>
              <p className="text-white/70 text-sm mt-1">风格类型</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-3xl font-bold">{data.statistics.materialCount}</p>
              <p className="text-white/70 text-sm mt-1">材质种类</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <p className="text-3xl font-bold">{data.statistics.brandCount}</p>
              <p className="text-white/70 text-sm mt-1">识别品牌</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">🎨 风格分布</h2>
            <span className="text-xs text-gray-500">社区热门风格</span>
          </div>
          <div className="space-y-3">
            {styles.slice(0, 12).map((style, i) => {
              const percent = (style.count / maxStyleCount) * 100;
              const hue = (i * 30) % 360;
              return (
                <button key={style.name} onClick={() => setActiveStyle(activeStyle === style.name ? null : style.name)} className={`w-full text-left transition-all p-2 rounded-xl ${activeStyle === style.name ? 'bg-primary-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900">{style.name}</span>
                    <span className="text-sm font-bold text-gray-700">{style.count}篇</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: `hsl(${hue}, 70%, 60%)` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">🧱 材质热度</h2>
            <span className="text-xs text-gray-500">常见装修材质</span>
          </div>
          <div className="space-y-3">
            {materials.slice(0, 12).map((m, i) => {
              const percent = (m.count / maxMaterialCount) * 100;
              return (
                <div key={m.name} className="p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900">{m.name}</span>
                    <span className="text-sm font-bold text-amber-700">{m.count}次</span>
                  </div>
                  <div className="h-2 bg-amber-50 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">💰 预算区间分布</h2>
        {data?.distributions?.budgets && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(data.distributions.budgets).map(([range, count]) => (
              <div key={range} className="p-5 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl text-center">
                <p className="text-2xl font-bold text-purple-700">{count as number}</p>
                <p className="text-xs text-gray-600 mt-1">{range}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {brands.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">🏷️ 热门品牌识别</h2>
          <div className="flex flex-wrap gap-3">
            {brands.slice(0, 20).map((brand, i) => {
              const scale = 0.75 + 0.75 * (brand.count / maxBrandCount);
              return (
                <span key={brand.name} className="px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow" style={{ fontSize: `${scale}rem` }}>
                  {brand.name}
                  <span className="ml-2 text-xs text-gray-400">×{brand.count}</span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {data?.graph?.nodes?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-5">🕸️ 风格-材质关联图</h2>
          <div className="relative h-96 bg-gray-50 rounded-2xl overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400">
              {data.graph.edges?.slice(0, 50).map((edge: any, i: number) => {
                const sourceNode = data.graph.nodes.find((n: any) => n.id === edge.source);
                const targetNode = data.graph.nodes.find((n: any) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;
                const sx = (Math.abs(edge.source.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % 300) + 100;
                const sy = (Math.abs(edge.source.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 1)) % 300) + 50;
                const tx = (Math.abs(edge.target.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 2)) % 300) + 450;
                const ty = (Math.abs(edge.target.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 3)) % 300) + 50;
                return <line key={i} x1={sx} y1={sy} x2={tx} y2={ty} stroke="#e8d4b8" strokeWidth={1} opacity={0.6} />;
              })}
            </svg>
            {data.graph.nodes.slice(0, 30).map((node: any, i: number) => {
              const isStyle = node.type === 'style';
              const baseX = isStyle ? ((i * 137) % 300) + 50 : ((i * 173) % 300) + 450;
              const baseY = ((i * 97) % 320) + 40;
              const size = Math.max(40, Math.min(80, 40 + node.value * 3));
              return (
                <div
                  key={node.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full font-semibold text-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
                  style={{
                    left: `${baseX / 8}%`,
                    top: `${baseY / 4}%`,
                    width: size,
                    height: size,
                    background: isStyle ? node.color : `hsl(${20 + (i * 25) % 40}, 70%, 55%)`,
                    fontSize: Math.max(10, size / 5.5)
                  }}
                  title={`${node.name} (${node.value})`}
                >
                  <span className="px-2 text-center leading-tight">{node.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">💡 灵感推荐案例</h2>
          {activeStyle && <span className="badge bg-primary-100 text-primary-700">筛选: {activeStyle}</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(data?.recommendations || data?.rawDiaries || []).slice(0, 12).filter((d: Diary) => {
            if (!activeStyle) return true;
            return d.styleTags?.some(s => s === activeStyle || s.includes(activeStyle) || activeStyle.includes(s));
          }).map((d: Diary) => {
            const stageInfo = CONSTRUCTION_STAGE_LABELS[d.constructionStage];
            const author = typeof d.userId === 'string' ? { username: '用户', avatar: '', nickname: '' } : d.userId as any;
            return (
              <Link key={d._id} to={`/diaries/${d._id}`} className="card group hover:-translate-y-1 transition-all">
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <img src={d.coverImage || `https://picsum.photos/seed/${d._id}/600/450`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {stageInfo && <div className={`absolute top-3 left-3 badge ${stageInfo.bg} ${stageInfo.color} text-[10px]`}>{stageInfo.label}</div>}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{d.title}</h3>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-gray-500">{HOUSE_TYPE_LABELS[d.houseType] || d.houseType} · {d.houseArea}㎡</span>
                    <span className="font-semibold text-primary-700">{formatCurrency(d.budget?.totalEstimated || 0)}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      {author.avatar ? <img src={author.avatar} className="w-4 h-4 rounded-full" /> : <span>{getInitials(author.nickname || author.username)}</span>}
                      <span>{author.nickname || author.username}</span>
                    </div>
                    <span>{fromNow(d.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
