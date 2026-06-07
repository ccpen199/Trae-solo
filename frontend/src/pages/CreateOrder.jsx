import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';

const VEHICLE_TYPES = ['小面', '中面', '金杯', '厢货', '平板'];
const CARGO_TYPES = ['日用品', '家电家具', '建材', '食品', '电子产品', '其他'];
const LOADING_OPTIONS = [
  { value: '', label: '无需搬运' },
  { value: 'need_help', label: '需要协助搬运' },
  { value: 'heavy', label: '重物搬运(50kg+)' }
];

export default function CreateOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const preset = location.state?.preset;
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [priceInfo, setPriceInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    start_address: preset?.start_address || '北京市朝阳区国贸中心',
    start_lat: 39.9087,
    start_lng: 116.4605,
    end_address: preset?.end_address || '北京市海淀区中关村',
    end_lat: 39.9842,
    end_lng: 116.3074,
    distance: preset?.distance || 18,
    vehicle_type: preset?.vehicle_type || '小面',
    cargo_type: preset?.cargo_type || '日用品',
    cargo_weight: preset?.cargo_weight || 100,
    cargo_volume: preset?.cargo_volume || 1,
    cargo_desc: '',
    loading_requirement: preset?.loading_requirement || '',
    insured_value: preset?.insured_value || 0,
    remark: ''
  });

  const handleEstimate = async () => {
    if (!formData.distance || !formData.vehicle_type) return;
    
    setEstimating(true);
    try {
      const res = await api.post('/orders/estimate', {
        distance: parseFloat(formData.distance),
        vehicle_type: formData.vehicle_type,
        cargo_weight: parseFloat(formData.cargo_weight),
        cargo_volume: parseFloat(formData.cargo_volume),
        loading_requirement: formData.loading_requirement
      });
      setPriceInfo(res.data);
    } catch (err) {
      alert('估价失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await api.post('/orders', formData);
      alert('订单创建成功！');
      navigate(`/orders/${res.data.order.id}`);
    } catch (err) {
      alert('创建失败：' + (err.response?.data?.error || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      <div className="card">
        <h2 style={{ marginBottom: '24px' }}>发布货运订单</h2>

        <div style={{ 
          display: 'flex', 
          gap: '40px', 
          marginBottom: '32px', 
          paddingBottom: '20px', 
          borderBottom: '1px solid #eee',
          position: 'relative'
        }}>
          {['地址信息', '货物信息', '确认下单'].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step > i ? '#52c41a' : step === i + 1 ? '#1677ff' : '#d9d9d9',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px',
                fontWeight: 'bold'
              }}>
                {step > i ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: '14px', color: step >= i + 1 ? '#333' : '#999' }}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label>出发地址</label>
              <input
                type="text"
                value={formData.start_address}
                onChange={e => setFormData({ ...formData, start_address: e.target.value })}
                placeholder="请输入出发地址"
                required
              />
            </div>
            
            <div className="form-group">
              <label>到达地址</label>
              <input
                type="text"
                value={formData.end_address}
                onChange={e => setFormData({ ...formData, end_address: e.target.value })}
                placeholder="请输入到达地址"
                required
              />
            </div>
            
            <div className="form-group">
              <label>预估里程(公里)</label>
              <input
                type="number"
                value={formData.distance}
                onChange={e => setFormData({ ...formData, distance: e.target.value })}
                placeholder="请输入预估里程"
                required
              />
            </div>
            
            <div className="form-group">
              <label>车型选择</label>
              <select
                value={formData.vehicle_type}
                onChange={e => setFormData({ ...formData, vehicle_type: e.target.value })}
                required
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                小面(限500kg/2.5m³) | 中面(限1吨/4.5m³) | 金杯(限1.5吨/6m³) | 厢货(限3吨/12m³)
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '12px', marginTop: '16px' }}
              onClick={() => setStep(2)}
            >
              下一步
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-group">
              <label>货物类型</label>
              <select
                value={formData.cargo_type}
                onChange={e => setFormData({ ...formData, cargo_type: e.target.value })}
                required
              >
                {CARGO_TYPES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-2">
              <div className="form-group">
                <label>货物重量(kg)</label>
                <input
                  type="number"
                  value={formData.cargo_weight}
                  onChange={e => setFormData({ ...formData, cargo_weight: e.target.value })}
                  placeholder="请输入货物重量"
                />
              </div>
              
              <div className="form-group">
                <label>货物体积(m³)</label>
                <input
                  type="number"
                  value={formData.cargo_volume}
                  onChange={e => setFormData({ ...formData, cargo_volume: e.target.value })}
                  placeholder="请输入货物体积"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>货物描述</label>
              <textarea
                value={formData.cargo_desc}
                onChange={e => setFormData({ ...formData, cargo_desc: e.target.value })}
                placeholder="请描述货物情况（选填）"
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>搬运需求</label>
              <select
                value={formData.loading_requirement}
                onChange={e => setFormData({ ...formData, loading_requirement: e.target.value })}
              >
                {LOADING_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>保价金额(元) <span style={{ color: '#999', fontSize: '12px' }}>（保费=保价金额×0.3%）</span></label>
              <input
                type="number"
                value={formData.insured_value}
                onChange={e => setFormData({ ...formData, insured_value: e.target.value })}
                placeholder="输入0则不需要保价"
              />
            </div>
            
            <div className="form-group">
              <label>备注</label>
              <textarea
                value={formData.remark}
                onChange={e => setFormData({ ...formData, remark: e.target.value })}
                placeholder="其他要求（选填）"
                rows={2}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setStep(1)}
              >
                上一步
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => { handleEstimate(); setStep(3); }}
                disabled={estimating}
              >
                {estimating ? '估价中...' : '预估费用并确认'}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="card" style={{ background: '#f5f5f5', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px' }}>订单信息确认</h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>出发地址：</span>
                  <span>{formData.start_address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>到达地址：</span>
                  <span>{formData.end_address}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>车型：</span>
                  <span>{formData.vehicle_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>货物类型：</span>
                  <span>{formData.cargo_type}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>预估里程：</span>
                  <span>{formData.distance} 公里</span>
                </div>
              </div>
            </div>

            {priceInfo && (
              <div className="card" style={{ background: '#fff7e6', marginBottom: '24px' }}>
                <h3 style={{ marginBottom: '16px', color: '#fa8c16' }}>费用明细</h3>
                
                <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>基础费用</span>
                    <span>¥{priceInfo.price_detail?.base || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>里程费用</span>
                    <span>¥{priceInfo.price_detail?.distance || 0}</span>
                  </div>
                  {priceInfo.price_detail?.loading_surcharge > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>搬运服务费</span>
                      <span>¥{priceInfo.price_detail.loading_surcharge}</span>
                    </div>
                  )}
                  {priceInfo.price_detail?.time_multiplier > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>时段溢价 (x{priceInfo.price_detail.time_multiplier})</span>
                      <span style={{ color: '#fa8c16' }}>+¥{Math.round(priceInfo.price * (1 - 1/priceInfo.price_detail.time_multiplier))}</span>
                    </div>
                  )}
                  {formData.insured_value > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>货运险 (保价¥{formData.insured_value})</span>
                      <span>¥{Math.round(formData.insured_value * 0.003)}</span>
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  borderTop: '2px dashed #fa8c16', 
                  paddingTop: '12px',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>预估总价</span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fa8c16' }}>
                    ¥{priceInfo.price + (formData.insured_value > 0 ? Math.round(formData.insured_value * 0.003) : 0)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '12px' }}
                onClick={() => setStep(2)}
              >
                返回修改
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? '提交中...' : '确认下单'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
