import React, { useState, useEffect } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

interface LegalModalProps {
  visible: boolean;
  title?: string;
  onConfirm: (agreed: boolean) => void;
  onCancel?: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({
  visible,
  title = '法律效力声明',
  onConfirm,
  onCancel
}) => {
  const [scrollEnd, setScrollEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (visible) {
      setScrollEnd(false);
      setAgreed(false);
    }
  }, [visible]);

  if (!visible) return null;

  const handleConfirm = () => {
    if (!scrollEnd) {
      Taro.showToast({ title: '请先完整阅读声明内容', icon: 'none' });
      return;
    }
    if (!agreed) {
      Taro.showToast({ title: '请勾选同意声明', icon: 'none' });
      return;
    }
    console.log('[LegalModal] 用户确认同意法律效力声明');
    onConfirm(agreed);
  };

  const handleCancel = () => {
    console.log('[LegalModal] 用户取消签署');
    onCancel?.();
  };

  const handleScrollToLower = () => {
    if (!scrollEnd) {
      setScrollEnd(true);
      console.log('[LegalModal] 用户已阅读至文末');
    }
  };

  return (
    <View className={styles.mask} onClick={handleCancel}>
      <View className={styles.wrapper} onClick={e => e.stopPropagation()}>
        <View className={styles.header}>
          <View className={styles.sealIcon}>⚖</View>
          <Text className={styles.title}>{title}</Text>
        </View>

        <ScrollView
          scrollY
          className={styles.content}
          onScrollToLower={handleScrollToLower}
          enhanced
          showScrollbar
        >
          <View className={styles.section}>
            <Text className={styles.sectionTitle}>一、电子签名法律效力</Text>
            <Text className={styles.paragraph}>
              根据《中华人民共和国电子签名法》第十四条规定：可靠的电子签名与手写签名或者盖章具有同等的法律效力。本系统采用国家商用密码管理局认证的SM2/SM4国密算法，所生成的电子签名符合法律对可靠电子签名的全部要求。
            </Text>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>二、身份核验与CA证书</Text>
            <Text className={styles.paragraph}>
              本系统已接入省级政务服务平台统一身份认证系统，并通过省级CA中心为您预置了符合国密标准的数字证书。您的身份信息已通过实名认证核验，证书受法律保护。
            </Text>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>三、签署行为确认</Text>
            <Text className={styles.paragraph}>
              您确认：本次签署系本人真实意思表示；已完整阅读并理解签署文件全部内容；所提交的信息和材料均真实、准确、完整；同意承担因虚假陈述产生的全部法律责任。
            </Text>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>四、存证与举证</Text>
            <Text className={styles.paragraph}>
              签署全过程将通过权威时间戳服务（TSA）固化证据链，包括：生物特征核验记录、操作日志、IP地址、设备信息、地理位置等。全部数据加密存储于政务云，可随时导出证据包用于司法举证。
            </Text>
          </View>

          <View className={styles.section}>
            <Text className={styles.sectionTitle}>五、隐私保护</Text>
            <Text className={styles.paragraph}>
              本系统严格遵守《个人信息保护法》《数据安全法》等法律法规，您的个人信息和签署数据将仅用于本次登记业务办理，不会被泄露或挪作他用。
            </Text>
          </View>

          {scrollEnd && (
            <View className={styles.endTip}>—— 声明内容结束 ——</View>
          )}
        </ScrollView>

        <View className={styles.footer}>
          <View
            className={classnames(styles.checkbox, agreed && styles.checked)}
            onClick={() => scrollEnd && setAgreed(!agreed)}
          >
            {agreed && <Text className={styles.checkMark}>✓</Text>}
          </View>
          <Text
            className={classnames(styles.agreeText, !scrollEnd && styles.disabled)}
            onClick={() => scrollEnd && setAgreed(!agreed)}
          >
            我已完整阅读并同意上述法律效力声明
          </Text>
        </View>

        <View className={styles.buttons}>
          <Button className={classnames(styles.btn, styles.btnCancel)} onClick={handleCancel}>
            取消签署
          </Button>
          <Button
            className={classnames(styles.btn, styles.btnConfirm, !(scrollEnd && agreed) && styles.disabled)}
            onClick={handleConfirm}
          >
            确认并继续
          </Button>
        </View>
      </View>
    </View>
  );
};

export default LegalModal;
