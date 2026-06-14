import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

export default function Navbar() {
  const { user, logout, isJobseeker, isCompany, isAdmin, language, toggleLanguage, t } = useApp();
  const navigate = useNavigate();
  const isEnglish = language === 'en';
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 100 }}>
      <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            background: 'linear-gradient(135deg, #00897b, #00695c)', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            琼
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#00695c' }}>{isEnglish ? 'Hainan FTP' : '海南自贸港'}</div>
            <div style={{ fontSize: '12px', color: '#757575' }}>{isEnglish ? 'FTZ Job Matching Platform' : '特色岗位撮合平台'}</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/jobs" style={{ color: '#424242', fontWeight: 500, fontSize: '15px' }}>{t('nav.jobs')}</Link>
          <Link to="/policies" style={{ color: '#424242', fontWeight: 500, fontSize: '15px' }}>{t('nav.policies')}</Link>
          <Link to="/contracts" style={{ color: '#424242', fontWeight: 500, fontSize: '15px' }}>{t('nav.contracts')}</Link>
          
          {isCompany && (
            <Link to="/company/post-job" className="btn btn-primary btn-sm">{t('nav.postJob')}</Link>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {isJobseeker && (
                <Link to="/jobseeker" style={{ color: '#424242', fontSize: '14px' }}>{t('nav.myPage')}</Link>
              )}
              {isCompany && (
                <Link to="/company" style={{ color: '#424242', fontSize: '14px' }}>{t('nav.companyCenter')}</Link>
              )}
              {isAdmin && (
                <div ref={dropdownRef} style={{ position: 'relative' }}>
                  <div 
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    style={{ 
                      color: '#424242', 
                      fontSize: '14px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {t('nav.admin')}
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </div>
                  {adminDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        minWidth: '200px',
                        zIndex: 1000,
                        marginTop: '8px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link 
                        to="/admin" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        📊 {isEnglish ? 'Overview' : '数据概览'}
                      </Link>
                      <Link 
                        to="/admin?tab=pending" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        ⏳ {isEnglish ? 'Pending Jobs' : '待审核职位'}
                      </Link>
                      <Link 
                        to="/admin?tab=recordings" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        📋 {isEnglish ? 'Bureau Filing' : '备案管理'}
                      </Link>
                      <Link 
                        to="/admin?tab=dataAudit" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        🔍 {isEnglish ? 'Data Audit' : '数据复查'}
                      </Link>
                      <Link 
                        to="/admin?tab=subsidyAudit" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none',
                          borderBottom: '1px solid #f0f0f0'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        💰 {isEnglish ? 'Subsidy Review' : '补贴审核'}
                      </Link>
                      <Link 
                        to="/admin?tab=postingGuide" 
                        onClick={() => setAdminDropdownOpen(false)}
                        style={{ 
                          display: 'block', 
                          padding: '12px 16px', 
                          color: '#424242', 
                          fontSize: '14px',
                          textDecoration: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        📝 {isEnglish ? 'Posting Guide' : '发布向导'}
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#616161' }}>{user.name}</span>
                <button 
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                >
                  {t('nav.logout')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary btn-sm">{t('nav.register')}</Link>
            </div>
          )}
          
          <button 
            onClick={toggleLanguage}
            style={{ 
              padding: '4px 12px',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              background: 'white',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {language === 'cn' ? 'EN' : '中'}
          </button>
        </div>
      </div>
      </div>
    </nav>
  );
}
