<template>
  <div class="min-h-screen bg-neutral-50 py-6">
    <div class="container">
      <div class="relative overflow-hidden bg-gov-gradient rounded-3xl p-8 mb-6 text-white">
        <div class="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div class="absolute bottom-0 left-20 w-64 h-64 bg-white/5 rounded-full translate-y-1/3"></div>
        <div class="relative flex items-center justify-between">
          <div class="flex items-center gap-6">
            <div class="relative">
              <div class="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                {{ userStore.userInfo?.realName?.charAt(0) || '用' }}
              </div>
              <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center shadow-md">
                <BadgeCheck class="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <h1 class="text-2xl font-bold mb-1">{{ greeting }}，{{ userStore.userInfo?.realName || '用户' }}</h1>
              <div class="flex items-center gap-3 text-blue-100 text-sm">
                <span class="flex items-center gap-1">
                  <ShieldCheck class="w-4 h-4" />
                  {{ authLevelText }}
                </span>
                <span class="w-px h-4 bg-white/20"></span>
                <span>欢迎回来，今天也要元气满满哦~</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="goToNotifications" class="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
              <Bell class="w-5 h-5" />
              <span class="text-sm">消息</span>
              <span class="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
            </button>
            <button @click="goToSettings" class="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
              <Settings class="w-5 h-5" />
              <span class="text-sm">设置</span>
            </button>
            <button @click="handleLogout" class="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 transition-colors">
              <LogOut class="w-5 h-5" />
              <span class="text-sm">退出</span>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div @click="goToApplications('submitted')" class="card card-hover cursor-pointer group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock class="w-6 h-6 text-blue-600" />
            </div>
            <span class="text-2xl font-bold text-neutral-800">{{ stats.pending + stats.processing }}</span>
          </div>
          <p class="text-sm text-neutral-600">待办办件</p>
          <p class="text-xs text-neutral-400 mt-1">待受理 {{ stats.pending }} · 办理中 {{ stats.processing }}</p>
        </div>
        <div @click="goToApplications('completed')" class="card card-hover cursor-pointer group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle class="w-6 h-6 text-emerald-600" />
            </div>
            <span class="text-2xl font-bold text-neutral-800">{{ stats.completed }}</span>
          </div>
          <p class="text-sm text-neutral-600">已办结</p>
          <p class="text-xs text-neutral-400 mt-1">本月办结 12 件</p>
        </div>
        <div @click="goToLicenses" class="card card-hover cursor-pointer group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard class="w-6 h-6 text-amber-600" />
            </div>
            <span class="text-2xl font-bold text-neutral-800">{{ licenseCount }}</span>
          </div>
          <p class="text-sm text-neutral-600">我的证照</p>
          <p class="text-xs text-amber-500 mt-1 flex items-center gap-1">
            <AlertTriangle class="w-3 h-3" />
            2 张即将到期
          </p>
        </div>
        <div @click="goToComplaints" class="card card-hover cursor-pointer group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageCircle class="w-6 h-6 text-violet-600" />
            </div>
            <span class="text-2xl font-bold text-neutral-800">{{ complaintCount }}</span>
          </div>
          <p class="text-sm text-neutral-600">我的诉求</p>
          <p class="text-xs text-neutral-400 mt-1">处理中 2 · 待评价 1</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Database class="w-5 h-5 text-gov-blue" />
                个人数据
              </h2>
              <button @click="goToProfile()" class="text-sm text-gov-blue hover:underline flex items-center gap-1">
                查看全部
                <ChevronRight class="w-4 h-4" />
              </button>
            </div>

            <div class="flex gap-1 mb-5 border-b border-neutral-100 -mx-6 px-6">
              <button
                v-for="tab in dataTabs"
                :key="tab.key"
                :class="[
                  'px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 -mb-px',
                  activeDataTab === tab.key
                    ? 'border-gov-blue text-gov-blue'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                ]"
                @click="activeDataTab = tab.key"
              >
                <component :is="tab.icon" class="w-4 h-4" />
                {{ tab.label }}
              </button>
            </div>

            <div v-show="activeDataTab === 'social'" class="animate-fade-in">
              <div class="grid grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500 mb-1">累计缴费</p>
                  <p class="text-xl font-bold text-neutral-800">{{ userProfile.socialSecurity?.cumulativeMonths || 0 }}<span class="text-sm font-normal text-neutral-500 ml-1">个月</span></p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50">
                  <p class="text-xs text-neutral-500 mb-1">当前状态</p>
                  <p class="text-xl font-bold text-accent-green">{{ getStatusText(userProfile.socialSecurity?.status) }}</p>
                </div>
                <div class="p-4 rounded-xl bg-amber-50">
                  <p class="text-xs text-neutral-500 mb-1">账户余额</p>
                  <p class="text-xl font-bold text-neutral-800">¥{{ (userProfile.socialSecurity?.pensionBalance || 0).toLocaleString() }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-500">
                  <Building2 class="w-4 h-4" />
                  参保单位：抚州科技有限公司
                </div>
                <div class="flex items-center gap-2">
                  <button @click="handleSsoJump('social')" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    进入社保系统
                  </button>
                  <button @click="goToProfile('social')" class="btn-primary !py-1.5 !px-3 text-xs">查看详情</button>
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'medical'" class="animate-fade-in">
              <div class="grid grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-emerald-50">
                  <p class="text-xs text-neutral-500 mb-1">个人账户余额</p>
                  <p class="text-xl font-bold text-neutral-800">¥{{ (userProfile.medicalInsurance?.personalAccountBalance || 0).toLocaleString() }}</p>
                </div>
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500 mb-1">年度报销次数</p>
                  <p class="text-xl font-bold text-neutral-800">{{ medicalReimburseCount }}<span class="text-sm font-normal text-neutral-500 ml-1">次</span></p>
                </div>
                <div class="p-4 rounded-xl bg-violet-50">
                  <p class="text-xs text-neutral-500 mb-1">本年度报销</p>
                  <p class="text-xl font-bold text-neutral-800">¥{{ (userProfile.medicalInsurance?.thisYearReimbursement || 0).toLocaleString() }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-500">
                  <Heart class="w-4 h-4" />
                  参保类型：城镇职工医疗保险
                </div>
                <div class="flex items-center gap-2">
                  <button @click="handleSsoJump('medical')" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    进入医保系统
                  </button>
                  <button @click="goToProfile('medical')" class="btn-primary !py-1.5 !px-3 text-xs">查看详情</button>
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'fund'" class="animate-fade-in">
              <div class="grid grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-amber-50">
                  <p class="text-xs text-neutral-500 mb-1">账户余额</p>
                  <p class="text-xl font-bold text-neutral-800">¥{{ (userProfile.housingFund?.balance || 0).toLocaleString() }}</p>
                </div>
                <div class="p-4 rounded-xl bg-orange-50">
                  <p class="text-xs text-neutral-500 mb-1">月缴存额</p>
                  <p class="text-xl font-bold text-neutral-800">¥{{ userProfile.housingFund?.monthlyDeposit || 0 }}</p>
                </div>
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500 mb-1">累计缴存</p>
                  <p class="text-xl font-bold text-neutral-800">{{ userProfile.housingFund?.cumulativeMonths || 0 }}<span class="text-sm font-normal text-neutral-500 ml-1">个月</span></p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-500">
                  <Building class="w-4 h-4" />
                  缴存单位：抚州科技有限公司
                </div>
                <div class="flex items-center gap-2">
                  <button @click="handleSsoJump('fund')" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    进入公积金系统
                  </button>
                  <button @click="goToProfile('fund')" class="btn-primary !py-1.5 !px-3 text-xs">查看详情</button>
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'education'" class="animate-fade-in">
              <div class="grid grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-violet-50">
                  <p class="text-xs text-neutral-500 mb-1">在读学校</p>
                  <p class="text-base font-bold text-neutral-800 truncate">{{ userProfile.education?.currentSchool || '-' }}</p>
                </div>
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500 mb-1">专业</p>
                  <p class="text-base font-bold text-neutral-800 truncate">软件工程</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50">
                  <p class="text-xs text-neutral-500 mb-1">年级</p>
                  <p class="text-base font-bold text-neutral-800">{{ userProfile.education?.currentGrade || '-' }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-500">
                  <GraduationCap class="w-4 h-4" />
                  学历：硕士研究生
                </div>
                <div class="flex items-center gap-2">
                  <button @click="handleSsoJump('education')" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    进入学籍系统
                  </button>
                  <button @click="goToProfile('education')" class="btn-primary !py-1.5 !px-3 text-xs">查看详情</button>
                </div>
              </div>
            </div>

            <div v-show="activeDataTab === 'driver'" class="animate-fade-in">
              <div class="grid grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-blue-50">
                  <p class="text-xs text-neutral-500 mb-1">驾驶证号</p>
                  <p class="text-base font-bold text-neutral-800">3625********0012</p>
                </div>
                <div class="p-4 rounded-xl bg-emerald-50">
                  <p class="text-xs text-neutral-500 mb-1">准驾车型</p>
                  <p class="text-base font-bold text-neutral-800">C1</p>
                </div>
                <div class="p-4 rounded-xl bg-amber-50">
                  <p class="text-xs text-neutral-500 mb-1">有效期至</p>
                  <p class="text-base font-bold text-neutral-800">2030-06-15</p>
                </div>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 text-sm text-neutral-500">
                  <Car class="w-4 h-4" />
                  状态：正常
                </div>
                <div class="flex items-center gap-2">
                  <button @click="handleSsoJump('driver')" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                    <ExternalLink class="w-3 h-3" />
                    进入交管系统
                  </button>
                  <button class="btn-primary !py-1.5 !px-3 text-xs">查看详情</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Clock class="w-5 h-5 text-gov-blue" />
                待办提醒
              </h2>
              <span class="text-xs text-neutral-400">共 {{ todoList.length }} 条待办</span>
            </div>
            <div class="space-y-3">
              <div
                v-for="item in todoList"
                :key="item.id"
                class="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer group"
                @click="handleTodoClick(item)"
              >
                <div :class="[
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  item.type === 'urgent' ? 'bg-red-100' :
                  item.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                ]">
                  <component :is="item.icon" :class="[
                    'w-5 h-5',
                    item.type === 'urgent' ? 'text-red-600' :
                    item.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                  ]" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-neutral-800 group-hover:text-gov-blue transition-colors">{{ item.title }}</p>
                  <p class="text-xs text-neutral-500 mt-0.5">{{ item.desc }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p :class="[
                    'text-xs font-medium',
                    item.type === 'urgent' ? 'text-red-500' :
                    item.type === 'warning' ? 'text-amber-500' : 'text-blue-500'
                  ]">{{ item.time }}</p>
                  <ChevronRight class="w-4 h-4 text-neutral-300 ml-auto mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <Sparkles class="w-5 h-5 text-gov-blue" />
                常用服务
              </h2>
              <button class="text-xs text-gov-blue hover:underline">更多</button>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div
                v-for="service in favoriteServices"
                :key="service.id"
                @click="goToService(service.id)"
                class="flex flex-col items-center p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
              >
                <div :class="[
                  'w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform',
                  service.bgColor
                ]">
                  <component :is="service.icon" :class="['w-6 h-6', service.iconColor]" />
                </div>
                <span class="text-xs text-neutral-700 text-center leading-tight">{{ service.name }}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-lg font-semibold text-neutral-800 flex items-center gap-2">
                <FileText class="w-5 h-5 text-gov-blue" />
                最近办理
              </h2>
              <button @click="goToApplications('all')" class="text-xs text-gov-blue hover:underline">全部</button>
            </div>
            <div class="space-y-3">
              <div
                v-for="app in recentApplications"
                :key="app.id"
                @click="goToApplicationDetail(app.id)"
                class="p-3 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors border border-neutral-100"
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <h3 class="text-sm font-medium text-neutral-800 line-clamp-1 flex-1">{{ app.serviceName }}</h3>
                  <span :class="[
                    'tag text-xs flex-shrink-0',
                    getStatusTagClass(app.status)
                  ]">{{ getStatusText(app.status) }}</span>
                </div>
                <p class="text-xs text-neutral-500 mb-2">受理号：{{ app.applyNo }}</p>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-neutral-400">{{ formatDate(app.submitTime) }}</span>
                  <span v-if="canContinue(app.status)" class="text-xs text-gov-blue font-medium flex items-center gap-0.5">
                    继续办理
                    <ArrowRight class="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
            <button
              v-if="recentApplications.length === 0"
              @click="goToServices"
              class="w-full mt-4 py-3 border border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500 hover:border-gov-blue hover:text-gov-blue transition-colors"
            >
              暂无办件，去办理服务
            </button>
          </div>

          <div class="card bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <h3 class="font-semibold mb-1">智能推荐</h3>
            <p class="text-sm text-blue-100 mb-4">基于您的使用习惯推荐</p>
            <div class="space-y-2">
              <div class="flex items-center gap-3 p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Calculator class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">社保计算器</p>
                  <p class="text-xs text-blue-200">快速计算养老金</p>
                </div>
                <ChevronRight class="w-4 h-4 text-white/50" />
              </div>
              <div class="flex items-center gap-3 p-3 bg-white/10 backdrop-blur rounded-xl hover:bg-white/20 cursor-pointer transition-colors">
                <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <FileText class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium">异地就医备案</p>
                  <p class="text-xs text-blue-200">即时办结</p>
                </div>
                <ChevronRight class="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="ssoDialogVisible"
      :title="ssoDialogTitle"
      width="480px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="py-8 text-center">
        <div v-if="ssoLoading" class="mb-6">
          <div class="w-20 h-20 mx-auto mb-4 relative">
            <div class="absolute inset-0 rounded-full border-4 border-gov-blue/20"></div>
            <div class="absolute inset-0 rounded-full border-4 border-gov-blue border-t-transparent animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <component :is="ssoIcon" class="w-8 h-8 text-gov-blue" />
            </div>
          </div>
          <p class="text-lg font-medium text-neutral-800 mb-2">正在跳转至{{ ssoSystemName }}...</p>
          <p class="text-sm text-neutral-500">正在为您建立安全连接，请稍候</p>
        </div>
        <div v-else class="mb-6">
          <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle class="w-10 h-10 text-green-500" />
          </div>
          <p class="text-lg font-medium text-neutral-800 mb-2">跳转成功</p>
          <p class="text-sm text-neutral-500">您已成功登录{{ ssoSystemName }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-center gap-3">
          <el-button v-if="!ssoLoading" @click="ssoDialogVisible = false">
            我知道了
          </el-button>
          <el-button v-if="!ssoLoading" type="primary">
            前往系统
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useApplicationStore } from '@/stores/application'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  BadgeCheck,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  Clock,
  CheckCircle,
  CreditCard,
  MessageCircle,
  AlertTriangle,
  Database,
  ChevronRight,
  Building2,
  Building,
  Heart,
  GraduationCap,
  Car,
  FileText,
  Sparkles,
  ArrowRight,
  Calculator,
  ExternalLink,
  FileCheck,
  Star,
  User,
} from 'lucide-vue-next'
import { mockUserProfile } from '@/mock/data/profile'
import { mockApplications } from '@/mock/data/applications'
import type { Application, ApplicationStatus, UserProfile } from '@/types'

