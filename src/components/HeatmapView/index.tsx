import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { TaskHeatmapPoint, Geofence } from '@/types/task';

type HeatmapDimension = 'all' | 'site' | 'area' | 'fence';
type HeatmapStatusFilter = 'all' | 'pending' | 'processing' | 'exception';

interface HeatmapViewProps {
  points: TaskHeatmapPoint[];
  fences?: Geofence[];
  title?: string;
  height?: number;
  showDimensionSwitch?: boolean;
  showStatusFilter?: boolean;
  showDispatchPanel?: boolean;
  selectedDimension?: HeatmapDimension;
  selectedStatus?: HeatmapStatusFilter;
  selectedFenceId?: string;
  onDimensionChange?: (dim: HeatmapDimension) => void;
  onStatusChange?: (status: HeatmapStatusFilter) => void;
  onPointClick?: (point: TaskHeatmapPoint) => void;
  onFenceSelect?: (fence: Geofence) => void;
  onDispatch?: (type: string) => void;
  onViewAll?: () => void;
}

const HeatmapView: React.FC<HeatmapViewProps> = ({
  points,
  fences = [],
  title = '任务热力分布',
  height = 300,
  showDimensionSwitch = true,
  showStatusFilter = true,
  showDispatchPanel = true,
  selectedDimension = 'all',
  selectedStatus = 'all',
  selectedFenceId = '',
  onDimensionChange,
  onStatusChange,
  onPointClick,
  onFenceSelect,
  onDispatch,
  onViewAll
}) => {
  const [activeDim, setActiveDim] = useState<HeatmapDimension>(selectedDimension);
  const [activeStatus, setActiveStatus] = useState<HeatmapStatusFilter>(selectedStatus);
  const [selectedPoint, setSelectedPoint] = useState<TaskHeatmapPoint | null>(null);

  const dimensions: { key: HeatmapDimension; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'site', label: '网点' },
    { key: 'area', label: '片区' },
    { key: 'fence', label: '围栏' }
  ];

  const statusFilters: { key: HeatmapStatusFilter; label: string; color: string }[] = [
    { key: 'all', label: '全部', color: 'primary' },
    { key: 'pending', label: '待处理', color: 'warning' },
    { key: 'processing', label: '进行中', color: 'success' },
    { key: 'exception', label: '异常', color: 'error' }
  ];

  const filteredPoints = useMemo(() => {
    let result = [...points];
    if (activeStatus !== 'all') {
      if (activeStatus === 'pending') {
        result = result.filter(p => p.type !== 'exception');
      } else if (activeStatus === 'exception') {
        result = result.filter(p => p.type === 'exception');
      }
    }
    return result;
  }, [points, activeStatus]);

  const stats = useMemo(() => {
    if (filteredPoints.length === 0) {
      return { total: 0, pickup: 0, delivery: 0, exception: 0, pending: 0, processing: 0 };
    }
    return filteredPoints.reduce((acc, point) => ({
      total: acc.total + point.count,
      pickup: acc.pickup + (point.type === 'pickup' ? point.count : 0),
      delivery: acc.delivery + (point.type === 'delivery' ? point.count : 0),
      exception: acc.exception + (point.type === 'exception' ? point.count : 0),
      pending: acc.pending + (point.type !== 'exception' ? point.count : 0),
      processing: acc.processing + (point.type !== 'exception' ? Math.floor(point.count * 0.6) : 0)
    }), { total: 0, pickup: 0, delivery: 0, exception: 0, pending: 0, processing: 0 });
  }, [filteredPoints]);

  const handleDimChange = (dim: HeatmapDimension) => {
    setActiveDim(dim);
    if (onDimensionChange) {
      onDimensionChange(dim);
    }
  };

  const handleStatusChange = (status: HeatmapStatusFilter) => {
    setActiveStatus(status);
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  const handlePointClick = (point: TaskHeatmapPoint) => {
    setSelectedPoint(point);
    if (onPointClick) {
      onPointClick(point);
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    }
  };

  const handleDispatch = (type: string) => {
    if (onDispatch) {
      onDispatch(type);
    } else {
      Taro.showToast({
        title: `调度${type}任务`,
        icon: 'none'
      });
    }
  };

  const renderFences = () => {
    if (activeDim !== 'fence' || fences.length === 0) return null;

    const minLng = Math.min(...points.map(p => p.longitude));
    const maxLng = Math.max(...points.map(p => p.longitude));
    const minLat = Math.min(...points.map(p => p.latitude));
    const maxLat = Math.max(...points.map(p => p.latitude));
    const lngRange = maxLng - minLng || 0.1;
    const latRange = maxLat - minLat || 0.1;

    return fences.map(fence => {
      const left = ((fence.centerLongitude - minLng) / lngRange) * 100;
      const top = 100 - ((fence.centerLatitude - minLat) / latRange) * 100;
      const radiusPx = (fence.radius / 1000) * 40;

      return (
        <View
          key={fence.id}
          className={classnames(styles.fenceCircle, {
            [styles.fenceActive]: selectedFenceId === fence.id
          })}
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${radiusPx * 2}rpx`,
            height: `${radiusPx * 2}rpx`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => onFenceSelect?.(fence)}
        >
          <Text className={styles.fenceLabel}>{fence.name}</Text>
        </View>
      );
    });
  };

  const renderMap = () => {
    const minLng = Math.min(...filteredPoints.map(p => p.longitude));
    const maxLng = Math.max(...filteredPoints.map(p => p.longitude));
    const minLat = Math.min(...filteredPoints.map(p => p.latitude));
    const maxLat = Math.max(...filteredPoints.map(p => p.latitude));
    const lngRange = maxLng - minLng || 0.1;
    const latRange = maxLat - minLat || 0.1;

    const maxWeight = Math.max(...filteredPoints.map(p => p.weight), 1);

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

        {renderFences()}

        {filteredPoints.map(point => {
          const left = ((point.longitude - minLng) / lngRange) * 100;
          const top = 100 - ((point.latitude - minLat) / latRange) * 100;
          const size = 40 + (point.weight / maxWeight) * 60;
          const opacity = 0.3 + (point.weight / maxWeight) * 0.7;

          return (
            <View
              key={point.id}
              className={classnames(styles.heatPoint, styles[point.type], {
                [styles.pointSelected]: selectedPoint?.id === point.id
              })}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}rpx`,
                height: `${size}rpx`,
                opacity,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handlePointClick(point)}
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

        {selectedPoint && (
          <View className={styles.pointPopup}>
            <View className={styles.popupHeader}>
              <Text className={styles.popupTitle}>
                {selectedPoint.type === 'pickup' ? '揽件任务' : selectedPoint.type === 'delivery' ? '派件任务' : '异常件'}
              </Text>
              <Text className={styles.popupClose} onClick={() => setSelectedPoint(null)}>✕</Text>
            </View>
            <View className={styles.popupContent}>
              <Text className={styles.popupCount}>{selectedPoint.count} 单</Text>
              <Text className={styles.popupDesc}>
                {selectedPoint.type === 'pickup' ? '待揽收' : selectedPoint.type === 'delivery' ? '待派送' : '待处理异常'}
              </Text>
            </View>
            <View className={styles.popupActions}>
              <View className={styles.popupBtn} onClick={() => Taro.switchTab({ url: '/pages/dispatch/index' })}>
                <Text>查看任务</Text>
              </View>
              <View className={classnames(styles.popupBtn, styles.primaryBtn)} onClick={() => handleDispatch(selectedPoint.type)}>
                <Text>调度分配</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <Text className={styles.title}>{title}</Text>
        <View className={styles.headerRight}>
          <Text className={styles.total}>共 {stats.total} 单</Text>
          <Text className={styles.viewAll} onClick={handleViewAll}>调度详情 →</Text>
        </View>
      </View>

      {showDimensionSwitch && (
        <View className={styles.dimSwitch}>
          {dimensions.map(dim => (
            <View
              key={dim.key}
              className={classnames(styles.dimItem, { [styles.dimActive]: activeDim === dim.key })}
              onClick={() => handleDimChange(dim.key)}
            >
              <Text>{dim.label}</Text>
            </View>
          ))}
        </View>
      )}

      {showStatusFilter && (
        <View className={styles.statusFilter}>
          {statusFilters.map(filter => (
            <View
              key={filter.key}
              className={classnames(styles.statusItem, styles[`status${filter.color.charAt(0).toUpperCase() + filter.color.slice(1)}`], {
                [styles.statusActive]: activeStatus === filter.key
              })}
              onClick={() => handleStatusChange(filter.key)}
            >
              <Text>{filter.label}</Text>
            </View>
          ))}
        </View>
      )}

      {filteredPoints.length > 0 ? renderMap() : (
        <View className={styles.empty} style={{ height: `${height}rpx` }}>
          <Text className={styles.emptyText}>暂无热力数据</Text>
        </View>
      )}

      {showDispatchPanel && filteredPoints.length > 0 && (
        <View className={styles.dispatchPanel}>
          <Text className={styles.dispatchTitle}>快捷调度</Text>
          <View className={styles.dispatchActions}>
            <View className={styles.dispatchBtn} onClick={() => handleDispatch('batch_pickup')}>
              <Text className={styles.dispatchIcon}>📦</Text>
              <Text className={styles.dispatchLabel}>批量揽派</Text>
            </View>
            <View className={styles.dispatchBtn} onClick={() => handleDispatch('reassign')}>
              <Text className={styles.dispatchIcon}>🔄</Text>
              <Text className={styles.dispatchLabel}>任务转派</Text>
            </View>
            <View className={styles.dispatchBtn} onClick={() => handleDispatch('priority')}>
              <Text className={styles.dispatchIcon}>⭐</Text>
              <Text className={styles.dispatchLabel}>加急处理</Text>
            </View>
            <View className={styles.dispatchBtn} onClick={() => handleDispatch('fence_check')}>
              <Text className={styles.dispatchIcon}>🛡️</Text>
              <Text className={styles.dispatchLabel}>围栏巡查</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default HeatmapView;
