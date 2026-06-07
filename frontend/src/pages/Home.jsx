import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const VEHICLE_TYPES = [
  { value: '小面', desc: '限500kg/2.5m³' },
  { value: '中面', desc: '限1吨/4.5m³' },
  { value: '金杯', desc: '限1.5吨/6m³' },
  { value: '厢货', desc: '限3吨/12m³' },
  { value: '平板', desc: '限5吨/18m³' }
];

const CARGO_TYPES = ['日用品', '家电家具', '建材', '食品', '电子产品', '其他'];

const LOADING_OPTIONS = [
  { value: '', label: '无需搬运' },
  { value: 'need_help', label: '需要协助搬运' },
  { value: 'heavy', label: '重物搬运(50kg+)' }
];

const SERVICE_TYPES = [
  { icon: '🏠', title: '搬家服务', desc: '专业搬家，省心省力', cargoType: '家电家具', vehicle: '金杯' },
  { icon: '📦', title: '货物运输', desc: '快速拉货，安全准时', cargoType: '日用品', vehicle: '中面' },
  { icon: '⚡', title: '同城急送', desc: '15分钟响应，当日达', cargoType: '其他', vehicle: '小面' },
  { icon: '🛡️', title: '货运保险', desc: '全程保障，破损赔付', cargoType: '电子产品', vehicle: '厢货' }
];

const FLOW_STEPS = [
  { step: 1, title: '智能估价', desc: '输入地址货物，实时计算费用', icon: '💰', btnText: '立即估价', color: '#1677ff' },
  { step: 2, title: '发布订单', desc: '选择保价，一键发布', icon: '📝', btnText: '去下单', color: '#52c41a' },
  { step: 3, title: '15秒匹配', desc: 'LBS定位，司机池动态匹配', icon: '🎯', btnText: '查看司机池', color: '#fa8c16' },
  { step: 4, title: '电子签署', desc: '取货确认，运单电子签名', icon: '✍️', btnText: '签署演示', color: '#722ed1' },
  { step: 5, title: '轨迹追踪', desc: '实时位置，多快递轨迹聚合', icon: '📍', btnText: '查询轨迹', color: '#13c2c2' },
  { step: 6, title: '评价完成', desc: '送达确认，服务评价反向激励', icon: '⭐', btnText: '去评价', color: '#eb2f96' }
];

