import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/request';
import { useToast } from '../components/Toast';
import Loading from '../components/Loading';

const platformIcons = {
  weibo: '🌐',
  wechat: '💬',
  qq: '🐧',
  douyin: '🎵'
};

const platformNames = {
  weibo: '微博',
  wechat: '微信',
  qq: 'QQ',
  douyin: '抖音'
};

const Share = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flashSale, setFlashSale] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [bindingPlatform, setBindingPlatform] = useState(null);
  const [bindAccountName, setBindAccountName] = useState('');
  const [shareContent, setShareContent] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [platformsResult, accountsResult] = await Promise.all([
        api.get('/share/platforms'),
        api.get('/share/accounts')
      ]);

      setPlatforms(platformsResult?.data || []);
      setAccounts(accountsResult?.data || []);

      if (id) {
        const saleResult = await api.get(`/flash-sale/${id}`);
        const sale = saleResult?.data;
        setFlashSale(sale);
        if (sale) {
          setShareContent(
            `【ME 淘】${sale.product_name}\n原价 ¥${sale.original_price}，秒杀价仅 ¥${sale.sale_price}！`
          );
        }
      }
    } catch (err) {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePlatform = (platformId) => {
    const hasAccount = accounts.some(a => a.platform === platformId);
    if (!hasAccount) {
      setBindingPlatform(platformId);
      return;
    }

    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      }
      return [...prev, platformId];
    });
  };

  const handleBind = async () => {
    if (!bindingPlatform || !bindAccountName.trim()) {
      showToast('请输入账号名称', 'error');
      return;
    }

    try {
      await api.post('/share/bind-account', {
        platform: bindingPlatform,
        account_name: bindAccountName
      });

      showToast('账号绑定成功', 'success');
      setBindingPlatform(null);
      setBindAccountName('');
      
      const accountsResult = await api.get('/share/accounts');
      setAccounts(accountsResult?.data || []);
      
      setSelectedPlatforms(prev => [...prev, bindingPlatform]);
    } catch (err) {
      // 错误已处理
    }
  };

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      showToast('请选择至少一个平台', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await api.post('/share/execute', {
        flash_sale_id: id ? parseInt(id) : null,
        platform_ids: selectedPlatforms,
        share_content: shareContent
      });

      const results = result?.data?.results || [];
      const successCount = results.filter(r => r.success).length;

      if (successCount === results.length) {
        showToast('分享成功！', 'success');
      } else if (successCount > 0) {
        showToast(`部分分享成功 (${successCount}/${results.length})`, 'warning');
      } else {
        showToast('分享失败，请检查账号绑定', 'error');
      }

      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      // 错误已处理
    } finally {
      setSaving(false);
    }
  };

  const hasAccount = (platformId) => {
    return accounts.some(a => a.platform === platformId);
  };

  const getAccountName = (platformId) => {
    const account = accounts.find(a => a.platform === platformId);
    return account?.account_name || '';
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => navigate(-1)}>
            ← 返回
          </button>
          <h1 style={styles.headerTitle}>分享</h1>
        </div>
        <div style={styles.content}>
          <Loading message="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={() => navigate(-1)}>
          ← 返回
        </button>
        <h1 style={styles.headerTitle}>分享</h1>
      </div>

      <div style={styles.content}>
        {flashSale && (
          <div style={styles.productCard}>
            {flashSale.product_thumb && (
              <img
                src={flashSale.product_thumb}
                alt={flashSale.product_name}
                style={styles.productThumb}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}
            <div style={styles.productInfo}>
              <h3 style={styles.productName}>{flashSale.product_name}</h3>
              <div style={styles.priceRow}>
                <span style={styles.salePrice}>¥{flashSale.sale_price}</span>
                <span style={styles.originalPrice}>¥{flashSale.original_price}</span>
              </div>
            </div>
          </div>
        )}

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>分享内容</h3>
          <textarea
            style={styles.textarea}
            placeholder="输入分享内容..."
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            rows={4}
          />
        </div>

        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>选择分享平台</h3>
          <div style={styles.platformGrid}>
            {platforms.map(platform => {
              const hasAcc = hasAccount(platform.id);
              const isSelected = selectedPlatforms.includes(platform.id);
              const accountName = getAccountName(platform.id);

              return (
                <div
                  key={platform.id}
                  style={{
                    ...styles.platformCard,
                    ...(isSelected ? styles.platformCardSelected : {}),
                    ...(!hasAcc ? styles.platformCardNoAccount : {})
                  }}
                  onClick={() => togglePlatform(platform.id)}
                >
                  <div style={styles.platformIcon}>
                    {platformIcons[platform.id] || '📱'}
                  </div>
                  <div style={styles.platformName}>
                    {platformNames[platform.id] || platform.name}
                  </div>
                  {hasAcc ? (
                    <div style={styles.accountBadge}>
                      {accountName}
                    </div>
                  ) : (
                    <div style={styles.bindBadge}>
                      未绑定
                    </div>
                  )}
                  {isSelected && (
                    <div style={styles.checkMark}>✓</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          style={{
            ...styles.shareButton,
            ...(saving ? styles.shareButtonDisabled : {})
          }}
          onClick={handleShare}
          disabled={saving}
        >
          {saving ? '分享中...' : `分享 (${selectedPlatforms.length})`}
        </button>
      </div>

      {bindingPlatform && (
        <div style={styles.modalOverlay} onClick={() => setBindingPlatform(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              绑定 {platformNames[bindingPlatform]} 账号
            </h3>
            <input
              style={styles.modalInput}
              placeholder="请输入账号名称"
              value={bindAccountName}
              onChange={(e) => setBindAccountName(e.target.value)}
            />
            <p style={styles.modalTip}>
              绑定后将使用该账号进行分享
            </p>
            <div style={styles.modalActions}>
              <button
                style={styles.modalCancel}
                onClick={() => setBindingPlatform(null)}
              >
                取消
              </button>
              <button
                style={styles.modalConfirm}
                onClick={handleBind}
              >
                绑定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: '16px 20px',
    borderBottom: '1px solid #eee'
  },
  backButton: {
    padding: '8px 16px 8px 8px',
    fontSize: '16px',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer'
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
    marginLeft: '8px'
  },
  content: {
    padding: '16px'
  },
  productCard: {
    display: 'flex',
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  productThumb: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    objectFit: 'cover',
    marginRight: '12px'
  },
  productInfo: {
    flex: 1
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px'
  },
  salePrice: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ff4757'
  },
  originalPrice: {
    fontSize: '13px',
    color: '#999',
    textDecoration: 'line-through'
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    resize: 'none',
    fontFamily: 'inherit'
  },
  platformGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  platformCard: {
    position: 'relative',
    padding: '16px',
    border: '2px solid #eee',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  platformCardSelected: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5'
  },
  platformCardNoAccount: {
    opacity: 0.7
  },
  platformIcon: {
    fontSize: '32px',
    textAlign: 'center',
    marginBottom: '8px'
  },
  platformName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: '4px'
  },
  accountBadge: {
    fontSize: '12px',
    color: '#2ed573',
    textAlign: 'center'
  },
  bindBadge: {
    fontSize: '12px',
    color: '#ff4757',
    textAlign: 'center'
  },
  checkMark: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '24px',
    height: '24px',
    backgroundColor: '#ff4757',
    color: '#fff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px'
  },
  shareButton: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer'
  },
  shareButtonDisabled: {
    backgroundColor: '#ff9ba2',
    cursor: 'not-allowed'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '360px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '16px',
    textAlign: 'center'
  },
  modalInput: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    marginBottom: '8px'
  },
  modalTip: {
    fontSize: '13px',
    color: '#999',
    textAlign: 'center',
    marginBottom: '20px'
  },
  modalActions: {
    display: 'flex',
    gap: '12px'
  },
  modalCancel: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  modalConfirm: {
    flex: 1,
    padding: '12px',
    fontSize: '15px',
    color: '#fff',
    backgroundColor: '#ff4757',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  }
};

export default Share;
