import React, { useState } from 'react';
import { View, Text, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { approvalService } from '@/services/approvalService';
import { ApprovalTemplate } from '@/types/approval';
import styles from './index.module.scss';

const templates = [
  { id: '1', name: '请假申请', icon: '🏖️', category: 'leave' },
  { id: '2', name: '报销申请', icon: '💰', category: 'expense' },
  { id: '3', name: '采购申请', icon: '📦', category: 'purchase' },
  { id: '4', name: '加班申请', icon: '⏰', category: 'overtime' },
  { id: '5', name: '出差申请', icon: '✈️', category: 'business' },
  { id: '6', name: '合同审批', icon: '📑', category: 'contract' },
  { id: '7', name: '用印申请', icon: '🔏', category: 'seal' },
  { id: '8', name: '更多模板', icon: '➕', category: 'more' }
];

const ApprovalCreatePage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalTemplate | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    days: '',
    reason: '',
    amount: '',
    description: ''
  });
  const [isUrgent, setIsUrgent] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);

  const handleTemplateSelect = (template: typeof templates[0]) => {
    if (template.category === 'more') {
      Taro.showToast({ title: '更多模板开发中', icon: 'none' });
      return;
    }

    setSelectedTemplate({
      id: template.id,
      name: template.name,
      description: '',
      icon: template.icon,
      category: template.category,
      formFields: [],
      processDefinition: [],
      flowNodes: [],
      isEnabled: true,
      sort: 0
    });
    setShowForm(true);
    Taro.setNavigationBarTitle({ title: template.name });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDatePick = (field: string) => {
    Taro.showActionSheet({
      itemList: ['选择日期'],
      success: () => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        handleInputChange(field, dateStr);

        if (field === 'endDate' && formData.startDate) {
          const start = new Date(formData.startDate);
          const end = new Date(dateStr);
          const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          handleInputChange('days', String(diffDays));
        }
      }
    });
  };

  const handleUpload = () => {
    Taro.chooseImage({
      count: 9 - uploadedFiles.length,
      success: (res) => {
        setUploadedFiles(prev => [...prev, ...res.tempFilePaths]);
      }
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      Taro.showToast({ title: '请填写标题', icon: 'none' });
      return;
    }

    if (selectedTemplate?.category === 'leave') {
      if (!formData.leaveType || !formData.startDate || !formData.endDate) {
        Taro.showToast({ title: '请填写完整信息', icon: 'none' });
        return;
      }
    }

    if (selectedTemplate?.category === 'expense' && !formData.amount) {
      Taro.showToast({ title: '请填写金额', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认提交',
      content: '提交后审批流程将自动发起，是否继续？',
      success: async (res) => {
        if (res.confirm) {
          Taro.showLoading({ title: '提交中...' });
          try {
            await approvalService.createApproval(
              selectedTemplate?.id || '1',
              { ...formData, files: uploadedFiles, isUrgent, title: formData.title },
              uploadedFiles
            );
            Taro.hideLoading();
            Taro.showToast({ title: '提交成功', icon: 'success' });
            setTimeout(() => Taro.navigateBack(), 1000);
          } catch (error) {
            Taro.hideLoading();
            Taro.showToast({ title: '提交失败', icon: 'error' });
          }
        }
      }
    });
  };

  const handleSaveDraft = () => {
    Taro.showToast({ title: '草稿已保存', icon: 'success' });
  };

  if (!showForm) {
    return (
      <View className={styles.page}>
        <View className={styles.templateList}>
          <Text className={styles.categoryTitle}>常用审批</Text>
          <View className={styles.templateGrid}>
            {templates.map(template => (
              <View
                key={template.id}
                className={styles.templateItem}
                onClick={() => handleTemplateSelect(template)}
              >
                <View className={`${styles.templateIcon} ${styles[template.category]}`}>
                  <Text>{template.icon}</Text>
                </View>
                <Text className={styles.templateName}>{template.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.recentSection}>
          <Text className={styles.sectionTitle}>最近发起</Text>
          <View className={styles.recentList}>
            {[
              { title: '2024年1月年假申请', time: '2024-01-10', status: 'approved' },
              { title: '采购办公设备申请', time: '2024-01-08', status: 'pending' },
              { title: '商务差旅费用报销', time: '2024-01-05', status: 'rejected' }
            ].map((item, index) => (
              <View key={index} className={styles.recentItem}>
                <View className={styles.recentInfo}>
                  <Text className={styles.recentTitle}>{item.title}</Text>
                  <Text className={styles.recentTime}>{item.time}</Text>
                </View>
                <Text className={classnames(styles.recentStatus, styles[item.status])}>
                  {item.status === 'approved' ? '已通过' : item.status === 'pending' ? '审批中' : '已驳回'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  const leaveTypes = ['年假', '病假', '事假', '婚假', '产假', '陪产假', '丧假', '调休'];

  return (
    <View className={styles.page}>
      {selectedTemplate?.category === 'leave' && (
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>填写请假信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              请假类型
            </Text>
            <View
              className={styles.pickerItem}
              onClick={() => Taro.showActionSheet({
                itemList: leaveTypes,
                success: (res) => handleInputChange('leaveType', leaveTypes[res.tapIndex])
              })}
            >
              <Text className={formData.leaveType ? styles.value : styles.placeholder}>
                {formData.leaveType || '请选择请假类型'}
              </Text>
              <Text className={styles.arrow}>›</Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              开始日期
            </Text>
            <View
              className={styles.pickerItem}
              onClick={() => handleDatePick('startDate')}
            >
              <Text className={formData.startDate ? styles.value : styles.placeholder}>
                {formData.startDate || '请选择开始日期'}
              </Text>
              <Text className={styles.arrow}>📅</Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              结束日期
            </Text>
            <View
              className={styles.pickerItem}
              onClick={() => handleDatePick('endDate')}
            >
              <Text className={formData.endDate ? styles.value : styles.placeholder}>
                {formData.endDate || '请选择结束日期'}
              </Text>
              <Text className={styles.arrow}>📅</Text>
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>请假天数</Text>
            <Input
              className={styles.formInput}
              type="digit"
              placeholder="请输入请假天数"
              value={formData.days}
              onInput={(e) => handleInputChange('days', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              请假事由
            </Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细说明请假事由"
              value={formData.reason}
              onInput={(e) => handleInputChange('reason', e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>标题</Text>
            <Input
              className={styles.formInput}
              placeholder="请输入审批标题"
              value={formData.title}
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
          </View>
        </View>
      )}

      {selectedTemplate?.category === 'expense' && (
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>填写报销信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              标题
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请输入报销标题"
              value={formData.title}
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              报销金额
            </Text>
            <Input
              className={styles.formInput}
              type="digit"
              placeholder="请输入报销金额"
              value={formData.amount}
              onInput={(e) => handleInputChange('amount', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              费用说明
            </Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细说明费用明细"
              value={formData.description}
              onInput={(e) => handleInputChange('description', e.detail.value)}
              maxlength={500}
            />
          </View>
        </View>
      )}

      {selectedTemplate?.category === 'purchase' && (
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>填写采购信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              标题
            </Text>
            <Input
              className={styles.formInput}
              placeholder="请输入采购标题"
              value={formData.title}
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              采购说明
            </Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细说明采购需求"
              value={formData.description}
              onInput={(e) => handleInputChange('description', e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>预算金额</Text>
            <Input
              className={styles.formInput}
              type="digit"
              placeholder="请输入预算金额"
              value={formData.amount}
              onInput={(e) => handleInputChange('amount', e.detail.value)}
            />
          </View>
        </View>
      )}

      {!['leave', 'expense', 'purchase'].includes(selectedTemplate?.category || '') && (
        <View className={styles.formSection}>
          <Text className={styles.sectionTitle}>填写{selectedTemplate?.name}信息</Text>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>
              <Text className={styles.required}>*</Text>
              标题
            </Text>
            <Input
              className={styles.formInput}
              placeholder={`请输入${selectedTemplate?.name}标题`}
              value={formData.title}
              onInput={(e) => handleInputChange('title', e.detail.value)}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>详细说明</Text>
            <Textarea
              className={styles.formTextarea}
              placeholder="请详细说明"
              value={formData.description}
              onInput={(e) => handleInputChange('description', e.detail.value)}
              maxlength={1000}
            />
          </View>
        </View>
      )}

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>相关附件</Text>
        {uploadedFiles.length > 0 && (
          <View className={styles.uploadList}>
            {uploadedFiles.map((_, index) => (
              <View key={index} className={styles.uploadItem}>
                <Text className={styles.remove} onClick={() => handleRemoveFile(index)}>×</Text>
              </View>
            ))}
          </View>
        )}
        <View className={styles.uploadSection} onClick={handleUpload}>
          <Text className={styles.icon}>📎</Text>
          <Text className={styles.text}>点击上传附件</Text>
          <Text className={styles.hint}>支持图片、PDF、Excel、Word格式，最多9个</Text>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>更多设置</Text>
        <View className={classnames(styles.formItem, styles.switchItem)}>
          <Text className={styles.formLabel}>🚨 紧急审批</Text>
          <View
            className={classnames(styles.switch, isUrgent && styles.active)}
            onClick={() => setIsUrgent(!isUrgent)}
          />
        </View>
      </View>

      <View className={styles.approvalFlow}>
        <Text className={styles.sectionTitle}>审批流程</Text>
        <View className={styles.flowPreview}>
          <View className={styles.flowNode}>
            <Text className={styles.icon}>👤</Text>
            <Text>我</Text>
          </View>
          <Text className={styles.arrow}>→</Text>
          <View className={styles.flowNode}>
            <Text className={styles.icon}>👔</Text>
            <Text>部门经理</Text>
          </View>
          <Text className={styles.arrow}>→</Text>
          <View className={styles.flowNode}>
            <Text className={styles.icon}>🏢</Text>
            <Text>总经理</Text>
          </View>
          {isUrgent && (
            <>
              <Text className={styles.arrow}>→</Text>
              <View className={styles.flowNode}>
                <Text className={styles.icon}>⏰</Text>
                <Text>加急处理</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View className={styles.securityNote}>
        <Text className={styles.icon}>🔒</Text>
        <Text>审批数据使用国密SM4加密传输，确保数据安全</Text>
      </View>

      <View className={styles.actionBar}>
        <View
          className={classnames(styles.actionBtn, styles.default)}
          onClick={handleSaveDraft}
        >
          保存草稿
        </View>
        <View
          className={classnames(styles.actionBtn, styles.primary)}
          onClick={handleSubmit}
        >
          提交审批
        </View>
      </View>
    </View>
  );
};

export default ApprovalCreatePage;
