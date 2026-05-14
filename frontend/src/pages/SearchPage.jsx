import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TabBar from '../components/TabBar';
import ProductCard from '../components/ProductCard';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function SearchPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hotSearches, setHotSearches] = useState([]);
  const [history, setHistory] = useState([]);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    api.get('/search/hot').then(res => setHotSearches(res.data));
    if (user) {
      api.get('/search/history').then(res => setHistory(res.data));
    }
  }, [user]);

  useEffect(() => {
    if (query.trim()) {
      api.get('/search/suggestions', { params: { q: query } }).then(res => setSuggestions(res.data));
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (q = query) => {
    if (!q.trim()) return;
    api.get('/search', { params: { q } }).then(res => {
      setResults(res.data);
      setShowResults(true);
      setSuggestions([]);
    });
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: showResults ? '70px' : 0 }}>
      <div style={{
        background: '#fff',
        padding: '10px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <span style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => navigate(-1)}>←</span>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSearch()}
          placeholder="搜索商品"
          style={{
            flex: 1,
            background: '#f5f5f5',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 15px',
            fontSize: '14px'
          }}
          autoFocus
        />
        <span style={{ color: '#ff6b35', cursor: 'pointer' }} onClick={() => handleSearch()}>搜索</span>
      </div>

      {suggestions.length > 0 && !showResults && (
        <div style={{ background: '#fff' }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{ padding: '15px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
              onClick={() => handleSearch(s)}
            >
              {s}
            </div>
          ))}
        </div>
      )}

      {showResults ? (
        <div style={{ padding: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {history.length > 0 && (
            <div style={{ background: '#fff', marginTop: '10px', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>搜索历史</span>
                <span style={{ color: '#999', cursor: 'pointer' }} onClick={clearHistory}>清空</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {history.map((item, i) => (
                  <span
                    key={i}
                    style={{ background: '#f5f5f5', padding: '8px 15px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer' }}
                    onClick={() => handleSearch(item.keyword)}
                  >
                    {item.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#fff', marginTop: '10px', padding: '15px' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>热门搜索</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {hotSearches.map(item => (
                <span
                  key={item.id}
                  style={{ background: '#f5f5f5', padding: '8px 15px', borderRadius: '20px', fontSize: '14px', cursor: 'pointer' }}
                  onClick={() => handleSearch(item.keyword)}
                >
                  {item.keyword}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {showResults && <TabBar />}
    </div>
  );
}

export default SearchPage;
