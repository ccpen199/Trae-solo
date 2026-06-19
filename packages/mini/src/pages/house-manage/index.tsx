import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useUserStore } from '@/store/user';

const HouseManagePage: React.FC = () => {
  const { houses } = useUserStore();

  const handleAddHouse = () => {
    Taro.showToast({ title: '房产绑定功能开发中', icon: 'none' });
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.houseList}>
        {houses.map((house) => (
          <View key={house.id} className={styles.houseCard}>
            <View className={styles.houseHeader}>
              <Text className={styles.houseName}>{house.communityName}</Text>
              <Text className={`${styles.verifiedTag} ${house.isVerified ? styles.verified : styles.unverified}`}>
                {house.isVerified ? '✓ 已认证' : '待认证'}
              </Text>
            </View>
            <View className={styles.houseDetail}>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>楼栋</Text>
                <Text className={styles.detailValue}>{house.buildingName}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>单元</Text>
                <Text className={styles.detailValue}>{house.unitName}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>房间号</Text>
                <Text className={styles.detailValue}>{house.roomNumber}</Text>
              </View>
              <View className={styles.detailRow}>
                <Text className={styles.detailLabel}>身份</Text>
                <Text className={styles.detailValue}>{house.relationship === 'OWNER' ? '业主' : '家属'}</Text>
              </View>
            </View>
          </View>
        ))}

        <View className={styles.addBtn} onClick={handleAddHouse}>
          <Text className={styles.addIcon}>➕</Text>
          绑定新房产
        </View>
      </View>
    </ScrollView>
  );
};

export default HouseManagePage;
