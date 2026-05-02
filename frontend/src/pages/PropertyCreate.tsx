import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../services/api';
import { Building2, Save, ArrowLeft, Loader2 } from 'lucide-react';

interface PropertyForm {
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  country: string;
  zipCode: string;
  propertyType: string;
  roomCount: number;
  bedCount: number;
  bathCount: number;
  maxGuests: number;
  pricePerNight: number;
  depositAmount: number;
  cleaningFee: number;
  checkInTime: string;
  checkOutTime: string;
  amenities: string[];
  houseRules: string[];
  cancellationPolicy: string;
}

const PropertyCreate: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<PropertyForm>({
    name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    country: '中国',
    zipCode: '',
    propertyType: 'apartment',
    roomCount: 1,
    bedCount: 1,
    bathCount: 1,
    maxGuests: 2,
    pricePerNight: 200,
    depositAmount: 0,
    cleaningFee: 0,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    amenities: ['wifi'],
    houseRules: [],
    cancellationPolicy: 'flexible',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      loadProperty(id);
    }
  }, [isEdit, id]);

  const loadProperty = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/properties/${propertyId}`);
      const property = response.data?.property;
      if (property) {
        setForm({
          name: property.name || '',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          province: property.province || '',
          country: property.country || '中国',
          zipCode: property.zipCode || '',
          propertyType: property.propertyType || 'apartment',
          roomCount: property.roomCount || 1,
          bedCount: property.bedCount || 1,
          bathCount: property.bathCount || 1,
          maxGuests: property.maxGuests || 2,
          pricePerNight: property.pricePerNight || 200,
          depositAmount: property.depositAmount || 0,
          cleaningFee: property.cleaningFee || 0,
          checkInTime: property.checkInTime || '14:00',
          checkOutTime: property.checkOutTime || '12:00',
          amenities: property.amenities || [],
          houseRules: property.houseRules || [],
          cancellationPolicy: property.cancellationPolicy || 'flexible',
        });
      }
    } catch (err) {
      console.error('Failed to load property:', err);
      setError('加载房源信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const propertyTypeOptions = [
    { value: 'apartment', label: '公寓' },
    { value: 'house', label: '独栋房屋' },
    { value: 'villa', label: '别墅' },
    { value: 'condo', label: '共管公寓' },
    { value: 'loft', label: 'LOFT' },
    { value: 'studio', label: '工作室' },
  ];

  const amenityOptions = [
    { key: 'wifi', label: 'WiFi' },
    { key: 'airConditioner', label: '空调' },
    { key: 'heater', label: '暖气' },
    { key: 'tv', label: '电视' },
    { key: 'kitchen', label: '厨房' },
    { key: 'washer', label: '洗衣机' },
    { key: 'dryer', label: '烘干机' },
    { key: 'parking', label: '停车位' },
    { key: 'pool', label: '泳池' },
    { key: 'gym', label: '健身房' },
  ];

  const ruleOptions = [
    { key: 'smoking', label: '允许吸烟' },
    { key: 'pets', label: '允许宠物' },
    { key: 'parties', label: '允许派对' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
    setError(null);
  };

  const handleCheckboxChange = (category: 'amenities' | 'houseRules', key: string) => {
    setForm((prev) => {
      const current = prev[category];
      const newValue = current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key];
      return { ...prev, [category]: newValue };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const submitData = {
        name: form.name,
        description: form.description,
        address: form.address,
        propertyType: form.propertyType,
        roomCount: form.roomCount,
        bedCount: form.bedCount,
        bathCount: form.bathCount,
        maxGuests: form.maxGuests,
        pricePerNight: form.pricePerNight,
        depositAmount: form.depositAmount,
        cleaningFee: form.cleaningFee,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        amenities: form.amenities,
        houseRules: form.houseRules,
        cancellationPolicy: form.cancellationPolicy,
      };

      if (isEdit) {
        await api.put(`/properties/${id}`, submitData);
        alert('房源更新成功！');
      } else {
        await api.post('/properties', submitData);
        alert('房源创建成功！');
      }
      navigate('/properties');
    } catch (err: any) {
      console.error('Failed to save property:', err);
      setError(err.response?.data?.message || '保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => navigate('/properties')}
            className="btn btn-outline"
            style={{ marginBottom: '1rem' }}
          >
            <ArrowLeft size={18} style={{ marginRight: '0.5rem' }} />
            返回列表
          </button>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Building2 size={28} style={{ color: 'var(--primary-color)' }} />
            {isEdit ? '编辑房源' : '新增房源'}
          </h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>
            {isEdit ? '修改房源信息' : '填写房源基本信息'}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              color: 'var(--danger-color)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              基本信息
            </h2>
            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">房源名称 *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="例如：海景公寓A栋"
                  required
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">房源描述</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="详细描述您的房源..."
                  rows={4}
                />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">详细地址 *</label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  value={form.address}
                  onChange={handleInputChange}
                  placeholder="例如：深圳市南山区海岸线1号"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">城市</label>
                <input
                  type="text"
                  name="city"
                  className="form-input"
                  value={form.city}
                  onChange={handleInputChange}
                  placeholder="例如：深圳"
                />
              </div>
              <div className="form-group">
                <label className="form-label">省份</label>
                <input
                  type="text"
                  name="province"
                  className="form-input"
                  value={form.province}
                  onChange={handleInputChange}
                  placeholder="例如：广东省"
                />
              </div>
              <div className="form-group">
                <label className="form-label">房源类型 *</label>
                <select
                  name="propertyType"
                  className="form-input"
                  value={form.propertyType}
                  onChange={handleInputChange}
                  required
                >
                  {propertyTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">取消政策</label>
                <select
                  name="cancellationPolicy"
                  className="form-input"
                  value={form.cancellationPolicy}
                  onChange={handleInputChange}
                >
                  <option value="flexible">灵活</option>
                  <option value="moderate">中等</option>
                  <option value="strict">严格</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              房屋规格
            </h2>
            <div className="grid grid-cols-2 grid-cols-4" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">房间数</label>
                <input
                  type="number"
                  name="roomCount"
                  className="form-input"
                  value={form.roomCount}
                  onChange={handleInputChange}
                  min={1}
                />
              </div>
              <div className="form-group">
                <label className="form-label">床位数</label>
                <input
                  type="number"
                  name="bedCount"
                  className="form-input"
                  value={form.bedCount}
                  onChange={handleInputChange}
                  min={1}
                />
              </div>
              <div className="form-group">
                <label className="form-label">卫生间数</label>
                <input
                  type="number"
                  name="bathCount"
                  className="form-input"
                  value={form.bathCount}
                  onChange={handleInputChange}
                  min={1}
                />
              </div>
              <div className="form-group">
                <label className="form-label">最大客人数</label>
                <input
                  type="number"
                  name="maxGuests"
                  className="form-input"
                  value={form.maxGuests}
                  onChange={handleInputChange}
                  min={1}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              价格与时间
            </h2>
            <div className="grid grid-cols-3" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">基础价格（元/晚）*</label>
                <input
                  type="number"
                  name="pricePerNight"
                  className="form-input"
                  value={form.pricePerNight}
                  onChange={handleInputChange}
                  min={0}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">押金（元）</label>
                <input
                  type="number"
                  name="depositAmount"
                  className="form-input"
                  value={form.depositAmount}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">清洁费（元）</label>
                <input
                  type="number"
                  name="cleaningFee"
                  className="form-input"
                  value={form.cleaningFee}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">入住时间</label>
                <input
                  type="time"
                  name="checkInTime"
                  className="form-input"
                  value={form.checkInTime}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">退房时间</label>
                <input
                  type="time"
                  name="checkOutTime"
                  className="form-input"
                  value={form.checkOutTime}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              设施配置
            </h2>
            <div className="grid grid-cols-2 grid-cols-3" style={{ gap: '0.5rem' }}>
              {amenityOptions.map((option) => (
                <label
                  key={option.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    backgroundColor: form.amenities.includes(option.key)
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'var(--gray-50)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    border: form.amenities.includes(option.key)
                      ? '1px solid var(--primary-color)'
                      : '1px solid transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.amenities.includes(option.key)}
                    onChange={() => handleCheckboxChange('amenities', option.key)}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem',
                color: 'var(--gray-800)',
              }}
            >
              入住规则
            </h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {ruleOptions.map((option) => (
                <label
                  key={option.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: form.houseRules.includes(option.key)
                      ? 'rgba(59, 130, 246, 0.1)'
                      : 'var(--gray-50)',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    border: form.houseRules.includes(option.key)
                      ? '1px solid var(--primary-color)'
                      : '1px solid transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.houseRules.includes(option.key)}
                    onChange={() => handleCheckboxChange('houseRules', option.key)}
                  />
                  <span style={{ fontSize: '0.875rem' }}>{option.label}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.5rem' }}>
              勾选表示允许该行为。如不勾选，将被视为禁止。
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => navigate('/properties')}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ minWidth: '120px' }}
            >
              {isSubmitting ? (
                '保存中...'
              ) : (
                <>
                  <Save size={18} style={{ marginRight: '0.5rem' }} />
                  {isEdit ? '更新房源' : '保存房源'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PropertyCreate;
