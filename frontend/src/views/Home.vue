<template>
  <div class="home-page page-container">
    <van-loading v-if="loading" class="page-loading" vertical>加载中...</van-loading>

    <div v-else class="home-content">
      <div class="page-header">
        <div class="user-info">
          <div class="avatar-wrap">
            <div class="avatar">{{ userStore.userInfo?.real_name?.[0] || '用' }}</div>
            <div class="auth-badge" :class="authLevelClass">
              {{ authLevelText }}
            </div>
          </div>
          <div class="user-detail">
            <div class="greeting">
              {{ greeting }}，{{ userStore.userInfo?.real_name || '用户' }}
              <van-tag v-if="authStatus === 'stepup'" type="success" size="medium" plain>已二次认证</van-tag>
              <van-tag v-else-if="authStatus === 'verified'" type="success" size="medium">已实名认证</van-tag>
            </div>
            <div class="auth-source">
              <van-icon name="shield-o" size="12" />
              <span>{{ authSourceText }}</span>
              <span class="dot">•</span>
              <span class="region" @click="showProvincePicker = true">
                <van-icon name="location-o" size="12" />
                {{ userStore.userInfo?.province || '选择属地' }}
                <van-icon name="arrow-down" size="10" />
              </span>
            </div>
          </div>
          <div class="badge" @click="router.push('/profile/notifications')">
            <van-icon name="bell-o" size="22" />
            <van-badge v-if="todos.unread_notifications > 0" :content="todos.unread_notifications" :max="99" />
          </div>
        </div>

        <div class="auth-card">
          <div class="auth-card-item" @click="router.push('/profile/auth')">
            <div class="auth-icon">
              <van-icon name="idcard-o" size="20" />
            </div>
            <div class="auth-info">
              <div class="auth-label">电子社保卡</div>
              <div class="auth-value">{{ userStore.userInfo?.id_card?.slice(-4) || '****' }}</div>
            </div>
            <van-icon name="arrow" size="12" />
          </div>
          <div class="auth-divider"></div>
          <div class="auth-card-item" @click="router.push('/profile/stepup')">
            <div class="auth-icon">
              <van-icon name="fingerprint-o" size="20" />
            </div>
            <div class="auth-info">
              <div class="auth-label">二次认证</div>
              <div class="auth-value" :class="{ 'text-success': authStatus === 'stepup' }">
                {{ authStatus === 'stepup' ? '已完成' : '未启用' }}
              </div>
            </div>
            <van-icon name="arrow" size="12" />
          </div>
        </div>
      </div>

      <van-swipe class="banner" :autoplay="3000" indicator-color="#fff">
        <van-swipe-item v-for="banner in banners" :key="banner.id">
          <div class="banner-item" @click="router.push(banner.link)">
            <div class="banner-title">{{ banner.title }}</div>
            <div class="banner-desc">{{ banner.description }}</div>
          </div>
        </van-swipe-item>
      </van-swipe>

      <div class="probe-entry card">
        <div>
          <div class="probe-title">业务复验入口</div>
          <div class="probe-desc">登录注册、搜索结果、服务详情、个人中心和后台管理均可直接进入。</div>
        </div>
        <div class="probe-actions">
          <van-button size="small" type="primary" plain @click="router.push('/login')">登录注册</van-button>
          <van-button size="small" type="primary" plain @click="router.push('/services')">搜索筛选</van-button>
          <van-button size="small" type="primary" plain @click="router.push('/service/pension_verify')">详情</van-button>
          <van-button size="small" type="primary" plain @click="router.push('/profile')">个人中心</van-button>
          <van-button size="small" type="primary" plain @click="router.push('/profile/audit')">后台管理</van-button>
        </div>
      </div>

      <div class="core-services card">
        <div class="card-title flex-between">
          <span>核心服务</span>
          <span class="text-secondary text-sm" @click="router.push('/services')">全部 ></span>
        </div>
        <van-grid :column-num="3" :border="false">
          <van-grid-item
            v-for="service in coreServices"
            :key="service.code"
            @click="goToService(service)"
          >
            <div class="core-service-icon" :style="{ background: getIconBg(service.category) }">
              <span>{{ getServiceMark(service.category) }}</span>
            </div>
            <div class="core-service-name">{{ service.name }}</div>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="quick-services card">
        <div class="card-title flex-between">
          <span>快捷服务</span>
          <span class="text-secondary text-sm" @click="router.push('/services')">更多 ></span>
        </div>
        <van-grid :column-num="4" :border="false">
          <van-grid-item
            v-for="service in hotServices.quick_services"
            :key="service.code"
            @click="goToService(service)"
          >
            <div class="grid-icon" :style="{ background: getIconBg(service.category) }">
              <span>{{ getServiceMark(service.category) }}</span>
            </div>
            <div class="service-name">
              {{ service.name }}
              <span v-if="service.is_hot" class="hot-tag">HOT</span>
            </div>
          </van-grid-item>
        </van-grid>
      </div>

      <div class="todo-section card">
        <div class="card-title flex-between">
          <span>待办事项</span>
          <span class="text-secondary text-sm" @click="router.push('/profile/records')">全部待办 ></span>
        </div>
        <div v-if="todos.todos.length === 0" class="empty-todo">
          <van-icon name="checked" size="24" />
          <div>暂无待办事项</div>
        </div>
        <div v-for="todo in todos.todos.slice(0, 3)" :key="todo.id" class="todo-item" @click="handleTodoClick(todo)">
          <div class="todo-dot"></div>
          <div class="todo-content">
            <div class="todo-title">{{ todo.title }}</div>
            <div class="todo-desc">{{ todo.description }}</div>
          </div>
          <div class="todo-action">
            <van-tag type="warning" size="small">{{ todo.type }}</van-tag>
            <van-icon name="arrow" size="12" class="todo-arrow" />
          </div>
        </div>
      </div>

      <div class="section-title">
        <span>为您推荐</span>
        <span class="more" @click="router.push('/news')">更多 ></span>
      </div>
      <div v-if="policies.length === 0" class="empty-policy">
        <van-icon name="file-text-o" size="24" />
        <div>暂无推荐政策</div>
      </div>
      <div v-else class="policy-list">
        <div
          v-for="policy in policies"
          :key="policy.id"
          class="policy-item"
          @click="router.push(`/news/${policy.id}`)"
        >
          <div class="policy-content">
            <div class="policy-title">
              {{ policy.title }}
              <van-tag v-if="policy.is_top" type="danger" size="small">置顶</van-tag>
              <van-tag v-else-if="policy.is_hot" type="danger" size="small">热门</van-tag>
            </div>
            <div class="policy-meta">
              <span>{{ policy.publisher }}</span>
              <span>{{ policy.publish_date }}</span>
              <span>{{ policy.views }} 阅读</span>
            </div>
          </div>
          <van-icon name="arrow" />
        </div>
      </div>
    </div>

    <van-popup v-model:show="showProvincePicker" position="bottom" :style="{ height: '50%' }">
      <van-picker
        :columns="provinceColumns"
        @confirm="onProvinceConfirm"
        title="选择属地"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useUserStore } from '@/store/user';
