import React from 'react'; import { View, Text } from '@tarojs/components'; import { useRouter } from '@tarojs/taro'; import styles from './index.module.scss';
const Page: React.FC = () => { const router = useRouter();
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>⭐</Text>
    <Text className={styles.title}>服务评价页</Text>
    <Text className={styles.desc}>关联办件：{router.params.service || router.params.appId || '-'}{'\n\n'}功能开发中...{'\n\n'}即将开放：五星评分、正/负面标签选择、文字评价、图片上传、差评自动转督办工单、评价结果反馈等功能。{'\n\n'}评价数据将用于服务优化和工作人员考核。</Text>
  </View></View>);
};
export default Page;
