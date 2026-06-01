import React, { useState, useEffect } from 'react';
import { shipsAPI, schedulesAPI, berthsAPI } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    ships: 0,
    scheduled: 0,
    berths: 0,
    today: 0
  });
  const [recentShips, setRecentShips] = useState([]);
  const [ganttData, setGanttData] = useState({ berths: [], schedules: [] });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [shipsRes, schedulesRes, berthsRes] = await Promise.all([
      shipsAPI.getAll(),
      schedulesAPI.getGantt(),
      berthsAPI.getAll()
    ]);

    if (shipsRes.success) {
      setRecentShips(shipsRes.data.slice(0, 5));
      setStats(s => ({ ...s, ships: shipsRes.data.length }));
    }
    if (schedulesRes.success) {
      setGanttData(schedulesRes.data);
      const today = new Date().toISOString().split('T')[0];
      const todayCount = schedulesRes.data.schedules.filter(s => 
        s.start_time && s.start_time.startsWith(today)
      ).length;
      setStats(s => ({ ...s, scheduled: schedulesRes.data.schedules.length, today: todayCount }));
    }
    if (berthsRes.success) {
      setStats(s => ({ ...s, berths: berthsRes.data.length }));
    }
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  function getTaskPosition(schedule) {
    const start = new Date(schedule.start_time);
    const end = new Date(schedule.end_time);
    const startOffset = (start - dayStart) / (1000 * 60 * 60);
    const duration = (end - start) / (1000 * 60 * 60);
    
    if (startOffset < 0 || startOffset > 24) return null;
    
    return {
      left: `${startOffset * 50}px`,
      width: `${Math.max(duration * 50, 50)}px`
    };
  }

  return (
    <div>
      <div className="page-header">
        <h1>调度总览</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.ships}</div>
          <div className="stat-label">登记船舶</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.scheduled}</div>
          <div className="stat-label">已排程</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.berths}</div>
          <div className="stat-label">可用泊位</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.today}</div>
          <div className="stat-label">今日靠泊</div>
        </div>
      </div>

      <div className="card">
        <h3>今日泊位甘特图</h3>
        <div className="gantt-container">
          <div className="gantt-grid">
            <div className="gantt-header">
              <div className="gantt-berth-col">泊位</div>
              <div className="gantt-time-cols">
                {hours.map(h => (
                  <div key={h} className="gantt-hour-col">{h}:00</div>
                ))}
              </div>
            </div>
            {ganttData.berths.map(berth => (
              <div key={berth.id} className="gantt-row">
                <div className="gantt-berth">{berth.name}</div>
                <div className="gantt-timeline">
                  {ganttData.schedules
                    .filter(s => s.berth_id === berth.id)
                    .map(schedule => {
                      const pos = getTaskPosition(schedule);
                      if (!pos) return null;
                      return (
                        <div
                          key={schedule.id}
                          className={`gantt-task ${schedule.status === 'delayed' ? 'warning' : ''}`}
                          style={pos}
                          title={`${schedule.ship_name} - ${schedule.voyage}`}
                        >
                          {schedule.ship_name}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h3>最近登记船舶</h3>
        <table className="table">
          <thead>
            <tr>
              <th>船名</th>
              <th>航次</th>
              <th>预计到港</th>
              <th>代理</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {recentShips.map(ship => (
              <tr key={ship.id}>
                <td>{ship.name}</td>
                <td>{ship.voyage}</td>
                <td>{ship.eta ? new Date(ship.eta).toLocaleString() : '-'}</td>
                <td>{ship.agent || '-'}</td>
                <td>
                  <span className={`badge ${ship.data_complete ? 'badge-success' : 'badge-warning'}`}>
                    {ship.data_complete ? '资料完整' : '资料不全'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
