import React from 'react';
import { View, Text, ScrollView, Input, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { mockServices } from '@/data/service';

const ServiceDetailPage: React.FC = () => {
  const router = useRouter();
  const serviceId = router.params.id;
  const service = mockServices.find(s => s.id === serviceId) || mockServices[0];

  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [remark, setRemark] = React.useState('');
  const [timeSel, setTimeSel] = React.useState(0);
  const timeOptions = ['尽快上门', '今天上午', '今天下午', '明天上午', '明天下午'];

  const handleSubmit = () => {
    if (!contactName || !contactPhone) {
      Taro.showToast({ title: '请填写联系人信息', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '下单成功！', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1500);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.hero}>
        <View className={styles.heroThumb}>🛎️</View>
        <View className={styles.heroInfo}>
          <View>
            <Text className={styles.heroName}>{service.name}</Text>
            <Text className={styles.heroProvider}>{service.providerName}</Text>
            <View className={styles.heroMeta}>
              <Text className={styles.heroRating}>⭐ {service.rating}</Text>
              <Text className={styles.heroSales}>已售 {service.sales}</Text>
            </View>
          </View>
          <View className={styles.heroPrice}>
            <Text className={styles.priceVal}>¥{service.price}</Text>
            <Text className={styles.priceUnit}>/ {service.unit}</Text>
            {service.originalPrice && <Text className={styles.priceOriginal}>¥{service.originalPrice}</Text>}
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服务详情</Text>
        <Text className={styles.descText}>{service.description}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>服务商家</Text>
        <View className={styles.providerCard}>
          <View className={styles.providerAvatar}>🏪</View>
          <View>
            <Text className={styles.providerName}>
              {service.providerName}
              <Text className={styles.providerTag}>已认证</Text>
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>联系人</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入姓名"
            value={contactName}
            onInput={(e) => setContactName(e.detail.value)}
          />
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>联系电话</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入手机号"
            type="number"
            value={contactPhone}
            onInput={(e) => setContactPhone(e.detail.value)}
          />
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>服务地址</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入服务地址"
            value={address}
            onInput={(e) => setAddress(e.detail.value)}
          />
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>预约时间</Text>
          <Picker mode="selector" range={timeOptions} value={timeSel} onChange={(e) => setTimeSel(Number(e.detail.value))}>
            <Text className={styles.formInput}>{timeOptions[timeSel]} ▾</Text>
          </Picker>
        </View>
        <View className={styles.formRow}>
          <Text className={styles.formLabel}>备注</Text>
          <Input
            className={styles.formInput}
            placeholder="选填，如有特殊需求请备注"
            value={remark}
            onInput={(e) => setRemark(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View>
          <Text className={styles.bottomPrice}>¥{service.price}</Text>
          <Text className={styles.bottomPriceUnit}>/ {service.unit}</Text>
        </View>
        <View className={styles.btnPrimary} onClick={handleSubmit}>立即下单</View>
      </View>
    </ScrollView>
  );
};

export default ServiceDetailPage;
