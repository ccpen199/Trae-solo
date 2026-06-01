import { useState, useEffect } from 'react';
import axios from 'axios';

function Reports() {
  const [camps, setCamps] = useState([]);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [completionData, setCompletionData] = useState(null);
  const [activityData, setActivityData] = useState(null);

  useEffect(() => {
    loadCamps();
  }, []);

  useEffect(() => {
    if (selectedCamp) {
      loadCompletionData();
      loadActivityData();
    }
  }, [selectedCamp]);

  const loadCamps = async () => {
    const res = await axios.get('/api/camps');
    setCamps(res.data);
    if (res.data.length > 0) setSelectedCamp(res.data[0]);
  };

  const loadCompletionData = async () => {
    const res = await axios.get(`/api/reports/${selectedCamp.id}/completion`);
    setCompletionData(res.data);
  };

  const loadActivityData = async () => {
    const res = await axios.get(`/api/reports/${selectedCamp.id}/activity`);
    setActivityData(res.data);
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <h2 style={{ margin: 0 }}>数据报表</h2>
        <div className="flex gap-2">
          {camps.map(camp => (
            <button key={camp.id} className={`btn ${selectedCamp?.id === camp.id ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSelectedCamp(camp)}>
              {camp.name}
            </button>
          ))}
        </div>
      </div>

      {selectedCamp && completionData && activityData && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">学员总数</div>
              <div className="value">{completionData.totalStudents}</div>
            </div>
            <div className="stat-card">
              <div className="label">平均完成率</div>
              <div className="value">{completionData.avgCompletionRate.toFixed(1)}%</div>
            </div>
            <div className="stat-card">
              <div className="label">平均点评响应</div>
              <div className="value">{activityData.avgResponseTime.toFixed(1)}h</div>
            </div>
            <div className="stat-card">
              <div className="label">总打卡次数</div>
              <div className="value">{activityData.checkinsByDay.reduce((sum, d) => sum + d.count, 0)}</div>
            </div>
          </div>

          <div className="grid">
            <div className="card">
              <h2>每日完成情况</h2>
              <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '20px 0' }}>
                {Array.from({ length: selectedCamp.total_days }, (_, i) => {
                  const dayData = completionData.dailyCompletion.find(d => d.day_number === i + 1);
                  const height = dayData ? (dayData.completed_count / completionData.totalStudents * 100) : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div 
                        style={{ 
                          width: '100%', 
                          height: `${Math.max(height, 2)}%`, 
                          background: height > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                          borderRadius: '4px 4px 0 0',
                          minHeight: 4
                        }} 
                      />
                      <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>{i + 1}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center text-sm text-gray">天数（共 {selectedCamp.total_days} 天）</div>
            </div>

            <div className="card">
              <h2>学员排行榜</h2>
              {completionData.studentStats
                .sort((a, b) => b.points - a.points)
                .slice(0, 10)
                .map((stat, index) => (
                  <div key={stat.id} className="ranking-item">
                    <div className={`rank ${index < 3 ? `top${index + 1}` : ''}`}>{index + 1}</div>
                    <div className="info">
                      <div className="name">{stat.name}</div>
                      <div className="text-sm text-gray">完成 {stat.completed_days} 天 · 连续 {stat.streak} 天</div>
                    </div>
                    <div className="points">{stat.points} 分</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <h2>学员完成详情</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>学员</th>
                  <th>积分</th>
                  <th>连续打卡</th>
                  <th>完成天数</th>
                  <th>完成率</th>
                </tr>
              </thead>
              <tbody>
                {completionData.studentStats
                  .sort((a, b) => b.points - a.points)
                  .map((stat, index) => (
                    <tr key={stat.id}>
                      <td>{index + 1}</td>
                      <td>{stat.name}</td>
                      <td className="font-bold">{stat.points}</td>
                      <td>{stat.streak} 天</td>
                      <td>{stat.completed_days} / {completionData.totalDays}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1, maxWidth: 100 }}>
                            <div className="fill" style={{ width: `${(stat.completed_days / completionData.totalDays * 100)}%` }}></div>
                          </div>
                          <span>{((stat.completed_days / completionData.totalDays) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Reports;
