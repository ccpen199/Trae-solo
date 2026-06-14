import React, { useState } from 'react';
import { View, Text, Switch } from '@tarojs/components';
import Taro from '@tarojs/taro';
import PageContainer from '@/components/PageContainer';
import { useUserStore } from '@/store/useUserStore';

const groups = [
  {
    title: '账号设置', items: [
      { k: '个人资料', v: '张明', type: 'arrow' },
      { k: '绑定手机', v: '138****8888', type: 'arrow' },
      { k: '修改密码', v: '', type: 'arrow' },
      { k: '实名认证', v: '已认证', type: 'tag', tag: 'success' },
    ],
  },
  {
    title: '消息通知', items: [
      { k: '工单通知', type: 'switch', key: 'ticket' },
      { k: '门禁通行通知', type: 'switch', key: 'access' },
      { k: '订单消息', type: 'switch', key: 'order' },
      { k: '公告推送', type: 'switch', key: 'announce' },
      { k: '设备告警通知（物业）', type: 'switch', key: 'alert' },
    ],
  },
  {
    title: '隐私与安全', items: [
      { k: '隐私协议', type: 'arrow' },
      { k: '用户协议', type: 'arrow' },
      { k: '位置权限', v: '始终允许', type: 'arrow' },
      { k: '蓝牙权限', v: '已开启', type: 'arrow' },
    ],
  },
  {
    title: '关于', items: [
      { k: '当前版本', v: 'v1.0.0', type: 'none' },
      { k: '检查更新', v: '已是最新', type: 'arrow' },
      { k: '给我们评分', type: 'arrow' },
      { k: '关于社区中台', type: 'arrow' },
    ],
  },
];

const SettingsPage: React.FC = () => {
  const { logout } = useUserStore();
  const [switches, setSwitches] = useState<Record<string, boolean>>({
    ticket: true, access: true, order: true, announce: true, alert: true,
  });

  return (
    <PageContainer>
      {groups.map((g, gi) => (
        <View key={gi} style={{
          background: '#fff', borderRadius: 16, marginBottom: 24, overflow: 'hidden',
          boxShadow: '0 4rpx 16rpx rgba(0,0,0,0.04)'
        }}>
          <Text style={{ fontSize: 24, color: '#86909C', padding: '24rpx 24rpx 8rpx', fontWeight: '500' }}>{g.title}</Text>
          {g.items.map((it, ii) => (
            <View key={ii} style={{
              display: 'flex', alignItems: 'center', padding: '28rpx 24rpx',
              borderTop: ii > 0 ? '1rpx solid #F2F3F5' : 'none'
            }}>
              <Text style={{ flex: 1, fontSize: 28, color: '#1D2129' }}>{it.k}</Text>
              {it.type === 'arrow' && (
                <>
                  <Text style={{ fontSize: 24, color: '#86909C', marginRight: 8 }}>{it.v}</Text>
                  <Text style={{ color: '#C9CDD4', fontSize: 28 }}>›</Text>
                </>
              )}
              {it.type === 'tag' && (
                <Text style={{
                  padding: '4rpx 16rpx', fontSize: 22, borderRadius: 12,
                  background: it.tag === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                  color: it.tag === 'success' ? '#10B981' : '#F59E0B', fontWeight: '500'
                }}>{it.v}</Text>
              )}
              {it.type === 'switch' && (
                <Switch
                  checked={switches[it.key]}
                  color="#2E7CF6"
                  onChange={(e) => setSwitches({ ...switches, [it.key]: e.detail.value })}
                />
              )}
              {it.type === 'none' && <Text style={{ fontSize: 24, color: '#86909C' }}>{it.v}</Text>}
            </View>
          ))}
        </View>
      ))}
      <View
        style={{
          height: 88, borderRadius: 44, marginTop: 24, marginBottom: 48,
          background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2rpx solid rgba(239,68,68,0.2)'
        }}
        onClick={() => Taro.showModal({
          title: '退出登录', content: '确定要退出当前账号吗？', confirmColor: '#EF4444',
          success: (r) => {
            if (r.confirm) {
              logout && logout();
              Taro.showToast({ title: '已退出登录', icon: 'none' });
            }
          },
        })}
      >
        <Text style={{ fontSize: 28, fontWeight: '600', color: '#EF4444' }}>退出登录</Text>
      </View>
    </PageContainer>
  );
};

export default SettingsPage;
