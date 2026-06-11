<template>
  <div class="services-page page-container">
    <div class="page-header">
      <div class="page-title-row">
        <div>
          <div class="page-title">服务大厅</div>
          <div class="page-subtitle">电子社保卡全场景服务</div>
        </div>
        <van-button size="small" plain type="primary" @click="router.push('/profile')">我的</van-button>
      </div>
    </div>

    <div class="essc-card" @click="showEsscCard">
      <div class="essc-header">
        <div class="essc-logo">
          <van-icon name="card-o" size="28" />
        </div>
        <div class="essc-info">
          <div class="essc-title">电子社保卡</div>
          <div class="essc-subtitle">社会保障号码</div>
        </div>
        <div class="essc-no">{{ socialCard.card_no || '**** **** **** ****' }}</div>
      </div>
    </div>

    <div class="service-search card">
      <van-search
        v-model="keyword"
        shape="round"
        placeholder="搜索服务、分类或关键词"
        @search="handleSearch"
        @clear="handleSearch"
      />
      <div class="service-shortcuts">
        <van-button size="small" type="primary" plain @click="router.push('/profile/records')">服务记录</van-button>
        <van-button size="small" type="primary" plain @click="router.push('/profile/audit')">后台审计</van-button>
        <van-button size="small" type="primary" plain @click="router.push('/profile/auth')">实名登录</van-button>
      </div>
    </div>

    <van-tabs v-model:active="activeCategory" sticky offset-top="0">
      <van-tab v-for="cat in categories" :key="cat" :title="cat" :name="cat" />
    </van-tabs>

    <div class="service-grid">
      <div
        v-for="service in filteredServices"
        :key="service.code"
        class="service-card"
        @click="goToService(service)"
      >
        <div class="service-icon" :style="{ background: getIconBg(service.category) }">
          {{ getServiceMark(service.category) }}
        </div>
        <div class="service-info">
          <div class="service-name">
            {{ service.name }}
            <span v-if="service.is_hot" class="hot-tag">HOT</span>
          </div>
          <div class="service-desc">{{ service.description }}</div>
        </div>
        <van-icon name="arrow" color="#c8c9cc" />
      </div>
      <div v-if="filteredServices.length === 0" class="empty-state">
        <van-icon name="search" size="36" />
        <div>暂无匹配服务</div>
      </div>
    </div>

    <van-popup v-model:show="showEssc" round position="center" :style="{ width: '90%' }">
      <div class="essc-detail">
        <div class="essc-detail-header">
          <div class="essc-detail-logo">
            <van-icon name="card-o" size="30" color="#fff" />
          </div>
          <div class="essc-detail-info">
            <div class="essc-detail-name">电子社保卡</div>
            <div class="essc-detail-no">{{ socialCard.card_no }}</div>
          </div>
        </div>
        <div class="essc-detail-body">
          <div class="essc-detail-row">
            <span>签发机构</span>
            <span>{{ socialCard.issue_office }}</span>
          </div>
          <div class="essc-detail-row">
            <span>签发日期</span>
            <span>{{ socialCard.issue_date }}</span>
          </div>
          <div class="essc-detail-row">
            <span>有效期至</span>
            <span>{{ socialCard.valid_date }}</span>
          </div>
          <div class="essc-detail-row">
            <span>账户余额</span>
            <span class="balance">¥{{ socialCard.balance?.toFixed(2) }}</span>
          </div>
        </div>
        <van-button block type="primary" @click="showEssc = false">关闭</van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getServices, getSocialCard } from '@/api/services';

const router = useRouter();

const services = ref([]);
const categories = ref([]);
const activeCategory = ref('全部');
const socialCard = ref({});
const showEssc = ref(false);
const keyword = ref('');

const filteredServices = computed(() => {
  const categoryFiltered = activeCategory.value === '全部'
    ? services.value
    : services.value.filter(s => s.category === activeCategory.value);
  const search = keyword.value.trim().toLowerCase();
  if (!search) return categoryFiltered;
  return categoryFiltered.filter((service) => {
    return [
      service.name,
      service.code,
      service.category,
      service.description,
    ].some(value => String(value || '').toLowerCase().includes(search));
  });
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

const handleSearch = () => {};

const showEsscCard = () => {
  showEssc.value = true;
};

const loadData = async () => {
  const [servicesRes, cardRes] = await Promise.all([
    getServices(),
    getSocialCard(),
  ]);
  
  if (servicesRes.code === 200) {
    services.value = servicesRes.data.list;
    categories.value = ['全部', ...servicesRes.data.categories];
  }
  if (cardRes.code === 200) {
    socialCard.value = cardRes.data;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.essc-card {
  margin: -20px 16px 16px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.essc-card::before {
  content: '';
  position: absolute;
  right: -50px;
  top: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.essc-header {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.essc-logo {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.essc-info {
  flex: 1;
}

.essc-detail {
  padding: 24px;
}

.essc-detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebedf0;
}

.essc-detail-logo {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
}

.essc-detail-info {
  flex: 1;
}

.essc-detail-name {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.essc-detail-no {
  font-size: 14px;
  color: #969799;
}

.essc-detail-body {
  margin-bottom: 24px;
}

.essc-detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 14px;
}

.essc-detail-row span:first-child {
  color: #969799;
}

.essc-detail-row .balance {
  color: #ee0a24;
  font-weight: 600;
  font-size: 16px;
}

.service-search {
  margin-top: 12px;
  padding: 8px 12px 12px;
}

.service-search :deep(.van-search) {
  padding: 0;
}

.service-shortcuts {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.service-grid {
  padding: 0 12px;
}

.service-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
}

.service-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 15px;
  color: #323233;
  font-weight: 500;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.service-desc {
  font-size: 12px;
  color: #969799;
}
</style>
