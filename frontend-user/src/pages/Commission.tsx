import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { commissionApi } from '../api/modules';
import { useToast } from '../App';
import Header from '../components/Header';

export default function Commission() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<'records' | 'team'>('records');
  const [records, setRecords] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [referrals, setReferrals] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    commissionApi.records({ limit: 50 }).then((res: any) => {
      if (res.success) setRecords(res.data || []);
    });
    commissionApi.team({ days: 30 }).then((res: any) => {
      if (res.success) setTeam(res.data);
    });
    commissionApi.referrals().then((res: any) => {
      if (res.success) setReferrals(res.data);
    });
  };

  const doWithdraw = async () => {
    if (!team) return;
    const amt = window.prompt(`请输入提现金额（最低10元）可提 ¥${Number(team?.totalCommission || 0).toFixed(2)}`, '10');
    if (!amt || isNaN(Number(amt))) return;
    setWithdrawing(true);
    try {
      const res: any = await commissionApi.withdraw({ amount: Number(amt) });
      if (res.success) {
        toast.show('提现申请已提交', 'success');
        loadData();
      } else {
        toast.show(res.message || '提现失败', 'error');
      }
    } catch (e: any) {
      toast.show(e.message, 'error');
    } finally {
      setWithdrawing(false);
    }
  };

  const formatTime = (t: number) => {
    if (!t) return '-';
    const d = new Date(t * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div>
      <Header title="佣金中心" />
      
      <div style={{
        margin: 16,
        padding: 24,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        color: 'white'
      }}>
        <div style={{ fontSize: 13, opacity: 0.9 }}>累计佣金收益(元)</div>
        <div style={{ fontSize: 44, fontWeight: 800, marginTop: 4 }}>
          ¥{Number(team?.totalCommission || 0).toFixed(2)}
        </div>
        <div className="grid-3" style={{ marginTop: 20 }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>可提现</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              ¥{team?.totalCommission ? (team.totalCommission * 0.7).toFixed(2) : '0.00'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>团队人数</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{team?.memberCount || 0}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>团队销售</div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>
              ¥{Number(team?.totalSales || 0).toFixed(0)}
            </div>
          </div>
        </div>
        <button onClick={doWithdraw} disabled={withdrawing}
          style={{
            marginTop: 20, width: '100%',
            padding: 12, borderRadius: 12,
            background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
            fontSize: 15, fontWeight: 600,
            backdropFilter: 'blur(10px)'
          }}>
          {withdrawing ? '处理中...' : '立即提现'}
        </button>
      </div>

      <div style={{ display: 'flex', margin: '0 16px', background: 'white', borderRadius: 12, overflow: 'hidden' }}>
        <button onClick={() => setTab('records')}
          style={{
            flex: 1, padding: '12px 0',
            background: tab === 'records' ? '#667eea' : 'transparent',
            color: tab === 'records' ? 'white' : '#666',
            fontWeight: tab === 'records' ? 600 : 500, fontSize: 14
          }}>
          📜 佣金明细
        </button>
        <button onClick={() => setTab('team')}
          style={{
            flex: 1, padding: '12px 0',
            background: tab === 'team' ? '#667eea' : 'transparent',
            color: tab === 'team' ? 'white' : '#666',
            fontWeight: tab === 'team' ? 600 : 500, fontSize: 14
          }}>
          👥 我的团队
        </button>
      </div>

      {tab === 'records' ? (
        <div className="card">
          {records.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💰</div>暂无佣金记录
            </div>
          ) : (
            records.map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: i < records.length - 1 ? '1px solid #f5f5f5' : 'none'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>
                    {r.level === 1 ? '一级' : r.level === 2 ? '二级' : '三级'}推荐收益
                  </div>
                  <div className="text-sm text-gray mt-8">
                    {r.from_nickname || '好友'} · {r.product_name || '商品'}
                  </div>
                  <div className="text-sm text-gray">
                    {formatTime(r.created_at)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#ff4d4f', fontWeight: 700, fontSize: 16 }}>+¥{r.amount}</div>
                  <div>
                    <span className={`tag ${r.status === 'settled' ? 'tag-green' : r.status === 'pending' ? 'tag-orange' : 'tag-gray'}`}
                      style={{ marginTop: 6, float: 'right' }}>
                      {r.status === 'settled' ? '已结算' : r.status === 'pending' ? '待结算' : r.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div>
          {team?.levels && (
            <div className="card">
              <div className="text-bold mb-12">📊 团队业绩分布</div>
              {[1, 2, 3].map(lvl => {
                const data = team.levels[lvl];
                return (
                  <div key={lvl} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                    borderBottom: lvl < 3 ? '1px solid #f5f5f5' : 'none'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: lvl === 1 ? '#f6ffed' : lvl === 2 ? '#fff7e6' : '#fff1f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700,
                      color: lvl === 1 ? '#52c41a' : lvl === 2 ? '#faad14' : '#ff4d4f'
                    }}>
                      L{lvl}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>
                        {lvl === 1 ? '直接推荐' : lvl === 2 ? '二级推荐' : '三级推荐'}
                      </div>
                      <div className="text-sm text-gray">
                        {data?.count || 0}人 · 销售¥{Number(data?.sales || 0).toFixed(0)} · 佣金¥{Number(data?.commission || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {referrals?.grouped && Object.keys(referrals.grouped).length > 0 && (
            <div className="card" style={{ marginTop: 0 }}>
              <div className="text-bold mb-12">👥 团队成员</div>
              {[1, 2, 3].map(lvl => (
                referrals.grouped[lvl]?.length > 0 && (
                  <div key={lvl}>
                    <div style={{ padding: '8px 0', fontSize: 13, color: '#999' }}>
                      L{lvl} · {lvl === 1 ? '直接' : '间接'}推荐 {referrals.grouped[lvl].length} 人
                    </div>
                    {referrals.grouped[lvl].map((u: any) => (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center',
                        padding: '10px 0', gap: 12
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: '#f0f4ff',
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14, fontWeight: 600, color: '#667eea'
                        }}>
                          {u.nickname?.charAt(0) || '?'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500 }}>{u.nickname}</div>
                          <div className="text-sm text-gray">
                            {u.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')} · 消费¥{Number(u.total_spent || 0).toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#bbb' }}>
        —— 继续邀请更多好友，一起赚佣金 ——
        <div>
          <button className="btn-primary mt-16" onClick={() => navigate('/share')}>
            去邀请
          </button>
        </div>
      </div>
    </div>
  );
}
