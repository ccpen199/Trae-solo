import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classNames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/services/api';

type CodeType = 'miniapp' | 'citycode';

const ScanPage: React.FC = () => {
  const { user } = useAppStore();
  const [codeType, setCodeType] = useState<CodeType>('miniapp');
  const [currentCode, setCurrentCode] = useState(`SY${Date.now().toString().slice(-10)}`);

  useDidShow(() => {
    console.log('[ScanPage] Page show');
    refreshCode();
  });

  const refreshCode = () => {
    const prefix = codeType === 'miniapp' ? 'SY' : 'SYC';
    const timestamp = Date.now().toString().slice(-10);
    setCurrentCode(`${prefix}${timestamp}`);
  };

  const handleCodeTypeChange = (type: CodeType) => {
    setCodeType(type);
    refreshCode();
  };

  const handleViewHistory = () => {
    Taro.navigateTo({
      url: '/pages/history/index'
    });
  };

  const handleScanQR = () => {
    Taro.scanCode({
      onlyFromCamera: false,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        console.log('[ScanPage] Scan result:', res.result);
        verifyCoupon(res.result);
      },
      fail: (err) => {
        console.error('[ScanPage] Scan failed:', err);
        Taro.showToast({ title: '扫码失败', icon: 'none' });
      }
    });
  };

  const verifyCoupon = async (code: string) => {
    try {
      const result = await api.verifyCoupon(code, codeType);
      if (result.success) {
        Taro.showToast({ title: result.message, icon: 'success' });
        refreshCode();
      } else {
        Taro.showToast({ title: result.message, icon: 'none' });
      }
    } catch (error) {
      console.error('[ScanPage] Verify failed:', error);
      Taro.showToast({ title: '核销失败', icon: 'none' });
    }
  };

  const formatCodeDisplay = (code: string) => {
    return code.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <View className={styles.scanPage}>
      <View className={styles.scanArea}>
        <Text className={styles.scanTitle}>出示核销码</Text>
        <Text className={styles.scanSubtitle}>
          向收银员出示二维码或条形码即可使用优惠券
        </Text>

        <View className={styles.qrContainer}>
          <View className={styles.qrCode}>
            <View className={styles.qrCenter}>
              <Text>🎫</Text>
            </View>
          </View>
          <View className={styles.codeInfo}>
            <Text className={styles.codeType}>
              {codeType === 'miniapp' ? '📱 小程序码' : '🏛️ 城市码'}
            </Text>
            <Text className={styles.codeValue}>{formatCodeDisplay(currentCode)}</Text>
          </View>
        </View>

        <View className={styles.codeTabs}>
          <View
            className={classNames(styles.codeTab, codeType === 'miniapp' && styles.active)}
            onClick={() => handleCodeTypeChange('miniapp')}
          >
            <Text>小程序码</Text>
          </View>
          <View
            className={classNames(styles.codeTab, codeType === 'citycode' && styles.active)}
            onClick={() => handleCodeTypeChange('citycode')}
          >
            <Text>城市码</Text>
          </View>
        </View>

        <View className={styles.scanTip}>
          <View className={styles.tipItem}>
            <Text>🔒</Text>
            <Text>二维码每分钟自动刷新，保障安全</Text>
          </View>
          <View className={styles.tipItem}>
            <Text>📍</Text>
            <Text>支持POS机具、小程序码、城市码核销</Text>
          </View>
          <View className={styles.tipItem}>
            <Text>👤</Text>
            <Text>已实名认证: {user?.realName || '未实名'}</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionSection}>
        <Button className={styles.historyBtn} onClick={handleViewHistory}>
          <Text>📋</Text>
          <Text>查看消费记录</Text>
        </Button>
        <Button className={styles.scanBtn} onClick={handleScanQR}>
          扫一扫付款码
        </Button>
      </View>
    </View>
  );
};

export default ScanPage;
