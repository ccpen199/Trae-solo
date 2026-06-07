import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';

const RiderDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [todayOrders, setTodayOrders] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gpsStatus, setGpsStatus] = useState('off');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        api.get('/rider/profile'),
        api.get('/orders/my?status=delivered&limit=10')
      ]);
      setProfile(profileRes.data);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = Math.floor(today.getTime() / 1000);
      const todayList = ordersRes.data.filter(o => o.delivered_at >= todayTs);
      setTodayOrders(todayList.length);
      setTodayIncome(todayList.reduce((sum, o) => sum + (o.rider_fee || 0), 0));
    } catch (e) {
      console.error('Load data failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const startGps = () => {
    if (navigator.geolocation) {
      setGpsStatus('on');
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          api.post('/gps/report', {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            speed: pos.coords.speed,
            heading: pos.coords.heading,
            accuracy: pos.coords.accuracy
          }).catch(() => {});
        },
        (err) => console.error('GPS error:', err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      localStorage.setItem('gpsWatchId', watchId);
    } else {
      alert('浏览器不支持定位功能');
    }
  };

  const stopGps = () => {
    const watchId = localStorage.getItem('gpsWatchId');
    if (watchId) {
      navigator.geolocation.clearWatch(parseInt(watchId));
      localStorage.removeItem('gpsWatchId');
    }
    setGpsStatus('off');
  };

  if (loading) return <div className="container"><div className="spinner" /> 加载中...</div>;

  const verStatus = profile?.verification?.verification_status || 'none';
  const vehStatus = profile?.vehicle?.binding_status || 'none';
  const canWork = verStatus === 'verified' && vehStatus === 'bound';

  return (
    <div className="container">
      <div className="card">
        <h2 className="card-title">👋 欢迎回来，{profile?.user?.real_name}</h2>
        <div className="grid grid-4" style={{ marginBottom: '20px' }}>
          <div className="card stats-card">
            <div className="stats-value">{profile?.stats?.completed_orders || 0}</div>
            <div className="stats-label">累计完成订单</div>
          </div>
          <div className="card stats-card">
            <div className="stats-value">{todayOrders}</div>
            <div className="stats-label">今日完成</div>
          </div>
          <div className="card stats-card">
            <div className="stats-value">¥{todayIncome.toFixed(2)}</div>
            <div className="stats-label">今日收入</div>
          </div>
          <div className="card stats-card">
            <div className="stats-value">{profile?.stats?.fulfillment_rate?.toFixed(1) || 0}%</div>
            <div className="stats-label">履约率</div>
          </div>
        </div>

        <div className="grid grid-2" style={{ marginBottom: '20px' }}>
          <div className="card">
            <h3 className="card-title">资质状态</h3>
            <div style={{ marginBottom: '12px' }}>
              实人认证：
              <span className={`badge ${verStatus === 'verified' ? 'badge-success' : verStatus === 'pending' ? 'badge-warning' : 'badge-default'}`}>
                {verStatus === 'verified' ? '已认证' : verStatus === 'pending' ? '审核中' : '未认证'}
              </span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              车辆绑定：
              <span className={`badge ${vehStatus === 'bound' ? 'badge-success' : vehStatus === 'pending' ? 'badge-warning' : 'badge-default'}`}>
                {vehStatus === 'bound' ? '已绑定' : vehStatus === 'pending' ? '审核中' : '未绑定'}
              </span>
            </div>
            {!canWork && (
              <div className="alert alert-warning">请先完成实人认证和车辆绑定才能接单</div>
            )}
          </div>

          <div className="card">
            <h3 className="card-title">GPS 定位</h3>
            <div style={{ marginBottom: '12px' }}>
              定位状态：
              <span className={`badge ${gpsStatus === 'on' ? 'badge-success' : 'badge-default'}`}>
                {gpsStatus === 'on' ? '上报中' : '已关闭'}
              </span>
            </div>
            {canWork && (
              gpsStatus === 'off' ? (
                <button className="btn btn-success btn-block" onClick={startGps}>开启定位并接单</button>
              ) : (
                <button className="btn btn-danger btn-block" onClick={stopGps}>关闭定位</button>
              )
            )}
          </div>
        </div>

        <div className="grid grid-2">
          <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/rider/orders')}>
            📋 查看可接订单
          </button>
          <button className="btn btn-lg btn-block" onClick={() => navigate('/rider/wallet')}>
            💰 我的钱包
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderDashboard;