const router = useRouter()
const userStore = useUserStore()
const applicationStore = useApplicationStore()

const activeDataTab = ref('social')
const ssoDialogVisible = ref(false)
const ssoLoading = ref(false)
const ssoSystemName = ref('')
const ssoDialogTitle = ref('')
const ssoIcon = ref(Building2)

const userProfile = ref<UserProfile>(mockUserProfile)

const dataTabs = [
  { key: 'social', label: '社保', icon: ShieldCheck },
  { key: 'medical', label: '医保', icon: Heart },
  { key: 'fund', label: '公积金', icon: Building },
  { key: 'education', label: '学籍', icon: GraduationCap },
  { key: 'driver', label: '驾驶证', icon: Car },
]

const stats = computed(() => ({
  pending: mockApplications.filter(a => a.status === 'submitted').length,
  processing: mockApplications.filter(a => ['accepted', 'reviewing', 'supplement'].includes(a.status)).length,
  completed: mockApplications.filter(a => a.status === 'completed').length,
  rejected: mockApplications.filter(a => a.status === 'rejected').length,
}))

const licenseCount = 6
const complaintCount = 3
const medicalReimburseCount = 12

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 17) return '下午好'
  if (hour < 19) return '傍晚好'
  return '晚上好'
})

const authLevelText = computed(() => {
  if (userStore.userInfo?.verified) return 'L4 实名认证'
  return 'L2 基础认证'
})

