import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { activityAPI } from '../api';

function ActivityDetail({ user }) {
  const { id } = useParams();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [checkinStatus, setCheckinStatus] = useState(null);

  useEffect(() => {
    loadActivity();
    
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [id]);

  useEffect(() => {
    if (activity && user?.volunteer?.id) {
      const signup = activity.signups?.find(s => s.volunteer_id === user.volunteer.id);
      setCheckinStatus(signup?.status || null);
    }
  }, [activity, user]);

  const loadActivity = async () => {
    try {
      const res = await activityAPI.getById(id);
      setActivity(res.data.data);
    } catch (err) {
      console.error('加载活动详情失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!user?.volunteer?.id) {
      alert('请先登录');
      return;
    }
    try {
      await activityAPI.signup(id, { volunteer_id: user.volunteer.id });
      loadActivity();
      alert('报名成功');
    } catch (err) {
      alert('报名失败：' + (err.response?.data?.message || err.message));
    }
  };

  const handleCheckin = async () => {
    if (!userLocation) {
      alert('正在获取定位信息，请稍后...');
      return;
    }
    try {
      const res = await activityAPI.checkin(id, {
        volunteer_id: user.volunteer.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        accuracy: userLocation.accuracy,
        location_source: 'gps'
      });
      setGpsStatus({ valid: true, message: `签到成功，距离活动地点${res.data.data.distance}米` });
      loadActivity();
    } catch (err) {
      setGpsStatus({ valid: false, message: err.response?.data?.message || '签到失败' });
    }
  };

  const handleCheckout = async () => {
    if (!userLocation) {
      alert('正在获取定位信息，请稍后...');
      return;
    }
    try {
      const res = await activityAPI.checkout(id, {
        volunteer_id: user.volunteer.id,
        latitude: userLocation.lat,
        longitude: userLocation.lng
      });
      alert(`签退成功！本次服务时长: ${res.data.data.actualHours}小时，区块链哈希: ${res.data.data.blockchain_hash.slice(0, 16)}...`);
      loadActivity();
    } catch (err) {
      alert('签退失败：' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="container"><div className="card">加载中...</div></div>;
  if (!activity) return <div className="container"><div className="card">活动不存在</div></div>;

  const mySignup = activity.signups?.find(s => s.volunteer_id === user?.volunteer?.id);

  return (
    <div className="container">
      <div className="card">
        <div className="card-title">
          <span>{activity.title}</span>
          <span className={`tag tag-${activity.status === 'published' ? 'success' : 'primary'}`}>
            {activity.status === 'published' ? '进行中' : activity.status}
          </span>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>活动描述</div>
              <div>{activity.description || '暂无描述'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>📍 活动地点</div>
                <div>{activity.location_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  坐标: {activity.latitude?.toFixed(6)}, {activity.longitude?.toFixed(6)} | 围栏半径: {activity.geofence_radius}米
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>🏢 主办组织</div>
                <div>{activity.org_name} <span className="tag tag-primary">信用分: {activity.org_credit}</span></div>
              </div>
            </div>
          </div>
          <div>
            <div className="card" style={{ background: '#fafafa', padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h3>北斗/GPS 签到</h3>
                {userLocation && (
                  <div className={`gps-status ${gpsStatus?.valid === false ? 'invalid' : 'valid'}`}>
                    <span>📍</span>
                    <span>定位精度: {Math.round(userLocation.accuracy)}米</span>
                  </div>
                )}
                {gpsStatus && (
                  <div style={{ marginTop: '12px', fontSize: '14px', color: gpsStatus.valid ? 'var(--success-color)' : 'var(--error-color)' }}>
                    {gpsStatus.message}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button
                  className={`checkin-button ${mySignup?.checkin_time ? 'checked' : 'active'}`}
                  onClick={handleCheckin}
                  disabled={!user?.volunteer || !userLocation || mySignup?.checkin_time}
                >
                  <span>{mySignup?.checkin_time ? '✓' : '📍'}</span>
                  <span>{mySignup?.checkin_time ? '已签到' : '签到'}</span>
                </button>
                <button
                  className={`checkin-button ${mySignup?.checkout_time ? 'checked' : 'active'}`}
                  onClick={handleCheckout}
                  disabled={!user?.volunteer || !userLocation || !mySignup?.checkin_time || mySignup?.checkout_time}
                  style={{ background: mySignup?.checkout_time ? undefined : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)' }}
                >
                  <span>{mySignup?.checkout_time ? '✓' : '🏁'}</span>
                  <span>{mySignup?.checkout_time ? '已签退' : '签退'}</span>
                </button>
              </div>

              {mySignup && (
                <div style={{ marginTop: '20px', padding: '12px', background: 'white', borderRadius: '4px', fontSize: '14px' }}>
                  <div>签到时间: {mySignup.checkin_time || '-'}</div>
                  <div>签退时间: {mySignup.checkout_time || '-'}</div>
                  <div>服务时长: {mySignup.actual_hours ? `${mySignup.actual_hours}小时` : '-'}</div>
                  {mySignup.blockchain_hash && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      区块链存证: {mySignup.blockchain_hash.slice(0, 24)}...
                    </div>
                  )}
                </div>
              )}
            </div>

            {!mySignup && user?.volunteer && (
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '12px' }}
                onClick={handleSignup}
              >
                立即报名
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-2">
          <div className="card">
            <div className="card-title">活动信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>开始时间</span>
                <span>{new Date(activity.start_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>结束时间</span>
                <span>{new Date(activity.end_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>预计服务时长</span>
                <span>{activity.required_hours}小时</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>风险等级</span>
                <span className={`tag tag-${activity.risk_level === 'high' ? 'error' : activity.risk_level === 'medium' ? 'warning' : 'primary'}`}>
                  {activity.risk_level}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>保险覆盖</span>
                <span>{activity.insurance_covered ? '✅ 已投保' : '❌ 未投保'}</span>
              </div>
              <div>
                <div style={{ marginBottom: '8px' }}>所需技能</div>
                <div>
                  {activity.required_skills?.length > 0 ? 
                    activity.required_skills.map(s => <span key={s} className="tag tag-primary">{s}</span>) : 
                    <span style={{ color: 'var(--text-secondary)' }}>无特殊要求</span>
                  }
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">报名志愿者 ({activity.signups?.length || 0})</div>
            {!activity.signups?.length ? (
              <div className="empty-state" style={{ padding: '30px' }}>
                <p>暂无报名</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>状态</th>
                    <th>签到</th>
                    <th>时长</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.signups.map(signup => (
                    <tr key={signup.id}>
                      <td>{signup.volunteer_name}</td>
                      <td>
                        <span className={`tag tag-${signup.status === 'completed' ? 'success' : 'primary'}`}>
                          {signup.status}
                        </span>
                      </td>
                      <td>{signup.checkin_time ? '✓' : '-'}</td>
                      <td>{signup.actual_hours ? `${signup.actual_hours}h` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityDetail;
