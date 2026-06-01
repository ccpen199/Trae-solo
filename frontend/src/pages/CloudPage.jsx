import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function CloudPage() {
  const { isLoggedIn, setShowLoginModal } = useAuth();
  const [activeTab, setActiveTab] = useState('files');
  const [files, setFiles] = useState([]);
  const [tools, setTools] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [vipData, setVipData] = useState({ benefits: [] });

  useEffect(() => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    loadData();
  }, [activeTab, isLoggedIn]);

  const loadData = async () => {
    try {
      if (activeTab === 'files') {
        const res = await axios.get('/api/cloud/files');
        setFiles(res.data.files);
      } else if (activeTab === 'tools') {
        const res = await axios.get('/api/cloud/tools');
        setTools(res.data.tools);
      } else if (activeTab === 'docs') {
        const res = await axios.get('/api/cloud/documents');
        setDocuments(res.data.documents);
      } else if (activeTab === 'vip') {
        const res = await axios.get('/api/cloud/vip');
        setVipData(res.data);
      }
    } catch (error) {
      console.error('加载数据失败', error);
    }
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          await axios.post('/api/cloud/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          loadData();
        } catch (error) {
          console.error('上传失败', error);
        }
      }
    };
    input.click();
  };

  if (!isLoggedIn) {
    return (
      <div className="cloud-page">
        <div className="empty-state">
          <div className="empty-icon">☁️</div>
          <div className="empty-text">请登录后使用网盘功能</div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'files') {
      if (files.length === 0) {
        return (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-text">暂无文件，点击右下角按钮上传</div>
          </div>
        );
      }
      return (
        <div className="files-list">
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-icon">📄</div>
              <div className="file-info">
                <div className="file-name">{file.filename}</div>
                <div className="file-size">{(file.file_size / 1024).toFixed(2)} KB</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'tools') {
      return (
        <div className="books-grid">
          {tools.map((tool, index) => (
            <div key={index} className="book-item">
              <div className="book-cover">{tool.icon}</div>
              <div className="book-info">
                <div className="book-title">{tool.name}</div>
                <div className="book-author">{tool.desc}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'docs') {
      return (
        <div className="files-list">
          {documents.map((doc, index) => (
            <div key={index} className="file-item">
              <div className="file-icon">{doc.icon}</div>
              <div className="file-info">
                <div className="file-name">{doc.name}</div>
                <div className="file-size">{doc.updated_at}</div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'vip') {
      return (
        <div>
          <div className="vip-banner">
            <div className="vip-title">
              {vipData.isVip ? '🎉 您已是超级会员' : '👑 开通超级会员'}
            </div>
            <div className="vip-desc">
              {vipData.isVip ? '享受全部会员特权' : '解锁全部会员特权，10TB空间等你用'}
            </div>
          </div>
          
          <div className="menu-list" style={{ marginTop: 20 }}>
            {vipData.benefits.map((benefit, index) => (
              <div key={index} className="menu-item">
                <span className="menu-icon">{benefit.icon}</span>
                <span className="menu-text">{benefit.name}</span>
                <span style={{ color: benefit.available ? '#4CAF50' : '#999' }}>
                  {benefit.available ? '✓' : '🔒'}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="cloud-page">
      <h1 className="page-title">夸克网盘</h1>
      
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          文件
        </div>
        <div 
          className={`tab ${activeTab === 'tools' ? 'active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          工具
        </div>
        <div 
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          文档
        </div>
        <div 
          className={`tab ${activeTab === 'vip' ? 'active' : ''}`}
          onClick={() => setActiveTab('vip')}
        >
          会员
        </div>
      </div>

      {renderContent()}

      {activeTab === 'files' && (
        <button className="upload-btn" onClick={handleUpload}>+</button>
      )}
    </div>
  );
}

export default CloudPage;
