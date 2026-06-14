import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import PageContainer from '@/components/PageContainer';
import styles from './index.module.scss';

const faqs = [
  { q: '如何绑定我的房产信息？', a: '进入「我的房产」页面，点击「绑定新房产」，输入房产证编号或房屋备案号即可完成绑定。' },
  { q: '访客二维码过期了怎么办？', a: '访客二维码的有效期最长为7天，过期后可在「访客邀请」页面重新生成新的邀请码分享给访客。' },
  { q: '如何评价物业工单服务？', a: '工单处理完成后，在工单详情页会自动弹出评价面板，您可以对服务进行星级评价和文字反馈。' },
  { q: '快递到了会有提醒吗？', a: '快递被放入丰巢快递柜后，系统会通过消息中心和微信通知您取件信息，包含取件码和存放位置。' },
  { q: '不满意服务如何投诉？', a: '进入「工单中心」，选择「投诉」类型创建工单，相关负责人会在24小时内跟进处理。' },
  { q: '忘记密码怎么办？', a: '可通过绑定的手机号验证码登录，或联系物业服务中心重置密码。' },
];

const HelpPage: React.FC = () => (
  <PageContainer>
    <View className="tip" style={{
      padding: 32, marginBottom: 24, borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(46,124,246,0.1) 0%, rgba(16,185,129,0.1) 100%)',
      display: 'flex', gap: 16, alignItems: 'flex-start'
    }}>
      <Text style={{ fontSize: 40 }}>💁</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 28, fontWeight: '600', color: '#2E7CF6' }}>您好！有什么可以帮助您？</Text>
        <Text style={{ fontSize: 24, color: '#86909C', marginTop: 8, display: 'block', lineHeight: 1.6 }}>
          您可以查看下方常见问题，或联系客服：400-888-8888
        </Text>
      </View>
    </View>
    <View style={{
      background: '#fff', borderRadius: 16, padding: 16, marginBottom: 24, boxShadow: '0 4rpx 16rpx rgba(0,0,0,0.04)'
    }}>
      <Text style={{ fontSize: 28, fontWeight: '600', color: '#1D2129', padding: '16rpx 8rpx' }}>📚 常见问题</Text>
      {faqs.map((f, i) => (
        <View key={i} onClick={() => Taro.showToast({ title: '展开查看详情', icon: 'none' })}
          style={{
            padding: '24rpx 16rpx', borderBottom: i < faqs.length - 1 ? '1rpx solid #F2F3F5' : 'none'
          }}>
          <Text style={{ fontSize: 28, fontWeight: '500', color: '#1D2129', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#2E7CF6' }}>Q{ i + 1 }.</Text>
            {f.q}
            <Text style={{ marginLeft: 'auto', color: '#86909C' }}>›</Text>
          </Text>
          <Text style={{ fontSize: 24, color: '#86909C', marginTop: 12, lineHeight: 1.6, display: 'block', paddingLeft: 36 }}>
            {f.a}
          </Text>
        </View>
      ))}
    </View>
    <View style={{
      background: '#fff', borderRadius: 16, padding: 16,
      boxShadow: '0 4rpx 16rpx rgba(0,0,0,0.04)'
    }}>
      <Text style={{ fontSize: 28, fontWeight: '600', color: '#1D2129', padding: '16rpx 8rpx 24rpx' }}>📞 联系方式</Text>
      {[
        { i: '☎️', l: '物业服务中心', v: '周一至周日 8:00-22:00', num: '0755-8888-8888' },
        { i: '🚔', l: '24小时安保热线', v: '紧急情况可拨打', num: '0755-8888-8889' },
        { i: '🛠️', l: '维修报修热线', v: '工作时间快速响应', num: '0755-8888-8890' },
        { i: '📧', l: '邮箱反馈', v: '工作日24小时内回复', num: 'service@community.com' },
      ].map((c, i) => (
        <View key={i} style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: 20, marginBottom: i < 3 ? 12 : 0,
          background: '#F7F8FA', borderRadius: 12
        }}>
          <Text style={{ fontSize: 36 }}>{c.i}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 28, fontWeight: '500', color: '#1D2129' }}>{c.l}</Text>
            <Text style={{ fontSize: 22, color: '#86909C', marginTop: 4, display: 'block' }}>{c.v}</Text>
          </View>
          <Text style={{ fontSize: 24, color: '#2E7CF6', fontWeight: '500' }}
            onClick={() => c.num.includes('@') ? Taro.showToast({ title: c.num, icon: 'none' }) : Taro.makePhoneCall({ phoneNumber: c.num }).catch(() => {})}>
            {c.num}
          </Text>
        </View>
      ))}
    </View>
    <View style={{ height: 48 }} />
  </PageContainer>
);

export default HelpPage;
