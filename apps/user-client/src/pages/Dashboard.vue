<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { socialInsuranceApi } from '@/api/socialInsurance';
import { certificationApi } from '@/api/certification';
import { formatCurrency, formatDate } from '@shared/utils';
import type { InsuranceType, AccountBalance } from '@shared/types/social-insurance';
import { InsuranceTypeMap, InsuranceTypeShortMap } from '@shared/types/social-insurance';
import type { CertificationResultResponse } from '@shared/types/certification';
import {
  User,
  CreditCard,
  Shield,
  PiggyBank,
  ScanFace,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const balances = ref<AccountBalance[]>([]);
const certResult = ref<CertificationResultResponse | null>(null);
const loading = ref(true);

const insuranceTypes: InsuranceType[] = ['PENSION', 'UNEMPLOYMENT', 'INJURY', 'MATERNITY'];

const insureStatusMap: Record<string, { text: string; color: string }> = {
  NORMAL: { text: '正常参保', color: 'text-success' },
  SUSPENDED: { text: '暂停参保', color: 'text-amber-500' },
  RETIRED: { text: '已退休', color: 'text-gray-500' },
};

const quickActions = [
  { icon: PiggyBank, label: '社保查询', route: '/social-insurance', color: 'text-blue-500' },
  { icon: ScanFace, label: '生存认证', route: '/survival-certification', color: 'text-emerald-500' },
  { icon: CreditCard, label: '认证记录', route: '/certification-history', color: 'text-purple-500' },
  { icon: User, label: '个人中心', route: '/profile', color: 'text-amber-500' },
];

onMounted(async () => {
  try {
    const balancePromises = insuranceTypes.map((type) =>
      socialInsuranceApi.getBalance(type).catch(() => null)
    );
    const balanceResults = await Promise.all(balancePromises);
    balances.value = balanceResults.filter(Boolean) as AccountBalance[];

    try {
      certResult.value = await certificationApi.getResult('latest');
    } catch {
      certResult.value = null;
    }
  } finally {
    loading.value = false;
  }
});

const getBalanceByType = (type: InsuranceType): AccountBalance | undefined => {
  return balances.value.find((b) => b.insuranceType === type);
};
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <template v-else>
      <div class="card-base p-6 mb-6">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 rounded-full bg-gov-gradient flex items-center justify-center text-white text-2xl font-bold">
            {{ authStore.userInfo?.nameMasked?.charAt(0) || '?' }}
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-800">
              {{ authStore.userInfo?.nameMasked || '未知用户' }}
            </h2>
            <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span class="flex items-center gap-1">
                <CreditCard class="w-4 h-4" />
                社保卡：{{ authStore.userInfo?.socialCardMasked || '--' }}
              </span>
              <span :class="insureStatusMap[authStore.userInfo?.insureStatus || 'NORMAL']?.color" class="flex items-center gap-1">
                <Shield class="w-4 h-4" />
                {{ insureStatusMap[authStore.userInfo?.insureStatus || 'NORMAL']?.text }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          v-for="type in insuranceTypes"
          :key="type"
          class="card-base card-hover p-5 cursor-pointer"
          @click="router.push('/social-insurance')"
        >
          <p class="text-sm text-gray-500 mb-1">{{ InsuranceTypeShortMap[type] }}保险</p>
          <p class="text-xl font-bold text-primary tabular-nums">
            {{ getBalanceByType(type) ? formatCurrency(getBalanceByType(type)!.personalAccount) : '--' }}
          </p>
          <p class="text-xs text-gray-400 mt-1">
            个人账户余额
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card-base p-6">
          <h3 class="text-base font-semibold text-gray-800 mb-4">最近认证状态</h3>
          <div v-if="certResult" class="space-y-3">
            <div class="flex items-center gap-3">
              <CheckCircle2 v-if="certResult.status === 'SUCCESS'" class="w-6 h-6 text-success" />
              <AlertCircle v-else-if="certResult.status === 'FAILED'" class="w-6 h-6 text-danger" />
              <Clock v-else class="w-6 h-6 text-amber-500" />
              <div>
                <p class="font-medium text-gray-800">
                  {{ certResult.status === 'SUCCESS' ? '认证通过' : certResult.status === 'FAILED' ? '认证未通过' : '待认证' }}
                </p>
                <p v-if="certResult.matchScore" class="text-xs text-gray-500">
                  匹配度：{{ (certResult.matchScore * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-sm text-gray-400">暂无认证记录</div>
        </div>

        <div class="card-base p-6">
          <h3 class="text-base font-semibold text-gray-800 mb-4">快捷操作</h3>
          <div class="grid grid-cols-4 gap-3">
            <button
              v-for="action in quickActions"
              :key="action.label"
              class="flex flex-col items-center gap-2 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              @click="router.push(action.route)"
            >
              <component :is="action.icon" :class="action.color" class="w-6 h-6" />
              <span class="text-xs text-gray-600">{{ action.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
