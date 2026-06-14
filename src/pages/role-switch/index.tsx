import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import { useUserStore } from '@/store/useUserStore';
import { roleNames, roleDescriptions } from '@/utils/auth';
import classnames from 'classnames';
import type { UserRole } from '@/types';

const roles: Array<{ key: UserRole; icon: string; color: string; features: Array<{ icon: string; label: string }> }> = [
  { key: 'resident', icon: '🏠', color: 'rgba(46, 124, 246, 0.12)', features: [
    { icon: '🔑', label: '智能门禁' }, { icon: '🛠️', label: '工单报修' }, { icon: '🛒', label: '生活服务' },
  ]},
  { key: 'property', icon: '🏢', color: 'rgba(245, 158, 11, 0.12)', features: [
    { icon: '📊', label: 'KPI看板' }, { icon: '📡', label: '设备监控' }, { icon: '📋', label: '工单处理' },
  ]},
  { key: 'committee', icon: '🏛️', color: 'rgba(16, 185, 129, 0.12)', features: [
    { icon: '📈', label: 'KPI监督' }, { icon: '🗳️', label: '业主投票' }, { icon: '📣', label: '公告审核' },
  ]},
];

const RoleSwitchPage: React.FC = () => {
  const { user, switchRole } = useUserStore();
  const [selected, setSelected] = useState<UserRole>(user?.role || 'resident');

  const handleConfirm = () => {
    switchRole(selected);
    Taro.showToast({ title: `已切换到${roleNames[selected]}`, icon: 'success' });
    console.log('[Role] Switched to:', selected);
    setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 800);
  };

  return (
    <PageContainer>
      <View className={styles.tip}>
        <Text>您可以根据需要切换不同的身份视图{'\n'}</Text>
        <Text style={{ color: '#86909C', fontSize: 24 }}>不同身份拥有不同的功能权限</Text>
      </View>

      {roles.map((r) => (
        <View
          key={r.key}
          className={classnames(styles.roleCard, selected === r.key ? styles.active : '', styles[r.key])}
          onClick={() => setSelected(r.key)}
        >
          <View className={styles.row}>
            <View className={styles.iconBox} style={{ background: r.color }}>
              <Text>{r.icon}</Text>
            </View>
            <View className={styles.info}>
              <View className={styles.name}>
                <Text>{roleNames[r.key]}</Text>
              </View>
              <Text className={styles.desc}>{roleDescriptions[r.key]}</Text>
            </View>
            <View className={classnames(styles.check, selected === r.key && styles.active)}>
              {selected === r.key && <Text style={{ fontSize: 24, fontWeight: 'bold' }}>✓</Text>}
            </View>
          </View>
          <View className={styles.features}>
            {r.features.map((f, i) => (
              <View key={i} className={styles.f}>
                <Text className={styles.fIcon}>{f.icon}</Text>
                <Text className={styles.fText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className={styles.confirmBtn} onClick={handleConfirm}>
        <Text>确认切换</Text>
      </View>
    </PageContainer>
  );
};

export default RoleSwitchPage;
