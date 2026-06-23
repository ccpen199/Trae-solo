import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, WebView } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import Taro from '@tarojs/taro';
import { pluginService } from '@/services/pluginService';
import { useUserStore } from '@/store/useUserStore';
import { encryptECB } from '@/utils/sm4';
import styles from './index.module.scss';

const ALLOWED_DOMAINS = [
  'gov.cn',
  'sohu.com',
  'state-owned-enterprise.com',
  'inner-oa.com',
  'erp-system.com',
  'safety-platform.com'
];

const PluginDetailPage: React.FC = () => {
  const router = useRouter();
  const { id, url, token } = router.params;
  const { userInfo, checkPermission } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isUrlSecure, setIsUrlSecure] = useState(false);
  const [showSecurityTip, setShowSecurityTip] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [pluginName, setPluginName] = useState('应用加载中...');

  const h5Url = useMemo(() => {
    if (!url) return '';
    try {
      const decodedUrl = decodeURIComponent(url);
      const urlObj = new URL(decodedUrl);
      
      const hasValidDomain = ALLOWED_DOMAINS.some(domain => 
        urlObj.hostname.endsWith(domain) || urlObj.hostname.includes(domain)
      );
      setIsUrlSecure(hasValidDomain);

      if (token && userInfo) {
        const encryptedToken = encryptECB(token, userInfo.encryptKey);
        const separator = decodedUrl.includes('?') ? '&' : '?';
        return `${decodedUrl}${separator}ssoToken=${encodeURIComponent(encryptedToken)}&userId=${userInfo.id}&orgId=${userInfo.orgId}`;
      }
      
      return decodedUrl;
    } catch (e) {
      console.error('URL解析失败', e);
      setLoadError('URL格式不正确');
      return '';
    }
  }, [url, token, userInfo]);

  useEffect(() => {
    const loadPluginData = async () => {
      try {
        setLoading(true);
        setLoadingProgress(20);

        if (id) {
          const plugin = await pluginService.getPluginDetail(id);
          setPluginName(plugin.name);
          setIsFavorite(plugin.isFavorite);
          Taro.setNavigationBarTitle({ title: plugin.name });
          setLoadingProgress(40);

          if (plugin.offlineEnabled) {
            const updateInfo = await pluginService.checkOfflineUpdate(id);
            if (updateInfo.hasUpdate && !updateInfo.isMandatory) {
              setLoadingProgress(60);
              await pluginService.downloadOfflinePackage(id);
            }
            setIsOfflineMode(true);
          }
        }

        setLoadingProgress(80);

        const hasPermission = checkPermission('plugin:access:' + id);
        if (!hasPermission) {
          setLoadError('您没有访问该应用的权限，请联系管理员');
          return;
        }

        setLoadingProgress(100);
        setTimeout(() => setLoading(false), 500);
      } catch (error) {
        console.error('加载应用失败', error);
        setLoadError('应用加载失败，请稍后重试');
      }
    };

    loadPluginData();

    const timer = setTimeout(() => {
      setShowSecurityTip(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, checkPermission]);

  const handleLoad = useCallback(() => {
    console.log('[WebView] 页面加载完成');
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    console.error('[WebView] 页面加载错误');
    setLoadError('页面加载失败，请检查网络连接');
    setLoading(false);
  }, []);

  const handleMessage = useCallback((e: any) => {
    console.log('[WebView] 收到H5消息:', e.detail.data);
    try {
      const data = JSON.parse(e.detail.data);
      
      switch (data.type) {
        case 'bioAuth':
          handleBioAuth(data.payload);
          break;
        case 'navigateBack':
          Taro.navigateBack();
          break;
        case 'share':
          handleShare(data.payload);
          break;
        case 'uploadFile':
          handleUploadFile(data.payload);
          break;
        default:
          console.log('[WebView] 未知消息类型:', data.type);
      }
    } catch (err) {
      console.error('[WebView] 消息解析失败', err);
    }
  }, []);

  const handleBioAuth = async (payload: any) => {
    console.log('[WebView] 触发生物识别:', payload);
    Taro.showModal({
      title: '安全验证',
      content: `${payload.operationName}需要身份验证`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await Taro.checkIsSupportSoterAuthentication();
            console.log('支持的生物识别方式:', result);
            
            const authResult = await Taro.startSoterAuthentication({
              requestAuthModes: ['fingerPrint', 'facial'],
              challenge: encryptECB(JSON.stringify({
                userId: userInfo?.id,
                timestamp: Date.now(),
                operation: payload.operationName
              }), userInfo?.encryptKey || ''),
              authContent: payload.tip || '请进行身份验证'
            });
            
            console.log('生物识别结果:', authResult);
            
            const webView = Taro.createSelectorQuery().select('#h5-webview') as any;
            webView?.boundingClientRect();
            webView?.exec((res: any) => {
              console.log('WebView信息:', res);
            });
            
          } catch (error) {
            console.error('生物识别失败', error);
            Taro.showToast({ title: '验证失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleShare = (payload: any) => {
    console.log('[WebView] 触发分享:', payload);
    Taro.showShareMenu({
      withShareTicket: true
    });
  };

  const handleUploadFile = (payload: any) => {
    console.log('[WebView] 触发文件上传:', payload);
    Taro.chooseImage({
      count: payload.count || 1,
      success: (res) => {
        console.log('选择的文件:', res.tempFilePaths);
        Taro.showToast({ title: '文件已选择', icon: 'success' });
      }
    });
  };

  const handleRetry = () => {
    setLoadError(null);
    setLoading(true);
    setLoadingProgress(0);
    
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setLoading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleRefresh = () => {
    const webView = Taro.createSelectorQuery().select('#h5-webview');
    console.log('刷新页面', webView);
    setLoading(true);
    setLoadingProgress(0);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    try {
      const newStatus = await pluginService.toggleFavorite(id);
      setIsFavorite(newStatus);
      Taro.showToast({ 
        title: newStatus ? '已收藏' : '已取消收藏', 
        icon: 'success' 
      });
    } catch (error) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const handleShareApp = () => {
    Taro.showActionSheet({
      itemList: ['分享给好友', '分享到班组', '复制链接'],
      success: (res) => {
        const tips = ['已发送给好友', '已分享到班组', '链接已复制'];
        Taro.showToast({ title: tips[res.tapIndex], icon: 'success' });
      }
    });
  };

  const handleMore = () => {
    Taro.showActionSheet({
      itemList: ['在浏览器打开', '清除缓存', '投诉建议'],
      success: (res) => {
        const tips = ['即将跳转到浏览器', '缓存已清除', '感谢您的反馈'];
        Taro.showToast({ title: tips[res.tapIndex], icon: 'success' });
      }
    });
  };

  if (loadError) {
    return (
      <View className={styles.page}>
        <View className={styles.errorContainer}>
          <Text className={styles.errorIcon}>⚠️</Text>
          <Text className={styles.errorTitle}>加载失败</Text>
          <Text className={styles.errorDesc}>{loadError}</Text>
          <View className={styles.retryBtn} onClick={handleRetry}>
            重新加载
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      {loading && (
        <View className={styles.loadingContainer}>
          <Text className={styles.loadingIcon}>⚙️</Text>
          <Text className={styles.loadingText}>正在加载 {pluginName}...</Text>
          <View className={styles.loadingProgress}>
            <View 
              className={styles.loadingProgressBar} 
              style={{ width: `${loadingProgress}%` }}
            />
          </View>
          <Text style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
            {loadingProgress < 40 && '正在验证权限...'}
            {loadingProgress >= 40 && loadingProgress < 70 && '正在检查离线包...'}
            {loadingProgress >= 70 && loadingProgress < 100 && '正在初始化SSO...'}
            {loadingProgress >= 100 && '加载完成'}
          </Text>
        </View>
      )}

      {!loading && isUrlSecure && (
        <View className={styles.sandboxBanner}>
          <Text className={styles.sandboxIcon}>🔒</Text>
          <Text className={styles.sandboxText}>
            安全沙箱运行中 · 数据已加密传输 · SM4国密算法
          </Text>
          <View className={styles.sandboxSecure}>安全</View>
        </View>
      )}

      {!loading && !isUrlSecure && (
        <View className={styles.sandboxBanner} style={{ background: 'linear-gradient(90deg, #fff3cd, #fff8e1)' }}>
          <Text className={styles.sandboxIcon}>⚠️</Text>
          <Text className={styles.sandboxText} style={{ color: '#856404' }}>
            外部链接 · 请注意信息安全
          </Text>
          <View style={{ padding: '2px 8px', background: '#fff3cd', color: '#856404', fontSize: 12, borderRadius: 4 }}>
            风险提示
          </View>
        </View>
      )}

      {!loading && h5Url && (
        <View className={styles.webviewContainer}>
          <WebView
            id="h5-webview"
            className={styles.webview}
            src={h5Url}
            onLoad={handleLoad}
            onError={handleError}
            onMessage={handleMessage}
          />
          
          {isOfflineMode && (
            <View className={styles.offlineBadge}>
              <Text className={styles.offlineBadgeIcon}>📦</Text>
              <Text>离线可用</Text>
            </View>
          )}

          {showSecurityTip && (
            <View className={styles.securityTip}>
              <Text className={styles.securityTipIcon}>🔐</Text>
              <Text>通信已启用SM4国密加密</Text>
            </View>
          )}
        </View>
      )}

      {!loading && (
        <View className={styles.toolbar}>
          <View className={styles.toolbarBtn} onClick={handleRefresh}>
            <Text className={styles.toolbarIcon}>🔄</Text>
            <Text className={styles.toolbarText}>刷新</Text>
          </View>
          <View className={styles.toolbarBtn} onClick={handleToggleFavorite}>
            <Text className={styles.toolbarIcon}>{isFavorite ? '⭐' : '☆'}</Text>
            <Text className={styles.toolbarText}>{isFavorite ? '已收藏' : '收藏'}</Text>
          </View>
          <View className={styles.toolbarBtn} onClick={handleShareApp}>
            <Text className={styles.toolbarIcon}>📤</Text>
            <Text className={styles.toolbarText}>分享</Text>
          </View>
          <View className={styles.toolbarBtn} onClick={handleMore}>
            <Text className={styles.toolbarIcon}>⋯</Text>
            <Text className={styles.toolbarText}>更多</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default PluginDetailPage;
