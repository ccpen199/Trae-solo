import React, { useState } from 'react';
import { View, Text, Image, Input, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import PageContainer from '@/components/PageContainer';
import classnames from 'classnames';
import type { TicketType } from '@/types';
import { useUserStore } from '@/store/useUserStore';

const types: Array<{ key: TicketType; label: string; icon: string; desc: string }> = [
  { key: 'repair', label: '报修', icon: '🛠️', desc: '设施损坏维修' },
  { key: 'complaint', label: '投诉', icon: '📢', desc: '服务问题反馈' },
  { key: 'suggestion', label: '建议', icon: '💡', desc: '改进意见建议' },
];

const priorities = [
  { key: 'urgent', label: '紧急', color: '#EF4444' },
  { key: 'high', label: '高', color: '#F59E0B' },
  { key: 'medium', label: '中', color: '#2E7CF6' },
  { key: 'low', label: '低', color: '#86909C' },
];

const TicketCreatePage: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const initialType = (router.params.t as TicketType) || 'repair';
  const currentProperty = user?.properties.find((p) => p.id === user?.currentPropertyId);

  const [type, setType] = useState<TicketType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(currentProperty?.address || '');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [priority, setPriority] = useState<string>('medium');
  const [images, setImages] = useState<string[]>([]);

  const handleAddImage = () => {
    if (images.length >= 6) {
      Taro.showToast({ title: '最多上传6张', icon: 'none' });
      return;
    }
    Taro.chooseImage({
      count: 6 - images.length,
      success: (res) => setImages([...images, ...res.tempFilePaths]),
      fail: () => {
        const fake = `https://picsum.photos/id/${100 + images.length}/600/400`;
        setImages([...images, fake]);
      },
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) { Taro.showToast({ title: '请输入标题', icon: 'none' }); return; }
    if (!description.trim()) { Taro.showToast({ title: '请输入问题描述', icon: 'none' }); return; }
    Taro.showLoading({ title: '提交中...' });
    setTimeout(() => {
      Taro.hideLoading();
      Taro.showToast({ title: '提交成功', icon: 'success' });
      console.log('[Ticket] Create:', { type, title, description, priority });
      setTimeout(() => Taro.navigateBack(), 800);
    }, 1000);
  };

  return (
    <PageContainer>
      <View className={styles.typeSelector}>
        {types.map((t) => (
          <View
            key={t.key}
            className={classnames(styles.type, type === t.key ? styles.active : '', styles[t.key])}
            onClick={() => setType(t.key)}
          >
            <Text className={styles.icon}>{t.icon}</Text>
            <Text className={styles.label}>{t.label}</Text>
            <Text className={styles.desc}>{t.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.formCard}>
        <View className={styles.field}>
          <View className={styles.label}><Text className={styles.required}>*</Text><Text>问题标题</Text></View>
          <View className={styles.inputBox}>
            <Input
              placeholder={`请简要描述${type === 'repair' ? '需要维修的问题' : type === 'complaint' ? '投诉的内容' : '您的建议'}`}
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={50}
            />
          </View>
          <View className={styles.hint}>{title.length}/50</View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text className={styles.required}>*</Text><Text>详细描述</Text></View>
          <View className={classnames(styles.inputBox, styles.textareaBox)}>
            <Textarea
              placeholder="请详细描述问题情况、发生时间、影响范围等，方便物业人员更快处理"
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={500}
              style={{ width: '100%', minHeight: '200rpx' }}
            />
          </View>
          <View className={styles.hint}>{description.length}/500</View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text>现场图片</Text></View>
          <View className={styles.uploadGrid}>
            {images.map((img, i) => (
              <View key={i} className={styles.imgBox}>
                <Image className={styles.img} src={img} mode="aspectFill" />
                <View className={styles.del} onClick={() => setImages(images.filter((_, j) => j !== i))}>
                  <Text>×</Text>
                </View>
              </View>
            ))}
            {images.length < 6 && (
              <View className={styles.addBox} onClick={handleAddImage}>
                <Text className={styles.plus}>+</Text>
                <Text className={styles.text}>上传图片</Text>
              </View>
            )}
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text className={styles.required}>*</Text><Text>问题位置</Text></View>
          <View className={styles.inputBox}>
            <Input value={location} onInput={(e) => setLocation(e.detail.value)} placeholder="请输入具体位置" />
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text>紧急程度</Text></View>
          <View className={styles.priorityGrid}>
            {priorities.map((p) => (
              <View
                key={p.key}
                className={classnames(styles.pItem, priority === p.key ? styles.active : '', styles[p.key])}
                style={priority === p.key ? { color: p.color, borderColor: p.color } : {}}
                onClick={() => setPriority(p.key)}
              >
                <Text>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text className={styles.required}>*</Text><Text>联系人</Text></View>
          <View className={styles.inputBox}>
            <Input value={contactName} onInput={(e) => setContactName(e.detail.value)} placeholder="您的姓名" />
          </View>
        </View>

        <View className={styles.field}>
          <View className={styles.label}><Text className={styles.required}>*</Text><Text>联系电话</Text></View>
          <View className={styles.inputBox}>
            <Input value={contactPhone} onInput={(e) => setContactPhone(e.detail.value)} placeholder="联系手机号" type="phone" />
          </View>
        </View>
      </View>

      <View style={{ height: '180rpx' }} />

      <View className={styles.submitBar}>
        <View className={`${styles.btn} ${styles.outline}`} onClick={() => Taro.navigateBack()}>
          <Text>取消</Text>
        </View>
        <View className={`${styles.btn} ${styles.primary}`} onClick={handleSubmit}>
          <Text>提交工单</Text>
        </View>
      </View>
    </PageContainer>
  );
};

export default TicketCreatePage;