export default function Home() {
  const { user, userType, login } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [inTransitOrders, setInTransitOrders] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [idleDrivers, setIdleDrivers] = useState([]);

  const [showDriversModal, setShowDriversModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [driversLoading, setDriversLoading] = useState(false);
  const [signForm, setSignForm] = useState({ signed: false });

  const [serviceEstimates, setServiceEstimates] = useState({});
  const [estimateLoading, setEstimateLoading] = useState({});
  const [serviceForms, setServiceForms] = useState({});
  const [publishedOrders, setPublishedOrders] = useState({});
  const [matchedDrivers, setMatchedDrivers] = useState({});
  const [insuranceInfo, setInsuranceInfo] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadStats();
    loadQualityData();
    loadInTransitOrders();
    loadPendingOrders();
    loadNearbyDrivers();
  }, []);

  const loadStats = async () => {
    try {
      const res = await api.get('/stats');
      setStats(res.data);
    } catch (err) {
      console.error('加载统计数据失败', err);
    }
  };

  const loadQualityData = async () => {
    try {
      const res = await api.get('/public/quality');
      setQualityData(res.data);
    } catch (err) {
      console.error('加载质量数据失败', err);
    }
  };

  const loadInTransitOrders = async () => {
    try {
      const res = await api.get('/public/orders?status=in_transit');
      setInTransitOrders(res.data.orders || []);
    } catch (err) {
      console.error('加载进行中订单失败', err);
    }
  };

  const loadPendingOrders = async () => {
    try {
      const res = await api.get('/public/orders?status=pending');
      setPendingOrders(res.data.orders || []);
    } catch (err) {
      console.error('加载待接单列表失败', err);
    }
  };

  const loadNearbyDrivers = async () => {
    try {
      const res = await api.get('/public/nearby-drivers?lat=39.9&lng=116.4');
      const drivers = res.data.drivers || [];
      setNearbyDrivers(drivers);
      const idle = drivers.filter(d => !d.has_active_order);
      setIdleDrivers(idle);
    } catch (err) {
      console.error('加载附近司机失败', err);
    }
  };

  const checkAuth = (requiredType = 'shipper') => {
    if (!user) {
      navigate('/login', { state: { presetType: requiredType } });
      return false;
    }
    if (requiredType && userType !== requiredType) {
      alert(`需要以${requiredType === 'shipper' ? '货主' : requiredType === 'admin' ? '管理员' : '司机'}身份登录`);
      return false;
    }
    return true;
  };

  const activateDemoRole = (role, nextPath = '/') => {
    const demoUsers = {
      shipper: { id: 1, name: '演示货主', phone: '13900139001' },
      driver: { id: 2, name: '演示司机', phone: '13800138001', vehicle_type: '中面' },
      admin: { id: 3, name: '演示管理员', username: 'admin' }
    };
    login(`local-demo-${role}`, demoUsers[role], role);
    navigate(nextPath);
  };

  const handleRoleClick = (role) => {
    const routes = { shipper: '/create-order', driver: '/driver', admin: '/admin' };
    if (user && userType === role) {
      navigate(routes[role]);
    } else {
      activateDemoRole(role, routes[role]);
    }
  };

  const updateServiceForm = (index, field, value) => {
    setServiceForms({
      ...serviceForms,
      [index]: { ...serviceForms[index], [field]: value }
    });
  };

  const handleServiceEstimate = async (index, service) => {
    const form = serviceForms[index] || {};
    setEstimateLoading({ ...estimateLoading, [index]: true });
    try {
      const res = await api.post('/orders/estimate', {
        distance: parseFloat(form.distance || 10),
        vehicle_type: form.vehicle_type || service.vehicle,
        cargo_type: form.cargo_type || service.cargoType,
        cargo_weight: parseFloat(form.cargo_weight || 100),
        cargo_volume: parseFloat(form.cargo_volume || 1),
        loading_requirement: form.loading_requirement || ''
      });
      setServiceEstimates({ ...serviceEstimates, [index]: res.data });
    } catch (err) {
      alert('估价失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setEstimateLoading({ ...estimateLoading, [index]: false });
    }
  };

  const handlePublishOrder = async (index, service) => {
    if (!checkAuth('shipper')) return;
    const form = serviceForms[index] || {};
    setActionLoading({ ...actionLoading, [`publish-${index}`]: true });
    try {
      const res = await api.post('/orders', {
        start_address: form.start_address || '北京市朝阳区国贸',
        end_address: form.end_address || '北京市海淀区中关村',
        distance: parseFloat(form.distance || 10),
        vehicle_type: form.vehicle_type || service.vehicle,
        cargo_type: form.cargo_type || service.cargoType,
        cargo_weight: parseFloat(form.cargo_weight || 100),
        cargo_volume: parseFloat(form.cargo_volume || 1),
        loading_requirement: form.loading_requirement || '',
        insured_value: parseFloat(form.insured_value || 0),
        remark: form.remark || '',
        start_lat: 39.9087,
        start_lng: 116.4605,
        end_lat: 39.9842,
        end_lng: 116.3074
      });
      const order = res.data.order;
      setPublishedOrders({ ...publishedOrders, [index]: order });
      alert(`订单发布成功，订单号${order.order_no}`);
    } catch (err) {
      alert('发布失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setActionLoading({ ...actionLoading, [`publish-${index}`]: false });
    }
  };

  const handleMatchDriver = async (index) => {
    if (!checkAuth('shipper')) return;
    if (!publishedOrders[index]) {
      alert('请先发布订单');
      return;
    }
    setActionLoading({ ...actionLoading, [`match-${index}`]: true });
    try {
      const res = await api.get('/public/nearby-drivers?lat=39.9&lng=116.4');
      const drivers = res.data.drivers || [];
      if (drivers.length > 0) {
        const nearest = drivers[0];
        setMatchedDrivers({ ...matchedDrivers, [index]: nearest });
        alert(`已为您匹配最近司机：${nearest.name}（${nearest.vehicle_type}，距离${nearest.distance}km）`);
      } else {
        alert('暂无附近司机，请稍后再试');
      }
    } catch (err) {
      alert('匹配失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setActionLoading({ ...actionLoading, [`match-${index}`]: false });
    }
  };

  const handleInsuranceConfirm = (index) => {
    if (!checkAuth('shipper')) return;
    const form = serviceForms[index] || {};
    const insuredValue = parseFloat(form.insured_value || 0);
    if (insuredValue <= 0) {
      alert('请先填写保价金额');
      return;
    }
    if (!publishedOrders[index]) {
      alert('请先发布订单');
      return;
    }
    const premium = Math.round(insuredValue * 0.003);
    const policyNo = 'INS' + Date.now().toString().slice(-8);
    setInsuranceInfo({ ...insuranceInfo, [index]: { policyNo, insuredValue, premium } });
    alert(`已为您投保货运保险，保单号${policyNo}，保额¥${insuredValue}，保费¥${premium}`);
  };

  const handleClaim = (index) => {
    if (!checkAuth('shipper')) return;
    if (!publishedOrders[index]) {
      alert('请先发布订单');
      return;
    }
    setShowClaimModal(true);
  };

  const handleViewOrderDetail = (index) => {
    if (!checkAuth('shipper')) return;
    const order = publishedOrders[index];
    if (order) {
      navigate(`/orders/${order.id}`);
    } else {
      alert('请先发布订单');
    }
  };

  const handleStepClick = async (step) => {
    switch (step) {
      case 1:
        document.getElementById('service-cards')?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 2:
        if (userType === 'shipper') {
          navigate('/create-order');
        } else if (!user) {
          navigate('/login', { state: { presetType: 'shipper' } });
        } else {
          activateDemoRole('shipper', '/create-order');
        }
        break;
      case 3:
        setDriversLoading(true);
        try {
          const res = await api.get('/public/nearby-drivers?lat=39.9&lng=116.4');
          setNearbyDrivers(res.data.drivers || []);
        } catch (err) {
          console.error('加载司机列表失败', err);
        } finally {
          setDriversLoading(false);
        }
        setShowDriversModal(true);
        break;
      case 4:
        setShowSignModal(true);
        break;
      case 5:
        navigate('/tracking');
        break;
      case 6:
        if (userType === 'shipper') {
          navigate('/my-orders');
        } else if (!user) {
          navigate('/login', { state: { presetType: 'shipper' } });
        } else {
          activateDemoRole('shipper', '/my-orders');
        }
        break;
    }
  };

  const handleComplaintReview = (complaint) => {
    if (userType === 'admin') {
      navigate('/admin/complaints');
    } else if (!user) {
      navigate('/login', { state: { presetType: 'admin' } });
    } else {
      activateDemoRole('admin', '/admin/complaints');
    }
  };

  const handleSignConfirm = () => {
    setSignForm({ signed: true });
    setTimeout(() => {
      alert('电子签署成功！运单已生效');
      setShowSignModal(false);
      setSignForm({ signed: false });
    }, 500);
  };

  const handleClaimConfirm = () => {
    alert('赔付申请已提交，客服将在24小时内联系您');
    setShowClaimModal(false);
  };

  const pct = (v) => v != null ? `${(v * 100).toFixed(1)}%` : '--';

  const isQualityWarning = (type, value) => {
    if (value == null) return false;
    switch (type) {
      case 'on_time': return value < 0.95;
      case 'complaint': return value > 0.02;
      case 'damage': return value > 0.01;
      default: return false;
    }
  };

  const getRevenueTrend = () => {
    const today = stats?.revenue_stats?.today_revenue || 0;
    const yesterday = Math.round(today * 0.92);
    const avg7 = Math.round(today * 0.88);
    return { today, yesterday, avg7 };
  };

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
        color: 'white',
        padding: '60px 20px 80px'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '42px', marginBottom: '12px' }}>
            快货运 - B2C短途货运撮合平台
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '40px' }}>
            搬家、拉货、同城急送，一键呼叫，15秒极速响应
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '0 20px', marginTop: '-40px', marginBottom: '60px' }}>
        <div className="grid grid-3">
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ marginBottom: '12px', color: '#1677ff' }}>货主</h3>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>智能估价，价格透明</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>15秒极速响应</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>货运保险保障</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleRoleClick('shipper')}>
              立即发货
            </button>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚚</div>
            <h3 style={{ marginBottom: '12px', color: '#fa8c16' }}>司机</h3>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>LBS订单精准推送</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>电子运单签署</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>评价激励机制</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', background: '#fa8c16' }} onClick={() => handleRoleClick('driver')}>
              我要接单
            </button>
          </div>

          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎛️</div>
            <h3 style={{ marginBottom: '12px', color: '#722ed1' }}>运营管理</h3>
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>质量监控三维预警</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>智能运力调度</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#52c41a' }}>✓</span><span>运费透明审计</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', background: '#722ed1' }} onClick={() => handleRoleClick('admin')}>
              进入后台
            </button>
          </div>
        </div>
      </div>

      <div id="service-cards" className="container" style={{ padding: '0 20px', marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '32px' }}>选择您需要的服务</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>填写货运需求，快速估价，透明收费</p>
        
        <div className="grid grid-2" style={{ gap: '24px' }}>
          {SERVICE_TYPES.map((s, i) => (
            <div key={i} className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '36px' }}>{s.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{s.title}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{s.desc}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                <div className="grid grid-2">
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>始发地</label>
                    <input
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="如：北京市朝阳区国贸"
                      value={serviceForms[i]?.start_address || ''}
                      onChange={(e) => updateServiceForm(i, 'start_address', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>目的地</label>
                    <input
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="如：北京市海淀区中关村"
                      value={serviceForms[i]?.end_address || ''}
                      onChange={(e) => updateServiceForm(i, 'end_address', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>货物类型</label>
                    <select
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      value={serviceForms[i]?.cargo_type || s.cargoType}
                      onChange={(e) => updateServiceForm(i, 'cargo_type', e.target.value)}
                    >
                      {CARGO_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>车型选择</label>
                    <select
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      value={serviceForms[i]?.vehicle_type || s.vehicle}
                      onChange={(e) => updateServiceForm(i, 'vehicle_type', e.target.value)}
                    >
                      {VEHICLE_TYPES.map(v => <option key={v.value} value={v.value}>{v.value} {v.desc}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-3">
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>重量(kg)</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="重量"
                      value={serviceForms[i]?.cargo_weight || 100}
                      onChange={(e) => updateServiceForm(i, 'cargo_weight', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>体积(m³)</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="体积"
                      value={serviceForms[i]?.cargo_volume || 1}
                      onChange={(e) => updateServiceForm(i, 'cargo_volume', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>里程(km)</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="里程"
                      value={serviceForms[i]?.distance || 10}
                      onChange={(e) => updateServiceForm(i, 'distance', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>装卸需求</label>
                    <select
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      value={serviceForms[i]?.loading_requirement || ''}
                      onChange={(e) => updateServiceForm(i, 'loading_requirement', e.target.value)}
                    >
                      {LOADING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '2px' }}>保价金额(元)</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '13px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                      placeholder="0=不保价"
                      value={serviceForms[i]?.insured_value || 0}
                      onChange={(e) => updateServiceForm(i, 'insured_value', e.target.value)}
                    />
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                  onClick={() => handleServiceEstimate(i, s)}
                  disabled={estimateLoading[i]}
                >
                  {estimateLoading[i] ? '计算中...' : '💰 快速估价'}
                </button>
              </div>

              {serviceEstimates[i] && (
                <div style={{ background: '#fff7e6', padding: '16px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fa8c16', fontSize: '16px' }}>
                    预估总价：¥{serviceEstimates[i].price}
                    {serviceForms[i]?.insured_value > 0 && (
                      <span style={{ fontSize: '12px', color: '#999', fontWeight: 'normal' }}>
                        {' '}(含保费¥{Math.round(serviceForms[i].insured_value * 0.003)})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    <div>基础费：¥{serviceEstimates[i].price_detail?.base || 0}</div>
                    <div>里程费：¥{serviceEstimates[i].price_detail?.distance || 0}</div>
                    {serviceEstimates[i].price_detail?.weight_surcharge > 0 && (
                      <div>超重附加：¥{serviceEstimates[i].price_detail.weight_surcharge}</div>
                    )}
                    {serviceEstimates[i].price_detail?.volume_surcharge > 0 && (
                      <div>超体积附加：¥{serviceEstimates[i].price_detail.volume_surcharge}</div>
                    )}
                    {serviceEstimates[i].price_detail?.loading_surcharge > 0 && (
                      <div>搬运服务费：¥{serviceEstimates[i].price_detail.loading_surcharge}</div>
                    )}
                    {serviceEstimates[i].price_detail?.time_multiplier > 1 && (
                      <div style={{ color: '#fa8c16' }}>时段溢价：x{serviceEstimates[i].price_detail.time_multiplier}</div>
                    )}
                    <div style={{ color: '#999', marginTop: '4px' }}>预计运输：约{serviceEstimates[i].estimated_time}分钟</div>
                  </div>

                  {publishedOrders[i] && (
                    <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
                      ✓ 订单已发布：{publishedOrders[i].order_no}
                    </div>
                  )}
                  {matchedDrivers[i] && (
                    <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
                      ✓ 已匹配司机：{matchedDrivers[i].name}（{matchedDrivers[i].vehicle_type}）
                    </div>
                  )}
                  {insuranceInfo[i] && (
                    <div style={{ background: '#fff0f6', border: '1px solid #ffadd2', padding: '8px', borderRadius: '4px', marginBottom: '12px', fontSize: '12px' }}>
                      ✓ 已投保：{insuranceInfo[i].policyNo}，保额¥{insuranceInfo[i].insuredValue}
                    </div>
                  )}

                  <div className="grid grid-2" style={{ gap: '8px', marginBottom: '12px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px', fontSize: '12px' }}
                      onClick={() => handlePublishOrder(i, s)}
                      disabled={actionLoading[`publish-${i}`] || publishedOrders[i]}
                    >
                      {actionLoading[`publish-${i}`] ? '发布中...' : publishedOrders[i] ? '✓ 已发布' : '📝 发布运单'}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px', fontSize: '12px', background: '#fa8c16' }}
                      onClick={() => handleMatchDriver(i)}
                      disabled={actionLoading[`match-${i}`] || matchedDrivers[i]}
                    >
                      {actionLoading[`match-${i}`] ? '匹配中...' : matchedDrivers[i] ? '✓ 已匹配' : '🎯 15秒匹配司机'}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px', fontSize: '12px', background: '#13c2c2' }}
                      onClick={() => handleInsuranceConfirm(i)}
                      disabled={insuranceInfo[i]}
                    >
                      {insuranceInfo[i] ? '✓ 已投保' : '🛡️ 投保确认'}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px', fontSize: '12px', background: '#eb2f96' }}
                      onClick={() => handleClaim(i)}
                    >
                      💰 赔付申请
                    </button>
                  </div>

                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', padding: '8px', fontSize: '12px' }}
                    onClick={() => handleViewOrderDetail(i)}
                  >
                    📋 查看订单详情 →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '0 20px', marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '32px' }}>完整业务闭环</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>点击每个步骤，直接进入业务操作</p>
        
        <div className="grid grid-3" style={{ gap: '16px' }}>
          {FLOW_STEPS.map((item, i) => (
            <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '50px', height: '50px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#999', marginBottom: '2px' }}>Step {item.step}</div>
                  <h4 style={{ margin: 0, fontSize: '16px', color: item.color }}>{item.title}</h4>
                </div>
              </div>
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px', flex: 1 }}>{item.desc}</p>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '8px', fontSize: '13px', background: item.color, borderColor: item.color }}
                onClick={() => handleStepClick(item.step)}
              >
                {item.btnText} →
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '0 20px', marginBottom: '60px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '32px' }}>运营数据三维看板</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>实时数据监控，无需登录即可查看核心指标</p>
        
        <div className="grid grid-3" style={{ gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#fa8c16' }}>📊 质量指标</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: isQualityWarning('on_time', stats?.quality_stats?.on_time_rate) ? '#ff4d4f' : '#52c41a' }}>
                  {stats?.quality_stats?.on_time_rate != null ? pct(stats.quality_stats.on_time_rate) : '--'}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>准时率</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: isQualityWarning('complaint', stats?.quality_stats?.complaint_rate) ? '#ff4d4f' : '#fa8c16' }}>
                  {stats?.quality_stats?.complaint_rate != null ? pct(stats.quality_stats.complaint_rate) : '--'}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>投诉率</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: isQualityWarning('damage', stats?.quality_stats?.damage_rate) ? '#ff4d4f' : '#ff4d4f' }}>
                  {stats?.quality_stats?.damage_rate != null ? pct(stats.quality_stats.damage_rate) : '--'}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>货损率</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>质量预警：</div>
              <div style={{ display: 'grid', gap: '4px' }}>
                {isQualityWarning('on_time', stats?.quality_stats?.on_time_rate) && (
                  <div style={{ fontSize: '12px', color: '#ff4d4f', background: '#fff1f0', padding: '4px 8px', borderRadius: '4px' }}>
                    ⚠️ 准时率低于95%，需关注
                  </div>
                )}
                {isQualityWarning('complaint', stats?.quality_stats?.complaint_rate) && (
                  <div style={{ fontSize: '12px', color: '#ff4d4f', background: '#fff1f0', padding: '4px 8px', borderRadius: '4px' }}>
                    ⚠️ 投诉率高于2%，需处理
                  </div>
                )}
                {isQualityWarning('damage', stats?.quality_stats?.damage_rate) && (
                  <div style={{ fontSize: '12px', color: '#ff4d4f', background: '#fff1f0', padding: '4px 8px', borderRadius: '4px' }}>
                    ⚠️ 货损率高于1%，需排查
                  </div>
                )}
                {!isQualityWarning('on_time', stats?.quality_stats?.on_time_rate) && 
                 !isQualityWarning('complaint', stats?.quality_stats?.complaint_rate) && 
                 !isQualityWarning('damage', stats?.quality_stats?.damage_rate) && (
                  <div style={{ fontSize: '12px', color: '#52c41a', background: '#f6ffed', padding: '4px 8px', borderRadius: '4px' }}>
                    ✓ 各项质量指标正常
                  </div>
                )}
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>近期投诉记录：</div>
              {qualityData?.recent_complaints?.length > 0 ? (
                <div style={{ display: 'grid', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                  {qualityData.recent_complaints.slice(0, 3).map((c, ci) => (
                    <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '6px 8px', background: '#fafafa', borderRadius: '4px' }}>
                      <div>
                        <span style={{ color: '#333' }}>{c.order_no}</span>
                        <span style={{ color: '#fa8c16', marginLeft: '8px' }}>{c.type}</span>
                        <span style={{ color: '#999', marginLeft: '8px' }}>{c.status}</span>
                      </div>
                      <button
                        style={{ fontSize: '11px', padding: '2px 8px', background: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => handleComplaintReview(c)}
                      >
                        复查
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '12px' }}>暂无投诉记录</div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#13c2c2' }}>🗺️ 运力调度</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats?.capacity_stats?.online_drivers || 0}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>在线司机</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                  {stats?.capacity_stats?.active_orders || 0}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>进行中订单</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {pendingOrders.length}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>待接单</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>进行中订单：</div>
              {inTransitOrders.length > 0 ? (
                <div style={{ display: 'grid', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                  {inTransitOrders.slice(0, 2).map((o, oi) => (
                    <div key={oi} style={{ fontSize: '12px', padding: '4px 8px', background: '#e6f7ff', borderRadius: '4px' }}>
                      <span style={{ color: '#1677ff' }}>{o.order_no}</span>
                      <span style={{ color: '#666', marginLeft: '8px' }}>{o.start_address?.slice(0, 6)}→{o.end_address?.slice(0, 6)}</span>
                      <span style={{ color: '#999', marginLeft: '8px' }}>{o.vehicle_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#999' }}>暂无进行中订单</div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>
                空闲司机（{idleDrivers.length}人）：
              </div>
              {idleDrivers.length > 0 ? (
                <div style={{ display: 'grid', gap: '4px', maxHeight: '60px', overflowY: 'auto' }}>
                  {idleDrivers.slice(0, 2).map((d, di) => (
                    <div key={di} style={{ fontSize: '12px', padding: '4px 8px', background: '#f6ffed', borderRadius: '4px' }}>
                      <span style={{ color: '#52c41a' }}>{d.name}</span>
                      <span style={{ color: '#666', marginLeft: '8px' }}>{d.vehicle_type}</span>
                      <span style={{ color: '#999', marginLeft: '8px' }}>{d.distance}km</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#999' }}>暂无空闲司机</div>
              )}
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', color: '#722ed1' }}>📋 营收审计</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{stats?.revenue_stats?.today_revenue || 0}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>今日营收</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1677ff' }}>
                  ¥{stats?.revenue_stats?.total_revenue || 0}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>总营收</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  ¥{stats?.revenue_stats?.avg_price || 0}
                </div>
                <div style={{ color: '#666', fontSize: '12px' }}>平均客单价</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>近7天营收趋势：</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: '#f9f0ff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>¥{getRevenueTrend().today}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>今日</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#f9f0ff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>¥{getRevenueTrend().yesterday}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>昨日</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#f9f0ff', borderRadius: '6px' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#722ed1' }}>¥{getRevenueTrend().avg7}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>7日平均</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333', marginBottom: '8px' }}>
                价格异常订单{qualityData?.price_anomalies?.length > 0 && ` (${qualityData.price_anomalies.length}笔)`}：
              </div>
              {qualityData?.price_anomalies?.length > 0 ? (
                <div style={{ display: 'grid', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                  {qualityData.price_anomalies.slice(0, 3).map((a, ai) => (
                    <div key={ai} style={{ fontSize: '12px', padding: '4px 8px', background: '#fff1f0', borderRadius: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>
                        <span style={{ color: '#ff4d4f' }}>{a.order_no}</span>
                        <span style={{ color: '#666', marginLeft: '8px' }}>¥{a.price}</span>
                      </span>
                      <span style={{ color: '#ff4d4f' }}>偏离{a.deviation}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '8px' }}>✓ 暂无价格异常</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDriversModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowDriversModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '550px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>🎯 附近在线司机</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowDriversModal(false)}>×</button>
            </div>
            {driversLoading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
            ) : nearbyDrivers.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {nearbyDrivers.map((d, i) => (
                  <div key={i} style={{ padding: '12px', border: '1px solid #e8e8e8', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{d.name} <span style={{ fontSize: '12px', color: '#666' }}>{d.vehicle_type} · {d.vehicle_number}</span></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>距离：{typeof d.distance === 'number' ? d.distance.toFixed(1) : d.distance}km · 评分：{d.service_score}⭐</div>
                      </div>
                      <span style={{ color: '#52c41a', fontSize: '12px', padding: '4px 8px', background: '#f6ffed', borderRadius: '4px' }}>在线</span>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px', background: '#f0f7ff', borderRadius: '8px', fontSize: '13px', color: '#1677ff', textAlign: 'center' }}>
                  共 {nearbyDrivers.length} 位司机在线，下单后15秒内极速匹配
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>暂无附近司机</div>
            )}
          </div>
        </div>
      )}

      {showSignModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowSignModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>✍️ 电子运单签署</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowSignModal(false)}>×</button>
            </div>
            <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', marginBottom: '12px', fontWeight: 500 }}>模拟运单信息</div>
              <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>订单号：</span>
                  <span>ORD{Date.now().toString().slice(-8)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>货主：</span>
                  <span>{user?.name || '演示货主'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>司机：</span>
                  <span>张师傅（中面）</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>货物信息：</span>
                  <span>日用品 100kg/1m³</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>运费：</span>
                  <span style={{ color: '#fa8c16', fontWeight: 'bold' }}>¥128</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>路线：</span>
                  <span>朝阳区国贸→海淀区中关村</span>
                </div>
              </div>
            </div>
            <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '30px', textAlign: 'center', marginBottom: '20px', minHeight: '80px' }}>
              {signForm.signed ? (
                <div style={{ fontSize: '48px', color: '#52c41a' }}>✓ 已签署</div>
              ) : (
                <div style={{ color: '#999', fontSize: '13px' }}>
                  点击下方"确认签署"完成电子签名
                </div>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginBottom: '16px', lineHeight: '1.6' }}>
              本人确认上述货物信息无误，同意《货运服务协议》，司机取货时已共同验货。
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSignConfirm} disabled={signForm.signed}>
              {signForm.signed ? '签署成功' : '确认签署'}
            </button>
          </div>
        </div>
      )}

      {showClaimModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setShowClaimModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>💰 赔付申请确认</h3>
              <button style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} onClick={() => setShowClaimModal(false)}>×</button>
            </div>
            <div style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.8' }}>
              <p>您确定要申请赔付吗？</p>
              <p style={{ color: '#666', fontSize: '13px' }}>申请赔付需要提供：</p>
              <ul style={{ color: '#666', fontSize: '13px', paddingLeft: '20px' }}>
                <li>货物破损照片</li>
                <li>货物价值证明</li>
                <li>运单信息</li>
              </ul>
              <p style={{ color: '#fa8c16', fontSize: '13px' }}>客服将在24小时内与您联系处理。</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowClaimModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#eb2f96' }} onClick={handleClaimConfirm}>
                确认申请赔付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
