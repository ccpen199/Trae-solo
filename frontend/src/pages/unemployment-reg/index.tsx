import React, { useState, useCallback } from 'react';
import { View, Text, Input, Textarea, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { applyMatter, uploadMatterMaterial } from '@/services/matter';
import { getCurrentUser } from '@/services/auth';
import { validateName, validateIdCard, validatePhone } from '@/utils/validator';
import { maskIdCard, maskPhone, formatDateTime, formatFileSize } from '@/utils/format';
import type { UserInfo } from '@/types/user';
import styles from './index.module.scss';

interface FormData {
  name: string;
  idCard: string;
  phone: string;
  gender: string;
  birthDate: string;
  address: string;
  unemploymentReason: string;
  unemploymentDate: string;
  lastCompany: string;
  lastPosition: string;
  lastSalary: string;
  jobIntention: string;
  expectedSalary: string;
  expectedPosition: string;
  expectedCity: string;
  education: string;
  workYears: string;
  skills: string;
}

interface FormErrors {
  name?: string;
  idCard?: string;
  phone?: string;
  unemploymentReason?: string;
  jobIntention?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  status: 'uploading' | 'success' | 'error';
  type: 'required' | 'optional';
}

const UnemploymentRegPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applyResult, setApplyResult] = useState<{ matterId: string; matterCode: string; applyTime: string } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    idCard: '',
    phone: '',
    gender: '',
    birthDate: '',
    address: '',
    unemploymentReason: '',
    unemploymentDate: '',
    lastCompany: '',
    lastPosition: '',
    lastSalary: '',
    jobIntention: '',
    expectedSalary: '',
    expectedPosition: '',
    expectedCity: '',
    education: '',
    workYears: '',
    skills: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const unemploymentReasons = [
    { label: '企业破产', value: 'bankruptcy' },
    { label: '企业裁员', value: 'layoff' },
    { label: '劳动合同期满', value: 'contract_expired' },
    { label: '本人辞职', value: 'resign' },
    { label: '其他原因', value: 'other' }
  ];

  const jobIntentions = [
    { label: '全职', value: 'fulltime' },
    { label: '兼职', value: 'parttime' },
    { label: '灵活就业', value: 'flexible' },
    { label: '自主创业', value: 'self_employed' },
    { label: '暂不就业', value: 'not_looking' }
  ];

  const educationLevels = [
    { label: '初中及以下', value: 'junior' },
    { label: '高中/中专', value: 'senior' },
    { label: '大专', value: 'college' },
    { label: '本科', value: 'bachelor' },
    { label: '硕士', value: 'master' },
    { label: '博士', value: 'doctor' }
  ];

  const workYearsOptions = [
    { label: '应届生', value: '0' },
    { label: '1-3年', value: '1-3' },
    { label: '3-5年', value: '3-5' },
    { label: '5-10年', value: '5-10' },
    { label: '10年以上', value: '10+' }
  ];

  const requiredMaterials = [
    { name: '身份证正反面照片', type: 'required' },
    { name: '解除劳动合同证明', type: 'required' },
    { name: '近期免冠照片', type: 'optional' },
    { name: '学历证书', type: 'optional' },
    { name: '职业资格证书', type: 'optional' }
  ];

  const loadUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          idCard: user.idCard || '',
          phone: user.phone || '',
          gender: user.gender === 'male' ? '男' : '女',
          address: user.address || ''
        }));
        setUserInfo(user);
      }
    } catch (error) {
      console.error('[UnemploymentRegPage] 加载用户信息失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    loadUserInfo();
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.valid) {
      errors.name = nameResult.message;
    }

    const idCardResult = validateIdCard(formData.idCard);
    if (!idCardResult.valid) {
      errors.idCard = idCardResult.message;
    }

    const phoneResult = validatePhone(formData.phone);
    if (!phoneResult.valid) {
      errors.phone = phoneResult.message;
    }

    if (!formData.unemploymentReason) {
      errors.unemploymentReason = '请选择失业原因';
    }

    if (!formData.jobIntention) {
      errors.jobIntention = '请选择求职意向';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChooseFile = async (materialName: string, type: 'required' | 'optional') => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      const tempFile = res.tempFiles[0];
      const fileId = `file_${Date.now()}`;

      const newFile: UploadedFile = {
        id: fileId,
        name: materialName,
        size: tempFile.size,
        url: tempFile.path,
        status: 'uploading',
        type
      };

      setUploadedFiles(prev => [...prev, newFile]);

      const uploadResult = await uploadMatterMaterial('draft', tempFile.path);
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: uploadResult.success ? 'success' : 'error', url: uploadResult.fileId || f.url }
            : f
        )
      );

      if (uploadResult.success) {
        Taro.showToast({ title: '上传成功', icon: 'success' });
      } else {
        Taro.showToast({ title: '上传失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[UnemploymentRegPage] 选择文件失败', error);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Taro.showToast({ title: '请完善必填信息', icon: 'none' });
      return;
    }

    const requiredUploaded = requiredMaterials
      .filter(m => m.type === 'required')
      .every(m => uploadedFiles.some(f => f.name === m.name && f.status === 'success'));

    if (!requiredUploaded) {
      Taro.showToast({ title: '请上传所有必填材料', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const result = await applyMatter({
        matterCode: 'UNEMPLOYMENT_REG',
        matterName: '失业登记',
        matterType: 'unemployment_registration',
        formData: formData as any,
        materials: uploadedFiles.filter(f => f.status === 'success').map(f => ({
          name: f.name,
          type: f.type,
          format: 'image',
          fileUrl: f.url
        })),
        isUrgent: false,
        isCrossProvince: false
      });

      if (result.success) {
        setApplyResult({
          matterId: result.matterId || '',
          matterCode: result.matterCode || '',
          applyTime: new Date().toISOString()
        });
        setShowSuccess(true);
      } else {
        Taro.showToast({ title: result.message || '提交失败', icon: 'none' });
      }
    } catch (error) {
      console.error('[UnemploymentRegPage] 提交申请失败', error);
      Taro.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    Taro.switchTab({ url: '/pages/home/index' });
  };

  const handleViewMatter = () => {
    Taro.navigateTo({ url: `/pages/matter-detail?id=${applyResult?.matterId}` });
  };

  const getOptionLabel = (options: { label: string; value: string }[], value: string) => {
    return options.find(o => o.value === value)?.label || '';
  };

  const handleUnemploymentReasonChange = (e: any) => {
    const index = e.detail.value;
    handleInputChange('unemploymentReason', unemploymentReasons[index].value);
  };

  const handleEducationChange = (e: any) => {
    const index = e.detail.value;
    handleInputChange('education', educationLevels[index].value);
  };

  const handleWorkYearsChange = (e: any) => {
    const index = e.detail.value;
    handleInputChange('workYears', workYearsOptions[index].value);
  };

  return (
    <View className={styles.page}>
      <PageHeader
        title="失业登记"
        subtitle="在线登记 精准帮扶 促进就业"
      />

      <View className={styles.content}>
        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>👤</Text>
            <Text>个人基本信息</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              姓名
            </Text>
            <Input
              className={styles.input}
              placeholder="请输入真实姓名"
              value={formData.name}
              onInput={e => handleInputChange('name', e.detail.value)}
            />
            {formErrors.name && <Text className={styles.error}>{formErrors.name}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              身份证号
            </Text>
            <Input
              className={styles.input}
              placeholder="请输入18位身份证号"
              value={formData.idCard}
              onInput={e => handleInputChange('idCard', e.detail.value)}
              maxLength={18}
            />
            {formData.idCard && (
              <Text style={{ fontSize: '22rpx', color: '#909399', marginTop: '8rpx' }}>
                {maskIdCard(formData.idCard)}
              </Text>
            )}
            {formErrors.idCard && <Text className={styles.error}>{formErrors.idCard}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              手机号
            </Text>
            <Input
              className={styles.input}
              placeholder="请输入11位手机号"
              value={formData.phone}
              onInput={e => handleInputChange('phone', e.detail.value)}
              type="number"
              maxLength={11}
            />
            {formData.phone && (
              <Text style={{ fontSize: '22rpx', color: '#909399', marginTop: '8rpx' }}>
                {maskPhone(formData.phone)}
              </Text>
            )}
            {formErrors.phone && <Text className={styles.error}>{formErrors.phone}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>家庭住址</Text>
            <Input
              className={styles.input}
              placeholder="请输入详细家庭住址"
              value={formData.address}
              onInput={e => handleInputChange('address', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>💼</Text>
            <Text>失业信息</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              失业原因
            </Text>
            <View className={styles.radioGroup}>
              {unemploymentReasons.map(reason => (
                <View
                  key={reason.value}
                  className={`${styles.radioItem} ${formData.unemploymentReason === reason.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('unemploymentReason', reason.value)}
                >
                  {reason.label}
                </View>
              ))}
            </View>
            {formErrors.unemploymentReason && <Text className={styles.error}>{formErrors.unemploymentReason}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>失业时间</Text>
            <Input
              className={styles.input}
              placeholder="请选择失业时间"
              value={formData.unemploymentDate}
              onInput={e => handleInputChange('unemploymentDate', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>原工作单位</Text>
            <Input
              className={styles.input}
              placeholder="请输入原工作单位名称"
              value={formData.lastCompany}
              onInput={e => handleInputChange('lastCompany', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>原工作岗位</Text>
            <Input
              className={styles.input}
              placeholder="请输入原工作岗位"
              value={formData.lastPosition}
              onInput={e => handleInputChange('lastPosition', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>原月薪水平</Text>
            <Input
              className={styles.input}
              placeholder="请输入原月薪（元）"
              value={formData.lastSalary}
              onInput={e => handleInputChange('lastSalary', e.detail.value)}
              type="digit"
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>🎯</Text>
            <Text>求职意向</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              求职意向
            </Text>
            <View className={styles.radioGroup}>
              {jobIntentions.map(intention => (
                <View
                  key={intention.value}
                  className={`${styles.radioItem} ${formData.jobIntention === intention.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('jobIntention', intention.value)}
                >
                  {intention.label}
                </View>
              ))}
            </View>
            {formErrors.jobIntention && <Text className={styles.error}>{formErrors.jobIntention}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>期望岗位</Text>
            <Input
              className={styles.input}
              placeholder="请输入期望工作岗位"
              value={formData.expectedPosition}
              onInput={e => handleInputChange('expectedPosition', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>期望薪资</Text>
            <Input
              className={styles.input}
              placeholder="请输入期望月薪（元）"
              value={formData.expectedSalary}
              onInput={e => handleInputChange('expectedSalary', e.detail.value)}
              type="digit"
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>期望工作城市</Text>
            <Input
              className={styles.input}
              placeholder="请输入期望工作城市"
              value={formData.expectedCity}
              onInput={e => handleInputChange('expectedCity', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>文化程度</Text>
            <Picker
              mode="selector"
              range={educationLevels.map(e => e.label)}
              value={educationLevels.findIndex(e => e.value === formData.education)}
              onChange={handleEducationChange}
            >
              <View className={styles.picker}>
                <Text className={formData.education ? '' : styles.placeholder}>
                  {formData.education ? getOptionLabel(educationLevels, formData.education) : '请选择文化程度'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>工作年限</Text>
            <Picker
              mode="selector"
              range={workYearsOptions.map(w => w.label)}
              value={workYearsOptions.findIndex(w => w.value === formData.workYears)}
              onChange={handleWorkYearsChange}
            >
              <View className={styles.picker}>
                <Text className={formData.workYears ? '' : styles.placeholder}>
                  {formData.workYears ? getOptionLabel(workYearsOptions, formData.workYears) : '请选择工作年限'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>专业技能</Text>
            <Textarea
              className={styles.textarea}
              placeholder="请描述您的专业技能、特长等"
              value={formData.skills}
              onInput={e => handleInputChange('skills', e.detail.value)}
              maxlength={500}
            />
          </View>
        </View>

        <View className={styles.materialSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.title}>
              <Text className={styles.icon}>📎</Text>
              <Text>材料上传</Text>
            </View>
            <Text className={styles.required}>
              {uploadedFiles.filter(f => f.type === 'required' && f.status === 'success').length} / {requiredMaterials.filter(m => m.type === 'required').length} 必填
            </Text>
          </View>

          <View className={styles.materialList}>
            {uploadedFiles.map(file => (
              <View key={file.id} className={styles.materialItem}>
                <View className={styles.fileIcon}>
                  {file.name.includes('身份证') ? '🪪' : file.name.includes('合同') ? '📄' : file.name.includes('照片') ? '🖼️' : '📑'}
                </View>
                <View className={styles.fileInfo}>
                  <Text className={styles.fileName}>{file.name}</Text>
                  <Text className={styles.fileSize}>{formatFileSize(file.size)}</Text>
                </View>
                <View className={`${styles.fileStatus} ${styles[file.status]}`}>
                  {file.status === 'success' ? '已上传' : file.status === 'uploading' ? '上传中' : '上传失败'}
                </View>
                <View className={styles.removeBtn} onClick={() => handleRemoveFile(file.id)}>✕</View>
              </View>
            ))}

            {requiredMaterials.map(material => {
              const uploaded = uploadedFiles.some(f => f.name === material.name);
              if (uploaded) return null;
              return (
                <View
                  key={material.name}
                  className={styles.uploadBtn}
                  onClick={() => handleChooseFile(material.name, material.type)}
                >
                  <Text className={styles.icon}>+</Text>
                  <Text>上传{material.name} {material.type === 'required' ? '(必填)' : '(选填)'}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className={styles.tipsSection}>
          <View className={styles.tipsTitle}>
            <Text className={styles.icon}>💡</Text>
            <Text>温馨提示</Text>
          </View>
          <View className={styles.tipsContent}>
            <Text className={styles.tipItem}>失业登记审核通过后，可申领失业保险金等相关待遇</Text>
            <Text className={styles.tipItem}>请确保填写信息真实有效，虚假信息将承担法律责任</Text>
            <Text className={styles.tipItem}>工作人员将在3个工作日内完成审核，请保持电话畅通</Text>
            <Text className={styles.tipItem}>失业人员可免费参加职业技能培训，提升就业能力</Text>
            <Text className={styles.tipItem}>长三角地区已实现失业登记跨省通办</Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View
          className={`${styles.submitBtn} ${loading ? 'disabled' : ''}`}
          onClick={!loading ? handleSubmit : undefined}
        >
          {loading ? '提交中...' : '提交登记申请'}
        </View>
        <Text className={styles.btnTip}>点击提交即表示您同意《失业登记服务协议》</Text>
      </View>

      {showSuccess && applyResult && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.successIcon}>🎉</View>
            <Text className={styles.successTitle}>登记提交成功</Text>
            <Text className={styles.successDesc}>
              您的失业登记申请已提交，工作人员将在3个工作日内完成审核。
            </Text>
            <View className={styles.matterInfo}>
              <View className={styles.infoItem}>
                <Text className={styles.label}>业务编号</Text>
                <Text className={styles.value}>{applyResult.matterCode}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>申请时间</Text>
                <Text className={styles.value}>{formatDateTime(applyResult.applyTime)}</Text>
              </View>
              <View className={styles.infoItem}>
                <Text className={styles.label}>预计审核完成</Text>
                <Text className={styles.value}>3个工作日内</Text>
              </View>
            </View>
            <View className={styles.modalBtns}>
              <View className={`${styles.btn} outline`} onClick={handleGoHome}>
                返回首页
              </View>
              <View className={`${styles.btn} primary`} onClick={handleViewMatter}>
                查看进度
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default UnemploymentRegPage;
