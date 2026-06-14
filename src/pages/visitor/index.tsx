import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import { mockVisitorInvites } from '@/data/mockAccess';

const VisitorPage: React.FC = () => {
  const invites = mockVisitorInvites;

  return (
    <PageContainer>
      <View
        className={styles.createBtn}
        onClick={() => Taro.showToast({ title: '创建访客邀请功能开发中', icon: 'none' })}
      >
        <View className={styles.iconBox}><Text>📩</Text></View>
        <View className={styles.info}>
          <View className={styles.title}><Text>创建访客邀请</Text></View>
          <View className={styles.sub}><Text>生成二维码或门禁码分享给访客</Text></View>
        </View>
        <Text className={styles.arrow}>›</Text>
      </View>

      {invites.length === 0 ? (
        <EmptyState title="暂无访客邀请" subTitle="点击上方按钮创建新的邀请" icon="👥" />
      ) : (
        invites.map(v => (
          <View key={v.id} className={styles.visitorCard}>
            <View className={styles.head}>
              <Image className={styles.av} src={`https://picsum.photos/id/${90 + parseInt(v.id.slice(1))}/100/100`} mode="aspectFill" />
              <View className={styles.info}>
                <View className={styles.name}>
                  <Text>{v.visitorName}</Text>
                  <StatusBadge type={v.status === 'active' ? 'success' : v.status === 'expired' ? 'gray' : 'warning'} dot>
                    {v.status === 'active' ? '生效中' : v.status === 'expired' ? '已过期' : '未使用'}
                  </StatusBadge>
                </View>
                <View className={styles.detail}>
                  <Text>{v.visitorPhone} · {v.purpose}</Text>
                </View>
              </View>
            </View>
            <View className={styles.body}>
              <View className={styles.infoRow}>
                <Text className={styles.label}>有效期限</Text>
                <View className={styles.value}>
                  <Text>{v.validStart.slice(5)}</Text>
                  <Text style={{ color: '#86909C' }}>至</Text>
                  <Text>{v.validEnd.slice(5)}</Text>
                </View>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>授权设备</Text>
                <View className={styles.value}>
                  {v.accessDeviceIds.slice(0, 2).map((id, i) => (
                    <Text key={id} style={{ marginLeft: i > 0 ? 6 : 0 }}>
                      {i > 0 ? '、' : ''}{id === 'D001' ? '小区东门' : id === 'D002' ? '5栋单元门' : id === 'D003' ? '小区西门' : '电梯'}
                    </Text>
                  ))}
                  {v.accessDeviceIds.length > 2 && <Text style={{ color: '#86909C' }}> 等{v.accessDeviceIds.length}处</Text>}
                </View>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>通行次数</Text>
                <View className={styles.value}><Text>{v.timesUsed || 0} / {v.maxTimes || '不限'}次</Text></View>
              </View>
              <View className={styles.infoRow}>
                <Text className={styles.label}>授权方式</Text>
                <View className={styles.value}>
                  {v.methods.map((m, i) => (
                    <StatusBadge key={m} type={m === 'qr' ? 'primary' : 'success'}>
                      {m === 'qr' ? '二维码' : m === 'ble' ? '蓝牙' : '门禁码'}
                    </StatusBadge>
                  ))}
                </View>
              </View>
            </View>
            <View className={styles.footer}>
              <View
                className={`${styles.btn} ${styles.outline}`}
                onClick={() => Taro.showToast({ title: '功能开发中', icon: 'none' })}
              >
                <Text>撤销邀请</Text>
              </View>
              <View
                className={`${styles.btn} ${styles.primary}`}
                onClick={() => Taro.showToast({ title: '已复制邀请码', icon: 'success' })}
              >
                <Text>分享访客</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </PageContainer>
  );
};

export default VisitorPage;
