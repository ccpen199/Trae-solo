import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { mockDevices } from '@/data/access';
import SectionHeader from '@/components/SectionHeader';

const AccessDetailPage: React.FC = () => {
  const [opening, setOpening] = useState<string | null>(null);

  const handleOpenDoor = async (deviceId: string, deviceName: string) => {
    setOpening(deviceId);
    console.log('[Access] Opening door:', deviceId, deviceName);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setOpening(null);
    Taro.showToast({
      title: '开门成功',
      icon: 'success',
    });
  };

  const handleGrantVisitor = () => {
    Taro.showToast({ title: '访客授权功能开发中', icon: 'none' });
  };

  const handleViewLogs = () => {
    Taro.navigateTo({ url: '/pages/access-log/index' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.qrSection}>
        <View className={styles.qrCard}>
          <Text className={styles.qrTitle}>我的开门二维码</Text>
          <View className={styles.qrBox}>
            <Text className={styles.qrPlaceholder}>📱</Text>
          </View>
          <Text className={styles.qrHint}>
            将二维码对准门禁扫描区即可开门{"\n"}
            支持蓝牙/NFC/二维码三种方式
          </Text>
          <Text className={styles.qrValid}>
            ⏱ 二维码有效期至 当日23:59
          </Text>
        </View>
      </View>

      <View className={styles.actionRow}>
        <View className={styles.actionBtn} onClick={handleGrantVisitor}>
          <View className={styles.actionIcon} style={{ backgroundColor: '#DBEAFE' }}>🔑</View>
          <Text className={styles.actionName}>访客授权</Text>
        </View>
        <View className={styles.actionBtn} onClick={handleViewLogs}>
          <View className={styles.actionIcon} style={{ backgroundColor: '#FEF3C7' }}>📋</View>
          <Text className={styles.actionName}>通行记录</Text>
        </View>
      </View>

      <View className={styles.deviceSection}>
        <SectionHeader title="可用门禁设备" />
        {mockDevices.map((device) => (
          <View key={device.id} className={styles.deviceCard}>
            <View className={styles.deviceIcon} style={{ backgroundColor: device.isOnline ? '#ECFDF5' : '#F1F5F9' }}>
              {device.type === 'QRCODE' ? '📷' : device.type === 'NFC' ? '💳' : device.type === 'BLUETOOTH' ? '📶' : '👤'}
            </View>
            <View className={styles.deviceInfo}>
              <Text className={styles.deviceName}>{device.name}</Text>
              <Text className={styles.deviceLocation}>{device.location} · {device.type}</Text>
            </View>
            <Text className={classnames(styles.deviceStatus, device.isOnline ? styles.online : styles.offline)}>
              {device.isOnline ? '● 在线' : '○ 离线'}
            </Text>
            <View
              className={styles.openBtn}
              onClick={() => device.isOnline && handleOpenDoor(device.id, device.name)}
              style={!device.isOnline ? { opacity: 0.5, background: '#CBD5E1' } : undefined}
            >
              {opening === device.id ? '开门中...' : '开门'}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AccessDetailPage;
