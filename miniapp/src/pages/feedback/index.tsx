import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '../../store/appStore';
import classnames from 'classnames';

const RATING_LABELS: Record<number, string> = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意',
};

const TAG_MAP: Record<number, string[]> = {
  1: ['系统响应慢', '材料清单不清晰', '流程复杂', '窗口态度差', '功能故障', '验证码问题'],
  2: ['系统响应慢', '材料清单不清晰', '流程复杂', '窗口态度差', '功能故障', '验证码问题'],
  3: ['等待时间长', '材料较多', '流程可简化'],
  4: ['办理快捷', '服务热情', '流程清晰', '体验流畅'],
  5: ['办理快捷', '服务热情', '流程清晰', '体验流畅'],
};

const MAX_IMAGES = 3;
const MAX_TEXT_LENGTH = 500;

const FeedbackPage: React.FC = () => {
  const router = useRouter();
  const speak = useAppStore(s => s.speak);

  const serviceName = decodeURIComponent(router.params.service || '');
  const appId = router.params.appId || '';

  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const currentTags = useMemo(() => TAG_MAP[rating] || [], [rating]);

  const handleStarClick = useCallback((star: number) => {
    setRating(star);
    setSelectedTags([]);
    speak(`${star}星，${RATING_LABELS[star]}`);
  }, [speak]);

  const handleTagClick = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
    speak(tag);
  }, [speak]);

  const handleContentChange = useCallback((e) => {
    const val = e.detail.value;
    if (val.length <= MAX_TEXT_LENGTH) {
      setContent(val);
    }
  }, []);

  const handleChooseImage = useCallback(() => {
    const remain = MAX_IMAGES - images.length;
    if (remain <= 0) {
      Taro.showToast({ title: `最多上传${MAX_IMAGES}张图片`, icon: 'none' });
      return;
    }
    Taro.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setImages(prev => [...prev, ...res.tempFilePaths].slice(0, MAX_IMAGES));
        speak('已添加图片');
      },
    });
  }, [images, speak]);

  const handleRemoveImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Taro.showToast({ title: '请选择评分', icon: 'none' });
      return;
    }

    const isNegative = rating <= 2;

    if (isNegative) {
      Taro.showModal({
        title: '提示',
        content: '您的反馈已自动转交督办部门，我们将尽快跟进处理。',
        showCancel: false,
        confirmText: '我知道了',
        success: () => {
          setSubmitted(true);
          speak('您的反馈已自动转交督办部门，感谢您的评价');
        },
      });
    } else {
      setSubmitted(true);
      speak('感谢您的评价');
    }
  }, [rating, speak]);

  if (submitted) {
    return (
      <View className={styles.container}>
        <View className={styles.successCard}>
          <Text className={styles.successIcon}>✅</Text>
          <Text className={styles.successTitle}>感谢您的评价</Text>
          {rating <= 2 && (
            <Text className={styles.successSub}>您的反馈已自动转交督办部门</Text>
          )}
          <Text className={styles.successDesc}>
            您的评价将帮助我们持续优化服务体验
          </Text>
          <View
            className={styles.backBtn}
            onClick={() => {
              speak('返回我的页面');
              Taro.navigateBack();
            }}
          >
            <Text className={styles.backBtnText}>返回</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.container}>
      {serviceName && (
        <View className={styles.serviceInfo}>
          <Text className={styles.serviceName}>{serviceName}</Text>
          {appId && <Text className={styles.appId}>办件编号：{appId}</Text>}
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>服务评分</Text>
        <View className={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <View
              key={star}
              className={classnames(styles.starBtn, star <= rating && styles.starActive)}
              onClick={() => handleStarClick(star)}
            >
              <Text className={styles.starIcon}>{star <= rating ? '★' : '☆'}</Text>
            </View>
          ))}
        </View>
        {rating > 0 && (
          <Text className={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
        )}
      </View>

      {rating > 0 && currentTags.length > 0 && (
        <View className={styles.card}>
          <Text className={styles.cardTitle}>选择评价标签</Text>
          <View className={styles.tagsRow}>
            {currentTags.map(tag => (
              <View
                key={tag}
                className={classnames(
                  styles.tag,
                  selectedTags.includes(tag) && styles.tagActive
                )}
                onClick={() => handleTagClick(tag)}
              >
                <Text className={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.card}>
        <Text className={styles.cardTitle}>文字评价</Text>
        <Textarea
          className={styles.textarea}
          placeholder="请输入您的评价内容（选填）"
          placeholderClass={styles.textareaPlaceholder}
          maxlength={MAX_TEXT_LENGTH}
          value={content}
          onInput={handleContentChange}
        />
        <Text className={styles.charCount}>{content.length}/{MAX_TEXT_LENGTH}</Text>
      </View>

      <View className={styles.card}>
        <Text className={styles.cardTitle}>上传图片（选填，最多{MAX_IMAGES}张）</Text>
        <View className={styles.imageRow}>
          {images.map((img, index) => (
            <View key={img} className={styles.imageItem}>
              <Image className={styles.imageThumb} src={img} mode="aspectFill" />
              <View
                className={styles.imageRemove}
                onClick={() => handleRemoveImage(index)}
              >
                <Text className={styles.imageRemoveText}>✕</Text>
              </View>
            </View>
          ))}
          {images.length < MAX_IMAGES && (
            <View className={styles.imageAdd} onClick={handleChooseImage}>
              <Text className={styles.imageAddIcon}>+</Text>
              <Text className={styles.imageAddText}>添加图片</Text>
            </View>
          )}
        </View>
      </View>

      <View
        className={classnames(styles.submitBtn, rating === 0 && styles.submitBtnDisabled)}
        onClick={handleSubmit}
      >
        <Text className={styles.submitBtnText}>提交评价</Text>
      </View>
    </View>
  );
};

export default FeedbackPage;
