import React, { useState, useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import classnames from 'classnames';
import { mockAccess } from '@/data/mockAccess';

const dates = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '本周' },
  { key: 'all', label: '全部' },
];

const AccessDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id || 'D001';
  const [date, setDate] = useState('today');
  const device = mockAccess.devices.find(d => d.id === id) || mockAccess.devices[0];

  const logs = useMemo(() => {
    const all = mockAccess.logs.filter(l => l.deviceId === id);
    return all.length > 0 ? all : mockAccess.logs.slice(0, 6);
  }, [id, date]);

  return (
    <PageContainer>
      <View className={styles.infoCard}>
        <View className={styles.name}>
          <Text>{device.type === 'gate' ? '🚪' : device.type === 'elevator' ? '🛗' : '📶'}</Text>
          <Text>{device.name}</Text>
        </View>
        <View className={styles.loc}><Text>📍 {device.location}</Text></View>
        <View className={styles.stats}>
          <View className={styles.item}>
            <View className={styles.num}><Text>{device.todayCount || 0}</Text></View>
            <View className={styles.label}><Text>今日通行</Text></View>
          </View>
          <View className={styles.item}>
            <View className={styles.num}><Text>{(device.todayCount || 0) * 7}</Text></View>
            <View className={styles.label}><Text>本周通行</Text></View>
          </View>
          <View className={styles.item}>
            <View className={styles.num}><Text>{device.status === 'online' ? '正常' : '异常'}</Text></View>
            <View className={styles.label}><Text>运行状态</Text></View>
          </View>
        </View>
      </View>

      <View className={styles.dateSelector}>
        {dates.map(d => (
          <View
            key={d.key}
            className={classnames(styles.item, date === d.key && styles.active)}
            onClick={() => setDate(d.key)}
          >
            <Text>{d.label}</Text>
          </View>
        ))}
      </View>

      {logs.length === 0 ? (
        <EmptyState title="暂无通行记录" subTitle="该时间段内暂无通行数据" icon="📋" />
      ) : (
        logs.map(l => (
          <View key={l.id} className={styles.logItem}>
            <Image className={styles.avatar} src={`https://picsum.photos/id/${70 + parseInt(l.id.slice(1))}/100/100`} mode="aspectFill" />
            <View className={styles.info}>
              <View className={styles.row1}>
                <Text className={styles.name}>{l.userName}</Text>
                <Text className={styles.time}>{l.timestamp.slice(11)}</Text>
              </View>
              <View className={styles.row2}>
                <StatusBadge type={l.method === 'qr' ? 'primary' : l.method === 'ble' ? 'success' : 'warning'}>
                  {l.method === 'qr' ? '二维码' : l.method === 'ble' ? '蓝牙' : 'NFC'}
                </StatusBadge>
                <StatusBadge type={l.result ? 'success' : 'error'} dot>
                  {l.result ? '通行成功' : '通行失败'}
                </StatusBadge>
                <Text>{l.timestamp.slice(0, 10)}</Text>
              </View>
            </View>
            <Text className={styles.statusIcon}>{l.result ? '✅' : '❌'}</Text>
          </View>
        ))
      )}
    </PageContainer>
  );
};

export default AccessDetailPage;
