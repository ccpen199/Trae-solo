import React from 'react'; import { View, Text } from '@tarojs/components'; import styles from './index.module.scss';
const Page: React.FC = () => {
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>🪪</Text>
    <Text className={styles.title}>证照证明中心</Text>
    <Text className={styles.desc}>功能开发中...{'\n\n'}即将开放：电子证照展示、参保证明下载、核验二维码生成、离线缓存管理、证照使用记录等功能。{'\n\n'}支持：身份证、社保卡、公积金、驾驶证、不动产权证等20+电子证照。</Text>
  </View></View>);
};
export default Page;
