import React, { useState } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/useAppStore';
import { mockMerchants } from '@/data/mockData';
import classNames from 'classnames';
import type { Coupon } from '@/types';

type RecordType = 'all' | 'used' | 'expired' | 'claimed';

interface HistoryRecord {
  id: string;
  type: 'used' | 'expired' | 'claimed';
  coupon: Coupon;
  merchantName: string;
  amount: number;
  originalAmount: number;
  savedAmount: number;
  timestamp: Date;
  status: 'success' | 'pending' | 'failed' | 'expired';
  terminal: 'pos' | 'miniapp' | 'citycode';
  orderNo: string;
}

const HistoryPage: React.FC = () => {
  const { coupons, user } = useAppStore();
  const [activeType, setActiveType] = useState<RecordType>('all');
  const [selectedMonth, setSelectedMonth] = useState('2024-05');

  useDidShow(() => {
    console.log('[HistoryPage] Page show');
  });

  const generateRecords = (): HistoryRecord[] => {
    const records: HistoryRecord[] = [];
    
    coupons.forEach((coupon, idx) => {
      const merchant = mockMerchants.find(m => m.id === coupon.merchantId) || mockMerchants[0];
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      if (coupon.status === 'used') {
        const originalAmount = (coupon.threshold || 100) + Math.random() * 200;
        records.push({
          id: `rec-${idx}`,
          type: 'used',
          coupon,
          merchantName: merchant.name,
          amount: originalAmount - coupon.value,
          originalAmount,
          savedAmount: coupon.value,
          timestamp,
          status: 'success',
          terminal: ['pos', 'miniapp', 'citycode'][idx % 3] as any,
          orderNo: `SY${timestamp.getTime().toString().slice(-12)}`
        });
      } else if (coupon.status === 'expired') {
        records.push({
          id: `rec-${idx}`,
          type: 'expired',
          coupon,
          merchantName: merchant.name,
          amount: 0,
          originalAmount: 0,
          savedAmount: 0,
          timestamp,
          status: 'expired',
          terminal: 'miniapp',
          orderNo: `SY${timestamp.getTime().toString().slice(-12)}`
        });
      } else if (coupon.status === 'available') {
        records.push({
          id: `rec-${idx}`,
          type: 'claimed',
          coupon,
          merchantName: merchant.name,
          amount: 0,
          originalAmount: 0,
          savedAmount: 0,
          timestamp,
          status: 'success',
          terminal: 'miniapp',
          orderNo: `SY${timestamp.getTime().toString().slice(-12)}`
        });
      }
    });

    return records.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const allRecords = generateRecords();
  
  const filteredRecords = activeType === 'all' 
    ? allRecords 
    : allRecords.filter(r => r.type === activeType);

  const groupedByMonth = filteredRecords.reduce((acc, record) => {
    const month = `${record.timestamp.getFullYear()}-${String(record.timestamp.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[month]) acc[month] = [];
    acc[month].push(record);
    return acc;
  }, {} as Record<string, HistoryRecord[]>);

  const totalSaved = allRecords.filter(r => r.type === 'used').reduce((sum, r) => sum + r.savedAmount, 0);
  const totalUsed = allRecords.filter(r => r.type === 'used').length;
  const totalExpired = allRecords.filter(r => r.type === 'expired').length;

  const typeTabs: { key: RecordType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'used', label: '已核销' },
    { key: 'expired', label: '已过期' },
    { key: 'claimed', label: '已领取' }
  ];

  const getTerminalLabel = (terminal: string) => {
    switch (terminal) {
      case 'pos': return '💳 POS机具';
      case 'miniapp': return '📱 小程序码';
      case 'citycode': return '🏛️ 城市码';
      default: return '未知';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'pending': return '处理中';
      case 'failed': return '失败';
      case 'expired': return '已过期';
      default: return status;
    }
  };

  const formatDateTime = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleMonthChange = () => {
    Taro.showActionSheet({
      itemList: ['2024年5月', '2024年4月', '2024年3月', '2024年2月', '2024年1月'],
      success: (res) => {
        const months = ['2024-05', '2024-04', '2024-03', '2024-02', '2024-01'];
        setSelectedMonth(months[res.tapIndex]);
      }
    });
  };

  const handleGoShopping = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleViewDetail = (record: HistoryRecord) => {
    Taro.showModal({
      title: '订单详情',
      content: `订单号: ${record.orderNo}\n商户: ${record.merchantName}\n优惠券: ${record.coupon.name}\n核销方式: ${getTerminalLabel(record.terminal)}\n时间: ${formatDateTime(record.timestamp)}`,
      showCancel: false
    });
  };

  return (
    <View className={styles.historyPage}>
      <View className={styles.summaryBar}>
        <Text className={styles.summaryTitle}>累计消费统计</Text>
        <View className={styles.summaryStats}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalUsed}</Text>
            <Text className={styles.summaryLabel}>核销笔数</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>¥{totalSaved.toFixed(2)}</Text>
            <Text className={styles.summaryLabel}>累计已省</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{totalExpired}</Text>
            <Text className={styles.summaryLabel}>已过期</Text>
          </View>
        </View>
      </View>

      <View className={styles.filterBar}>
        <View className={styles.typeTabs}>
          {typeTabs.map((tab) => (
            <View
              key={tab.key}
              className={classNames(styles.typeTab, activeType === tab.key && styles.active)}
              onClick={() => setActiveType(tab.key)}
            >
              <Text>{tab.label}</Text>
            </View>
          ))}
        </View>
        <View className={styles.monthPicker} onClick={handleMonthChange}>
          <Text>📅</Text>
          <Text>{selectedMonth.replace('-', '年')}月</Text>
        </View>
      </View>

      <View className={styles.listContainer}>
        {Object.keys(groupedByMonth).length > 0 ? (
          Object.entries(groupedByMonth).map(([month, records]) => {
            const monthSaved = records.filter(r => r.type === 'used').reduce((sum, r) => sum + r.savedAmount, 0);
            return (
              <View key={month} className={styles.monthSection}>
                <View className={styles.monthHeader}>
                  <Text className={styles.monthTitle}>
                    {month.replace('-', '年')}月
                  </Text>
                  <Text className={styles.monthSummary}>
                    {records.length}笔记录 · 已省¥{monthSaved.toFixed(2)}
                  </Text>
                </View>

                {records.map((record) => (
                  <View
                    key={record.id}
                    className={styles.recordCard}
                    onClick={() => handleViewDetail(record)}
                  >
                    <View className={styles.recordHeader}>
                      <View className={classNames(styles.recordIcon, `type_${record.type}`)}>
                        <Text>
                          {record.type === 'used' ? '✅' : record.type === 'expired' ? '⏰' : '🎫'}
                        </Text>
                      </View>
                      <View className={styles.recordMeta}>
                        <Text className={styles.recordTitle}>{record.coupon.name}</Text>
                        <Text className={styles.recordSubtitle}>
                          <Text>🏪</Text>
                          <Text>{record.merchantName}</Text>
                        </Text>
                      </View>
                      <View className={styles.recordAmount}>
                        <Text className={classNames(styles.amountValue, record.type === 'used' ? 'positive' : 'negative')}>
                          {record.type === 'used' ? `-¥${record.amount.toFixed(2)}` : record.type === 'expired' ? '已过期' : '已领取'}
                        </Text>
                        {record.type === 'used' && (
                          <Text className={styles.amountLabel}>已省¥{record.savedAmount.toFixed(2)}</Text>
                        )}
                      </View>
                    </View>

                    {record.type === 'used' && (
                      <View className={styles.recordBody}>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>核销方式</Text>
                          <Text className={styles.detailValue}>{getTerminalLabel(record.terminal)}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>订单金额</Text>
                          <Text className={styles.detailValue}>¥{record.originalAmount.toFixed(2)}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>核销时间</Text>
                          <Text className={styles.detailValue}>{formatDateTime(record.timestamp)}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text style={{ fontSize: '$font-size-xs', color: '$color-text-tertiary' }}>
                            订单号: {record.orderNo}
                          </Text>
                          <Text className={classNames(styles.statusTag, `status_${record.status}`)}>
                            {getStatusLabel(record.status)}
                          </Text>
                        </View>
                      </View>
                    )}

                    {record.type !== 'used' && (
                      <View className={styles.recordBody}>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>领取时间</Text>
                          <Text className={styles.detailValue}>{formatDateTime(record.timestamp)}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text className={styles.detailLabel}>优惠券码</Text>
                          <Text className={styles.detailValue}>{record.coupon.code}</Text>
                        </View>
                        <View className={styles.detailRow}>
                          <Text style={{ fontSize: '$font-size-xs', color: '$color-text-tertiary' }}>
                            订单号: {record.orderNo}
                          </Text>
                          <Text className={classNames(styles.statusTag, `status_${record.status}`)}>
                            {getStatusLabel(record.status)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无消费记录</Text>
            <Button className={styles.emptyBtn} onClick={handleGoShopping}>
              去领取优惠券
            </Button>
          </View>
        )}

        {filteredRecords.length > 0 && (
          <View className={styles.loadMore}>
            <Text>— 没有更多记录了 —</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default HistoryPage;
