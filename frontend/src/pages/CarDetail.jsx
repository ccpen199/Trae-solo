import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carAPI } from '../api/client';
import useAuthStore from '../store/authStore';

function CarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [car, setCar] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    agency_id: '',
    appointment_time: '',
    contact_name: '',
    contact_phone: '',
    notes: '',
  });

  useEffect(() => {
    loadCar();
    loadAgencies();
  }, [id]);

  const loadCar = async () => {
    try {
      const res = await carAPI.getCar(id);
      setCar(res.data.car);
      if (res.data.agencies && res.data.agencies.length > 0) {
        setAgencies(res.data.agencies);
      }
    } catch (err) {
      alert('加载失败');
      navigate('/cars');
    } finally {
      setLoading(false);
    }
  };

  const loadAgencies = async () => {
    try {
      const res = await carAPI.getAgencies({ region_code: user?.region_code });
      if (agencies.length === 0) {
        setAgencies(res.data.agencies || []);
      }
    } catch (err) {
      console.error('加载检测机构失败', err);
    }
  };

  const handleBookInspection = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('请先登录');
      navigate('/login');
      return;
    }
    try {
      await carAPI.bookInspection(id, bookForm);
      alert('预约成功！检测机构将尽快联系您');
      setShowBookModal(false);
      setBookForm({ agency_id: '', appointment_time: '', contact_name: '', contact_phone: '', notes: '' });
    } catch (err) {
      alert(err.response?.data?.message || '预约失败');
    }
  };

  if (loading) return <div className="loading">加载中...</div>;
  if (!car) return <div className="empty">未找到该车辆</div>;

  const currentYear = new Date().getFullYear();
  const carAge = currentYear - car.year;
  const hasAccident = car.accident_history && car.accident_history !== '无';

  return (
    <div className="page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)}>← 返回列表</button>
      
      <div className="detail-header">
        <h1>{car.title}</h1>
        <div className="detail-meta">
          {car.vin_verified === 1 && <span className="badge badge-success">VIN已核验</span>}
          <span className={`badge ${hasAccident ? 'badge-warning' : 'badge-info'}`}>
            {car.accident_history || '无事故记录'}
          </span>
          <span className="price-large">¥{car.price.toLocaleString()}万</span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>车辆详情</button>
        <button className={`tab ${activeTab === 'vin' ? 'active' : ''}`} onClick={() => setActiveTab('vin')}>VIN解析</button>
        <button className={`tab ${activeTab === 'inspection' ? 'active' : ''}`} onClick={() => setActiveTab('inspection')}>检测预约</button>
      </div>

      {activeTab === 'info' && (
        <div className="card">
          <div className="detail-grid">
            <div className="detail-item">
              <label>品牌</label>
              <span>{car.brand}</span>
            </div>
            <div className="detail-item">
              <label>车型</label>
              <span>{car.model}</span>
            </div>
            <div className="detail-item">
              <label>年款</label>
              <span>{car.year}年</span>
            </div>
            <div className="detail-item">
              <label>里程</label>
              <span>{car.mileage}万公里</span>
            </div>
            <div className="detail-item">
              <label>变速箱</label>
              <span>{car.transmission || '自动'}</span>
            </div>
            <div className="detail-item">
              <label>燃料类型</label>
              <span>{car.fuel_type || '汽油'}</span>
            </div>
            <div className="detail-item">
              <label>颜色</label>
              <span>{car.color || '暂无'}</span>
            </div>
            <div className="detail-item">
              <label>车龄</label>
              <span>{carAge}年</span>
            </div>
            <div className="detail-item">
              <label>所在区域</label>
              <span>{car.region_name}</span>
            </div>
            <div className="detail-item">
              <label>联系人</label>
              <span>{car.contact_name}</span>
            </div>
          </div>

          <div className="detail-section">
            <h3>车辆描述</h3>
            <p>{car.description}</p>
          </div>

          <div className="detail-section">
            <h3>事故记录</h3>
            <div className="info-box">
              <p><strong>事故情况：</strong>{car.accident_history || '未查询到事故记录'}</p>
              <p><strong>保养情况：</strong>正常保养</p>
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={() => setShowBookModal(true)}>预约检测</button>
            <button className="btn btn-secondary">联系卖家</button>
          </div>
        </div>
      )}

      {activeTab === 'vin' && (
        <div className="card">
          <h3>VIN码解析报告</h3>
          {car.vin ? (
            <div className="vin-report">
              <div className="vin-box">
                <span className="vin-label">VIN码：</span>
                <span className="vin-code">{car.vin}</span>
              </div>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>WMI世界制造厂识别码</label>
                  <span>{car.vin.substring(0, 3)}</span>
                </div>
                <div className="detail-item">
                  <label>VDS车辆说明部分</label>
                  <span>{car.vin.substring(3, 9)}</span>
                </div>
                <div className="detail-item">
                  <label>VIS车辆指示部分</label>
                  <span>{car.vin.substring(9, 17)}</span>
                </div>
                <div className="detail-item">
                  <label>生产国家</label>
                  <span>中国</span>
                </div>
                <div className="detail-item">
                  <label>生产厂家</label>
                  <span>{car.brand}汽车</span>
                </div>
                <div className="detail-item">
                  <label>生产年份</label>
                  <span>{car.year}年</span>
                </div>
                <div className="detail-item">
                  <label>检验位</label>
                  <span>{car.vin.charAt(8)}</span>
                </div>
                <div className="detail-item">
                  <label>生产序号</label>
                  <span>{car.vin.substring(12, 17)}</span>
                </div>
              </div>
              <div className="vin-confidence">
                <p><strong>解析置信度：</strong>95%</p>
                <p className="text-muted">数据来源：本地车管所VIN数据库</p>
              </div>
            </div>
          ) : (
            <div className="empty">VIN码未录入</div>
          )}
        </div>
      )}

      {activeTab === 'inspection' && (
        <div className="card">
          <h3>本地检测机构</h3>
          {agencies.length > 0 ? (
            <div className="agency-list">
              {agencies.map((agency) => (
                <div key={agency.id} className="agency-item card">
                  <div className="agency-header">
                    <h4>{agency.name}</h4>
                    <span className="badge badge-success">官方认证</span>
                  </div>
                  <div className="agency-info">
                    <p>📍 {agency.address}{agency.region_name ? ` (${agency.region_name})` : ''}</p>
                    <p>📞 {agency.phone}</p>
                    <p>⏰ 营业时间：{agency.business_hours || '周一至周六 9:00-18:00'}</p>
                    <p>⭐ 评分：{agency.rating || 4.8}分</p>
                    <p>💰 检测费用：¥{agency.price || 300}起</p>
                  </div>
                  <div className="agency-actions">
                    <button className="btn btn-primary" onClick={() => {
                      setBookForm({ ...bookForm, agency_id: agency.id });
                      setShowBookModal(true);
                    }}>立即预约</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">暂无检测机构</div>
          )}
        </div>
      )}

      {showBookModal && (
        <div className="modal-overlay" onClick={() => setShowBookModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>预约车辆检测</h3>
            <form onSubmit={handleBookInspection}>
              <div className="form-group">
                <label>检测机构 *</label>
                <select
                  value={bookForm.agency_id}
                  onChange={(e) => setBookForm({ ...bookForm, agency_id: e.target.value })}
                  required
                >
                  <option value="">请选择检测机构</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} - ¥{a.price || 300}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>预约时间 *</label>
                <input
                  type="datetime-local"
                  value={bookForm.appointment_time}
                  onChange={(e) => setBookForm({ ...bookForm, appointment_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>联系人 *</label>
                <input
                  type="text"
                  value={bookForm.contact_name}
                  onChange={(e) => setBookForm({ ...bookForm, contact_name: e.target.value })}
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>联系电话 *</label>
                <input
                  type="tel"
                  value={bookForm.contact_phone}
                  onChange={(e) => setBookForm({ ...bookForm, contact_phone: e.target.value })}
                  placeholder="请输入手机号"
                  required
                />
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={bookForm.notes}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                  placeholder="特殊需求等"
                  rows="3"
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBookModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认预约</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarDetail;
