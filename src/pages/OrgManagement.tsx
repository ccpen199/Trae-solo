import { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Store as StoreIcon, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { organizations } from '@/mock/data';
import type { Store, Team, PerformanceMetrics } from '@/types';

type SelectedNode = { type: 'store'; data: Store; orgName: string } | { type: 'team'; data: Team; storeName: string; orgName: string } | null;

function MetricRow({ label, value, unit, trend }: { label: string; value: string | number; unit?: string; trend?: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
      <span className="text-sm text-surface-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-surface-800">{value}{unit || ''}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}

function PerformancePanel({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div>
      <MetricRow label="总营收" value={(metrics.totalRevenue / 10000).toFixed(1)} unit="万" trend={metrics.monthOverMonth} />
      <MetricRow label="成交量" value={metrics.transactionCount} unit="笔" />
      <MetricRow label="均价" value={(metrics.averagePrice / 10000).toFixed(1)} unit="万" />
      <MetricRow label="带看量" value={metrics.viewingCount} unit="次" />
      <MetricRow label="转化率" value={metrics.conversionRate} unit="%" />
      <MetricRow label="环比" value={`${metrics.monthOverMonth >= 0 ? '+' : ''}${metrics.monthOverMonth}%`} trend={metrics.monthOverMonth} />
    </div>
  );
}

export default function OrgManagement() {
  const [expandedOrgs, setExpandedOrgs] = useState<Set<string>>(new Set(['org1']));
  const [expandedStores, setExpandedStores] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);

  const toggleOrg = (id: string) => {
    setExpandedOrgs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleStore = (id: string) => {
    setExpandedStores((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-surface-50 rounded-xl p-4 shadow-card border border-surface-200 max-h-[80vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-primary-800 mb-3">组织架构</h3>
        <div className="space-y-1">
          {organizations.map((org) => (
            <div key={org.id}>
              <div
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-surface-100 transition-colors"
                onClick={() => toggleOrg(org.id)}
              >
                {expandedOrgs.has(org.id) ? (
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-surface-400" />
                )}
                <Building2 className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-surface-800">{org.name}</span>
                <span className="ml-auto text-xs text-surface-400">{org.stores.length}门店</span>
              </div>
              {expandedOrgs.has(org.id) && (
                <div className="ml-5 space-y-0.5">
                  {org.stores.map((store) => (
                    <div key={store.id}>
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-surface-100 transition-colors"
                        onClick={() => {
                          toggleStore(store.id);
                          setSelectedNode({ type: 'store', data: store, orgName: org.name });
                        }}
                      >
                        {expandedStores.has(store.id) ? (
                          <ChevronDown className="w-3.5 h-3.5 text-surface-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-surface-400" />
                        )}
                        <StoreIcon className="w-3.5 h-3.5 text-gold-400" />
                        <span className={`text-sm ${selectedNode?.type === 'store' && (selectedNode.data as Store).id === store.id ? 'text-primary-700 font-medium' : 'text-surface-600'}`}>
                          {store.name}
                        </span>
                      </div>
                      {expandedStores.has(store.id) && (
                        <div className="ml-7 space-y-0.5">
                          {store.teams.map((team) => (
                            <div
                              key={team.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-surface-100 transition-colors ${
                                selectedNode?.type === 'team' && (selectedNode.data as Team).id === team.id ? 'bg-primary-50' : ''
                              }`}
                              onClick={() => setSelectedNode({ type: 'team', data: team, storeName: store.name, orgName: org.name })}
                            >
                              <Users className="w-3.5 h-3.5 text-surface-400" />
                              <span className={`text-sm ${selectedNode?.type === 'team' && (selectedNode.data as Team).id === team.id ? 'text-primary-700 font-medium' : 'text-surface-600'}`}>
                                {team.name}
                              </span>
                              <span className="ml-auto text-xs text-surface-400">{team.memberCount}人</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedNode ? (
          <div className="bg-surface-50 rounded-xl p-5 shadow-card border border-surface-200">
            {selectedNode.type === 'store' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <StoreIcon className="w-5 h-5 text-gold-400" />
                  <h3 className="text-lg font-semibold text-primary-800">{selectedNode.data.name}</h3>
                </div>
                <p className="text-sm text-surface-400 mb-4">{selectedNode.orgName} · {selectedNode.data.address}</p>
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-surface-600 mb-2">门店业绩</h4>
                  <PerformancePanel metrics={selectedNode.data.performance} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-surface-600 mb-3">下属团队</h4>
                  <div className="space-y-2">
                    {selectedNode.data.teams.map((team) => (
                      <div key={team.id} className="p-3 rounded-lg border border-surface-200 hover:border-primary-200 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary-400" />
                            <span className="font-medium text-surface-800">{team.name}</span>
                          </div>
                          <span className="text-xs text-surface-400">{team.memberCount}人</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                          <div><span className="text-surface-400">营收</span><div className="font-semibold text-surface-700">{(team.performance.totalRevenue / 10000).toFixed(1)}万</div></div>
                          <div><span className="text-surface-400">成交</span><div className="font-semibold text-surface-700">{team.performance.transactionCount}笔</div></div>
                          <div>
                            <span className="text-surface-400">环比</span>
                            <div className={`font-semibold ${team.performance.monthOverMonth >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                              {team.performance.monthOverMonth >= 0 ? '+' : ''}{team.performance.monthOverMonth}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {selectedNode.type === 'team' && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-semibold text-primary-800">{selectedNode.data.name}</h3>
                </div>
                <p className="text-sm text-surface-400 mb-4">{selectedNode.orgName} · {selectedNode.storeName} · {selectedNode.data.memberCount}人</p>
                <h4 className="text-sm font-semibold text-surface-600 mb-2">团队业绩</h4>
                <PerformancePanel metrics={selectedNode.data.performance} />
              </>
            )}
          </div>
        ) : (
          <div className="bg-surface-50 rounded-xl p-12 shadow-card border border-surface-200 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-surface-300" />
            <p className="text-surface-400">请在左侧选择门店或团队查看详情</p>
          </div>
        )}
      </div>
    </div>
  );
}
