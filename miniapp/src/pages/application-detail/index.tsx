import React from 'react'; import { View, Text } from '@tarojs/components'; import styles from './index.module.scss';
import { useRouter } from '@tarojs/taro';
const Page: React.FC = () => { const router = useRouter();
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>📊</Text>
    <Text className={styles.title}>办件详情页</Text>
    <Text className={styles.desc}>办件ID：{router.params.id || '-'}{'\n\n'}该页面将完整展示办件的流程节点时间轴、审核状态、材料核验结果、办理人员信息、预约信息等功能，支持材料补交、消息沟通、服务评价等操作。</Text>
  </View></View>);
};
export default Page;
