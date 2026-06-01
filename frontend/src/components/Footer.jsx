import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>关于我们</h4>
          <p>校园新闻平台致力于为校内外用户提供及时、准确的校园资讯服务。</p>
        </div>
        <div className="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><Link to="/">首页</Link></li>
            <li><Link to="/search">搜索</Link></li>
            <li><Link to="/login">登录</Link></li>
            <li><Link to="/register">注册</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>联系我们</h4>
          <ul>
            <li>邮箱: news@campus.edu</li>
            <li>电话: 010-12345678</li>
            <li>地址: 大学校园新闻中心</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
