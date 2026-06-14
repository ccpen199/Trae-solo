import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import { useUserStore } from '@/store/useUserStore';
import classnames from 'classnames';

const PropertyPage: React.FC = () => {
  const { user, switchProperty } = useUserStore();
  const properties = user?.properties || [];

  const handleSwitch = (pid: string) => {
    switchProperty(pid);
    Taro.showToast({ title: '已切换房产', icon: 'success' });
    console.log('[Property] Switched to:', pid);
  };

  return (
    <PageContainer>
      <View
        className={styles.addBtn}
        onClick={() => Taro.showToast({ title: '绑定新房产功能开发中', icon: 'none' })}
      >
        <View className={styles.plus}><Text>+</Text></View>
        <View className={styles.label}><Text>绑定新房产</Text></View>
      </View>

      {properties.map((p, i) => (
        <View key={p.id} className={classnames(styles.propertyCard, p.id === user?.currentPropertyId && styles.active)}>
          <View className={classnames(styles.head, i % 2 === 1 && styles.alt)}>
            <View className={styles.typeTag}>
              <Text>{p.type === 'owner' ? '业主' : p.type === 'tenant' ? '租户' : '业主家属'}</Text>
            </View>
            <View className={styles.building}>
              <Text>{p.building}栋 {p.unit}单元 {p.room}</Text>
            </View>
            <View className={styles.address}><Text>📍 {p.address}</Text></View>
            {p.id === user?.currentPropertyId && (
              <View className={styles.currentBadge}><Text>当前使用</Text></View>
            )}
          </View>
          <View className={styles.body}>
            <View className={styles.infoRow}>
              <Text className={styles.label}>产权面积</Text>
              <Text className={styles.value}>{p.area}㎡</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>户型</Text>
              <Text className={styles.value}>{p.layout || '3室2厅2卫'}</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>物业费</Text>
              <Text className={styles.value}>{(p.area * 3.8).toFixed(0)}元/月</Text>
            </View>
            <View className={styles.infoRow}>
              <Text className={styles.label}>车位</Text>
              <Text className={styles.value}>B1-{200 + i}号</Text>
            </View>

            <View className={styles.members}>
              <Text className={styles.mLabel}>住户成员（{p.members.length}人）</Text>
              <View className={styles.mList}>
                {p.members.map((m, mi) => (
                  <View key={mi} className={styles.mItem}>
                    <Image className={styles.av} src={m.avatar || `https://picsum.photos/id/${60 + mi}/100/100`} mode="aspectFill" />
                    <Text className={styles.name}>{m.name}</Text>
                    {m.relation === 'owner' && <Text className={styles.rTag}>业主</Text>}
                    {m.relation === 'spouse' && <Text className={styles.rTag}>配偶</Text>}
                    {m.relation === 'child' && <Text className={styles.rTag}>子女</Text>}
                    {m.relation === 'parent' && <Text className={styles.rTag}>父母</Text>}
                  </View>
                ))}
                <View
                  className={styles.addM}
                  onClick={() => Taro.showToast({ title: '添加成员功能开发中', icon: 'none' })}
                >
                  <Text>+</Text><Text>添加</Text>
                </View>
              </View>
            </View>

            <View className={styles.actions}>
              <View
                className={`${styles.action} ${styles.outline}`}
                onClick={() => Taro.showToast({ title: '产权信息开发中', icon: 'none' })}
              >
                <Text>产权信息</Text>
              </View>
              <View
                className={`${styles.action} ${styles.primary}`}
                onClick={() => p.id !== user?.currentPropertyId && handleSwitch(p.id)}
              >
                <Text>{p.id === user?.currentPropertyId ? '当前使用中' : '切换至此房产'}</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </PageContainer>
  );
};

export default PropertyPage;
