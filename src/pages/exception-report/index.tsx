import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, Textarea, Image } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useUserStore } from '@/store/useUserStore';
import { exceptionService } from '@/services/exception';
import { logOperation } from '@/utils/logger';
import { generateEvidenceHash, validateWaybillNo, validateExceptionDescription } from '@/utils/validator';
import type { ExceptionType, ExceptionPhoto, ExceptionSeverity } from '@/types/exception';
import { EXCEPTION_REASON_OPTIONS, EXCEPTION_SEVERITY_MAP, EXCEPTION_TYPE_MAP } from '@/types/exception';

const TYPE_ICONS: Record<ExceptionType, string> = {
  damaged: '📦',
  rejected: '❌',
  wrong_delivery: '📍',
  lost: '🔍',
  delayed: '⏰',
  address_unknown: '🏠',
  recipient_missing: '👤',
  refused_pay: '💰',
  package_leak: '💧',
  other: '⚠️'
};

const ExceptionReportPage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const [waybillNo, setWaybillNo] = useState('');
  const [selectedType, setSelectedType] = useState<ExceptionType | null>(null);
  const [photos, setPhotos] = useState<ExceptionPhoto[]>([]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locationInfo, setLocationInfo] = useState<{ longitude?: number; latitude?: number; location?: string }>({});
  const [deviceInfo, setDeviceInfo] = useState('');
  const [evidenceHash, setEvidenceHash] = useState('');

  useEffect(() => {
    const waybillFromRouter = router.params.waybillNo;
    if (waybillFromRouter) {
      setWaybillNo(decodeURIComponent(waybillFromRouter));
    }
  }, [router.params.waybillNo]);

  useEffect(() => {
    const device = Taro.getSystemInfoSync();
    setDeviceInfo(`${device.model} ${device.system}`);
  }, []);

  const getLocation = useCallback(async () => {
    try {
      const res = await Taro.getLocation({ type: 'gcj02' });
      const info = {
        longitude: res.longitude,
        latitude: res.latitude,
        location: `${res.longitude.toFixed(6)},${res.latitude.toFixed(6)}`
      };
      setLocationInfo(info);
      return info;
    } catch (e) {
      console.warn('[ExceptionReport] 获取位置失败:', e);
      return {};
    }
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  useEffect(() => {
    if (waybillNo && selectedType && description) {
      const hash = generateEvidenceHash({
        waybillNo,
        exceptionType: selectedType,
        description,
        photoCount: photos.length,
        timestamp: Date.now()
      });
      setEvidenceHash(hash);
    } else {
      setEvidenceHash('');
    }
  }, [waybillNo, selectedType, description, photos.length]);

  useDidShow(() => {
    getLocation();
  });

  const handleTypeSelect = (type: ExceptionType) => {
    setSelectedType(type);
  };

  const handleAddPhoto = async () => {
    if (photos.length >= 9) {
      Taro.showToast({ title: '最多上传9张照片', icon: 'none' });
      return;
    }

    Taro.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: async (res) => {
        let photo: ExceptionPhoto | null = null;
        if (res.tapIndex === 0) {
          photo = await exceptionService.takePhoto();
        } else {
          photo = await exceptionService.chooseImage();
        }

        if (photo) {
          setPhotos([...photos, photo]);
        }
      }
    });
  };

  const handleDeletePhoto = (index: number) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          const newPhotos = photos.filter((_, i) => i !== index);
          setPhotos(newPhotos);
        }
      }
    });
  };

  const handlePreviewPhoto = (index: number) => {
    const urls = photos.map(p => p.url);
    Taro.previewImage({
      current: index,
      urls
    });
  };

  const canSubmit = (): boolean => {
    if (!validateWaybillNo(waybillNo)) return false;
    if (!selectedType) return false;

    const typeOption = EXCEPTION_REASON_OPTIONS.find(o => o.type === selectedType);
    if (typeOption?.needPhotos && photos.length === 0) return false;
    if (typeOption?.needDescription && !validateExceptionDescription(description)) return false;

    return true;
  };

  const handleSubmit = async () => {
    if (!user || !selectedType) return;
    if (!canSubmit()) {
      Taro.showToast({ title: '请完善必要信息', icon: 'none' });
      return;
    }

    setSubmitting(true);
    try {
      const locInfo = locationInfo.longitude ? locationInfo : await getLocation();

      const success = await exceptionService.reportException({
        waybillNo,
        exceptionType: selectedType,
        description,
        photos,
        userId: user.id,
        userName: user.name
      });

      if (success) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'exception',
          action: 'report_submit',
          targetType: 'waybill',
          targetId: waybillNo,
          targetName: `异常上报-${EXCEPTION_TYPE_MAP[selectedType]}`,
          status: 'success',
          complianceLevel: 'critical',
          retentionDays: 365,
          requireLocation: true,
          requestParams: {
            waybillNo,
            exceptionType: selectedType,
            description,
            photoCount: photos.length,
            ...locInfo
          },
          responseResult: { evidenceHash }
        });

        Taro.showModal({
          title: '上报成功',
          content: '异常已成功上报，证据哈希已生成',
          showCancel: false,
          success: () => {
            Taro.navigateBack();
          }
        });
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '上报失败';
      console.error('[ExceptionReport] 提交失败:', e);

      if (user) {
        await logOperation({
          userId: user.id,
          userName: user.name,
          module: 'exception',
          action: 'report_submit',
          targetType: 'waybill',
          targetId: waybillNo,
          status: 'failed',
          errorMessage: errorMsg,
          complianceLevel: 'critical',
          retentionDays: 365
        });
      }

      Taro.showToast({ title: errorMsg, icon: 'none' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    Taro.showModal({
      title: '确认重置',
      content: '确定要清空所有已填内容吗？',
      success: (res) => {
        if (res.confirm) {
          setWaybillNo('');
          setSelectedType(null);
          setPhotos([]);
          setDescription('');
          setEvidenceHash('');
        }
      }
    });
  };

  const selectedTypeOption = selectedType ? EXCEPTION_REASON_OPTIONS.find(o => o.type === selectedType) : null;
  const severityDisplay = selectedTypeOption ? EXCEPTION_SEVERITY_MAP[selectedTypeOption.severity] : '';

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>异常上报</Text>
        <Text className={styles.headerDesc}>请如实填写异常信息，所有操作均留痕可追溯</Text>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>运单信息</Text>
        <View className={styles.waybillInput}>
          <Text className={styles.icon}>📦</Text>
          <Input
            className={styles.input}
            placeholder="请输入运单号"
            value={waybillNo}
            onInput={(e) => setWaybillNo(e.detail.value)}
            maxlength={20}
          />
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>异常类型</Text>
        <View className={styles.typeGrid}>
          {EXCEPTION_REASON_OPTIONS.map((option) => (
            <View
              key={option.type}
              className={classnames(styles.typeItem, selectedType === option.type && styles.active)}
              onClick={() => handleTypeSelect(option.type)}
            >
              <Text className={styles.icon}>{TYPE_ICONS[option.type]}</Text>
              <Text className={styles.label}>{option.label}</Text>
              <Text className={styles.check}>✓</Text>
            </View>
          ))}
        </View>
        {selectedTypeOption && selectedTypeOption.severity !== 'low' && (
          <View className={styles.severityHint}>
            <Text className={styles.icon}>⚠️</Text>
            <Text className={styles.text}>
              该异常等级为{severityDisplay}，需要{selectedTypeOption.needPhotos ? '拍照取证' : ''}
              {selectedTypeOption.needPhotos && selectedTypeOption.needDescription ? '和' : ''}
              {selectedTypeOption.needDescription ? '详细描述' : ''}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.photoSection}>
        <Text className={styles.sectionTitle}>
          拍照取证
          {selectedTypeOption?.needPhotos && <Text style={{ color: '$color-error' }}> *</Text>}
        </Text>
        <View className={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={photo.id} className={styles.photoItem}>
              <Image
                className={styles.image}
                src={photo.url}
                mode="aspectFill"
                onClick={() => handlePreviewPhoto(index)}
              />
              <View className={styles.deleteBtn} onClick={() => handleDeletePhoto(index)}>
                <Text>×</Text>
              </View>
            </View>
          ))}
          {photos.length < 9 && (
            <View
              className={classnames(styles.addPhoto, photos.length >= 9 && styles.disabled)}
              onClick={handleAddPhoto}
            >
              <Text className={styles.icon}>📷</Text>
              <Text className={styles.text}>添加照片</Text>
            </View>
          )}
        </View>
        <Text className={styles.photoCount}>{photos.length}/9</Text>
      </View>

      <View className={styles.descSection}>
        <Text className={styles.sectionTitle}>
          原因描述
          {selectedTypeOption?.needDescription && <Text style={{ color: '$color-error' }}> *</Text>}
        </Text>
        <Textarea
          className={styles.descTextarea}
          placeholder="请详细描述异常情况，包括时间、地点、具体情况等..."
          value={description}
          onInput={(e) => setDescription(e.detail.value)}
          maxlength={500}
        />
        <Text className={styles.descCount}>{description.length}/500</Text>
      </View>

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>自动采集信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.label}>上报位置</Text>
          <Text className={styles.value}>
            {locationInfo.location || '获取中...'}
          </Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.label}>设备信息</Text>
          <Text className={styles.value}>{deviceInfo}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.label}>上报人</Text>
          <Text className={styles.value}>{user?.name || '-'}</Text>
        </View>
        {evidenceHash && (
          <View className={styles.infoRow}>
            <Text className={styles.label}>证据哈希</Text>
            <Text className={styles.hash}>{evidenceHash}</Text>
          </View>
        )}
      </View>

      <View className={styles.bottomActionBar}>
        <View className={classnames(styles.actionBtn, styles.secondary)} onClick={handleReset}>
          <Text>🔄 重置</Text>
        </View>
        <View
          className={classnames(styles.actionBtn, styles.primary, !canSubmit() && styles.disabled, submitting && styles.disabled)}
          onClick={handleSubmit}
        >
          <Text>{submitting ? '提交中...' : '✅ 提交上报'}</Text>
        </View>
      </View>
    </View>
  );
};

export default ExceptionReportPage;
