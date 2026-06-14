import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

const PublishProperty = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'apartment',
    rent_mode: 'whole',
    price: '',
    deposit: '',
    area: '',
    rooms: '',
    bathrooms: '',
    floor: '',
    total_floors: '',
    orientation: '南北',
    decoration: '精装',
    address: '',
    city: '北京',
    district: '',
    community: '',
    facilities: [],
    tags: []
  });

  const facilitiesOptions = ['空调', '洗衣机', '冰箱', '热水器', 'WiFi', '天然气', '车位', '储物间', '电视', '床', '衣柜', '沙发'];
  const tagsOptions = ['近地铁', '学区房', '有电梯', '独立卫浴', 'loft', '近公园', '有车位', '性价比高', '拎包入住'];

  if (user && user.role !== 'landlord') {
    return (
      <div className="container" style={{ padding: '3rem 0', textAlign: 'center' }}>
        <p>只有房东可以发布房源</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckbox = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/properties', formData);
      navigate('/profile?tab=my-properties');
    } catch (error) {
      setError(error.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <h1 className="text-2xl font-bold mb-8">发布房源</h1>

      {error && (
        <div className="alert alert-error mb-4">{error}</div>
      )}

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">房源标题 *</label>
              <input
                type="text"
                name="title"
                className="form-input"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="例如：朝阳区精装两居室"
              />
            </div>

            <div className="form-group">
              <label className="form-label">房源描述</label>
              <textarea
                name="description"
                className="form-input"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="请描述房源特点、周边配套等"
              />
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">月租金（元）*</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">押金（元）</label>
                <input
                  type="number"
                  name="deposit"
                  className="form-input"
                  value={formData.deposit}
                  onChange={handleChange}
                  placeholder="默认1个月租金"
                />
              </div>
              <div className="form-group">
                <label className="form-label">面积（㎡）</label>
                <input
                  type="number"
                  name="area"
                  className="form-input"
                  value={formData.area}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">户型 - 室</label>
                <input
                  type="number"
                  name="rooms"
                  className="form-input"
                  value={formData.rooms}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">户型 - 卫</label>
                <input
                  type="number"
                  name="bathrooms"
                  className="form-input"
                  value={formData.bathrooms}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">楼层</label>
                <input
                  type="text"
                  name="floor"
                  className="form-input"
                  value={formData.floor}
                  onChange={handleChange}
                  placeholder="例如：中层"
                />
              </div>
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">房屋类型</label>
                <select
                  name="property_type"
                  className="form-input"
                  value={formData.property_type}
                  onChange={handleChange}
                >
                  <option value="apartment">公寓</option>
                  <option value="house">别墅</option>
                  <option value="studio">单间</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">租赁方式</label>
                <select
                  name="rent_mode"
                  className="form-input"
                  value={formData.rent_mode}
                  onChange={handleChange}
                >
                  <option value="whole">整租</option>
                  <option value="share">合租</option>
                  <option value="sublet">转租</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">朝向</label>
                <select
                  name="orientation"
                  className="form-input"
                  value={formData.orientation}
                  onChange={handleChange}
                >
                  <option value="南北">南北通透</option>
                  <option value="南">朝南</option>
                  <option value="北">朝北</option>
                  <option value="东">朝东</option>
                  <option value="西">朝西</option>
                  <option value="东南">东南</option>
                  <option value="西南">西南</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">详细地址 *</label>
              <input
                type="text"
                name="address"
                className="form-input"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="例如：北京市朝阳区建国路88号"
              />
            </div>

            <div className="grid grid-3">
              <div className="form-group">
                <label className="form-label">城市</label>
                <select
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                >
                  <option value="北京">北京</option>
                  <option value="上海">上海</option>
                  <option value="广州">广州</option>
                  <option value="深圳">深圳</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">区域</label>
                <input
                  type="text"
                  name="district"
                  className="form-input"
                  value={formData.district}
                  onChange={handleChange}
                  placeholder="例如：朝阳区"
                />
              </div>
              <div className="form-group">
                <label className="form-label">小区名称</label>
                <input
                  type="text"
                  name="community"
                  className="form-input"
                  value={formData.community}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">配套设施</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {facilitiesOptions.map(facility => (
                  <label key={facility} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    background: formData.facilities.includes(facility) ? '#eef2ff' : '#f3f4f6',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(facility)}
                      onChange={() => handleCheckbox('facilities', facility)}
                      style={{ margin: 0 }}
                    />
                    {facility}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">房源标签</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {tagsOptions.map(tag => (
                  <label key={tag} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    background: formData.tags.includes(tag) ? '#eef2ff' : '#f3f4f6',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="checkbox"
                      checked={formData.tags.includes(tag)}
                      onChange={() => handleCheckbox('tags', tag)}
                      style={{ margin: 0 }}
                    />
                    {tag}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                className="btn"
                onClick={() => navigate(-1)}
                style={{ flex: 1 }}
              >
                取消
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? '发布中...' : '发布房源'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublishProperty;
