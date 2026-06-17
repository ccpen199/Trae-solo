import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Button, Tag, Switch, message, Avatar } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '@/api';
import { useAuthStore } from '@/store/auth';

const statusLabel: Record<string, string> = {
  PENDING: '待接单', ACCEPTED: '已接单', EN_ROUTE: '前往中', ARRIVED: '已到达',
  PICKED: '已收件', DELIVERING: '派送中', COMPLETED: '已完成', CANCELLED: '已取消',
};
const statusColor: Record<string, string> = {
  PENDING: 'processing', ACCEPTED: 'processing', EN_ROUTE: 'processing', ARRIVED: 'warning',
  PICKED: 'processing', DELIVERING: 'processing', COMPLETED: 'success', CANCELLED: 'default',
};

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [onDuty, setOnDuty] = useState(false);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, picked: 0, completed: 0, isOnDuty: false });

  const loadStats = async () => {
    try {
      const r: any = await api.get('/courier/stats/today');
      setStats(r.data);
      setOnDuty(r.data.isOnDuty);
    } catch {}
  };

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const p: any = { page: 1, pageSize: 100 };
      if (status && status !== 'all') p.status = status;
      const r: any = await api.get('/courier/tasks', { params: p });
      setTasks(r.data.list || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadStats(); load(); }, []);

  const toggleDuty = async (checked: boolean) => {
    await api.post('/courier/duty/toggle', { onDuty: checked });
    setOnDuty(checked);
    message.success(checked ? '已上班打卡，开始接收工单' : '已下班');
    loadStats();
  };

  const mockLat = 23.1291 + Math.random() * 0.05;
  const mockLon = 113.2644 + Math.random() * 0.05;

  useEffect(() => {
    if (!onDuty) return;
    const t = setInterval(() => {
      api.post('/courier/location/report', { lat: mockLat, lon: mockLon, accuracy: 10 }).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, [onDuty]);

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'PENDING', label: <span>待接单 <Tag color="red">{stats.pending || 0}</Tag></span> },
    { key: 'ACCEPTED', label: '进行中' },
    { key: 'COMPLETED', label: '已完成' },
  ].map(t => ({ ...t, children: null }));

  return (
    <div>
      <div className="courier-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>👷 {user?.realNameMasked || '揽收员'} · {stats.todayTaskCount || 0}单</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>今日工单中心</div>
          </div>
          <div className={`on-duty-toggle ${onDuty ? 'active' : ''}`} onClick={() => toggleDuty(!onDuty)}>
            {onDuty ? '🟢 上班中' : '⚪ 已下班'}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-item"><div className="stat-num">{stats.total || 0}</div><div className="stat-lbl">今日总单</div></div>
        <div className="stat-item"><div className="stat-num" style={{ color: '#F53F3F' }}>{stats.pending || 0}</div><div className="stat-lbl">待处理</div></div>
        <div className="stat-item"><div className="stat-num" style={{ color: '#FF7D00' }}>{stats.picked || 0}</div><div className="stat-lbl">已收件</div></div>
        <div className="stat-item"><div className="stat-num" style={{ color: '#00B42A' }}>{stats.completed || 0}</div><div className="stat-lbl">已完成</div></div>
      </div>

      <Tabs defaultActiveKey="all" onChange={(k) => load(k)} items={tabItems} style={{ padding: '4px 12px', background: '#fff', marginTop: 8 }} />

      <Spin spinning={loading}>
        {tasks.length === 0 ? (
          <Empty style={{ padding: 60 }} description={onDuty ? '暂无工单，请保持位置开启' : '您未上班，无法接收工单'} />
        ) : tasks.map(t => (
          <div key={t.id} className={`task-card ${['PENDING', 'ARRIVED'].includes(t.status) ? 'priority' : ''}`} onClick={() => navigate(`/task/${t.id}`)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <span className="task-pill">{t.taskType === 'PICKUP' ? '📥 收件' : '📤 派件'} · {t.orderType?.replace(/_/g, '/')}</span>
                {t.distance && <Tag color="blue" style={{ marginLeft: 6 }}>📍 {t.distance}km</Tag>}
              </div>
              <Tag color={statusColor[t.status]}>{statusLabel[t.status]}</Tag>
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: '#666' }}>
              <div>📋 订单号：{t.orderNo}</div>
              {t.appointment && <div>🕒 预约：{dayjs(t.appointment.from).format('MM-DD HH:mm')} ~ {dayjs(t.appointment.to).format('HH:mm')}</div>}
              <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>创建：{dayjs(t.createdAt).format('MM-DD HH:mm')}</div>
            </div>
            {['PENDING', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED'].includes(t.status) && (
              <div className="action-btn-row">
                {t.status === 'PENDING' && (
                  <Button type="primary" block onClick={async (e) => {
                    e.stopPropagation();
                    await api.post(`/courier/tasks/${t.id}/accept`);
                    message.success('已接单');
                    load(); loadStats();
                  }}>接单</Button>
                )}
                <Button block onClick={(e) => { e.stopPropagation(); navigate(`/task/${t.id}`); }}>详情</Button>
              </div>
            )}
          </div>
        ))}
      </Spin>
    </div>
  );
};
export default TasksPage;
