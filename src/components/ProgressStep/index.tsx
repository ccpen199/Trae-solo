import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

export interface StepItem {
  status: string;
  statusText?: string;
  operator: string;
  remark: string;
  timestamp: string;
  images?: string[];
}

interface ProgressStepProps {
  items: StepItem[];
  currentStatus?: string;
}

const statusMap: Record<string, 'done' | 'active' | 'pending'> = {
  completed: 'done',
  closed: 'done',
  processing: 'active',
  assigned: 'active',
  pending: 'pending',
};

const statusTextMap: Record<string, string> = {
  pending: '待处理',
  assigned: '已派单',
  processing: '处理中',
  completed: '已完成',
  closed: '已关闭',
};

const ProgressStep: React.FC<ProgressStepProps> = ({ items }) => {
  return (
    <View className={styles.steps}>
      {items.map((item, index) => {
        const type = statusMap[item.status] ?? 'pending';
        return (
          <View
            key={index}
            className={classnames(styles.step, styles[type])}
          >
            <View className={classnames(styles.dot, styles[type])} />
            <View className={styles.content}>
              <View className={styles.topRow}>
                <Text className={styles.status}>{item.statusText || statusTextMap[item.status] || item.status}</Text>
                <Text className={styles.time}>{item.timestamp}</Text>
              </View>
              <Text className={styles.operator}>处理人：{item.operator}</Text>
              <Text className={styles.remark}>{item.remark}</Text>
              {item.images && item.images.length > 0 && (
                <View className={styles.images}>
                  {item.images.map((img, i) => (
                    <Image key={i} className={styles.img} src={img} mode="aspectFill" />
                  ))}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default ProgressStep;
