import { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import useStore from '../store';
import { rankingAPI } from '../api';

function Home() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && location.pathname === '/') {
      loadStats();
    } else {
      setLoading(false);
    }
  }, [user, location.pathname]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await rankingAPI.getMyStats();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const caloriesToFood = (calories) => {
    const foods = [
      { name: '🍔 汉堡', cal: 500 },
      { name: '🍚 米饭', cal: 116 },
      { name: '🍎 苹果', cal: 52 },
      { name: '🍌 香蕉', cal: 89 },
      { name: '🥤 可乐', cal: 140 }
    ];
    return foods.map(f => ({
      ...f,
      count: Math.round((calories || 0) / f.cal)
    }));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <header style={{
        background: 'linear-gradient(135deg, #00d563 0%, #00b857 100%)',
        padding: '15px 20px',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🏃 Keep 健身</h1>
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span>👤 {user.nickname || user.username || '用户'}</span>
              <span>💰 {user.keep_coins || 0} 币</span>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                退出
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              登录
            </button>
          )}
        </div>
      </header>

      <nav style={{
        background: 'white',
        padding: '10px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {[
            { path: '/', label: '🏠 首页' },
            { path: '/live', label: '📺 直播' },
            { path: '/activities', label: '🎉 活动' },
            { path: '/music', label: '🎵 音乐' },
            { path: '/ranking', label: '🏆 排行榜' },
            { path: '/wallet', label: '💰 钱包' }
          ].map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: location.pathname === item.path ? '#00d563' : '#333',
                fontWeight: location.pathname === item.path ? 'bold' : 500,
                background: location.pathname === item.path ? 'rgba(0,213,99,0.1)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {location.pathname === '/' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
            ) : user && stats ? (
              <div>
                <h2>📊 我的运动数据</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {[
                    { label: '今日运动', data: stats.today || { minutes: 0, calories: 0 }, color: '#00d563' },
                    { label: '本周运动', data: stats.week || { minutes: 0, calories: 0 }, color: '#1890ff' },
                    { label: '本月运动', data: stats.month || { minutes: 0, calories: 0 }, color: '#722ed1' }
                  ].map(item => (
                    <div key={item.label} style={{
                      background: 'white',
                      padding: '25px',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <h3 style={{ margin: '0 0 15px 0', color: item.color }}>{item.label}</h3>
                      <p style={{ fontSize: '18px', margin: '8px 0' }}>
                        ⏱️ {item.data.minutes || 0} 分钟
                      </p>
                      <p style={{ fontSize: '18px', margin: '8px 0' }}>
                        🔥 {item.data.calories || 0} 千卡
                      </p>
                    </div>
                  ))}
                </div>

                <h2>🍎 卡路里等量食物</h2>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px'
                }}>
                  {caloriesToFood(stats.today?.calories || 1000).map(food => (
                    <div key={food.name} style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                        {food.name.split(' ')[0]}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {food.name.split(' ')[1]}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00d563', marginTop: '10px' }}>
                        × {food.count}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '30px' }}>
                  <h2>💪 记录运动</h2>
                  <button
                    onClick={async () => {
                      try {
                        await rankingAPI.recordTraining({
                          activity_type: '跑步',
                          duration: 30,
                          calories: 300,
                          distance: 5
                        });
                        alert('运动记录已保存！');
                        loadStats();
                      } catch (error) {
                        console.error(error);
                      }
                    }}
                    style={{
                      padding: '15px 40px',
                      background: 'linear-gradient(135deg, #00d563 0%, #00b857 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    🏃 记录一次跑步（30分钟，300千卡）
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '100px 20px'
              }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🏃</div>
                <h1>欢迎来到 Keep 健身</h1>
                <p style={{ fontSize: '18px', color: '#666', marginBottom: '30px' }}>
                  健身直播、线下活动、音乐陪伴、排行榜挑战，让运动更有趣！
                </p>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '15px 50px',
                    background: 'linear-gradient(135deg, #00d563 0%, #00b857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  开始运动之旅
                </button>
              </div>
            )}
          </div>
        )}

        <Outlet />
      </main>
    </div>
  );
}

export default Home;