import { getRecommendPolicies, getHotServices, getTodos, getBanners, getProvinces, setProvince } from '@/api/home';

const router = useRouter();
const userStore = useUserStore();

const loading = ref(true);
const banners = ref([]);
const hotServices = ref({ hot_services: [], quick_services: [], all_services: [] });
const policies = ref([]);
const todos = ref({ todos: [], unread_notifications: 0, pending_services: 0 });
const provinces = ref([]);
const showProvincePicker = ref(false);

const coreServices = computed(() => {
  return [
    { code: 'pension_verify', name: '养老金认证', category: '养老' },
    { code: 'medical_record', name: '异地就医备案', category: '医疗' },
    { code: 'social_transfer', name: '社保关系转移', category: '社保' },
    { code: 'unemployment', name: '失业金申领', category: '失业' },
    { code: 'cert_query', name: '职业证书查询', category: '证书' },
    { code: 'labor_report', name: '劳动权益保障', category: '维权' },
  ];
});

const authLevelClass = computed(() => {
  const level = userStore.userInfo?.auth_level || 1;
  return level >= 2 ? 'auth-level-2' : 'auth-level-1';
});

const authLevelText = computed(() => {
  const level = userStore.userInfo?.auth_level || 1;
  return level >= 2 ? 'L2' : 'L1';
});

const authStatus = computed(() => {
  const level = userStore.userInfo?.auth_level || 1;
  if (level >= 3) return 'stepup';
  if (level >= 2) return 'verified';
  return 'basic';
});

