import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Input, Textarea, Button, ScrollView, Picker } from '@tarojs/components';
import Taro, { useRouter, useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import PageContainer from '@/components/PageContainer';
import { getRegistrationItems, createApply, submitApply } from '@/services/apply';
import type { RegistrationItem, FormField } from '@/types';
import { mockLicenses, mockRegistrationItems } from '@/data/mock';
import styles from './index.module.scss';

const ApplyDetailPage: React.FC = () => {
  const router = useRouter();
  const { itemId, applyId } = router.params;
  const [item, setItem] = useState<RegistrationItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedLicenses, setSelectedLicenses] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadItem = useCallback(async () => {
    if (!itemId) return;
    Taro.showLoading({ title: '加载中...', mask: true });
    try {
      const items = await getRegistrationItems();
      const found = items.find(i => i.id === itemId) || mockRegistrationItems.find(i => i.id === itemId);
      if (found) {
        setItem(found);
        const init: Record<string, any> = {};
        found.formFields.forEach(f => {
          if (f.type === 'checkbox') init[f.key] = [];
        });
        setFormData(init);
      }
    } catch (err: any) {
      console.error('[ApplyDetail] 加载事项失败:', err);
      const found = mockRegistrationItems.find(i => i.id === itemId);
      if (found) {
        setItem(found);
        const init: Record<string, any> = {};
        found.formFields.forEach(f => {
          if (f.type === 'checkbox') init[f.key] = [];
        });
        setFormData(init);
      }
    } finally {
      Taro.hideLoading();
    }
  }, [itemId]);

  useEffect(() => { loadItem(); }, [loadItem]);

  const setFieldValue = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      const next = { ...errors };
      delete next[key];
      setErrors(next);
    }
  };

  const toggleCheckbox = (key: string, value: string) => {
    const current = (formData[key] || []) as string[];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFieldValue(key, next);
  };

  const toggleLicense = (licenseId: string) => {
    setSelectedLicenses(prev => ({ ...prev, [licenseId]: !prev[licenseId] }));
  };

  const validateForm = (): boolean => {
    if (!item) return false;
    const newErrors: Record<string, string> = {};
    item.formFields.forEach(field => {
      const value = formData[field.key];
      if (field.required) {
        const isEmpty = value === undefined || value === null || value === '' ||
          (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          newErrors[field.key] = `请填写${field.label}`;
        }
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      Taro.showToast({ title: '请完善必填项', icon: 'none' });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    console.log('[ApplyDetail] 保存草稿:', formData);
    Taro.showToast({ title: '草稿已保存', icon: 'success' });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!item) return;

    Taro.showModal({
      title: '提交确认',
      content: `您即将提交《${item.name}》申请。\n\n提交后，您将需要通过电子签名确认申请内容，电子签名与手写签名具有同等法律效力。\n\n是否确认提交？`,
      confirmText: '确认提交',
      confirmColor: '#1E5DAB',
      success: async (res) => {
        if (!res.confirm) return;
        Taro.showLoading({ title: '提交中...', mask: true });
        try {
          const record = applyId
            ? await submitApply(applyId)
            : await createApply(item.id, formData);
          console.log('[ApplyDetail] 申请提交成功:', record.id);
          Taro.hideLoading();
          Taro.showModal({
            title: '提交成功',
            content: `申请编号：${record.id}\n\n下一步：请完成电子签名，系统将立即进入审批流程。`,
            confirmText: '前往签署',
            cancelText: '稍后处理',
            success: (r) => {
              if (r.confirm) {
                Taro.redirectTo({ url: `/pages/sign-detail/index?applyId=${record.id}&docType=application` })
                  .catch(() => Taro.switchTab({ url: '/pages/signing/index' }));
              } else {
                Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/apply/index' }));
              }
            }
          });
        } catch (err: any) {
          Taro.hideLoading();
          console.error('[ApplyDetail] 提交失败:', err);
          Taro.showToast({ title: err.message || '提交失败', icon: 'none' });
        }
      }
    });
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key];
    const error = errors[field.key];

    return (
      <View key={field.key} className={styles.fieldRow}>
        <View className={styles.fieldLabel}>
          {field.required && <Text className={styles.requiredMark}>*</Text>}
          <Text className={styles.labelText}>{field.label}</Text>
        </View>

        {field.type === 'input' && (
          <View className={styles.inputBox}>
            <Input
              className={styles.input}
              placeholder={field.placeholder || `请输入${field.label}`}
              value={value || ''}
              onInput={e => setFieldValue(field.key, e.detail.value)}
              maxlength={field.validation?.maxLength || 200}
            />
          </View>
        )}

        {field.type === 'textarea' && (
          <View className={styles.textareaBox}>
            <Textarea
              className={styles.textarea}
              placeholder={field.placeholder || `请输入${field.label}`}
              value={value || ''}
              onInput={e => setFieldValue(field.key, e.detail.value)}
              maxlength={field.validation?.maxLength || 1000}
              autoHeight
            />
          </View>
        )}

        {field.type === 'select' && field.options && (
          <Picker
            mode="selector"
            range={field.options.map(o => o.label)}
            onChange={e => {
              const opt = field.options![parseInt(e.detail.value)];
              setFieldValue(field.key, opt.value);
            }}
          >
            <View className={styles.selectBox}>
              <Text className={classnames(
                styles.selectValue,
                !value && styles.placeholder
              )}>
                {field.options.find(o => o.value === value)?.label || `请选择${field.label}`}
              </Text>
              <Text className={styles.selectArrow}>›</Text>
            </View>
          </Picker>
        )}

        {field.type === 'radio' && field.options && (
          <View className={styles.radioGroup}>
            {field.options.map(opt => (
              <View
                key={opt.value}
                className={classnames(styles.radioItem, value === opt.value && styles.checked)}
                onClick={() => setFieldValue(field.key, opt.value)}
              >
                <View className={styles.radioInner}>
                  {value === opt.value && <View className={styles.radioDot} />}
                </View>
                <Text>{opt.label}</Text>
              </View>
            ))}
          </View>
        )}

        {field.type === 'checkbox' && field.options && (
          <View className={styles.checkboxGroup}>
            {field.options.map(opt => {
              const arr = (value || []) as string[];
              const checked = arr.includes(opt.value);
              return (
                <View
                  key={opt.value}
                  className={classnames(styles.checkboxItem, checked && styles.checked)}
                  onClick={() => toggleCheckbox(field.key, opt.value)}
                >
                  <View className={styles.checkboxInner}>
                    {checked && <Text className={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text className={styles.checkboxLabel}>{opt.label}</Text>
                </View>
              );
            })}
          </View>
        )}

        {field.type === 'license' && (
          <View>
            {mockLicenses.map(lic => (
              <View
                key={lic.id}
                className={classnames(styles.licenseBox, selectedLicenses[lic.id] && {})}
                style={{ marginBottom: '16rpx' }}
                onClick={() => toggleLicense(lic.id)}
              >
                <View className={styles.licenseIcon}>
                  <Text>🪪</Text>
                </View>
                <View className={styles.licenseInfo}>
                  <Text className={styles.licenseName}>{lic.licenseType} · {lic.holderName}</Text>
                  <Text className={styles.licenseMeta}>
                    证照号：{lic.licenseNo} · {lic.status === 'valid' ? '有效' : '无效'}
                  </Text>
                </View>
                <View
                  className={styles.licenseAction}
                  style={{ background: selectedLicenses[lic.id] ? '#00B42A' : '#2E7D32' }}
                >
                  <Text>{selectedLicenses[lic.id] ? '✓ 已调用' : '调用证照'}</Text>
                </View>
              </View>
            ))}
            <View className={styles.uploadBox} onClick={() => setFieldValue(field.key, 'manual_upload')}>
              <Text className={styles.uploadIcon}>📤</Text>
              <Text className={styles.uploadText}>手动上传材料</Text>
              <Text className={styles.uploadHint}>无电子证照时可手动上传</Text>
            </View>
          </View>
        )}

        {field.type === 'upload' && (
          <View className={styles.uploadBox}>
            <Text className={styles.uploadIcon}>📎</Text>
            <Text className={styles.uploadText}>点击上传{field.label}</Text>
            <Text className={styles.uploadHint}>支持 JPG / PNG / PDF 格式，单个不超过10MB</Text>
          </View>
        )}

        {error && (
          <Text style={{ color: '#F53F3F', fontSize: '22rpx', marginTop: '8rpx' }}>{error}</Text>
        )}
      </View>
    );
  };

  if (!item) {
    return (
      <PageContainer safeBottom>
        <View style={{ textAlign: 'center', padding: '200rpx 0' }}>
          <Text style={{ fontSize: '80rpx', opacity: 0.3 }}>📋</Text>
          <Text style={{ color: '#86909C', marginTop: '24rpx' }}>加载中...</Text>
        </View>
      </PageContainer>
    );
  }

  return (
    <>
      <ScrollView scrollY style={{ height: '100vh' }}>
        <PageContainer scroll={false} safeBottom padding>
          <View className={styles.contentPadding}>
            {/* 事项信息 */}
            <View className={styles.banner}>
              <Text className={styles.bannerName}>{item.name}</Text>
              <Text className={styles.bannerCode}>事项编号：{item.code} · {item.category}</Text>
              <View className={styles.bannerInfo}>
                <View className={styles.bannerItem}>
                  <Text className={styles.bannerLabel}>办理时限</Text>
                  <Text className={styles.bannerValue}>{item.estimatedDays}个工作日</Text>
                </View>
                <View className={styles.bannerItem}>
                  <Text className={styles.bannerLabel}>所需材料</Text>
                  <Text className={styles.bannerValue}>{item.requiredMaterials.length}项</Text>
                </View>
                <View className={styles.bannerItem}>
                  <Text className={styles.bannerLabel}>申请方式</Text>
                  <Text className={styles.bannerValue}>不见面审批</Text>
                </View>
              </View>
            </View>

            {/* 第一部分：申请信息填写 */}
            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleNum}>1</View>
                <Text>申请信息填写</Text>
              </View>
              {item.formFields.map(field => renderField(field))}
            </View>

            {/* 第二部分：材料清单 */}
            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleNum}>2</View>
                <Text>材料清单与电子证照</Text>
              </View>
              <Text style={{ fontSize: '24rpx', color: '#86909C', marginBottom: '24rpx', lineHeight: '1.6' }}>
                ℹ️ 已对接省级电子证照库，系统将优先调用您的电子证照，无需手动上传。如调用失败可手动上传材料。
              </Text>
              <View className={styles.materialList}>
                {item.requiredMaterials.map((mat, idx) => {
                  const fromLicense = idx < mockLicenses.length;
                  return (
                    <View key={idx} className={styles.materialItem}>
                      <Text style={{ color: '#00B42A', fontSize: '28rpx', marginRight: '12rpx' }}>
                        {fromLicense ? '🪪' : '📄'}
                      </Text>
                      <Text className={styles.materialName}>
                        {mat}{fromLicense && '（电子证照自动调用）'}
                      </Text>
                      <View className={classnames(styles.materialStatus, fromLicense ? styles.done : styles.todo)}>
                        <Text>{fromLicense ? '已获取' : '待上传'}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* 第三部分：法律声明 */}
            <View className={styles.section}>
              <View className={styles.sectionTitle}>
                <View className={styles.sectionTitleNum}>3</View>
                <Text>声明与承诺</Text>
              </View>
              <Text
                style={{
                  fontSize: '26rpx',
                  color: '#4E5969',
                  lineHeight: '1.8',
                  textAlign: 'justify',
                  padding: '24rpx',
                  background: '#F0F5FF',
                  borderRadius: '12rpx'
                }}
              >
                本人郑重声明：
                一、所提交的全部信息、材料真实、准确、完整，不存在虚假陈述、重大遗漏或误导性陈述；
                二、知悉并同意系统采用电子签名方式确认申请，电子签名与手写签名/盖章具有同等法律效力；
                三、同意相关部门通过省级政务平台核验本人信息，并将申请信息纳入政务数据共享；
                四、如有不实，愿承担相应法律责任。
              </Text>
            </View>
          </View>
        </PageContainer>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className={styles.bottomBar}>
        <Button className={classnames(styles.barBtn, styles.btnDraft)} onClick={handleSaveDraft}>
          保存草稿
        </Button>
        <Button className={classnames(styles.barBtn, styles.btnSubmit)} onClick={handleSubmit}>
          提交并进入签署
        </Button>
      </View>
    </>
  );
};

export default ApplyDetailPage;
