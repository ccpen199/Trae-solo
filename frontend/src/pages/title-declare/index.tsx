import React, { useState, useCallback } from 'react';
import { View, Text, Input, Picker } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { PageHeader } from '@/components';
import { applyMatter, uploadMatterMaterial } from '@/services/matter';
import { getCurrentUser } from '@/services/auth';
import { validateName, validateIdCard, validatePhone } from '@/utils/validator';
import { maskIdCard, maskPhone, formatDateTime, formatFileSize, formatMoney } from '@/utils/format';
import type { UserInfo } from '@/types/user';
import styles from './index.module.scss';

interface FormData {
  name: string;
  idCard: string;
  phone: string;
  titleLevel: string;
  titleSeries: string;
  major: string;
  workUnit: string;
  workYears: string;
  education: string;
  degree: string;
  graduationSchool: string;
  graduationDate: string;
  currentTitle: string;
  currentTitleDate: string;
  achievements: string;
}

interface FormErrors {
  name?: string;
  idCard?: string;
  phone?: string;
  titleLevel?: string;
  major?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  desc: string;
  size: number;
  url: string;
  status: 'uploading' | 'success' | 'error';
  type: 'required' | 'optional';
}

const TitleDeclarePage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applyResult, setApplyResult] = useState<{ matterId: string; matterCode: string; applyTime: string } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [crossProvince, setCrossProvince] = useState(false);
  const [targetProvince, setTargetProvince] = useState('');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    idCard: '',
    phone: '',
    titleLevel: '',
    titleSeries: '',
    major: '',
    workUnit: '',
    workYears: '',
    education: '',
    degree: '',
    graduationSchool: '',
    graduationDate: '',
    currentTitle: '',
    currentTitleDate: '',
    achievements: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const titleLevels = [
    { label: '初级职称', value: 'junior', desc: '助理工程师/助教等' },
    { label: '中级职称', value: 'intermediate', desc: '工程师/讲师等' },
    { label: '副高级职称', value: 'senior_vice', desc: '高级工程师/副教授等' },
    { label: '正高级职称', value: 'senior_full', desc: '正高级工程师/教授等' }
  ];

  const titleSeries = [
    { label: '工程技术', value: 'engineering' },
    { label: '教育教学', value: 'education' },
    { label: '医疗卫生', value: 'medical' },
    { label: '农业技术', value: 'agriculture' },
    { label: '经济系列', value: 'economy' },
    { label: '会计系列', value: 'accounting' },
    { label: '艺术系列', value: 'art' },
    { label: '新闻出版', value: 'journalism' }
  ];

  const majors = [
    { label: '计算机科学与技术', value: 'computer' },
    { label: '电子信息工程', value: 'electronics' },
    { label: '机械工程', value: 'mechanical' },
    { label: '土木工程', value: 'civil' },
    { label: '电气工程', value: 'electrical' },
    { label: '化学工程', value: 'chemical' },
    { label: '生物医学工程', value: 'biomedical' },
    { label: '环境工程', value: 'environmental' }
  ];

  const educationLevels = [
    { label: '中专', value: 'secondary' },
    { label: '大专', value: 'college' },
    { label: '本科', value: 'bachelor' },
    { label: '硕士', value: 'master' },
    { label: '博士', value: 'doctor' }
  ];

  const degrees = [
    { label: '无', value: 'none' },
    { label: '学士', value: 'bachelor' },
    { label: '硕士', value: 'master' },
    { label: '博士', value: 'doctor' }
  ];

  const currentTitles = [
    { label: '无', value: 'none' },
    { label: '初级', value: 'junior' },
    { label: '中级', value: 'intermediate' },
    { label: '副高级', value: 'senior_vice' },
    { label: '正高级', value: 'senior_full' }
  ];

  const requiredMaterials = [
    { name: '身份证正反面', desc: '需清晰可见', type: 'required' },
    { name: '学历证书', desc: '最高学历', type: 'required' },
    { name: '学位证书', desc: '如有', type: 'optional' },
    { name: '现任职称证书', desc: '如有', type: 'optional' },
    { name: '工作业绩证明', desc: '相关工作经历', type: 'required' },
    { name: '获奖证书', desc: '如有', type: 'optional' },
    { name: '论文论著', desc: '如有', type: 'optional' },
    { name: '继续教育证明', desc: '近五年', type: 'required' }
  ];

  const provinces = [
    { label: '江苏省', value: 'JS' },
    { label: '上海市', value: 'SH' },
    { label: '浙江省', value: 'ZJ' },
    { label: '安徽省', value: 'AH' }
  ];

  const declareFee = 200;

  const loadUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: user.name || '',
          idCard: user.idCard || '',
          phone: user.phone || ''
        }));
        setUserInfo(user);
      }
    } catch (error) {
      console.error('[TitleDeclarePage] 加载用户信息失败', error);
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

    if (!formData.titleLevel) {
      errors.titleLevel = '请选择申报职称级别';
    }

    if (!formData.major) {
      errors.major = '请选择申报专业';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUploadFile = async (material: { name: string; desc: string; type: 'required' | 'optional' }) => {
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
        name: material.name,
        desc: material.desc,
        size: tempFile.size,
        url: tempFile.path,
        status: 'uploading',
        type: material.type
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
      console.error('[TitleDeclarePage] 选择文件失败', error);
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

    if (crossProvince && !targetProvince) {
      Taro.showToast({ title: '请选择目标省份', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const result = await applyMatter({
        matterCode: 'TITLE_DECLARE',
        matterName: `${titleLevels.find(t => t.value === formData.titleLevel)?.label}申报`,
        matterType: 'title_declaration',
        formData: {
          ...formData,
          crossProvince,
          targetProvince
        } as any,
        materials: uploadedFiles.filter(f => f.status === 'success').map(f => ({
          name: f.name,
          type: f.type,
          format: 'image',
          fileUrl: f.url
        })),
        isUrgent: false,
        isCrossProvince: crossProvince,
        crossProvinceInfo: crossProvince ? {
          targetProvince,
          targetCity: ''
        } : undefined
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
      console.error('[TitleDeclarePage] 提交申请失败', error);
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

  return (
    <View className={styles.page}>
      <PageHeader
        title="职称申报"
        subtitle="在线申报 公开透明 长三角互认"
      />

      <View className={styles.content}>
        <View className={styles.guideCard}>
          <Text className={styles.title}>📋 职称申报指南</Text>
          <Text className={styles.desc}>
            职称是专业技术人员专业技术水平和能力的标志。请按照要求如实填写申报信息并上传相关材料。
          </Text>
          <View className={styles.guideSteps}>
            <View className={styles.step}>
              <View className={styles.stepNum}>1</View>
              <Text className={styles.stepText}>填写信息</Text>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>2</View>
              <Text className={styles.stepText}>上传材料</Text>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>3</View>
              <Text className={styles.stepText}>提交审核</Text>
            </View>
            <View className={styles.step}>
              <View className={styles.stepNum}>4</View>
              <Text className={styles.stepText}>评审发证</Text>
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>👤</Text>
            <Text>基本信息</Text>
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
            <Text className={styles.label}>工作单位</Text>
            <Input
              className={styles.input}
              placeholder="请输入工作单位名称"
              value={formData.workUnit}
              onInput={e => handleInputChange('workUnit', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>从事专业工作年限</Text>
            <Input
              className={styles.input}
              placeholder="请输入工作年限（年）"
              value={formData.workYears}
              onInput={e => handleInputChange('workYears', e.detail.value)}
              type="number"
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>🎓</Text>
            <Text>学历信息</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              文化程度
            </Text>
            <Picker
              mode="selector"
              range={educationLevels.map(e => e.label)}
              value={educationLevels.findIndex(e => e.value === formData.education)}
              onChange={e => handleInputChange('education', educationLevels[e.detail.value].value)}
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
            <Text className={styles.label}>学位</Text>
            <Picker
              mode="selector"
              range={degrees.map(d => d.label)}
              value={degrees.findIndex(d => d.value === formData.degree)}
              onChange={e => handleInputChange('degree', degrees[e.detail.value].value)}
            >
              <View className={styles.picker}>
                <Text className={formData.degree ? '' : styles.placeholder}>
                  {formData.degree ? getOptionLabel(degrees, formData.degree) : '请选择学位'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>毕业院校</Text>
            <Input
              className={styles.input}
              placeholder="请输入毕业院校名称"
              value={formData.graduationSchool}
              onInput={e => handleInputChange('graduationSchool', e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>📜</Text>
            <Text>申报信息</Text>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              申报职称级别
            </Text>
            <View className={styles.levelGrid}>
              {titleLevels.map(level => (
                <View
                  key={level.value}
                  className={`${styles.levelCard} ${formData.titleLevel === level.value ? 'active' : ''}`}
                  onClick={() => handleInputChange('titleLevel', level.value)}
                >
                  <Text className={styles.levelName}>{level.label}</Text>
                  <Text className={styles.levelDesc}>{level.desc}</Text>
                </View>
              ))}
            </View>
            {formErrors.titleLevel && <Text className={styles.error}>{formErrors.titleLevel}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>职称系列</Text>
            <Picker
              mode="selector"
              range={titleSeries.map(s => s.label)}
              value={titleSeries.findIndex(s => s.value === formData.titleSeries)}
              onChange={e => handleInputChange('titleSeries', titleSeries[e.detail.value].value)}
            >
              <View className={styles.picker}>
                <Text className={formData.titleSeries ? '' : styles.placeholder}>
                  {formData.titleSeries ? getOptionLabel(titleSeries, formData.titleSeries) : '请选择职称系列'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>
              <Text className={styles.required}>*</Text>
              申报专业
            </Text>
            <Picker
              mode="selector"
              range={majors.map(m => m.label)}
              value={majors.findIndex(m => m.value === formData.major)}
              onChange={e => handleInputChange('major', majors[e.detail.value].value)}
            >
              <View className={styles.picker}>
                <Text className={formData.major ? '' : styles.placeholder}>
                  {formData.major ? getOptionLabel(majors, formData.major) : '请选择申报专业'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
            {formErrors.major && <Text className={styles.error}>{formErrors.major}</Text>}
          </View>

          <View className={styles.formItem}>
            <Text className={styles.label}>现任职称</Text>
            <Picker
              mode="selector"
              range={currentTitles.map(t => t.label)}
              value={currentTitles.findIndex(t => t.value === formData.currentTitle)}
              onChange={e => handleInputChange('currentTitle', currentTitles[e.detail.value].value)}
            >
              <View className={styles.picker}>
                <Text className={formData.currentTitle ? '' : styles.placeholder}>
                  {formData.currentTitle ? getOptionLabel(currentTitles, formData.currentTitle) : '请选择现任职称'}
                </Text>
                <Text className={styles.arrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>
            <Text className={styles.icon}>🌐</Text>
            <Text>长三角跨省通办</Text>
          </View>
          
          <View className={styles.formItem}>
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: '28rpx', color: '#606266' }}>是否跨省申报</Text>
              <View 
                style={{ 
                  width: 100, 
                  height: 56, 
                  borderRadius: 28, 
                  background: crossProvince ? '#1890ff' : '#dcdfe6',
                  position: 'relative',
                  transition: 'all 0.3s'
                }}
                onClick={() => setCrossProvince(!crossProvince)}
              >
                <View 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 24, 
                    background: '#fff',
                    position: 'absolute',
                    top: 4,
                    left: crossProvince ? 48 : 4,
                    transition: 'all 0.3s',
                    boxShadow: '0 2rpx 4rpx rgba(0,0,0,0.2)'
                  }} 
                />
              </View>
            </View>
            <Text style={{ fontSize: '22rpx', color: '#909399', marginTop: '12rpx' }}>
              支持长三角地区（江苏、上海、浙江、安徽）职称跨省申报评审
            </Text>
          </View>

          {crossProvince && (
            <View className={styles.formItem}>
              <Text className={styles.label}>
                <Text className={styles.required}>*</Text>
                目标省份
              </Text>
              <Picker
                mode="selector"
                range={provinces.map(p => p.label)}
                value={provinces.findIndex(p => p.value === targetProvince)}
                onChange={e => setTargetProvince(provinces[e.detail.value].value)}
              >
                <View className={styles.picker}>
                  <Text className={targetProvince ? '' : styles.placeholder}>
                    {targetProvince ? getOptionLabel(provinces, targetProvince) : '请选择目标省份'}
                  </Text>
                  <Text className={styles.arrow}>›</Text>
                </View>
              </Picker>
            </View>
          )}
        </View>

        <View className={styles.materialSection}>
          <View className={styles.sectionHeader}>
            <View className={styles.title}>
              <Text className={styles.icon}>📎</Text>
              <Text>申报材料</Text>
            </View>
            <Text className={styles.required}>
              {uploadedFiles.filter(f => f.type === 'required' && f.status === 'success').length} / {requiredMaterials.filter(m => m.type === 'required').length} 必填
            </Text>
          </View>

          <View className={styles.materialList}>
            {requiredMaterials.map(material => {
              const uploaded = uploadedFiles.find(f => f.name === material.name);
              return (
                <View key={material.name} className={styles.materialItem}>
                  <View className={styles.fileIcon}>
                    {material.name.includes('身份证') ? '🪪' : 
                     material.name.includes('学历') || material.name.includes('学位') ? '🎓' : 
                     material.name.includes('证书') || material.name.includes('获奖') ? '🏆' : 
                     material.name.includes('业绩') || material.name.includes('论文') ? '📄' : '📑'}
                  </View>
                  <View className={styles.fileInfo}>
                    <Text className={styles.fileName}>
                      {material.name} {material.type === 'required' ? '(必填)' : '(选填)'}
                    </Text>
                    <Text className={styles.fileDesc}>{material.desc}</Text>
                  </View>
                  {uploaded ? (
                    <>
                      <View className={`${styles.fileStatus} ${styles[uploaded.status]}`}>
                        {uploaded.status === 'success' ? '已上传' : uploaded.status === 'uploading' ? '上传中' : '上传失败'}
                      </View>
                      <View className={styles.removeBtn} onClick={() => handleRemoveFile(uploaded.id)}>✕</View>
                    </>
                  ) : (
                    <View className={styles.uploadBtn} onClick={() => handleUploadFile(material)}>
                      上传
                    </View>
                  )}
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
            <Text className={styles.tipItem}>请确保填写信息真实有效，虚假信息将取消申报资格</Text>
            <Text className={styles.tipItem}>所有上传材料需清晰可辨，否则将影响审核进度</Text>
            <Text className={styles.tipItem}>职称评审周期一般为1-3个月，请耐心等待审核结果</Text>
            <Text className={styles.tipItem}>长三角地区已实现职称互认，无需重复评审</Text>
            <Text className={styles.tipItem}>如有疑问，请拨打服务热线：12333</Text>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <View className={styles.feeInfo}>
          申报费用：<Text className={styles.fee}>{formatMoney(declareFee)}</Text>
        </View>
        <View
          className={`${styles.submitBtn} ${loading ? 'disabled' : ''}`}
          onClick={!loading ? handleSubmit : undefined}
        >
          {loading ? '提交中...' : '提交申报并缴费'}
        </View>
        <Text className={styles.btnTip}>点击提交即表示您同意《职称申报服务协议》</Text>
      </View>

      {showSuccess && applyResult && (
        <View className={styles.successModal}>
          <View className={styles.modalContent}>
            <View className={styles.successIcon}>🎉</View>
            <Text className={styles.successTitle}>申报提交成功</Text>
            <Text className={styles.successDesc}>
              您的职称申报已提交，请及时关注审核进度。评审通过后将颁发电子职称证书。
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
                <Text className={styles.label}>预计完成</Text>
                <Text className={styles.value}>45个工作日内</Text>
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

export default TitleDeclarePage;
