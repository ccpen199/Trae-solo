import React, { useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useScan } from '@/hooks/useScan';
import { useUserStore } from '@/store/useUserStore';
import { waybillService } from '@/services/waybill';
import type { ScanType } from '@/hooks/useScan';

interface ScanHistory {
  waybillNo: string;
  time: number;
  type: ScanType;
  success: boolean;
}

const ScanPage: React.FC = () => {
  const router = useRouter();
  const [scanType, setScanType] = useState<ScanType>('pickup');
  const [manualInput, setManualInput] = useState('');
  const [history, setHistory] = useState<ScanHistory[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const { user } = useUserStore();
  const { scanCode, manualInput: scanManualInput } = useScan();

  useEffect(() => {
    const typeParam = router.params.type as ScanType;
    if (typeParam && ['pickup', 'delivery', 'station'].includes(typeParam)) {
      setScanType(typeParam);
    }

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router.params.type]);

  const handleScan = async () => {
    if (!user) return;

    const result = await scanCode(scanType);
    if (result) {
      let success = false;
      try {
        switch (scanType) {
          case 'pickup':
            success = await waybillService.scanPickup(result.result, user.id, user.name, result.location);
            break;
          case 'delivery':
            success = await waybillService.scanDelivery(result.result, user.id, user.name, result.location);
            break;
          case 'station':
            success = await waybillService.scanStation(result.result, user.id, user.name, 'STATION_001', '合作驿站');
            break;
        }

        const newHistory: ScanHistory = {
          waybillNo: result.result,
          time: Date.now(),
          type: scanType,
          success
        };
        setHistory(prev => [newHistory, ...prev.slice(0, 9)]);
      } catch (e) {
        console.error('[ScanPage] 扫码失败:', e);
      }
    }
  };

  const handleManualConfirm = async () => {
    if (!manualInput || !user) return;

    const result = await scanManualInput(manualInput, scanType);
    if (result) {
      let success = false;
      try {
        switch (scanType) {
          case 'pickup':
            success = await waybillService.scanPickup(result.result, user.id, user.name, result.location);
            break;
          case 'delivery':
            success = await waybillService.scanDelivery(result.result, user.id, user.name, result.location);
            break;
          case 'station':
            success = await waybillService.scanStation(result.result, user.id, user.name, 'STATION_001', '合作驿站');
            break;
        }

        const newHistory: ScanHistory = {
          waybillNo: result.result,
          time: Date.now(),
          type: scanType,
          success
        };
        setHistory(prev => [newHistory, ...prev.slice(0, 9)]);
        setManualInput('');
      } catch (e) {
        console.error('[ScanPage] 手动输入失败:', e);
      }
    }
  };

  const getTypeLabel = (type: ScanType): string => {
    const labels: Record<ScanType, string> = {
      pickup: '揽件',
      delivery: '派送',
      station: '驿站'
    };
    return labels[type];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  };

  return (
    <View className={styles.page}>
      <View className={styles.typeTabs}>
        <View
          className={classnames(styles.typeTab, scanType === 'pickup' && styles.active)}
          onClick={() => setScanType('pickup')}
        >
          <Text>📦 揽件</Text>
        </View>
        <View
          className={classnames(styles.typeTab, scanType === 'delivery' && styles.active)}
          onClick={() => setScanType('delivery')}
        >
          <Text>🚚 派送</Text>
        </View>
        <View
          className={classnames(styles.typeTab, scanType === 'station' && styles.active)}
          onClick={() => setScanType('station')}
        >
          <Text>🏪 驿站</Text>
        </View>
      </View>

      {!isOnline && (
        <View className={styles.offlineNotice}>
          <Text className={styles.offlineIcon}>📡</Text>
          <Text className={styles.offlineText}>当前处于离线模式，数据将自动保存，联网后自动同步</Text>
        </View>
      )}

      <View className={styles.scanArea}>
        <View className={styles.scanFrame}>
          <View className={styles.scanCorners}>
            <View className={classnames(styles.corner, styles.tl)} />
            <View className={classnames(styles.corner, styles.tr)} />
            <View className={classnames(styles.corner, styles.bl)} />
            <View className={classnames(styles.corner, styles.br)} />
          </View>
          <View className={styles.scanLine} />
          <Text className={styles.scanHint}>将{getTypeLabel(scanType)}码放入框内自动识别</Text>
        </View>
      </View>

      <View className={styles.manualInput}>
        <Text className={styles.inputLabel}>手动输入运单号</Text>
        <View className={styles.inputRow}>
          <Input
            className={styles.input}
            placeholder="请输入运单号"
            value={manualInput}
            onInput={(e) => setManualInput(e.detail.value)}
            maxLength={30}
          />
          <View className={styles.confirmBtn} onClick={handleManualConfirm}>
            <Text>确定</Text>
          </View>
        </View>
      </View>

      {history.length > 0 && (
        <View className={styles.history}>
          <Text className={styles.historyTitle}>最近扫码记录</Text>
          {history.map((item, index) => (
            <View key={index} className={styles.historyItem}>
              <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                <Text>{item.success ? '✅' : '⚠️'}</Text>
                <Text className={styles.historyWaybill}>{item.waybillNo}</Text>
              </View>
              <Text className={styles.historyTime}>
                {getTypeLabel(item.type)} · {formatTime(item.time)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View className={styles.bottomBtn}>
        <View className={styles.scanBtn} onClick={handleScan}>
          <Text>📷</Text>
          <Text>开始扫码{getTypeLabel(scanType)}</Text>
        </View>
      </View>
    </View>
  );
};

export default ScanPage;