const todoList = [
  {
    id: 1,
    type: 'urgent',
    icon: AlertTriangle,
    title: '公积金提取申请需补件',
    desc: '请补充租房合同原件扫描件',
    time: '剩余 2 天',
    action: 'application',
    actionId: 'a_003',
  },
  {
    id: 2,
    type: 'warning',
    icon: Clock,
    title: '驾驶证即将到期',
    desc: '您的驾驶证将于30天后到期',
    time: '剩余 30 天',
    action: 'service',
    actionId: 'driver_renewal',
  },
  {
    id: 3,
    type: 'info',
    icon: FileCheck,
    title: '社保卡办理待评价',
    desc: '办理完成，邀请您评价服务',
    time: '可评价',
    action: 'evaluation',
    actionId: 'a_002',
  },
]

const favoriteServices = [
  { id: 's_001', name: '养老保险', icon: ShieldCheck, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 's_002', name: '社保卡办理', icon: CreditCard, bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { id: 's_006', name: '公积金提取', icon: Building, bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
  { id: 's_003', name: '医保参保', icon: Heart, bgColor: 'bg-rose-100', iconColor: 'text-rose-600' },
  { id: 's_010', name: '营业执照', icon: FileText, bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
  { id: 's_011', name: '身份证补办', icon: User, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
]

const recentApplications = computed(() => {
  return mockApplications
    .filter(a => a.userId === 'u_001')
    .slice(0, 5)
})

function getStatusText(status: ApplicationStatus | string | undefined) {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '待受理',
    accepted: '已受理',
    reviewing: '审核中',
    supplement: '待补件',
    approved: '已通过',
    rejected: '已退回',
    completed: '已办结',
    cancelled: '已取消',
    normal: '正常缴费',
    suspended: '已暂停',
    terminated: '已终止',
    studying: '在读',
    graduated: '已毕业',
    sealed: '已封存',
    transferred: '已转移',
  }
  return map[status || ''] || status || '-'
}

function getStatusTagClass(status: ApplicationStatus) {
  const map: Record<string, string> = {
    draft: 'tag-default',
    submitted: 'tag-warning',
    accepted: 'tag-primary',
    reviewing: 'tag-primary',
    supplement: 'tag-warning',
    approved: 'tag-success',
    rejected: 'tag-danger',
    completed: 'tag-success',
    cancelled: 'tag-default',
  }
  return map[status] || 'tag-default'
}

function canContinue(status: ApplicationStatus) {
  return ['draft', 'supplement', 'submitted'].includes(status)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.slice(5, 16).replace(' ', ' ')
}

function goToApplications(status?: string) {
  if (status && status !== 'all') {
    router.push({ path: '/my-applications', query: { status } })
  } else {
    router.push('/my-applications')
  }
}

function goToApplicationDetail(id: string) {
  router.push(`/my-applications?id=${id}`)
}

function goToLicenses() {
  router.push('/profile/licenses')
}

function goToComplaints() {
  router.push('/complaints')
}

function goToProfile(tab?: string) {
  if (tab) {
    router.push({ path: '/profile', query: { tab } })
  } else {
    router.push('/profile')
  }
}

function goToServices() {
  router.push('/services')
}

function goToService(id: string) {
  router.push(`/services/${id}`)
}

function goToNotifications() {
  ElMessage.info('消息中心开发中')
}

function goToSettings() {
  ElMessage.info('设置页面开发中')
}

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/')
    })
    .catch(() => {})
}

