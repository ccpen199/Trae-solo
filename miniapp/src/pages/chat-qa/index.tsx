import React from 'react'; import { View, Text } from '@tarojs/components'; import { useRouter } from '@tarojs/taro'; import styles from './index.module.scss';
const Page: React.FC = () => { const router = useRouter();
  return (<View className={styles.container}><View className={styles.card}>
    <Text className={styles.icon}>🤖</Text>
    <Text className={styles.title}>小智智能问答</Text>
    <Text className={styles.desc}>初始问题：{router.params.question || router.params.keyword || '（空）'}{'\n\n'}对话页面开发中...{'\n\n'}即将开放：基于知识图谱的对话式问答、多轮追问、政策关联解读、办事条件智能匹配、问题转人工、对话历史、问题反馈纠错等功能。{'\n\n'}支持20+委办局政策数据，覆盖5万+高频问答。</Text>
  </View></View>);
};
export default Page;
