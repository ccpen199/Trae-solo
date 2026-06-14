import React, { useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import SectionCard from '@/components/SectionCard';
import classnames from 'classnames';
import { mockKpiList, mockDailyStats } from '@/data/mockKpi';
import { mockTickets } from '@/data/mockTickets';
import { mockOrders } from '@/data/mockOrders';

const periods = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
  { key: 'year', label: '本年' },
];

const handlerRank = [
  { name: '王师傅', role: '维修组', count: 48, score: 4.9 },
  { name: '李队长', role: '安保组', count: 42, score: 4.8 },
  { name: '张姐', role: '客服组', count: 39, score: 4.7 },
  { name: '陈师傅', role: '维修组', count: 31, score: 4.6 },
  { name: '赵师傅', role: '绿化组', count: 28, score: 4.5 },
];

const KpiPage: React.FC = () => {
  const [period, setPeriod] = useState('week');
  const kpi = mockKpiList[0];
  const daily = mockDailyStats;

  const typeDist = [
    { key: 'r', num: mockTickets.filter(t => t.type === 'repair').length, label: '报修单', rate: '96%', color: '#F87171' },
    { key: 'c', num: mockTickets.filter(t => t.type === 'complaint').length, label: '投诉单', rate: '92%', color: '#FB7185' },
    { key: 's', num: mockTickets.filter(t => t.type === 'suggestion').length, label: '建议单', rate: '100%', color: '#34D399' },
  ];

  const maxDaily = Math.max(...daily.map(d => Math.max(d.total, 8)));

  return (
    <PageContainer>
      <View className={styles.periodTabs}>
        {periods.map(p => (
          <View
            key={p.key}
            className={classnames(styles.tab, period === p.key && styles.active)}
            onClick={() => setPeriod(p.key)}
          >
            <Text>{p.label}</Text>
          </View>
        ))}
      </View>

      <View className={styles.kpiSummary}>
        <View className={`${styles.card} ${styles.c1}`}>
          <View className={styles.head}>
            <Text className={styles.label}>响应时长</Text>
            <Text className={`${styles.trend} ${styles.down}`}>↓ 12%</Text>
          </View>
          <View className={styles.value}>
            <Text className={styles.num}>{kpi.avgResponseMinutes}</Text>
            <Text className={styles.unit}>分钟</Text>
          </View>
          <View className={styles.bar}><View className={`${styles.fill} ${styles.c1}`} style={{ width: '72%' }} /></View>
          <View className={styles.target}>目标 ≤ 30分钟</View>
        </View>

        <View className={`${styles.card} ${styles.c2}`}>
          <View className={styles.head}>
            <Text className={styles.label}>工单完结率</Text>
            <Text className={`${styles.trend} ${styles.up}`}>↑ 5%</Text>
          </View>
          <View className={styles.value}>
            <Text className={styles.num}>{kpi.completionRate}</Text>
            <Text className={styles.unit}>%</Text>
          </View>
          <View className={styles.bar}><View className={`${styles.fill} ${styles.c2}`} style={{ width: kpi.completionRate + '%' }} /></View>
          <View className={styles.target}>目标 ≥ 95%</View>
        </View>

        <View className={`${styles.card} ${styles.c3}`}>
          <View className={styles.head}>
            <Text className={styles.label}>业主满意度</Text>
            <Text className={`${styles.trend} ${styles.up}`}>↑ 0.2</Text>
          </View>
          <View className={styles.value}>
            <Text className={styles.num}>{kpi.satisfaction}</Text>
            <Text className={styles.unit}>分</Text>
          </View>
          <View className={styles.bar}><View className={`${styles.fill} ${styles.c3}`} style={{ width: (kpi.satisfaction * 20) + '%' }} /></View>
          <View className={styles.target}>目标 ≥ 4.5分</View>
        </View>

        <View className={`${styles.card} ${styles.c4}`}>
          <View className={styles.head}>
            <Text className={styles.label}>按期办结率</Text>
            <Text className={`${styles.trend} ${styles.down}`}>↓ 2%</Text>
          </View>
          <View className={styles.value}>
            <Text className={styles.num}>{kpi.onTimeRate}</Text>
            <Text className={styles.unit}>%</Text>
          </View>
          <View className={styles.bar}><View className={`${styles.fill} ${styles.c4}`} style={{ width: kpi.onTimeRate + '%' }} /></View>
          <View className={styles.target}>目标 ≥ 90%</View>
        </View>
      </View>

      <View className={styles.chartCard}>
        <View className={styles.head}>
          <View className={styles.title}><Text>📊</Text><Text>近7日工单趋势</Text></View>
        </View>
        <View className={styles.bars}>
          {daily.map(d => (
            <View key={d.date} className={styles.barItem}>
              <View className={styles.bar} style={{ height: `${(d.total / maxDaily) * 100}%` }}>
                <View className={styles.val}><Text>{d.total}</Text></View>
              </View>
              <Text className={styles.label}>{d.date}</Text>
            </View>
          ))}
        </View>
      </View>

      <SectionCard title="工单类型分布" titleIcon="📈" moreText="详情">
        <View className={styles.typeDist}>
          {typeDist.map(t => (
            <View key={t.key} className={`${styles.dItem} ${styles[t.key]}`}>
              <View className={styles.num} style={{ color: t.color }}><Text>{t.num}</Text></View>
              <View className={styles.label}><Text>{t.label}</Text></View>
              <View className={styles.rate}><Text>完结率 {t.rate}</Text></View>
            </View>
          ))}
        </View>
      </SectionCard>

      <View style={{ height: $spacing-md }} />

      <View className={styles.rankCard}>
        <View className={styles.head}>
          <View className={styles.title}><Text>🏆</Text><Text>处理人员排行榜</Text></View>
        </View>
        {handlerRank.map((h, i) => (
          <View key={i} className={styles.rankItem}>
            <View className={`${styles.numBox} ${styles['n' + (i + 1)]}`}><Text>{i + 1}</Text></View>
            <View className={styles.info}>
              <Text className={styles.name}>{h.name}</Text>
              <Text className={styles.sub}>{h.role} · 完成{h.count}单</Text>
            </View>
            <View className={styles.val}>
              <View className={styles.num}><Text>{h.score}</Text></View>
              <View className={styles.label}><Text>平均评分</Text></View>
            </View>
          </View>
        ))}
      </View>
    </PageContainer>
  );
};

export default KpiPage;
