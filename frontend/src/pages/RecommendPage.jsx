import { useEffect, useState } from 'react';
import TabBar from '../components/TabBar';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

function RecommendPage() {
  const [recommendData, setRecommendData] = useState(null);

  useEffect(() => {
    api.get('/products/recommend').then(res => setRecommendData(res.data));
  }, []);

  if (!recommendData) return null;

  const sections = [
    { title: '私人订制', data: recommendData.personalized, icon: '✨' },
    { title: '猜你喜欢', data: recommendData.guessYouLike, icon: '💡' },
    { title: '人气推荐', data: recommendData.hot, icon: '🔥' },
    { title: '品牌制造商直供', data: recommendData.brands, icon: '🏭' }
  ];

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: '70px' }}>
      <div style={{ background: '#fff', padding: '15px', borderBottom: '1px solid #eee' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>推荐</h1>
      </div>

      {sections.map(section => (
        <div key={section.title} style={{ marginTop: '10px', background: '#fff', padding: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>{section.icon}</span>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>{section.title}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {section.data.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', padding: '0 15px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>🎁</span>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>严选一起拼</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>💰</span>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>积分中心</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>👑</span>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>会员俱乐部</p>
        </div>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ fontSize: '32px' }}>📢</span>
          <p style={{ marginTop: '10px', fontWeight: 'bold' }}>众筹</p>
        </div>
      </div>

      <TabBar />
    </div>
  );
}

export default RecommendPage;
