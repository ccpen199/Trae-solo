import React from 'react'; import { View, Text } from '@tarojs/components'; import styles from './index.module.scss';
const Page: React.FC = () => {
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>🎯</Text>
    <Text className={styles.title}>市民数字画像中心</Text>
    <Text className={styles.desc}>画像配置页开发中...{'\n\n'}即将开放：{'\n'}• 4维度标签体系（人口属性/行为特征/偏好倾向/人生事件）{'\n'}• 画像动态更新与可视化{'\n'}• 标签手动修正与反馈{'\n'}• 偏好服务自定义排序{'\n'}• 画像数据导出与隐私管理{'\n'}• 推荐算法透明度说明{'\n\n'}所有画像数据严格加密存储，仅本人可见。</Text>
  </View></View>);
};
export default Page;
