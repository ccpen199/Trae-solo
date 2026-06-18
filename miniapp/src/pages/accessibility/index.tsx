import React from 'react'; import { View, Text } from '@tarojs/components'; import styles from './index.module.scss';
const Page: React.FC = () => {
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>♿</Text>
    <Text className={styles.title}>无障碍设置中心</Text>
    <Text className={styles.desc}>功能开发中...{'\n\n'}即将开放：{'\n'}• 高对比度模式（符合WCAG AA标准）{'\n'}• 全局大字体模式（放大1.3x/1.5x/1.8x）{'\n'}• 语音导航与页面内容朗读{'\n'}• 朗读语速调节{'\n'}• 自动朗读开关{'\n'}• 屏幕阅读器优化{'\n'}• 操作引导语音提示{'\n'}• 老年人简易模式{'\n\n'}严格遵循《信息无障碍技术标准》，让每一位市民都能平等享受政务服务。</Text>
  </View></View>);
};
export default Page;
