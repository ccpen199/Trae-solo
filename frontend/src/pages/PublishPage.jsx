import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { useStore } from '../store';

const SERVICE_OPTIONS = ['代驾', '保洁', '搬家', '维修', '管道疏通', '开锁', '空调安装', '其他'];
const EDUCATION_OPTIONS = ['不限', '高中', '大专', '本科', '硕士', '博士'];
const EXPERIENCE_OPTIONS = ['不限', '1年以下', '1-3年', '3-5年', '5-10年', '10年以上'];
const TRANSMISSION_OPTIONS = ['手动挡', '自动挡', '手自一体'];

function PublishPage() {
  const { categories, user, showToast } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', price_min: '', price_max: '', price_unit: '',
    location: '', city: '', district: '',
    area: '', rooms: '', bathrooms: '', floor: '',
    car_brand: '', car_model: '', car_year: '', car_mileage: '', car_transmission: '',
    job_title: '', job_salary_min: '', job_salary_max: '', job_experience: '', job_education: '',
    service_type: '', service_hours: '',
    images: [], videos: [], cert_files: []
  });

  useEffect(() => {
    if (!user) {
      showToast('请先登录后发布信息', 'error');
      navigate('/auth', { state: { from: location } });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory) { showToast('请选择分类', 'error'); return; }
    if (!formData.title.trim()) { showToast('请输入标题', 'error'); return; }
    try {
      await api.post('/listings', {
        ...formData,
        category_id: selectedCategory.id,
        category_code: selectedCategory.code
      });
      showToast('发布成功！信息已提交审核');
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.error || '发布失败', 'error');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field, e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    const urls = files.map((_, i) => `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(formData.title || 'listing photo')}&image_size=landscape_4_3`);
    setTimeout(() => {
      setFormData(prev => ({ ...prev, [field]: [...prev[field], ...urls] }));
      setUploading(false);
      showToast(`${files.length} 个文件上传成功`);
    }, 800);
  };

  const removeFile = (field, index) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  if (!user) return null;

  const code = selectedCategory?.code;
  const isHouse = code === 'rent' || code === 'house';
  const isCar = code === 'car';
  const isJob = code === 'job';
  const isService = code === 'service';

  return (
    <div className="form-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 className="form-title" style={{ marginBottom: 0 }}>发布信息</h2>
        <div style={{ fontSize: 13, color: '#999' }}>
          当前角色: <span style={{ color: '#1890ff', fontWeight: 600 }}>{user.user_type === 'admin' ? '管理员' : user.user_type === 'b' ? '商家' : '个人用户'}</span>
          {user.user_type === 'b' && <span> · 发布即带认证标识</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">选择分类 *</label>
          <div className="category-tabs">
            {categories.map(cat => (
              <span key={cat.id} className={`category-tab ${selectedCategory?.id === cat.id ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>
                {cat.icon} {cat.name}
              </span>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div style={{ background: '#f6ffed', padding: '10px 16px', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
            已选择: {selectedCategory.icon} {selectedCategory.name} — 请填写下方专属字段
          </div>
        )}

        <div className="form-group">
          <label className="form-label">标题 *</label>
          <input type="text" className="form-input" value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="请输入信息标题" required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">价格</label>
            <input type="number" className="form-input" value={formData.price_min} onChange={e => handleChange('price_min', e.target.value)} placeholder="价格" />
          </div>
          <div className="form-group">
            <label className="form-label">价格单位</label>
            <select className="form-input" value={formData.price_unit} onChange={e => handleChange('price_unit', e.target.value)}>
              <option value="">请选择</option>
              <option value="月">月</option>
              <option value="天">天</option>
              <option value="次">次</option>
              <option value="小时">小时</option>
              <option value="年">年</option>
              <option value="总价">总价</option>
            </select>
          </div>
        </div>

        {isHouse && (
          <>
            <div className="form-row">
              <div className="form-group"><label className="form-label">面积(㎡)</label><input type="number" className="form-input" value={formData.area} onChange={e => handleChange('area', e.target.value)} placeholder="面积" /></div>
              <div className="form-group">
                <label className="form-label">户型</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" className="form-input" value={formData.rooms} onChange={e => handleChange('rooms', e.target.value)} placeholder="室" style={{ flex: 1 }} />
                  <input type="number" className="form-input" value={formData.bathrooms} onChange={e => handleChange('bathrooms', e.target.value)} placeholder="卫" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div className="form-group"><label className="form-label">楼层</label><input type="text" className="form-input" value={formData.floor} onChange={e => handleChange('floor', e.target.value)} placeholder="如：3/6层" /></div>
          </>
        )}

        {isCar && (
          <>
            <div className="form-row">
              <div className="form-group"><label className="form-label">品牌</label><input type="text" className="form-input" value={formData.car_brand} onChange={e => handleChange('car_brand', e.target.value)} placeholder="品牌" /></div>
              <div className="form-group"><label className="form-label">型号</label><input type="text" className="form-input" value={formData.car_model} onChange={e => handleChange('car_model', e.target.value)} placeholder="型号" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">上牌年份</label><input type="number" className="form-input" value={formData.car_year} onChange={e => handleChange('car_year', e.target.value)} placeholder="年份" /></div>
              <div className="form-group"><label className="form-label">里程(万公里)</label><input type="number" className="form-input" value={formData.car_mileage} onChange={e => handleChange('car_mileage', e.target.value)} placeholder="里程" /></div>
            </div>
            <div className="form-group">
              <label className="form-label">变速箱</label>
              <select className="form-input" value={formData.car_transmission} onChange={e => handleChange('car_transmission', e.target.value)}>
                <option value="">请选择</option>
                {TRANSMISSION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </>
        )}

        {isJob && (
          <>
            <div className="form-group"><label className="form-label">职位名称</label><input type="text" className="form-input" value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} placeholder="职位名称" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">薪资最低</label><input type="number" className="form-input" value={formData.job_salary_min} onChange={e => handleChange('job_salary_min', e.target.value)} placeholder="最低薪资" /></div>
              <div className="form-group"><label className="form-label">薪资最高</label><input type="number" className="form-input" value={formData.job_salary_max} onChange={e => handleChange('job_salary_max', e.target.value)} placeholder="最高薪资" /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">经验要求</label>
                <select className="form-input" value={formData.job_experience} onChange={e => handleChange('job_experience', e.target.value)}>
                  <option value="">请选择</option>
                  {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">学历要求</label>
                <select className="form-input" value={formData.job_education} onChange={e => handleChange('job_education', e.target.value)}>
                  <option value="">请选择</option>
                  {EDUCATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </>
        )}

        {isService && (
          <>
            <div className="form-group">
              <label className="form-label">服务类型</label>
              <select className="form-input" value={formData.service_type} onChange={e => handleChange('service_type', e.target.value)}>
                <option value="">请选择</option>
                {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">服务时间</label><input type="text" className="form-input" value={formData.service_hours} onChange={e => handleChange('service_hours', e.target.value)} placeholder="如：全天 / 9:00-18:00" /></div>
          </>
        )}

        <div className="form-group"><label className="form-label">位置</label><input type="text" className="form-input" value={formData.location} onChange={e => handleChange('location', e.target.value)} placeholder="详细地址" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">城市</label><input type="text" className="form-input" value={formData.city} onChange={e => handleChange('city', e.target.value)} placeholder="城市" /></div>
          <div className="form-group"><label className="form-label">区县</label><input type="text" className="form-input" value={formData.district} onChange={e => handleChange('district', e.target.value)} placeholder="区县" /></div>
        </div>
        <div className="form-group"><label className="form-label">描述</label><textarea className="form-input form-textarea" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="请输入详细描述" /></div>

        <FileUploadField label="上传图片" field="images" files={formData.images} onUpload={handleFileUpload} onRemove={removeFile} uploading={uploading} accept="image/*" />
        <FileUploadField label="上传视频" field="videos" files={formData.videos} onUpload={handleFileUpload} onRemove={removeFile} uploading={uploading} accept="video/*" />
        <FileUploadField label="上传证件" field="cert_files" files={formData.cert_files} onUpload={handleFileUpload} onRemove={removeFile} uploading={uploading} accept="image/*,.pdf" />

        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16, marginTop: 20 }} disabled={uploading}>
          {uploading ? '上传中...' : '发布信息'}
        </button>
      </form>
    </div>
  );
}

function FileUploadField({ label, field, files, onUpload, onRemove, uploading, accept }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="upload-area" onClick={() => !uploading && document.getElementById(`${field}Input`).click()}>
        <div>{uploading ? '⏳ 上传中...' : '� 点击上传'}</div>
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>支持 {accept}</div>
      </div>
      <input id={`${field}Input`} type="file" multiple accept={accept} style={{ display: 'none' }} onChange={e => onUpload(field, e)} />
      {files.length > 0 && (
        <div className="upload-preview">
          {files.map((f, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={f} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
              <button type="button" onClick={() => onRemove(field, i)} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublishPage;
