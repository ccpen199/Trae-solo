import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await api.get('/properties?limit=6');
      setProperties(response.data.properties);
    } catch (error) {
      console.error('获取房源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
  };

  const features = [
    { icon: '✅', title: '真实房源', desc: '四重验证，100%真实' },
    { icon: '🤝', title: '直接交易', desc: '去中介化，费用透明' },
    { icon: '💰', title: '资金托管', desc: '安全保障，放心支付' },
    { icon: '📜', title: '电子合同', desc: '法律认可，存证保全' }
  ];

  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">找到你的理想之家</h1>
          <p className="hero-subtitle">去中介化居住交易平台，房东租客直接沟通</p>
          <form className="search-box" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input"
              placeholder="请输入搜索小区、地址、关键词..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn-success" style={{ padding: '1rem 2rem' }}>
              提交搜索
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/search')}
              style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}
            >
              查看搜索结果
            </button>
          </form>
        </div>
      </section>

      <section className="container mt-8">
        <div className="grid grid-4 mb-8">
          {[
            { title: '搜索筛选房源', desc: '按小区、地址、租金、户型和验证状态查询', path: '/search' },
            { title: '后台管理审核', desc: '房源核验、订单工单、纠纷与数据看板', path: '/admin' },
            { title: '购买提交服务', desc: '验房、法务、托管、合同和保险服务订单', path: '/services' },
            { title: '发现分类导航', desc: '整租、合租、转租、租金指数和信用中心', path: '/properties' }
          ].map((item) => (
            <button
              key={item.title}
              type="button"
              className="card"
              onClick={() => navigate(item.path)}
              style={{ textAlign: 'left', border: 'none', cursor: 'pointer' }}
            >
              <div className="card-body">
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-gray text-sm">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="container mt-8">
        <div className="grid grid-4 mb-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="text-lg font-bold mb-4">{feature.title}</h3>
              <p className="text-gray">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="flex-between mb-8">
          <h2 className="text-2xl font-bold">精选房源</h2>
          <button className="btn btn-primary" onClick={() => navigate('/search')}>
            查看更多搜索筛选
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid grid-3">
            {properties.map((property) => (
              <div
                key={property.id}
                className="card property-card"
                onClick={() => navigate(`/property/${property.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="property-image"></div>
                <div className="card-body">
                  <h3 className="font-bold text-lg mb-2">{property.title}</h3>
                  <p className="text-gray text-sm mb-2">{property.address}</p>
                  <div className="mb-2">
                    {property.tags?.slice(0, 3).map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                  <div className="flex-between">
                    <span className="property-price">¥{property.price}/月</span>
                    <span className="text-gray text-sm">{property.rooms}室 {property.area}㎡</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
