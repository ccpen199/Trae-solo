import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Search, Filter, Users, TrendingUp, UserPlus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { getTeamFission } from '../../services/api';
import type { TeamFissionNode } from '../../../shared/types';

export default function TeamFissionPage() {
  const [teamData, setTeamData] = useState<TeamFissionNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([0, 1]);
  const [selectedNode, setSelectedNode] = useState<TeamFissionNode | null>(null);

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const res = await getTeamFission();
      if (res.code === 0) {
        setTeamData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch team data:', err);
    } finally {
      setLoading(false);
    }
  };

  const countDescendants = (node: TeamFissionNode): number => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.length + node.children.reduce((sum, child) => sum + countDescendants(child), 0);
  };

  const flattenTree = (node: TeamFissionNode, level: number): Array<{ node: TeamFissionNode; level: number }> => {
    const result: Array<{ node: TeamFissionNode; level: number }> = [{ node, level }];
    if (node.children && expandedLevels.includes(level)) {
      node.children.forEach(child => {
        result.push(...flattenTree(child, level + 1));
      });
    }
    return result;
  };

  const treeOption = teamData ? {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data;
        return `
          <div style="padding: 8px;">
            <strong>${data.name}</strong><br/>
            层级: ${data.level}<br/>
            团队人数: ${data.value}<br/>
            业绩: ¥${data.sales || 0}万
          </div>
        `;
      }
    },
    series: [
      {
        type: 'tree',
        top: '10%',
        left: '10%',
        bottom: '10%',
        right: '10%',
        symbolSize: 14,
        orient: 'LR',
        expandAndCollapse: true,
        initialTreeDepth: 2,
        animationDuration: 550,
        animationDurationUpdate: 750,
        lineStyle: {
          color: '#059669',
          width: 2,
          curveness: 0.5
        },
        label: {
          position: 'left',
          verticalAlign: 'middle',
          align: 'right',
          fontSize: 12,
          formatter: '{b}'
        },
        leaves: {
          label: {
            position: 'right',
            verticalAlign: 'middle',
            align: 'left'
          }
        },
        emphasis: {
          focus: 'descendant'
        },
        data: [
          {
            name: teamData.name,
            value: countDescendants(teamData) + 1,
            children: teamData.children?.map(child => ({
              name: child.name,
              value: countDescendants(child) + 1,
              itemStyle: { color: child.level === 1 ? '#10b981' : '#34d399' },
              children: child.children?.map(grandchild => ({
                name: grandchild.name,
                value: countDescendants(grandchild) + 1,
                itemStyle: { color: grandchild.level === 2 ? '#6ee7b7' : '#a7f3d0' },
              }))
            }))
          }
        ]
      }
    ]
  } : {};

  const stats = [
    { label: '总团队人数', value: teamData ? countDescendants(teamData) + 1 : 0, icon: Users, color: 'text-primary-600', bg: 'bg-primary-100' },
    { label: '团队层级', value: 5, icon: TrendingUp, color: 'text-brand-600', bg: 'bg-brand-100' },
    { label: '本月新增', value: 18, icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: '预警人数', value: 2, icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100' },
  ];

  const levelConfig: Record<number, { label: string; color: string }> = {
    0: { label: '总部', color: 'text-primary-700 bg-primary-100' },
    1: { label: '一级经销商', color: 'text-green-700 bg-green-100' },
    2: { label: '二级经销商', color: 'text-blue-700 bg-blue-100' },
    3: { label: '三级经销商', color: 'text-purple-700 bg-purple-100' },
    4: { label: '直销员', color: 'text-gray-700 bg-gray-100' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const allNodes = teamData ? flattenTree(teamData, 0) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">团队裂变图谱</h1>
          <p className="text-gray-500 mt-1">穿透式查看团队结构，实时掌握团队裂变情况</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="搜索团队成员..." className="input pl-10 w-64" />
          </div>
          <button className="btn btn-secondary">
            <Filter className="w-4 h-4 mr-2" />
            筛选
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
          <h3 className="text-lg font-semibold text-gray-900">团队组织结构图</h3>
          <div className="flex items-center gap-4">
            {[0, 1, 2, 3, 4].map(level => (
              <button
                key={level}
                onClick={() => {
                  if (expandedLevels.includes(level)) {
                    setExpandedLevels(expandedLevels.filter(l => l !== level));
                  } else {
                    setExpandedLevels([...expandedLevels, level]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${expandedLevels.includes(level) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {levelConfig[level]?.label || `层级${level}`}
              </button>
            ))}
          </div>
        </div>
        <ReactECharts option={treeOption} style={{ height: 400 }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">团队成员明细</h3>
            <span className="text-sm text-gray-500">共 {allNodes.length} 人</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-auto">
            {allNodes.map((item, idx) => {
              const config = levelConfig[item.level] || levelConfig[4];
              const descendantCount = countDescendants(item.node);
              const hasChildren = item.node.children && item.node.children.length > 0;
              const isExpanded = expandedLevels.includes(item.level);

              return (
                <div
                  key={idx}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ paddingLeft: `${item.level * 24 + 16}px` }}
                  onClick={() => setSelectedNode(item.node)}
                >
                  <div className="flex items-center gap-3">
                    {hasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isExpanded) {
                            setExpandedLevels(expandedLevels.filter(l => l !== item.level));
                          } else {
                            setExpandedLevels([...expandedLevels, item.level]);
                          }
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    {!hasChildren && <div className="w-6"></div>}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {item.node.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{item.node.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        团队 {descendantCount + 1} 人 · 业绩 ¥{item.node.sales || 0}万
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary-600">¥{item.node.sales || 0}万</p>
                      <p className="text-xs text-gray-500">本月业绩</p>
                    </div>
                    {(item.node.warning || item.node.sales === 0) && (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {selectedNode && (
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedNode.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedNode.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelConfig[selectedNode.level]?.color || levelConfig[4].color}`}>
                    {levelConfig[selectedNode.level]?.label || '直销员'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">本月业绩</p>
                  <p className="text-2xl font-bold text-primary-600">¥{selectedNode.sales || 0}万</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">下属团队</p>
                  <p className="text-2xl font-bold text-brand-600">{countDescendants(selectedNode) + 1}人</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">本月新增</p>
                  <p className="text-2xl font-bold text-green-600">{selectedNode.newMembers || 0}人</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">职级</p>
                  <p className="text-2xl font-bold text-amber-600">{selectedNode.levelTitle || '中级经销商'}</p>
                </div>
              </div>

              {(selectedNode.warning || selectedNode.sales === 0) && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>预警提示：</strong>
                      {selectedNode.warning || '连续2个月业绩为0，建议关注'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">预警成员</h3>
            <div className="space-y-3">
              {[
                { name: '张三', level: 2, reason: '连续2个月无业绩', days: 60 },
                { name: '李四', level: 3, reason: '本月业绩下滑80%', days: 30 },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                      {item.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.reason}</p>
                    </div>
                    <span className="text-xs text-amber-600">{item.days}天</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
