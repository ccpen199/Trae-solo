import React, { useState } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import StatusBadge from '@/components/StatusBadge';
import { useUserStore } from '@/store/useUserStore';
import { mockDevices, mockAccessLogs, mockVisitors } from '@/data/mockAccess';

const tabs = [
  { key: 'open', label: '一键开门' },
  { key: 'device', label: '门禁设备' },
  { key: 'log', label: '通行日志' },
  { key: 'visitor', label: '访客管理' },
];

const AccessPage: React.FC = () => {
  const { user } = useUserStore();
  const [tab, setTab] = useState('open');

  const currentBuilding = user?.properties.find((p) => p.id === user.currentPropertyId)?.building;
  const availableDevices = mockDevices.filter(
    (d) => d.status === 'online' && d.buildingScope.includes(currentBuilding || '5栋')
  );

  const handleOpen = (device: typeof mockDevices[0]) => {
    if (device.status !== 'online') {
      Taro.showToast({ title: '设备不在线', icon: 'none' });
      return;
    }
    Taro.showLoading({ title: '开门中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: `${device.name} 已开门`, icon: 'success' });
      console.log('[Access] Open door:', device.id, device.name);
    }, 1200);
  };

  const handleInviteVisitor = () => {
    Taro.navigateTo({ url: '/pages/visitor/index' });
  };

  const handleViewAuth = () => {
    Taro.showToast({ title: '授权管理开发中', icon: 'none' });
  };

  const handleViewLog = () => {
    setTab('log');
  };

  return (
    <PageContainer>
      <View className={styles.tabBar}>
        {tabs.map((t) => (
          <View
            key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.active : ''}`}
            onClick={() => setTab(t.key)}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      {tab === 'open' && (
        <>
          <View className={styles.qrSection}>
            <View className={styles.header}>
              <Text className={styles.title}>通行二维码</Text>
              <View className={styles.method}>
                <Text>扫码/蓝牙/NFC 通用</Text>
              </View>
            </View>
            <View className={styles.qrBox}>
              <View className={styles.qrPlaceholder}>
                <View className={styles.scanLine} />
                <View className={styles.center}>
                  <Text className={styles.qrIcon}>📱</Text>
                  <Text className={styles.tip}>靠近门禁设备自动感应</Text>
                </View>
              </View>
              <Text className={styles.codeText}>SG · 20260610 · 8X4K2M</Text>
              <Text className={styles.valid}>有效期：动态刷新 · 60秒后自动更新</Text>
            </View>
            <View className={styles.actions}>
              <View className={styles.btn} onClick={handleInviteVisitor}>
                <Text className={styles.icon}>👥</Text>
                <Text className={styles.label}>访客邀请</Text>
              </View>
              <View className={styles.btn} onClick={handleViewAuth}>
                <Text className={styles.icon}>🔐</Text>
                <Text className={styles.label}>授权管理</Text>
              </View>
              <View className={styles.btn} onClick={handleViewLog}>
                <Text className={styles.icon}>📋</Text>
                <Text className={styles.label}>通行记录</Text>
              </View>
            </View>
          </View>

          <SectionCard title="常用门禁" titleIcon="🚪" moreText="查看全部" onMore={() => setTab('device')}>
            <View className={styles.deviceList}>
              {availableDevices.slice(0, 4).map((d) => (
                <View key={d.id} className={styles.deviceItem}>
                  <View className={styles.iconBox}>
                    <Text>{d.type === 'combo' ? '🏢' : d.type === 'bluetooth' ? '📶' : d.type === 'nfc' ? '💳' : '📱'}</Text>
                  </View>
                  <View className={styles.info}>
                    <View className={styles.name}>
                      {d.name}
                      <StatusBadge type={d.status === 'online' ? 'success' : d.status === 'fault' ? 'error' : 'warning'} dot>
                        {d.status === 'online' ? '在线' : d.status === 'fault' ? '故障' : '离线'}
                      </StatusBadge>
                    </View>
                    <Text className={styles.location}>{d.location}</Text>
                  </View>
                  <View
                    className={`${styles.openBtn} ${d.status !== 'online' ? styles.disabled : ''}`}
                    onClick={() => handleOpen(d)}
                  >
                    <Text>开门</Text>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        </>
      )}

      {tab === 'device' && (
        <SectionCard title="全部门禁设备" titleIcon="📡">
          <View className={styles.deviceList}>
            {mockDevices.map((d) => (
              <View key={d.id} className={styles.deviceItem}>
                <View className={styles.iconBox}>
                  <Text>{d.type === 'combo' ? '🏢' : d.type === 'bluetooth' ? '📶' : d.type === 'nfc' ? '💳' : '📱'}</Text>
                </View>
                <View className={styles.info}>
                  <View className={styles.name}>
                    {d.name}
                    <StatusBadge type={d.status === 'online' ? 'success' : d.status === 'fault' ? 'error' : 'warning'} dot>
                      {d.status === 'online' ? '在线' : d.status === 'fault' ? '故障' : '离线'}
                    </StatusBadge>
                  </View>
                  <Text className={styles.location}>{d.location} · {d.batteryLevel ? `电量${d.batteryLevel}%` : '外接电源'}</Text>
                </View>
                <View
                  className={`${styles.openBtn} ${d.status !== 'online' ? styles.disabled : ''}`}
                  onClick={() => handleOpen(d)}
                >
                  <Text>开门</Text>
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {tab === 'log' && (
        <SectionCard title="通行日志审计" titleIcon="📋" moreText="筛选">
          <View className={styles.logList}>
            {mockAccessLogs.map((l) => (
              <View key={l.id} className={styles.logItem}>
                <View className={styles.avatar}>
                  <Text>{l.result === 'success' ? '✅' : '❌'}</Text>
                </View>
                <View className={styles.content}>
                  <View className={styles.top}>
                    <Text className={styles.user}>{l.userName}</Text>
                    <View className={`${styles.method} ${styles[l.method]}`}>
                      <Text>
                        {l.method === 'bluetooth' ? '蓝牙' : l.method === 'nfc' ? 'NFC' : l.method === 'qrcode' ? '二维码' : '门禁卡'}
                      </Text>
                    </View>
                  </View>
                  <View className={styles.bottom}>
                    <Text className={styles.device}>{l.deviceName}</Text>
                    <Text className={styles.time}>{l.timestamp}</Text>
                  </View>
                  {l.failReason && <Text className={styles.failReason}>失败原因：{l.failReason}</Text>}
                </View>
              </View>
            ))}
          </View>
        </SectionCard>
      )}

      {tab === 'visitor' && (
        <>
          <SectionCard
            title="访客邀请"
            titleIcon="👥"
            moreText="新建邀请"
            onMore={handleInviteVisitor}
          >
            <View className={styles.visitorList}>
              {mockVisitors.length === 0 ? (
                <View style={{ padding: '80rpx 0', textAlign: 'center', color: '#86909C' }}>
                  <Text>暂无访客邀请记录</Text>
                </View>
              ) : (
                mockVisitors.map((v) => (
                  <View key={v.id} className={styles.vItem}>
                    <View className={styles.top}>
                      <View className={styles.info}>
                        <View className={styles.avatar}><Text>👤</Text></View>
                        <View>
                          <Text className={styles.name}>
                            {v.visitorName}
                            {v.used && <StatusBadge type="success" dot style={{ marginLeft: 12 }}>已使用</StatusBadge>}
                            {!v.used && <StatusBadge type="primary" dot style={{ marginLeft: 12 }}>有效</StatusBadge>}
                          </Text>
                          <Text className={styles.phone}>{v.visitorPhone} · 邀请人：{v.inviterName}</Text>
                        </View>
                      </View>
                    </View>
                    <View className={styles.meta}>
                      <View className={styles.valid}>
                        <Text>🕐 {v.validFrom.slice(5, 16)} ~ {v.validTo.slice(11, 16)}</Text>
                      </View>
                      <Text className={styles.action} onClick={() => Taro.showToast({ title: v.used ? '二维码已失效' : v.qrCode, icon: 'none' })}>
                        {v.used ? '查看记录' : '查看二维码 ›'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </SectionCard>
        </>
      )}
    </PageContainer>
  );
};

export default AccessPage;