const authSourceText = computed(() => {
  return '国家政务服务平台认证';
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

const provinceColumns = computed(() => {
  return provinces.value.map(p => ({ text: p.name, value: p.code }));
});

const getIconBg = (category) => {
  const colors = {
    '养老': 'linear-gradient(135deg, #ff9a9e, #fecfef)',
    '医疗': 'linear-gradient(135deg, #a8edea, #fed6e3)',
    '社保': 'linear-gradient(135deg, #667eea, #764ba2)',
    '失业': 'linear-gradient(135deg, #f093fb, #f5576c)',
    '证书': 'linear-gradient(135deg, #4facfe, #00f2fe)',
    '维权': 'linear-gradient(135deg, #43e97b, #38f9d7)',
    '就业': 'linear-gradient(135deg, #fa709a, #fee140)',
  };
  return colors[category] || 'linear-gradient(135deg, #667eea, #764ba2)';
};

const getServiceMark = (category) => {
  const marks = {
    '养老': '养',
    '医疗': '医',
    '社保': '保',
    '失业': '业',
    '证书': '证',
    '维权': '权',
    '就业': '就',
  };
  return marks[category] || '服';
};

const goToService = (service) => {
  router.push(`/service/${service.code}`);
};

const todoServiceMap = {
  '养老': 'pension_verify',
  '医疗': 'medical_record',
  '社保': 'social_transfer',
  '失业': 'unemployment',
  '证书': 'cert_query',
  '维权': 'labor_report',
  '系统': '/profile/records',
  '运营': '/profile/records',
  '运维': '/profile/records',
};

const handleTodoClick = (todo) => {
  const target = todoServiceMap[todo.type];
  if (target) {
    if (target.startsWith('/')) {
      router.push(target);
    } else {
      router.push(`/service/${target}?todoId=${todo.id}`);
    }
  } else {
    router.push('/profile/records');
  }
};

const onProvinceConfirm = async ({ selectedOptions }) => {
  const province = selectedOptions[0].text;
  const res = await setProvince(province, province);
  if (res.code === 200) {
    userStore.updateUserInfo({ province, city: province });
    showToast('属地设置成功');
    showProvincePicker.value = false;
    loadData();
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const [bannerRes, servicesRes, todoRes, policyRes, provinceRes] = await Promise.all([
      getBanners(),
      getHotServices(),
      getTodos(),
      getRecommendPolicies({ pageSize: 5 }),
      getProvinces(),
    ]);
    
    if (bannerRes.code === 200) banners.value = bannerRes.data;
    if (servicesRes.code === 200) hotServices.value = servicesRes.data;
    if (todoRes.code === 200) todos.value = todoRes.data;
    if (policyRes.code === 200) policies.value = policyRes.data.list;
    if (provinceRes.code === 200) provinces.value = provinceRes.data;
  } catch (e) {
    console.error('Load data error:', e);
    showToast('数据加载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.home-page {
  background-color: #f7f8fa;
  min-height: 100vh;
}

.page-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

.home-content {
  padding-bottom: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-wrap {
  position: relative;
}

.avatar {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.auth-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #fff;
  border: 2px solid #1989fa;
}

.auth-badge.auth-level-1 {
  background: #ff976a;
  border-color: #ff976a;
}

.auth-badge.auth-level-2 {
  background: #07c160;
  border-color: #07c160;
}

.user-detail {
  flex: 1;
}

.greeting {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.auth-source {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.9;
}

.auth-source .dot {
  opacity: 0.5;
}

.region {
  display: flex;
  align-items: center;
  gap: 4px;
}

.badge {
  position: relative;
  padding: 8px;
}

.auth-card {
  margin-top: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
}

.auth-card-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.auth-divider {
  width: 1px;
  height: 30px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 12px;
}

.auth-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.auth-info {
  flex: 1;
}

.auth-label {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 2px;
}

.auth-value {
  font-size: 14px;
  font-weight: 600;
}

.auth-value.text-success {
  color: #07c160;
}

.banner {
  margin: -30px 16px 0;
  border-radius: 12px;
  overflow: hidden;
  height: 120px;
}

.banner-item {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px;
  color: #fff;
}

.banner-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.banner-desc {
  font-size: 13px;
  opacity: 0.9;
}

.banner-item:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.banner-item:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.grid-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 6px;
}

.service-name {
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.core-service-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  margin: 0 auto 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.core-service-name {
  font-size: 13px;
  color: #323233;
  font-weight: 500;
}

.hot-tag {
  background: #ee0a24;
  color: #fff;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
  transition: background 0.2s;
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-item:active {
  background: #f7f8fa;
}

.todo-action {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.todo-arrow {
  color: #c8c9cc;
}

.todo-dot {
  width: 8px;
  height: 8px;
  background: #ee0a24;
  border-radius: 50%;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
}

.todo-title {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.todo-desc {
  font-size: 12px;
  color: #969799;
}

.empty-todo {
  text-align: center;
  padding: 20px;
  color: #c8c9cc;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-policy {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: #c8c9cc;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.policy-list {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  overflow: hidden;
}

.policy-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #ebedf0;
}

.policy-item:last-child {
  border-bottom: none;
}

.policy-content {
  flex: 1;
}

.policy-title {
  font-size: 15px;
  color: #323233;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.policy-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #969799;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.section-title .more {
  font-size: 12px;
  color: #969799;
  font-weight: normal;
}

.text-sm {
  font-size: 12px;
}

.text-secondary {
  color: #969799;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}

.probe-entry {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.probe-title {
  font-size: 16px;
  font-weight: 700;
  color: #323233;
}

.probe-desc {
  margin-top: 4px;
  color: #7d8797;
  font-size: 12px;
  line-height: 1.5;
}

.probe-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 16px 60px;
  color: #fff;
}
</style>
