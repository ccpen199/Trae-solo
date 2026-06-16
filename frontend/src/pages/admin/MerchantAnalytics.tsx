import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminApi, merchantApi } from '../../api';
import { Card, Badge, Button, Avatar, ProgressBar } from '../../components/ui';
import { formatTime } from '../../utils/format';

const COLORS = ['#22c55e', '#f97316', '#ef4444', '#eab308', '#3b82f6'];

const MerchantAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState(id || '');

  useEffect(() => {
    const init = async () => {
      try {
        const mr = await merchantApi.nearby({ latitude: 39.9042, longitude: 116.4074, radius: 100000, limit: 100 });
        setMerchants(mr.merchants || mr || []);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await adminApi.merchantAnalytics(selectedId);
        setData(res);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedId]);

  const handleMerchantChange = (newId: string) => {
    setSelectedId(newId);
    navigate(`/admin/merchant/${newId}`, { replace: true });
  };

  const summary = data?.summary || {};
  const couponAnalytics = data?.couponAnalytics || [];
  const reviewPosts = data?.reviewPosts || [];
  const merchant = data?.merchant;

  const couponFunnelData = [
    { name: '投放数量', value: summary.totalCoupons ? couponAnalytics.reduce((s: number, c: any) => s + c.totalQuantity, 0) : 0, fill: '#3b82f6' },
    { name: '领取数量', value: summary.totalClaimed || 0, fill: '#f97316' },
    { name: '核销数量', value: summary.totalUsed || 0, fill: '#22c55e' },
  ];

  const couponEffectivenessData = couponAnalytics.map((c: any) => ({
    name: c.title.length > 8 ? c.title.slice(0, 8) + '...' : c.title,
    领取率: Number(c.claimRate.toFixed(1)),
    核销率: Number(c.redemptionRate.toFixed(1)),
  }));

  const reviewStats = reviewPosts.reduce(
    (acc: any, p: any) => {
      acc.totalLikes += p.likeCount;
      acc.totalComments += p.commentCount;
      acc.totalShares += p.shareCount;
      acc.totalViews += p.viewCount;
      return acc;
    },
    { totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">商户效能分析</h1>
            <p className="text-sm text-slate-500 mt-1">优惠券核销率 · 探店笔记转化路径</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">切换商户：</span>
            <select
              value={selectedId}
              onChange={e => handleMerchantChange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg min-w-[200px]"
            >
              <option value="">请选择商户</option>
              {merchants.filter(m => m.status === 'APPROVED').map((m: any) => (
                <option key={m.id} value={m.id}>{m.businessName}</option>
              ))}
            </select>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/governance')}>
            ← 返回驾驶舱
          </Button>
        </div>
      </div>

      {!selectedId ? (
        <Card className="p-16 text-center">
          <div className="text-6xl mb-4">🏪</div>
          <div className="text-lg font-medium text-slate-700 mb-2">请选择要分析的商户</div>
          <div className="text-sm text-slate-500">从右上角下拉框中选择一个商户查看详细效能分析</div>
        </Card>
      ) : loading ? (
        <Card className="p-12 text-center text-slate-500">加载分析数据中...</Card>
      ) : !data ? (
        <Card className="p-12 text-center text-slate-500">未找到该商户数据</Card>
      ) : (
        <>
          {merchant && (
            <Card className="p-5 overflow-hidden">
              <div className="flex items-center gap-5 flex-wrap">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg">
                  🏪
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-800">{merchant.businessName}</h2>
                    <Badge className="bg-green-50 text-green-700">
                      {merchant.licenseVerified ? '✅ 营业执照已核验' : '⏳ 核验中'}
                    </Badge>
                    <Badge className="bg-blue-50 text-blue-700">{merchant.category}</Badge>
                    {merchant.status === 'APPROVED' ? (
                      <Badge className="bg-green-100 text-green-700">正常营业</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700">{merchant.status}</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-4 flex-wrap text-sm text-slate-600">
                    <span>📍 {merchant.address}</span>
                    <span>📞 {merchant.phone}</span>
                    <span>⭐ {merchant.rating?.toFixed(1)} 分 / {merchant.reviewCount} 条评价</span>
                    <span className="text-slate-400">入驻: {formatTime(merchant.createdAt)}</span>
                  </div>
                  {merchant.description && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{merchant.description}</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-4 gap-4">
            <Card className="p-5 border-t-4 border-t-blue-500">
              <div className="text-xs text-slate-500">优惠券总数</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">{summary.totalCoupons}</div>
              <div className="mt-3 text-xs text-slate-400">券种丰富度</div>
            </Card>
            <Card className="p-5 border-t-4 border-t-orange-500">
              <div className="text-xs text-slate-500">累计领取</div>
              <div className="text-3xl font-bold text-orange-600 mt-1">{summary.totalClaimed}</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>领取转化率</span>
                  <span>
                    {couponAnalytics.reduce((s: number, c: any) => s + c.totalQuantity, 0) > 0
                      ? ((summary.totalClaimed / couponAnalytics.reduce((s: number, c: any) => s + c.totalQuantity, 0)) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <ProgressBar
                  value={couponAnalytics.reduce((s: number, c: any) => s + c.totalQuantity, 0) > 0
                    ? (summary.totalClaimed / couponAnalytics.reduce((s: number, c: any) => s + c.totalQuantity, 0)) * 100
                    : 0}
                />
              </div>
            </Card>
            <Card className="p-5 border-t-4 border-t-green-500">
              <div className="text-xs text-slate-500">累计核销</div>
              <div className="text-3xl font-bold text-green-600 mt-1">{summary.totalUsed}</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>综合核销率</span>
                  <span>{summary.overallRedemptionRate?.toFixed(1)}%</span>
                </div>
                <ProgressBar value={summary.overallRedemptionRate || 0} />
              </div>
            </Card>
            <Card className="p-5 border-t-4 border-t-purple-500">
              <div className="text-xs text-slate-500">探店笔记</div>
              <div className="text-3xl font-bold text-purple-600 mt-1">{summary.reviewCount}</div>
              <div className="mt-3 text-xs text-slate-400">
                平均点赞 <span className="text-purple-600 font-medium">{summary.avgLikesPerReview?.toFixed(1)}</span>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-bold text-slate-800 mb-4">🎟️ 优惠券转化漏斗</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={couponFunnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={70} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" name="数量" radius={[0, 8, 8, 0]} barSize={36}>
                    {couponFunnelData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 col-span-2">
              <h3 className="font-bold text-slate-800 mb-4">📈 各优惠券效果对比</h3>
              {couponEffectivenessData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={couponEffectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={12} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} formatter={(v: any) => [`${v}%`]} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="领取率" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="核销率" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
                  暂无优惠券数据
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Card className="p-5">
              <h3 className="font-bold text-slate-800 mb-4">💫 笔记互动分布</h3>
              {reviewStats.totalViews + reviewStats.totalLikes + reviewStats.totalComments + reviewStats.totalShares > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: '浏览量', value: reviewStats.totalViews },
                          { name: '点赞数', value: reviewStats.totalLikes },
                          { name: '评论数', value: reviewStats.totalComments },
                          { name: '分享数', value: reviewStats.totalShares },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={index} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[0] }}></div>
                      浏览: {reviewStats.totalViews}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[1] }}></div>
                      点赞: {reviewStats.totalLikes}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[2] }}></div>
                      评论: {reviewStats.totalComments}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded" style={{ background: COLORS[3] }}></div>
                      分享: {reviewStats.totalShares}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-slate-400 text-sm">
                  暂无互动数据
                </div>
              )}
            </Card>

            <Card className="p-5 col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">📋 优惠券明细</h3>
                <Badge className="bg-slate-100 text-slate-600">{couponAnalytics.length} 张券</Badge>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-auto">
                {couponAnalytics.map((c: any) => {
                  return (
                    <div key={c.id} className="p-4 rounded-xl bg-gradient-to-r from-orange-50/50 to-amber-50/50 border border-orange-100">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="font-medium text-slate-800">{c.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            投放 {c.totalQuantity} 张 · 已领 {c.claimedQuantity} 张 · 已用 {c.usedQuantity} 张
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-100 text-orange-700">
                              领取率 {c.claimRate.toFixed(1)}%
                            </Badge>
                            <Badge className="bg-green-100 text-green-700">
                              核销率 {c.redemptionRate.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>领取进度</span>
                            <span>{c.claimedQuantity}/{c.totalQuantity}</span>
                          </div>
                          <ProgressBar value={c.claimRate} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>核销进度</span>
                            <span>{c.usedQuantity}/{c.claimedQuantity}</span>
                          </div>
                          <ProgressBar value={c.redemptionRate} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {couponAnalytics.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">该商户暂无优惠券</div>
                )}
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">📝 探店笔记转化路径</h3>
              <Badge className="bg-purple-50 text-purple-700">{reviewPosts.length} 篇笔记</Badge>
            </div>
            {reviewPosts.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-3 px-2 font-medium">笔记标题</th>
                      <th className="py-3 px-2 font-medium">作者</th>
                      <th className="py-3 px-2 font-medium">发布时间</th>
                      <th className="py-3 px-2 font-medium text-center">浏览</th>
                      <th className="py-3 px-2 font-medium text-center">点赞</th>
                      <th className="py-3 px-2 font-medium text-center">评论</th>
                      <th className="py-3 px-2 font-medium text-center">分享</th>
                      <th className="py-3 px-2 font-medium text-center">特殊标识</th>
                      <th className="py-3 px-2 font-medium text-center">互动率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewPosts.map((p: any) => {
                      const engagement = p.viewCount > 0
                        ? (((p.likeCount + p.commentCount + p.shareCount) / p.viewCount) * 100).toFixed(1)
                        : '0';
                      return (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-2 font-medium text-slate-800 max-w-[200px] truncate">
                            {p.title || p.content?.slice(0, 30)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <Avatar name={p.user?.nickname || '?'} size="sm" />
                              <span className="text-slate-600">{p.user?.nickname}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-slate-500 text-xs">{formatTime(p.createdAt)}</td>
                          <td className="py-3 px-2 text-center text-slate-700">{p.viewCount}</td>
                          <td className="py-3 px-2 text-center text-blue-600 font-medium">{p.likeCount}</td>
                          <td className="py-3 px-2 text-center text-green-600 font-medium">{p.commentCount}</td>
                          <td className="py-3 px-2 text-center text-purple-600 font-medium">{p.shareCount}</td>
                          <td className="py-3 px-2 text-center">
                            <div className="flex justify-center gap-1">
                              {p.hasProof && <Badge className="bg-blue-50 text-blue-600 text-xs">凭证</Badge>}
                              {p.isPitfall && <Badge className="bg-red-50 text-red-600 text-xs">避坑</Badge>}
                              {p.priceAnchor && <Badge className="bg-orange-50 text-orange-600 text-xs">¥{p.priceAnchor}</Badge>}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`font-bold ${
                              Number(engagement) >= 10 ? 'text-green-600' :
                              Number(engagement) >= 5 ? 'text-orange-600' : 'text-slate-500'
                            }`}>
                              {engagement}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-sm">暂无探店笔记</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default MerchantAnalytics;
