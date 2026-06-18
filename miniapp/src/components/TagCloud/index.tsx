import React, { memo } from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import type { CitizenTag } from '../../types';
import classnames from 'classnames';
import { useAppStore } from '../../store/appStore';

interface Props {
  tags: CitizenTag[];
  maxCount?: number;
  showExpand?: boolean;
  onClick?: (tag: CitizenTag) => void;
}

const categoryClass: Record<CitizenTag['category'], string> = {
  demographic: 'tag-demographic',
  behavior: 'tag-behavior',
  preference: 'tag-preference',
  'life-event': 'tag-life-event'
};

const categoryLabels: Record<CitizenTag['category'], string> = {
  demographic: '人口属性',
  behavior: '行为特征',
  preference: '偏好倾向',
  'life-event': '人生事件'
};

const TagCloud: React.FC<Props> = memo(({ tags, maxCount = 0, showExpand = true, onClick }) => {
  const speak = useAppStore(s => s.speak);
  const [expanded, setExpanded] = React.useState(false);

  const displayTags = maxCount > 0 && !expanded ? tags.slice(0, maxCount) : tags;
  const hasMore = maxCount > 0 && tags.length > maxCount;

  const grouped = displayTags.reduce<Record<string, CitizenTag[]>>((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = [];
    acc[tag.category].push(tag);
    return acc;
  }, {});

  const handleTagClick = (tag: CitizenTag) => {
    speak(`${tag.name}，${categoryLabels[tag.category]}标签`);
    onClick?.(tag);
  };

  const handleToggleExpand = () => {
    setExpanded(!expanded);
    speak(!expanded ? '展开全部画像标签' : '收起画像标签');
  };

  if (!displayTags || displayTags.length === 0) {
    return (
      <View className={styles.empty}>
        <Text className={styles.emptyText}>暂无画像标签，使用更多服务后将自动生成</Text>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      {Object.entries(grouped).map(([category, categoryTags]) => (
        <View key={category} className={styles.categoryGroup}>
          <View className={styles.categoryHeader}>
            <Text className={styles.categoryLabel}>
              {categoryLabels[category as CitizenTag['category']]}
            </Text>
            <Text className={styles.categoryCount}>{categoryTags.length}项</Text>
          </View>
          <View className={styles.tagRow}>
            {categoryTags.map(tag => {
              const fontSize = 20 + Math.round(tag.weight * 12);
              return (
                <View
                  key={tag.id}
                  className={classnames(styles.tagItem, styles[categoryClass[tag.category]])}
                  onClick={() => handleTagClick(tag)}
                  style={{ fontSize: `${fontSize}rpx` }}
                >
                  <Text>{tag.name}</Text>
                  {tag.weight >= 0.85 && <Text className={styles.tagHot}>🔥</Text>}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      {hasMore && showExpand && (
        <View className={styles.expandBtn} onClick={handleToggleExpand}>
          <Text className={styles.expandText}>
            {expanded ? '收起 ▲' : `展开全部 (${tags.length}个标签) ▼`}
          </Text>
        </View>
      )}

      <View className={styles.footerNote}>
        <Text className={styles.footerText}>
          📊 画像标签基于政务办事行为数据自动生成，保护隐私仅本人可见
        </Text>
      </View>
    </View>
  );
});

export default TagCloud;
