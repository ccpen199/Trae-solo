import React, { memo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import type { GovernmentService } from '../../types';
import classnames from 'classnames';
import { useAppStore } from '../../store/appStore';
import { useUserStore } from '../../store/userStore';

interface Props {
  service: GovernmentService;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showFavorite?: boolean;
  onClick?: (service: GovernmentService) => void;
}

const ServiceCard: React.FC<Props> = memo(({ service, layout = 'horizontal', showFavorite = true, onClick }) => {
  const speak = useAppStore(s => s.speak);
  const addRecentService = useUserStore(s => s.addRecentService);
  const toggleFavorite = useUserStore(s => s.toggleServiceFavorite);

  const handleClick = () => {
    speak(`${service.name}，来自${service.department}`);
    addRecentService(service.id);
    if (onClick) {
      onClick(service);
    } else {
      Taro.navigateTo({ url: `/pages/service-detail/index?id=${service.id}` });
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(service.id);
    Taro.showToast({ title: service.isFavorite ? '已取消收藏' : '已收藏', icon: 'none' });
  };

  if (layout === 'compact') {
    return (
      <View className={styles.compactCard} onClick={handleClick}>
        <View className={styles.compactIcon} style={{ backgroundColor: `${service.color}15`, color: service.color }}>
          <Text>{service.icon}</Text>
        </View>
        <Text className={styles.compactName}>{service.shortName}</Text>
      </View>
    );
  }

  if (layout === 'vertical') {
    return (
      <View className={styles.verticalCard} onClick={handleClick}>
        <View className={styles.verticalIcon} style={{ backgroundColor: `${service.color}15`, color: service.color }}>
          <Text>{service.icon}</Text>
        </View>
        <View className={styles.verticalInfo}>
          <Text className={styles.verticalName}>{service.shortName}</Text>
          <Text className={styles.verticalDept}>{service.department}</Text>
        </View>
        {showFavorite && (
          <View className={styles.favoriteIcon} onClick={handleFavoriteClick}>
            <Text>{service.isFavorite ? '★' : '☆'}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={styles.horizontalCard} onClick={handleClick}>
      <View className={styles.leftSection}>
        <View className={styles.iconBox} style={{ backgroundColor: `${service.color}15`, color: service.color }}>
          <Text className={styles.iconText}>{service.icon}</Text>
        </View>
        <View className={styles.infoSection}>
          <View className={styles.nameRow}>
            <Text className={styles.serviceName}>{service.name}</Text>
            {service.hotLevel >= 90 && (
              <View className={styles.hotBadge}>
                <Text>热门</Text>
              </View>
            )}
          </View>
          <Text className={styles.serviceDesc}>{service.description}</Text>
          <View className={styles.metaRow}>
            <Text className={styles.deptText}>{service.department}</Text>
            <View className={styles.tagList}>
              {service.tags.slice(0, 2).map(tag => (
                <Text key={tag} className={styles.tagItem}>{tag}</Text>
              ))}
            </View>
          </View>
          <View className={styles.statsRow}>
            <Text className={styles.statItem}>⏱ {service.handlingTime}</Text>
            <Text className={styles.statItem}>📄 {service.materialsCount}项材料</Text>
            <Text className={styles.statItem}>✅ {Math.round(service.successRate * 100)}%办结率</Text>
          </View>
        </View>
      </View>
      <View className={styles.rightSection}>
        {showFavorite && (
          <View
            className={classnames(styles.favoriteBtn, service.isFavorite && styles.favoriteActive)}
            onClick={handleFavoriteClick}
          >
            <Text>{service.isFavorite ? '★' : '☆'}</Text>
          </View>
        )}
        <Button className={styles.handleBtn}>
          <Text>立即办理</Text>
        </Button>
      </View>
    </View>
  );
});

export default ServiceCard;
