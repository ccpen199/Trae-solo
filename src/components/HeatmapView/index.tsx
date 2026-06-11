import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { TaskHeatmapPoint } from '@/types/task';

interface HeatmapViewProps {
  points: TaskHeatmapPoint[];
  title?: string;
  height?: number;
  onClick?: () => void;
}

const HeatmapView: React.FC<HeatmapViewProps> = ({ points, title = '任务热力分布', height = 300, onClick }) => {
  const stats = React.useMemo(() => {
    if (points.length === 0) {
      return { total: 0, pickup: 0, delivery: 0, exception: 0 };
    }
    return points.reduce((acc, point) => ({
      total: acc.total + point.count,
      pickup: acc.pickup + (point.type === 'pickup' ? point.count : 0),
      delivery: acc.delivery + (point.type === 'delivery' ? point.count : 0),
      exception: acc.exception + (point.type === 'exception' ? point.count : 0)
    }), { total: 0, pickup: 0, delivery: 0, exception: 0 });
  }, [points]);

  const renderMap = () => {
    const minLng = Math.min(...points.map(p => p.longitude));
    const maxLng = Math.max(...points.map(p => p.longitude));
    const minLat = Math.min(...points.map(p => p.latitude));
    const maxLat = Math.max(...points.map(p => p.latitude));
    const lngRange = maxLng - minLng || 0.1;
    const latRange = maxLat - minLat || 0.1;

    const maxWeight = Math.max(...points.map(p => p.weight), 1);

    return (
      <View className={styles.mapContainer} style={{ height: `${height}rpx` }}>
        <View className={styles.mapGrid}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={`h-${i}`} className={styles.gridLineH} style={{ top: `${(i + 1) * 20}%` }} />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={`v-${i}`} className={styles.gridLineV} style={{ left: `${(i + 1) * 20}%` }} />
          ))}
        </View>

        {points.map(point => {
          const left = ((point.longitude - minLng) / lngRange) * 100;
          const top = 100 - ((point.latitude - minLat) / latRange) * 100;
          const size = 40 + (point.weight / maxWeight) * 60;
          const opacity = 0.3 + (point.weight / maxWeight) * 0.7;

          let color = '$color-primary';
          if (point.type === 'pickup') color = 'rgba(22, 93, 255, 1)';
          else if (point.type === 'delivery') color = 'rgba(0, 180, 42, 1)';
          else color = 'rgba(255, 125, 0, 1)';

          return (
            <View
              key={point.id}
              className={classnames(styles.heatPoint, styles[point.type])}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}rpx`,
                height: `${size}rpx`,
                opacity,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <View className={styles.pointInner}>
                <Text className={styles.pointCount}>{point.count}</Text>
              </View>
            </View>
          );
        })}

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.pickup)} />
            <Text className={styles.legendText}>揽收 {stats.pickup}</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.delivery)} />
            <Text className={styles.legendText}>派送 {stats.delivery}</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={classnames(styles.legendDot, styles.exception)} />
            <Text className={styles.legendText}>异常 {stats.exception}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className={styles.container} onClick={onClick}>
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        <Text className={styles.total}>共 {stats.total} 单</Text>
      </View>
      {points.length > 0 ? renderMap() : (
        <View className={styles.empty} style={{ height: `${height}rpx` }}>
          <Text className={styles.emptyText}>暂无热力数据</Text>
        </View>
      )}
    </View>
  );
};

export default HeatmapView;
