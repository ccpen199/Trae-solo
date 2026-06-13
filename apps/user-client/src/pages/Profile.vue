<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import {
  User,
  CreditCard,
  Shield,
  Phone,
  Calendar,
  MapPin,
  Edit3,
} from 'lucide-vue-next';

const authStore = useAuthStore();

const info = authStore.userInfo;

const insureStatusMap: Record<string, { text: string; color: string }> = {
  NORMAL: { text: '正常参保', color: 'text-success' },
  SUSPENDED: { text: '暂停参保', color: 'text-amber-500' },
  RETIRED: { text: '已退休', color: 'text-gray-500' },
};

const profileItems = [
  { icon: User, label: '姓名', value: info?.nameMasked || '--' },
  { icon: CreditCard, label: '身份证号', value: info?.idCardMasked || '--' },
  { icon: CreditCard, label: '社保卡号', value: info?.socialCardMasked || '--' },
  { icon: Shield, label: '参保状态', value: insureStatusMap[info?.insureStatus || 'NORMAL']?.text, valueClass: insureStatusMap[info?.insureStatus || 'NORMAL']?.color },
  { icon: Phone, label: '联系电话', value: '138****1234' },
  { icon: Calendar, label: '参保日期', value: '2015-07-01' },
  { icon: MapPin, label: '参保地', value: '广西壮族自治区南宁市' },
];
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-800 mb-6">个人中心</h1>

    <div class="card-base p-6 mb-6">
      <div class="flex items-center gap-5">
        <div class="w-20 h-20 rounded-full bg-gov-gradient flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {{ info?.nameMasked?.charAt(0) || '?' }}
        </div>
        <div>
          <h2 class="text-xl font-bold text-gray-800">{{ info?.nameMasked || '未知用户' }}</h2>
          <p class="text-sm text-gray-500 mt-1">社保卡号：{{ info?.socialCardMasked || '--' }}</p>
          <span :class="['inline-flex items-center gap-1 mt-2 text-sm font-medium', insureStatusMap[info?.insureStatus || 'NORMAL']?.color]">
            <Shield class="w-4 h-4" />
            {{ insureStatusMap[info?.insureStatus || 'NORMAL']?.text }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-base overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-base font-semibold text-gray-800">基本信息</h3>
        <button class="text-sm text-accent hover:text-primary flex items-center gap-1 transition-colors">
          <Edit3 class="w-3.5 h-3.5" />
          编辑
        </button>
      </div>

      <div class="divide-y divide-gray-50">
        <div
          v-for="item in profileItems"
          :key="item.label"
          class="flex items-center px-6 py-4 hover:bg-gray-50/50 transition-colors"
        >
          <div class="flex items-center gap-3 w-36 flex-shrink-0">
            <component :is="item.icon" class="w-4 h-4 text-gray-400" />
            <span class="text-sm text-gray-500">{{ item.label }}</span>
          </div>
          <span :class="['text-sm font-medium', item.valueClass || 'text-gray-800']">
            {{ item.value }}
          </span>
        </div>
      </div>
    </div>

    <div class="card-base p-6 mt-6">
      <h3 class="text-base font-semibold text-gray-800 mb-4">安全设置</h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-gray-600">登录密码</span>
          <button class="text-sm text-accent hover:text-primary transition-colors">修改</button>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-gray-600">绑定手机</span>
          <span class="text-sm text-gray-800">138****1234</span>
        </div>
        <div class="flex items-center justify-between py-2">
          <span class="text-sm text-gray-600">桂事通绑定</span>
          <span class="text-sm text-success">已绑定</span>
        </div>
      </div>
    </div>
  </div>
</template>
