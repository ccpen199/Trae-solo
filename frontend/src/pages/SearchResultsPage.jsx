import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    loadResults();
  }, [query]);

  const loadResults = async () => {
    try {
      const response = await axios.post('/api/search', { keyword: query });
      setResults(response.data.results);
    } catch (error) {
      console.error('加载搜索结果失败', error);
    }
  };

  const handleResultClick = (item) => {
    console.log('点击搜索结果:', item.title);
  };

  return (
    <div className="search-results-page">
      <div className="results-header">
        <button className="back-btn" onClick={() => navigate('/')}>←</button>
        <h1 className="results-title">搜索: {query}</h1>
      </div>

      <div className="results-list">
        {results.map((item, index) => (
          <div 
            key={index} 
            className="result-item"
            onClick={() => handleResultClick(item)}
          >
            <div className="result-title">{item.title}</div>
            <div className="result-desc">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SearchResultsPage;
