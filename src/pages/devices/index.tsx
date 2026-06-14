import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';
import { mockDevices, mockAlerts } from '@/data/mockAccess';
import { mockAccess } from '@/data/mockAccess';
import type { AccessDevice, AccessDeviceStatus } from '@/types';

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'online', label: '在线' },
  { key: 'offline', label: '离线' },
  { key: 'warning', label: '告警' },
];

const DevicesPage: React.FC = () => {
  const [filter, setFilter] = useState('all');

  const devices: AccessDevice[] = mockDevices && mockDevices.length ? mockDevices : mockAccess.devices;
  const alerts = mockAlerts || mockAccess.alerts || [];

  const overview = useMemo(() => {
    if (!devices || !devices.length) return { total: 0, online: 0, offline: 0, warning: 0 };
    return {
      total: devices.length,
      online: devices.filter(d => d.status === 'online').length,
      offline: devices.filter(d => d.status === 'offline').length,
      warning: devices.filter(d => d.status === 'warning').length,
    };
  }, [devices]);

  const filteredDevices = useMemo(() => {
    if (!devices) return [];
    if (filter === 'all') return devices;
    return devices.filter(d => d.status === filter);
  }, [devices, filter]);

  const pendingAlerts = alerts.filter(a => !a.resolved);

  const handleResolve = (alertId: string) => {
    Taro.showModal({
      title: '确认处理',
      content: '确认标记此告警已处理？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '处理成功', icon: 'success' });
          console.log('[Alert] Resolved:', alertId);
        }
      },
    });
  };

  const handleReboot = (deviceId: string) => {
    Taro.showModal({
      title: '重启设备',
      content: '确认远程重启该门禁设备？',
      success: (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '重启中...' });
          setTimeout(() => {
            Taro.hideLoading();
            Taro.showToast({ title: '重启命令已发送', icon: 'success' });
            console.log('[Device] Reboot:', deviceId);
          }, 1500);
        }
      },
    });
  };

  return (
    <PageContainer>
      <View className={styles.overviewGrid}>
        <View className={`${styles.oCard}`}>
          <View className={styles.num}><Text>{overview.total}</Text></View>
          <View className={styles.label}><Text>设备总数</Text></View>
        </View>
        <View className={`${styles.oCard} ${styles.online}`}>
          <View className={styles.num}><Text>{overview.online}</Text></View>
          <View className={styles.label}><Text>在线设备</Text></View>
        </View>
        <View className={`${styles.oCard} ${styles.warning}`}>
          <View className={styles.num}><Text>{overview.warning}</Text></View>
          <View className={styles.label}><Text>告警设备</Text></View>
        </View>
        <View className={`${styles.oCard} ${styles.offline}`}>
          <View className={styles.num}><Text>{overview.offline}</Text></View>
          <View className={styles.label}><Text>离线设备</Text></View>
        </View>
      </View>

      {pendingAlerts.length > 0 && (
        <View className={styles.alertBanner}>
          <View className={styles.head}>
            <View className={styles.title}><Text>🚨</Text><Text>待处理告警</Text></View>
            <View className={styles.badge}><Text>{pendingAlerts.length}</Text></View>
          </View>
          <View className={styles.alerts}>
            {pendingAlerts.slice(0, 3).map(a => (
              <View key={a.id} className={`${styles.alert} ${styles[a.level]}`}>
                <View className={styles.row1}>
                  <Text className={styles.name}>{a.deviceName}</Text>
                  <Text className={styles.time}>{a.timestamp.slice(11)}</Text>
                </View>
                <Text className={styles.msg}>{a.message}</Text>
                <View className={styles.opRow}>
                  <View className={`${styles.opBtn} ${styles.outline}`} onClick={() => Taro.showToast({ title: '查看详情', icon: 'none' })}>
                    <Text>查看详情</Text>
                  </View>
                  <View className={`${styles.opBtn} ${styles.primary}`} onClick={() => handleResolve(a.id)}>
                    <Text>已处理</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <ScrollView scrollX className={styles.filterBar} enableFlex showScrollbar={false}>
        {statusFilters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filter, filter === f.key && styles.active)}
            onClick={() => setFilter(f.key)}
          >
            <Text>{f.label}</Text>
          </View>
        ))}
      </ScrollView>

      {filteredDevices.map(d => (
        <View key={d.id} className={styles.deviceCard}>
          <View className={styles.row1}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View className={styles.name}>
                <Text>{d.type === 'gate' ? '🚪' : d.type === 'elevator' ? '🛗' : d.type === 'ble' ? '📶' : '📸'}</Text>
                <Text>{d.name}</Text>
              </View>
              <View className={styles.loc}><Text>📍 {d.location}</Text></View>
            </View>
            <StatusBadge
              type={d.status === 'online' ? 'success' : d.status === 'warning' ? 'warning' : 'error'}
              dot
            >
              {d.status === 'online' ? '在线' : d.status === 'warning' ? '告警' : '离线'}
            </StatusBadge>
          </View>

          <View className={styles.metaGrid}>
            <View className={styles.meta}>
              <View className={styles.label}><Text>今日通行</Text></View>
              <View className={styles.value}><Text>{d.todayCount || 0}次</Text></View>
            </View>
            <View className={styles.meta}>
              <View className={styles.label}><Text>信号强度</Text></View>
              <View className={styles.value}><Text>{d.signal || '--'}dBm</Text></View>
            </View>
            <View className={styles.meta}>
              <View className={styles.label}><Text>最后心跳</Text></View>
              <View className={styles.value}><Text>{d.lastHeartbeat ? d.lastHeartbeat.slice(11, 16) : '--'}</Text></View>
            </View>
          </View>

          <View className={styles.actionBar}>
            <View className={`${styles.action} ${styles.outline}`} onClick={() => Taro.navigateTo({ url: `/pages/access-detail/index?id=${d.id}` })}>
              <Text>通行日志</Text>
            </View>
            <View className={`${styles.action} ${styles.outline}`} onClick={() => Taro.showToast({ title: '远程开门', icon: 'success' })}>
              <Text>远程开门</Text>
            </View>
            <View className={`${styles.action} ${styles.primary}`} onClick={() => handleReboot(d.id)}>
              <Text>重启设备</Text>
            </View>
          </View>
        </View>
      ))}
    </PageContainer>
  );
};

export default DevicesPage;
