import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { safetyApi, userApi } from '../services';
import { useAppStore } from '../store/appStore';
import type { SafetySession, GuardianRelation, WhistleAlert, User } from '../types';

export default function SafetyPage() {
  const { currentUser, showToast } = useAppStore();
  const [guardians, setGuardians] = useState<GuardianRelation[]>([]);
  const [sessions, setSessions] = useState<SafetySession[]>([]);
  const [activeSession, setActiveSession] = useState<SafetySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [sessionConfig, setSessionConfig] = useState({
    guardianIds: [] as string[],
    checkInMinutes: 30,
    activityId: ''
  });
  const [requestConfig, setRequestConfig] = useState({
    toUserId: '',
    relationName: '',
    message: '',
    permissionLevel: 'full' as const,
    mutual: true
  });
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [searchKw, setSearchKw] = useState('');
  const [heartbeatInterval, setHeartbeatInterval] = useState<number | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [gs, ss] = await Promise.all([
        safetyApi.getGuardians(),
        safetyApi.getSessions()
      ]);
      setGuardians(gs as GuardianRelation[]);
      setSessions(ss as SafetySession[]);
      const active = (ss as SafetySession[]).find(s => s.status === 'active' || s.status === 'alarm');
      setActiveSession(active || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeSession) {
      const id = window.setInterval(async () => {
        await safetyApi.submitHeartbeat(activeSession.id, {} as never);
        const res = await safetyApi.getSession(activeSession.id);
        setActiveSession(res as SafetySession);
      }, (sessionConfig.checkInMinutes * 60 * 1000) / 2);
      setHeartbeatInterval(id);
      return () => { if (id) clearInterval(id); };
    } else if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      setHeartbeatInterval(null);
    }
    return;
  }, [activeSession?.id]);

  const availableGuardians = guardians.filter(g => g.direction === 'guards_me');

  const handleStartSession = async () => {
    if (sessionConfig.guardianIds.length === 0) {
      showToast('请至少选择一位守护人', 'error');
      return;
    }
    try {
      const s = await safetyApi.startSession({
        guardianIds: sessionConfig.guardianIds,
        activityId: sessionConfig.activityId || undefined,
        checkInMinutes: sessionConfig.checkInMinutes
      });
      setActiveSession(s as SafetySession);
      setShowSessionModal(false);
      showToast('🛡️ 平安哨守护已启动！', 'success');
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleManualCheckIn = async () => {
    if (!activeSession) return;
    try {
      await safetyApi.submitHeartbeat(activeSession.id, { isManual: true } as never);
      showToast('签到成功，已确认安全', 'success');
      const res = await safetyApi.getSession(activeSession.id);
      setActiveSession(res as SafetySession);
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleWhistle = async (severity: 'medium' | 'high' | 'critical') => {
    if (!activeSession) return;
    if (!confirm(severity === 'critical' ? '确认触发紧急警报？将立即通知紧急联系人！' : '确认触发平安哨？')) return;
    try {
      await safetyApi.triggerWhistle(activeSession.id, { severity } as never);
      showToast(severity === 'critical' ? '🚨 紧急警报已触发！' : '⚠️ 平安哨已触发', severity === 'critical' ? 'error' : 'info');
      const res = await safetyApi.getSession(activeSession.id);
      setActiveSession(res as SafetySession);
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (!confirm('确认结束平安哨守护？')) return;
    try {
      await safetyApi.endSession(activeSession.id);
      setActiveSession(null);
      showToast('守护已结束', 'info');
      void load();
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleSendRequest = async () => {
    if (!requestConfig.toUserId || !requestConfig.relationName) {
      showToast('请填写完整信息', 'error');
      return;
    }
    try {
      await safetyApi.requestGuardian(requestConfig as never);
      showToast('请求已发送', 'success');
      setShowRequestModal(false);
      setRequestConfig({ toUserId: '', relationName: '', message: '', permissionLevel: 'full', mutual: true });
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  const handleSearchUser = async () => {
    try {
      const res = await userApi.search({ keyword: searchKw, pageSize: 10 });
      setSearchUsers((res as { items: User[] }).items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await safetyApi.acknowledgeAlert(alertId);
      showToast('已确认收到提醒', 'info');
      if (activeSession) {
        const res = await safetyApi.getSession(activeSession.id);
        setActiveSession(res as SafetySession);
      }
    } catch (e) {
      showToast((e as Error).message, 'error');
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">🛡️ 平安哨 · 双向守护</h1>
          <p className="text-sm text-gray-500 mt-1">心跳检测 + 紧急联系人 + AI语音安抚，全方位安全守护</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRequestModal(true)} className="btn btn-secondary">+ 邀请守护人</button>
          {!activeSession && <button onClick={() => setShowSessionModal(true)} className="btn btn-primary">🛡️ 开启守护</button>}
        </div>
      </div>

      {activeSession && (
        <div className={`card mb-6 overflow-hidden whistle-active ${
          activeSession.status === 'alarm' ? 'ring-4 ring-red-400' : ''
        }`}>
          <div className={`p-8 ${
            activeSession.status === 'alarm' ? 'bg-gradient-to-r from-red-500 to-orange-500' :
            'bg-gradient-to-r from-green-500 to-emerald-500'
          } text-white`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <div className="text-6xl">
                  {activeSession.status === 'alarm' ? '🚨' : '🛡️'}
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {activeSession.status === 'alarm' ? '警报状态' : '守护进行中'}
                  </div>
                  <div className="opacity-90 text-sm mt-1">
                    守护人 {activeSession.guardianProfiles?.length || 0} 位 ·
                    每 {activeSession.checkInInterval} 分钟自动签到
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={handleManualCheckIn} className="btn" style={{ background: 'white', color: '#10b981' }}>
                  ✅ 手动签到
                </button>
                <button onClick={handleEndSession} className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                  结束守护
                </button>
              </div>
            </div>
          </div>
          <div className="card-body grid grid-3 gap-4 pt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <button onClick={() => void handleWhistle('critical')} className="w-full">
                <div className="text-5xl mb-2">🚨</div>
                <div className="font-bold text-red-600 text-lg">紧急警报</div>
                <div className="text-xs text-red-500 mt-1">立即通知紧急联系人</div>
              </button>
            </div>
            <div className="p-4 bg-orange-50 rounded-xl text-center">
              <button onClick={() => void handleWhistle('high')} className="w-full">
                <div className="text-5xl mb-2">⚠️</div>
                <div className="font-bold text-orange-600 text-lg">求助警报</div>
                <div className="text-xs text-orange-500 mt-1">通知守护人 + AI安抚</div>
              </button>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <button onClick={() => void handleWhistle('medium')} className="w-full">
                <div className="text-5xl mb-2">💡</div>
                <div className="font-bold text-amber-600 text-lg">轻微提醒</div>
                <div className="text-xs text-amber-500 mt-1">留痕记录 + 轻量提醒</div>
              </button>
            </div>
          </div>

          {activeSession.alerts && activeSession.alerts.length > 0 && (
            <div className="card-body pt-0 border-t border-gray-100 mt-4">
              <h3 className="font-bold mb-3">🕒 告警记录</h3>
              <div className="space-y-2">
                {[...activeSession.alerts].reverse().map(a => (
                  <div key={a.id} className={`p-3 rounded-xl border-l-4 ${
                    a.severity === 'critical' ? 'bg-red-50 border-red-500' :
                    a.severity === 'high' ? 'bg-orange-50 border-orange-500' :
                    a.severity === 'medium' ? 'bg-amber-50 border-amber-500' :
                    'bg-gray-50 border-gray-400'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <span className={`badge ${
                            a.severity === 'critical' ? 'badge-danger' :
                            a.severity === 'high' ? 'badge-warning' : 'badge-info'
                          }`}>{a.eventType}</span>
                          {a.aiVoiceInitiated && <span className="badge badge-primary">🤖 AI已安抚</span>}
                          {a.emergencyContactNotified && <span className="badge badge-danger">📞 已通知紧急联系人</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(a.triggeredAt).toLocaleString()}</div>
                      </div>
                      {!a.acknowledged && (
                        <button onClick={() => void handleAcknowledgeAlert(a.id)} className="btn btn-sm btn-secondary">
                          确认收到
                        </button>
                      )}
                      {a.resolved && <span className="badge badge-success text-xs">已处理</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <section className="card">
          <div className="card-header">👥 我的守护关系 ({guardians.length})</div>
          <div className="card-body space-y-3">
            {loading ? <div className="text-sm text-gray-400 text-center py-4">加载中...</div> :
             guardians.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🤝</div>
                <p className="text-sm">暂无守护关系，点击右上角邀请好友成为守护人</p>
              </div>
            ) : guardians.map(g => (
              <div key={g.relation.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <img src={g.user?.avatar} className="avatar" alt="" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{g.user?.nickname}</span>
                    <span className={`badge ${g.direction === 'i_guard' ? 'badge-info' : 'badge-success'}`}>
                      {g.direction === 'i_guard' ? `我守护${g.relation.relationName}` : `${g.relation.relationName}守护我`}
                    </span>
                    {g.relation.mutual && <span className="badge badge-primary">双向</span>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {g.user?.phone} · 权限: {g.relation.permissionLevel === 'full' ? '完整' : g.relation.permissionLevel === 'location' ? '位置' : '基础'}
                  </div>
                </div>
                <Link to={`/profile/${g.user?.id}`} className="btn btn-sm btn-secondary">查看</Link>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-header">📋 守护记录</div>
          <div className="card-body">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm">暂无守护记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 8).map(s => (
                  <div key={s.id} className="p-3 border border-gray-100 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${
                          s.status === 'active' ? 'badge-success' :
                          s.status === 'alarm' ? 'badge-danger' :
                          s.status === 'emergency' ? 'badge-warning' : 'badge-secondary'
                        }`}>
                          {s.status === 'active' ? '进行中' :
                           s.status === 'alarm' ? '有警报' :
                           s.status === 'emergency' ? '紧急' :
                           s.status === 'completed' ? '已完成' : s.status}
                        </span>
                        <span className="text-sm">{new Date(s.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {s.alerts?.length || 0} 条告警 · 守护人 {s.guardianIds.length} 位
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="card mt-6">
        <div className="card-header">📚 平安哨守护协议说明</div>
        <div className="card-body text-sm text-gray-600 space-y-2">
          <p>• <b>心跳检测</b>：自动按设定间隔上报位置、电量、信号强度，连续3次漏报自动触发AI呼叫</p>
          <p>• <b>AI语音安抚</b>：触发告警后立即启动AI安抚通话，识别情绪后决定是否升级联系紧急联系人</p>
          <p>• <b>紧急联系人</b>：仅critical级别警报才会触发短信+电话双重通知紧急联系人</p>
          <p>• <b>双向守护</b>：建立互相守护关系，双方共享彼此的守护会话状态，一方遇险另一方第一时间收到通知</p>
          <p>• <b>隐私保护</b>：位置数据端到端加密，仅活动期间对已授权守护人可见，活动结束后自动销毁</p>
        </div>
      </div>

      {showSessionModal && (
        <div className="modal-overlay" onClick={() => setShowSessionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header">🛡️ 开启平安哨守护</div>
            <div className="card-body space-y-4">
              <div className="form-group">
                <label className="form-label">选择守护人（至少1位）</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {availableGuardians.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-4">暂无守护人，请先邀请</div>
                  ) : availableGuardians.map(g => (
                    <label key={g.relation.guarderId} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input type="checkbox"
                        checked={sessionConfig.guardianIds.includes(g.relation.guarderId)}
                        onChange={e => {
                          const id = g.relation.guarderId;
                          setSessionConfig(c => ({
                            ...c,
                            guardianIds: e.target.checked
                              ? [...c.guardianIds, id]
                              : c.guardianIds.filter(x => x !== id)
                          }));
                        }} />
                      <img src={g.user?.avatar} className="avatar avatar-sm" alt="" />
                      <div className="text-sm">
                        <span className="font-medium">{g.user?.nickname}</span>
                        <span className="text-gray-500 ml-2">({g.relation.relationName})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">签到间隔 (分钟): {sessionConfig.checkInMinutes}</label>
                <input type="range" className="w-full" min={5} max={120} value={sessionConfig.checkInMinutes}
                  onChange={e => setSessionConfig(c => ({ ...c, checkInMinutes: parseInt(e.target.value) }))} />
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700">
                💡 建议在外出、赴约、夜间通勤等场景开启守护，签到间隔建议15-30分钟
              </div>
              <div className="flex gap-3">
                <button className="btn btn-secondary flex-1" onClick={() => setShowSessionModal(false)}>取消</button>
                <button className="btn btn-primary flex-1" onClick={handleStartSession}>🛡️ 启动守护</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="card-header">🤝 邀请好友成为守护人</div>
            <div className="card-body space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="form-group">
                <label className="form-label">搜索用户</label>
                <div className="flex gap-2">
                  <input className="input" placeholder="昵称/学校/行业" value={searchKw}
                    onChange={e => setSearchKw(e.target.value)} />
                  <button className="btn btn-secondary" onClick={handleSearchUser}>搜索</button>
                </div>
                {searchUsers.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-1">
                    {searchUsers.filter(u => u.id !== currentUser?.id).slice(0, 6).map(u => (
                      <button key={u.id}
                        onClick={() => setRequestConfig(c => ({ ...c, toUserId: u.id }))}
                        className={`w-full flex items-center gap-2 p-2 text-left rounded-lg ${
                          requestConfig.toUserId === u.id ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}>
                        <img src={u.avatar} className="avatar avatar-sm" alt="" />
                        <div className="text-sm">
                          <span className="font-medium">{u.nickname}</span>
                          <span className="text-gray-500 ml-2">{u.education.school}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-2 gap-3">
                <div className="form-group">
                  <label className="form-label">关系称呼</label>
                  <input className="input" placeholder="如：闺蜜、兄弟" value={requestConfig.relationName}
                    onChange={e => setRequestConfig(c => ({ ...c, relationName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">权限等级</label>
                  <select className="input" value={requestConfig.permissionLevel}
                    onChange={e => setRequestConfig(c => ({ ...c, permissionLevel: e.target.value as never }))}>
                    <option value="full">完整权限（位置+状态+紧急联系人）</option>
                    <option value="location">位置权限（仅位置共享）</option>
                    <option value="basic">基础权限（仅警报通知）</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">邀请留言</label>
                <textarea className="input" rows={2} value={requestConfig.message}
                  placeholder="对方将看到这条邀请消息"
                  onChange={e => setRequestConfig(c => ({ ...c, message: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={requestConfig.mutual}
                  onChange={e => setRequestConfig(c => ({ ...c, mutual: e.target.checked }))} />
                同时邀请TA成为我的守护人（双向守护）
              </label>
              <div className="flex gap-3 pt-2">
                <button className="btn btn-secondary flex-1" onClick={() => setShowRequestModal(false)}>取消</button>
                <button className="btn btn-primary flex-1" onClick={handleSendRequest}>发送邀请</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
