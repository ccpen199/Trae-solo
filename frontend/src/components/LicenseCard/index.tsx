import React from 'react';
import { View, Text } from '@tarojs/components';
import type { License } from '@/types/license';
import { formatDate, maskIdCard } from '@/utils/format';
import styles from './index.module.scss';

interface LicenseCardProps {
  license: License;
  size?: 'small' | 'medium' | 'large';
  onClick?: (license: License) => void;
  showActions?: boolean;
}

const LicenseCard: React.FC<LicenseCardProps> = ({ 
  license, 
  size = 'medium',
  onClick,
  showActions = false
}) => {
  const handleClick = () => {
    onClick?.(license);
  };

  const getStatusText = (status: string) => {
    const map: Record<string, string> = {
      active: '有效',
      expiring: '即将到期',
      expired: '已过期',
      revoked: '已吊销',
      pending: '待签发'
    };
    return map[status] || status;
  };

  const getStatusClass = (status: string) => {
    const map: Record<string, string> = {
      active: 'active',
      expiring: 'warning',
      expired: 'error',
      revoked: 'error',
      pending: 'gray'
    };
    return styles[map[status] || 'gray'];
  };

  const getGradient = (type: string) => {
    const gradients: Record<string, string> = {
      social_security: 'linear-gradient(135deg, #1890FF 0%, #40A9FF 100%)',
      professional_qualification: 'linear-gradient(135deg, #722ED1 0%, #9254DE 100%)',
      title_certificate: 'linear-gradient(135deg, #FA8C16 0%, #FFA940 100%)',
      pension: 'linear-gradient(135deg, #52C41A 0%, #73D13D 100%)',
      unemployment: 'linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%)',
      employment: 'linear-gradient(135deg, #EB2F96 0%, #F759AB 100%)'
    };
    return gradients[type] || gradients.social_security;
  };

  const sizeClass = size === 'small' ? styles.small : size === 'large' ? styles.large : styles.medium;

  return (
    <View className={`${styles.card} ${sizeClass}`} onClick={handleClick}>
      <View className={styles.cardInner} style={{ background: getGradient(license.type) }}>
        <View className={styles.header}>
          <View className={styles.typeRow}>
            <Text className={styles.typeName}>{license.licenseName}</Text>
            <View className={`${styles.status} ${getStatusClass(license.status)}`}>
              {getStatusText(license.status)}
            </View>
          </View>
          {license.isElectronic && (
            <View className={styles.electronicBadge}>
              <Text className={styles.badgeText}>电子证照</Text>
            </View>
          )}
        </View>

        <View className={styles.body}>
          <View className={styles.mainInfo}>
            <Text className={styles.holderName}>{license.holderName}</Text>
            <Text className={styles.licenseNumber}>{maskIdCard(license.licenseNumber)}</Text>
          </View>
          
          {size !== 'small' && (
            <View className={styles.subInfo}>
              {license.issueDate && (
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>签发日期</Text>
                  <Text className={styles.infoValue}>{formatDate(license.issueDate)}</Text>
                </View>
              )}
              {license.validDate && (
                <View className={styles.infoItem}>
                  <Text className={styles.infoLabel}>有效期至</Text>
                  <Text className={styles.infoValue}>{formatDate(license.validDate)}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View className={styles.footer}>
          <Text className={styles.issuer}>{license.issuer}</Text>
          {license.isCrossProvince && (
            <View className={styles.crossTag}>
              <Text className={styles.crossText}>长三角互认</Text>
            </View>
          )}
        </View>

        {showActions && (
          <View className={styles.actions}>
            <View className={styles.actionBtn}>查看详情</View>
            {license.status === 'active' && license.canVerify && (
              <View className={styles.actionBtnPrimary}>扫码验真</View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default LicenseCard;
