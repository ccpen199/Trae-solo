import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import useAuthStore from '../store/authStore';
import TaskCard from '../components/TaskCard';

function Home({ showToast }) {
  const { user } = useAuthStore();
  const [recommendedTasks, setRecommendedTasks] = useState([]);
  const [latestTasks, setLatestTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const latestResponse = await api.get('/tasks?pageSize=8');
      setLatestTasks(latestResponse.data.data || []);
      
      if (user && ['student', 'homemaker', 'parttime'].includes(user.user_type)) {
        try {
          const recommendedResponse = await api.get('/tasks/recommended');
          setRecommendedTasks(recommendedResponse.data.data || []);
        } catch (e) {
          console.log('No recommended tasks available');
        }
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const userTypeLabels = {
    student: '在校学生',
    homemaker: '居家宝妈',
    parttime: '兼职上班族',
    employer: '企业雇主',
    admin: '管理员'
  };

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>灵活就业，轻松赚钱</h1>
          <p>为在校学生、居家宝妈、兼职上班族提供优质灵活就业机会</p>
          <div className="hero-actions">
            {user ? (
              ['student', 'homemaker', 'parttime'].includes(user.user_type) ? (
                <>
                  <Link to="/tasks" className="btn btn-primary" style={{ background: 'white', color: '#667eea' }}>
                    浏览任务
                  </Link>
                  <Link to="/my-orders" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'white' }}>
                    我的任务
                  </Link>
                </>
              ) : user.user_type === 'employer' ? (
                <>
                  <Link to="/tasks" className="btn btn-primary" style={{ background: 'white', color: '#667eea' }}>
                    发布任务
                  </Link>
                  <Link to="/profile" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'white' }}>
                    企业中心
                  </Link>
                </>
              ) : (
                <Link to="/admin" className="btn btn-primary" style={{ background: 'white', color: '#667eea' }}>
                  管理后台
                </Link>
              )
            ) : (
              <>
                <Link to="/register" className="btn btn-primary" style={{ background: 'white', color: '#667eea' }}>
                  立即注册
                </Link>
                <Link to="/login" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'white' }}>
                  登录账号
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">为什么选择我们</h2>
          <div className="grid-4">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
              <h3 style={{ marginBottom: '8px' }}>实名认证</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>所有用户和企业均需实名认证，保障交易安全</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💰</div>
              <h3 style={{ marginBottom: '8px' }}>T+1结算</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>任务完成后次日自动结算，支持多种提现方式</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ marginBottom: '8px' }}>智能匹配</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>根据技能、位置、时间智能推荐合适任务</p>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
              <h3 style={{ marginBottom: '8px' }}>风控保障</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>多级审核机制，确保任务真实可靠</p>
            </div>
          </div>
        </div>
      </section>

      {recommendedTasks.length > 0 && (
        <section className="section" style={{ background: '#f8fafc' }}>
          <div className="container">
            <h2 className="section-title">为您推荐</h2>
            {loading ? (
              <div className="empty-state">加载中...</div>
            ) : (
              <div className="grid-3">
                {recommendedTasks.map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    showToast={showToast}
                    onAcceptSuccess={loadData}
                  />
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <Link to="/tasks" className="btn btn-primary">查看更多任务</Link>
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <h2 className="section-title">最新任务</h2>
          {loading ? (
            <div className="empty-state">加载中...</div>
          ) : latestTasks.length > 0 ? (
            <div className="grid-3">
              {latestTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  showToast={showToast}
                  onAcceptSuccess={loadData}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
              <p>暂无任务</p>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/tasks" className="btn btn-primary">进入任务大厅</Link>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <div className="container">
          <h2 className="section-title" style={{ color: 'white' }}>适合人群</h2>
          <div className="grid-3">
            <div className="card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍🎓</div>
              <h3 style={{ marginBottom: '8px', color: 'white' }}>在校学生</h3>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>利用课余时间赚取生活费，积累社会实践经验</p>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>👩‍👧</div>
              <h3 style={{ marginBottom: '8px', color: 'white' }}>居家宝妈</h3>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>时间灵活，在家即可工作，兼顾家庭与收入</p>
            </div>
            <div className="card" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: 'white' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
              <h3 style={{ marginBottom: '8px', color: 'white' }}>兼职上班族</h3>
              <p style={{ opacity: 0.9, fontSize: '14px' }}>下班后和周末做副业，增加额外收入来源</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
