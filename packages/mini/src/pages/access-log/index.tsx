import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockAccessLogs } from '@/data/access';

const AccessLogPage: React.FC = () => {
  const groupedLogs: Record<string, typeof mockAccessLogs> = {};
  mockAccessLogs.forEach(log => {
    const date = log.accessedAt.split(' ')[0];
    if (!groupedLogs[date]) groupedLogs[date] = [];
    groupedLogs[date].push(log);
  });

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return '今天';
    return dateStr;
  };

  return (
    <ScrollView className={styles.page} scrollY>
      {Object.entries(groupedLogs).map(([date, logs]) => (
        <View key={date}>
          <Text className={styles.dateHeader}>{formatDate(date)}</Text>
          <View className={styles.logList}>
            {logs.map((log) => (
              <View key={log.id} className={styles.logCard}>
                <View className={classnames(styles.logIcon, log.accessResult ? styles.success : styles.fail)}>
                  {log.accessType === 'QRCODE' ? '📷' : log.accessType === 'NFC' ? '💳' : log.accessType === 'BLUETOOTH' ? '📶' : '👤'}
                </View>
                <View className={styles.logInfo}>
                  <Text className={styles.logDevice}>{log.deviceName}</Text>
                  <Text className={styles.logLocation}>{log.location} · {log.accessType}</Text>
                </View>
                <View className={styles.logRight}>
                  <Text className={styles.logTime}>{log.accessedAt.split(' ')[1]}</Text>
                  <Text className={classnames(styles.logResult, log.accessResult ? styles.resultSuccess : styles.resultFail)}>
                    {log.accessResult ? '✓ 通过' : '✗ 拒绝'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

export default AccessLogPage;
