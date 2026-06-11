import { useState } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Home } from 'lucide-react';
import { organizations } from '@/mock/data';
import { Link } from 'react-router-dom';
import type { Store, Team } from '@/types';

type DrillLevel = 'company' | 'store' | 'team';

interface DrillState {
  level: DrillLevel;
  storeId?: string;
  teamId?: string;
}

export default function PerformanceDashboard() {
  const org = organizations[0];
  const [drill, setDrill] = useState<DrillState>({ level: 'company' });

  const totalRevenue = org.stores.reduce((s, st) => s + st.performance.totalRevenue, 0);
  const totalTransactions = org.stores.reduce((s, st) => s + st.performance.transactionCount, 0);
  const totalViewings = org.stores.reduce((s, st) => s + st.performance.viewingCount, 0);
  const avgConversion = (org.stores.reduce((s, st) => s + st.performance.conversionRate, 0) / org.stores.length).toFixed(1);

  const breadcrumbs = [
    { label: org.name, action: () => setDrill({ level: 'company' }) },
    ...(drill.level !== 'company' && drill.storeId ? [{ label: org.stores.find(s => s.id === drill.storeId)?.name || '', action: () => setDrill({ level: 'store', storeId: drill.storeId }) }] : []),
    ...(drill.level === 'team' && drill.teamId ? [{ label: org.stores.flatMap(s => s.teams).find(t => t.id === drill.teamId)?.name || '', action: () => {} }] : []),
  ];

  const renderMetrics = (metrics: { totalRevenue: number; transactionCount: number; averagePrice: number; viewingCount: number; conversionRate: number; monthOverMonth: number }) => (
    <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
      {[
        { label: '总营收', value: `${(metrics.totalRevenue / 10000).toFixed(1)}亿`, color: 'text-primary-600' },
        { label: '成交量', value: `${metrics.transactionCount}套`, color: 'text-gold-600' },
        { label: '均价', value: `${metrics.averagePrice}万`, color: 'text-surface-700' },
        { label: '带看量', value: `${metrics.viewingCount}次`, color: 'text-surface-700' },
        { label: '转化率', value: `${metrics.conversionRate}%`, color: 'text-status-success' },
        { label: '环比', value: `${metrics.monthOverMonth > 0 ? '+' : ''}${metrics.monthOverMonth}%`, color: metrics.monthOverMonth >= 0 ? 'text-status-success' : 'text-status-danger', icon: metrics.monthOverMonth >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" /> },
      ].map((m, i) => (
        <div key={i} className="card p-4 text-center">
          <p className="text-xs text-surface-500 mb-1">{m.label}</p>
          <div className={`text-lg font-bold ${m.color} flex items-center justify-center gap-1`}>
            {m.icon}
            {m.value}
          </div>
        </div>
      ))}
    </div>
  );

  const renderStoreRow = (store: Store) => (
    <div
      key={store.id}
      onClick={() => setDrill({ level: 'store', storeId: store.id })}
      className="card card-hover p-4 cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
          <Home className="w-5 h-5 text-primary-500" />
        </div>
        <div>
          <h4 className="font-medium text-surface-800">{store.name}</h4>
          <p className="text-xs text-surface-400">{store.address}</p>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-bold text-primary-600">{(store.performance.totalRevenue / 10000).toFixed(1)}亿</p>
          <p className="text-xs text-surface-400">营收</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gold-600">{store.performance.transactionCount}套</p>
          <p className="text-xs text-surface-400">成交</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${store.performance.monthOverMonth >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
          {store.performance.monthOverMonth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {store.performance.monthOverMonth > 0 ? '+' : ''}{store.performance.monthOverMonth}%
        </div>
        <ChevronRight className="w-4 h-4 text-surface-300" />
      </div>
    </div>
  );

  const renderTeamRow = (team: Team) => (
    <div
      key={team.id}
      onClick={() => setDrill({ level: 'team', storeId: drill.storeId, teamId: team.id })}
      className="card card-hover p-4 cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center">
          <span className="text-xs font-bold text-gold-600">{team.memberCount}人</span>
        </div>
        <h4 className="font-medium text-surface-800">{team.name}</h4>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-sm font-bold text-primary-600">{(team.performance.totalRevenue / 10000).toFixed(1)}亿</p>
          <p className="text-xs text-surface-400">营收</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${team.performance.monthOverMonth >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
          {team.performance.monthOverMonth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {team.performance.monthOverMonth > 0 ? '+' : ''}{team.performance.monthOverMonth}%
        </div>
        <ChevronRight className="w-4 h-4 text-surface-300" />
      </div>
    </div>
  );

  const currentStore = drill.storeId ? org.stores.find(s => s.id === drill.storeId) : null;
  const currentTeam = drill.teamId && currentStore ? currentStore.teams.find(t => t.id === drill.teamId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">业绩穿透看板</h2>
          <nav className="flex items-center gap-2 mt-1 text-sm text-surface-500">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <button onClick={b.action} className="hover:text-primary-500 transition-colors">{b.label}</button>
              </span>
            ))}
          </nav>
        </div>
        <Link to="/admin" className="btn-secondary text-xs">返回管理后台</Link>
      </div>

      {drill.level === 'company' && (
        <>
          {renderMetrics({ totalRevenue, transactionCount: totalTransactions, averagePrice: Math.round(totalRevenue / totalTransactions), viewingCount: totalViewings, conversionRate: Number(avgConversion), monthOverMonth: 3.5 })}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-surface-600 mt-2">门店业绩</h3>
            {org.stores.map(renderStoreRow)}
          </div>
        </>
      )}

      {drill.level === 'store' && currentStore && (
        <>
          {renderMetrics(currentStore.performance)}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-surface-600 mt-2">团队业绩</h3>
            {currentStore.teams.map(renderTeamRow)}
          </div>
        </>
      )}

      {drill.level === 'team' && currentTeam && (
        <>
          {renderMetrics(currentTeam.performance)}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-surface-600 mb-4">团队详情</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-surface-400">团队人数</p>
                <p className="text-lg font-bold text-surface-800">{currentTeam.memberCount}人</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">人均营收</p>
                <p className="text-lg font-bold text-primary-600">{(currentTeam.performance.totalRevenue / currentTeam.memberCount / 10000).toFixed(1)}亿</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">人均成交</p>
                <p className="text-lg font-bold text-gold-600">{(currentTeam.performance.transactionCount / currentTeam.memberCount).toFixed(1)}套</p>
              </div>
              <div>
                <p className="text-xs text-surface-400">人均带看</p>
                <p className="text-lg font-bold text-surface-700">{(currentTeam.performance.viewingCount / currentTeam.memberCount).toFixed(0)}次</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
