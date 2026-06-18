import React from 'react'; import { View, Text } from '@tarojs/components'; import { useRouter } from '@tarojs/taro'; import styles from './index.module.scss';
const Page: React.FC = () => { const router = useRouter();
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>📜</Text>
    <Text className={styles.title}>政策详情页</Text>
    <Text className={styles.desc}>政策ID：{router.params.id || '-'}{'\n\n'}功能开发中...{'\n\n'}即将开放：政策全文阅读、条款关联解读、图解政策、政策时间轴、适用人群分析、关联办事服务、政策意见反馈等功能。{'\n\n'}基于政务知识图谱，支持"政策→办事→问答"全链路追溯。</Text>
  </View></View>);
};
export default Page;
