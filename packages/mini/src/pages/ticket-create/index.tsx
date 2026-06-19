import React, { useState } from 'react';
import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';

const TICKET_TYPES = [
  { key: 'REPAIR', label: '🔧 报修' },
  { key: 'COMPLAINT', label: '💬 投诉' },
  { key: 'SUGGESTION', label: '💡 建议' },
];

const PRIORITIES = [
  { key: 'LOW', label: '低' },
  { key: 'MEDIUM', label: '中' },
  { key: 'HIGH', label: '高' },
  { key: 'URGENT', label: '紧急' },
];

const TicketCreatePage: React.FC = () => {
  const router = useRouter();
  const [ticketType, setTicketType] = useState(router.params.type || 'REPAIR');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' });
      return;
    }
    if (!content.trim()) {
      Taro.showToast({ title: '请输入详细描述', icon: 'none' });
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      Taro.showToast({ title: '请填写联系方式', icon: 'none' });
      return;
    }
    Taro.showToast({ title: '工单提交成功！', icon: 'success' });
    setTimeout(() => Taro.navigateBack(), 1500);
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.typeSelector}>
        <Text className={styles.typeTitle}>工单类型</Text>
        <View className={styles.typeOptions}>
          {TICKET_TYPES.map((type) => (
            <View
              key={type.key}
              className={classnames(styles.typeOption, ticketType === type.key && styles.typeOptionActive)}
              onClick={() => setTicketType(type.key)}
            >
              {type.label}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.form}>
        <View className={styles.formRow}>
          <Text className={`${styles.formLabel} ${styles.required}`}>标题</Text>
          <Input
            className={styles.formInput}
            placeholder="简要描述问题"
            value={title}
            onInput={(e) => setTitle(e.detail.value)}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={`${styles.formLabel} ${styles.required}`}>详细描述</Text>
          <Textarea
            className={styles.formTextarea}
            placeholder="请详细描述您的问题或建议，以便我们更好地为您服务"
            value={content}
            onInput={(e) => setContent(e.detail.value)}
            maxlength={500}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>优先级</Text>
          <View className={styles.prioritySelector}>
            {PRIORITIES.map((p) => (
              <View
                key={p.key}
                className={classnames(styles.priorityOption, priority === p.key && styles.priorityActive)}
                onClick={() => setPriority(p.key)}
              >
                {p.label}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>故障位置</Text>
          <Input
            className={styles.formInput}
            placeholder="如：1号楼2单元3楼走廊"
            value={location}
            onInput={(e) => setLocation(e.detail.value)}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={styles.formLabel}>现场照片</Text>
          <View className={styles.imageUpload}>
            <View className={styles.uploadItem}>➕</View>
          </View>
        </View>

        <View className={styles.formRow}>
          <Text className={`${styles.formLabel} ${styles.required}`}>联系人</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入姓名"
            value={contactName}
            onInput={(e) => setContactName(e.detail.value)}
          />
        </View>

        <View className={styles.formRow}>
          <Text className={`${styles.formLabel} ${styles.required}`}>联系电话</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入手机号"
            type="number"
            value={contactPhone}
            onInput={(e) => setContactPhone(e.detail.value)}
          />
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.btnPrimary} onClick={handleSubmit}>提交工单</View>
      </View>
    </ScrollView>
  );
};

export default TicketCreatePage;
