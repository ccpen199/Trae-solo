import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { dailyLogApi } from '../../services/api';
import { DailyLog, UserRole } from '../../types';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<DailyLog[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    reviewed: 0
  });
  const [loading, setLoading] = useState(true);

  const today = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const logsData = await dailyLogApi.getDailyLogs({ limit: 10 });
      const logs = logsData.data || [];

      const todayEntry = logs.find((log: DailyLog) => dayjs(log.date).format('YYYY-MM-DD') === today);
      setTodayLog(todayEntry || null);

      setRecentLogs(logs.slice(0, 5));

      const total = logsData.total || 0;
      const submitted = logs.filter((log: DailyLog) => log.status === 'submitted' || log.status === 'reviewed').length;
      const reviewed = logs.filter((log: DailyLog) => log.status === 'reviewed').length;

      setStats({ total, submitted, reviewed });
    } catch (error) {
      console.error('获取工作台数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      draft: '草稿',
      submitted: '已提交',
      reviewed: '已评价'
    };
    return labels[status] || status;
  };

  const getStatusClass = (status: string) => {
    return `status-badge status-${status}`;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>工作台</h2>
        <p>欢迎回来，{user?.name}！</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">总日志数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.submitted}</div>
          <div className="stat-label">已提交</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.reviewed}</div>
          <div className="stat-label">已评价</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>今日日志</h3>
          {!todayLog && (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/daily-logs')}
            >
              + 填写今日日志
            </button>
          )}
        </div>

        {todayLog ? (
          <div>
            <div className="form-row">
              <div>
                <strong>日期：</strong>
                {dayjs(todayLog.date).format('YYYY年MM月DD日')}
              </div>
              <div>
                <strong>状态：</strong>
                <span className={getStatusClass(todayLog.status)}>
                  {getStatusBadge(todayLog.status)}
                </span>
              </div>
              {todayLog.relatedFees > 0 && (
                <div>
                  <strong>相关费用：</strong>¥{todayLog.relatedFees}
                </div>
              )}
            </div>
            <div style={{ marginTop: '16px' }}>
              <strong>工作内容：</strong>
              <p style={{ marginTop: '8px', color: '#333', lineHeight: '1.6' }}>
                {todayLog.content}
              </p>
            </div>
            {todayLog.planTomorrow && (
              <div style={{ marginTop: '12px' }}>
                <strong>明日计划：</strong>
                <p style={{ marginTop: '8px', color: '#333', lineHeight: '1.6' }}>
                  {todayLog.planTomorrow}
                </p>
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/daily-logs`)}
              >
                编辑日志
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>今天还没有填写日志</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/daily-logs')}
            >
              立即填写
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>最近日志</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/daily-logs')}
          >
            查看全部
          </button>
        </div>

        {recentLogs.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>日期</th>
                  <th>工作内容</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{dayjs(log.date).format('YYYY-MM-DD')}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.content}
                    </td>
                    <td>
                      <span className={getStatusClass(log.status)}>
                        {getStatusBadge(log.status)}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate('/daily-logs')}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>暂无日志记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