function handleTodoClick(item: typeof todoList[0]) {
  if (item.action === 'application') {
    goToApplicationDetail(item.actionId)
  } else if (item.action === 'service') {
    goToService(item.actionId)
  } else {
    ElMessage.info('评价功能开发中')
  }
}

const ssoSystemMap: Record<string, { name: string; title: string; icon: any }> = {
  social: { name: '人社系统', title: '社保服务平台', icon: ShieldCheck },
  medical: { name: '医保系统', title: '医保服务平台', icon: Heart },
  fund: { name: '公积金系统', title: '住房公积金管理中心', icon: Building },
  education: { name: '教育学籍系统', title: '教育服务平台', icon: GraduationCap },
  driver: { name: '交管系统', title: '交通安全综合服务平台', icon: Car },
}

function handleSsoJump(type: string) {
  const sysInfo = ssoSystemMap[type]
  if (!sysInfo) return

  ssoSystemName.value = sysInfo.name
  ssoDialogTitle.value = sysInfo.title
  ssoIcon.value = sysInfo.icon
  ssoLoading.value = true
  ssoDialogVisible.value = true

  setTimeout(() => {
    ssoLoading.value = false
  }, 2000)
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    applicationStore.fetchStats(userStore.userInfo?.id)
  }
})
</script>
