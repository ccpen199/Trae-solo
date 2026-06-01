import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function ReadingPage() {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState('bookshelf');
  const [bookshelf, setBookshelf] = useState([]);
  const [novels, setNovels] = useState([]);
  const [comics, setComics] = useState([]);
  const [games, setGames] = useState([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'bookshelf' && isLoggedIn) {
        const res = await axios.get('/api/reading/bookshelf');
        setBookshelf(res.data.books);
      } else if (activeTab === 'novel') {
        const res = await axios.get('/api/reading/novels');
        setNovels(res.data.books);
      } else if (activeTab === 'comic') {
        const res = await axios.get('/api/reading/comics');
        setComics(res.data.books);
      } else if (activeTab === 'game') {
        const res = await axios.get('/api/reading/games');
        setGames(res.data.games);
      }
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'bookshelf' && !isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setActiveTab(tab);
  };

  const renderContent = () => {
    if (activeTab === 'bookshelf') {
      if (!isLoggedIn) {
        return null;
      }
      if (bookshelf.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <div className="empty-text">书架空空如也，快去添加吧！</div>
          </div>
        );
      }
      return (
        <div className="books-grid">
          {bookshelf.map((book, index) => (
            <div key={index} className="book-item">
              <div className="book-cover">{book.cover}</div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'novel') {
      return (
        <div className="books-grid">
          {novels.map((book, index) => (
            <div key={index} className="book-item">
              <div className="book-cover">{book.cover}</div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'comic') {
      return (
        <div className="books-grid">
          {comics.map((book, index) => (
            <div key={index} className="book-item">
              <div className="book-cover">{book.cover}</div>
              <div className="book-info">
                <div className="book-title">{book.title}</div>
                <div className="book-author">{book.author}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'game') {
      return (
        <div className="books-grid">
          {games.map((game, index) => (
            <div key={index} className="book-item">
              <div className="book-cover">{game.icon}</div>
              <div className="book-info">
                <div className="book-title">{game.name}</div>
                <div className="book-author">{game.desc}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="reading-page">
      <h1 className="page-title">阅读娱乐</h1>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'bookshelf' ? 'active' : ''}`}
          onClick={() => handleTabClick('bookshelf')}
        >
          书架
        </div>
        <div 
          className={`tab ${activeTab === 'novel' ? 'active' : ''}`}
          onClick={() => handleTabClick('novel')}
        >
          小说
        </div>
        <div 
          className={`tab ${activeTab === 'comic' ? 'active' : ''}`}
          onClick={() => handleTabClick('comic')}
        >
          漫画
        </div>
        <div 
          className={`tab ${activeTab === 'game' ? 'active' : ''}`}
          onClick={() => handleTabClick('game')}
        >
          游戏
        </div>
      </div>

      {renderContent()}
    </div>
  );
}

export default ReadingPage;
