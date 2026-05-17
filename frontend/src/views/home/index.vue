<template>
  <div class="page-container home-page">
    <div class="page-header">
      <div class="header-top">
        <div>
          <div class="title">FITLIFE</div>
          <div class="subtitle">让运动成为习惯</div>
        </div>
        <div class="user-avatar" @click="goToMy">
          <van-icon name="user-o" size="24" />
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else-if="error" class="error-container" @click="fetchData">
      <van-icon name="warning-o" size="48" color="#999" />
      <p>加载失败，点击重试</p>
    </div>
    
    <div v-else class="home-content">
      <van-swipe class="banner-swipe" :autoplay="3000" indicator-color="white">
        <van-swipe-item v-for="(banner, index) in homeData.banners" :key="banner.id">
          <div :class="['banner-img', 'banner-' + (index + 1)]">
            <div class="banner-title">{{ banner.title }}</div>
          </div>
        </van-swipe-item>
      </van-swipe>
      
      <div class="category-grid">
        <div
          v-for="item in homeData.categories"
          :key="item.id"
          class="category-item"
          @click="navigateTo(item.link)"
        >
          <div class="category-icon">{{ item.icon }}</div>
          <div class="category-name">{{ item.name }}</div>
        </div>
      </div>
      
      <div class="section-title">热门课程</div>
      <div class="class-list">
        <div
          v-for="(cls, index) in homeData.hotClasses"
          :key="cls.id"
          class="class-card card-shadow"
          @click="goToClassDetail(cls.id)"
        >
          <div :class="['class-cover', 'class-cover-' + ((index % 4) + 1)]">
            <span class="class-icon">{{ getClassIcon(cls.name) }}</span>
          </div>
          <div class="class-info">
            <div class="class-name">{{ cls.name }}</div>
            <div class="class-desc">{{ cls.description }}</div>
            <div class="class-meta">
              <span>{{ cls.duration }}分钟</span>
              <span>难度 {{ '⭐'.repeat(cls.difficulty) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="section-title">推荐教练</div>
      <div class="coach-list">
        <div
          v-for="(coach, index) in homeData.recommendCoaches"
          :key="coach.id"
          class="coach-card card-shadow"
          @click="goToCoachDetail(coach.id)"
        >
          <div :class="['coach-avatar', 'coach-avatar-' + ((index % 3) + 1)]">
            <span class="coach-icon">{{ getCoachInitial(coach.name) }}</span>
          </div>
          <div class="coach-info">
            <div class="coach-name">{{ coach.name }}</div>
            <div class="coach-title">{{ coach.title }}</div>
            <div class="coach-price">¥{{ coach.price }}/课时</div>
          </div>
        </div>
      </div>
    </div>
    
    <van-tabbar v-model:active="activeTabbar" active-color="#667eea">
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/group-classes" icon="orders-o">团课</van-tabbar-item>
      <van-tabbar-item to="/coaches" icon="user-o">私教</van-tabbar-item>
      <van-tabbar-item to="/cards" icon="gift-o">购卡</van-tabbar-item>
      <van-tabbar-item to="/my" icon="manager-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import request from '../../utils/request';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const error = ref(false);
const activeTab = ref(route.path);
const homeData = ref({
  banners: [],
  categories: [],
  hotClasses: [],
  recommendCoaches: []
});

async function fetchData() {
  try {
    loading.value = true;
    error.value = false;
    const res = await request.get('/home/data');
    homeData.value = res.data;
  } catch (err) {
    error.value = true;
    console.error('获取首页数据失败:', err);
  } finally {
    loading.value = false;
  }
}

function navigateTo(link) {
  router.push(link);
}

function goToClassDetail(id) {
  router.push(`/group-class/${id}`);
}

function goToCoachDetail(id) {
  router.push(`/coach/${id}`);
}

function goToMy() {
  router.push('/my');
}

function getClassIcon(name) {
  const iconMap = {
    '瑜伽入门': '🧘',
    '动感单车': '🚴',
    '力量训练': '💪',
    'HIIT燃脂': '🔥',
    '普拉提': '🏋️'
  };
  return iconMap[name] || '🏃';
}

function getCoachInitial(name) {
  return name.charAt(0);
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.home-page {
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
}

.banner-swipe {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
  height: 160px;
  
  .banner-img {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .banner-title {
      font-size: 24px;
      font-weight: bold;
      color: white;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }
  
  .banner-1 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  
  .banner-2 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
  
  .banner-3 {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  padding: 16px;
  gap: 16px;
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  
  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .category-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    .category-name {
      font-size: 12px;
      color: #333;
    }
  }
}

.class-list {
  padding: 0 16px;
  
  .class-card {
    display: flex;
    margin-bottom: 12px;
    overflow: hidden;
    
    .class-cover {
      width: 120px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .class-icon {
        font-size: 36px;
      }
    }
    
    .class-cover-1 {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    }
    
    .class-cover-2 {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    }
    
    .class-cover-3 {
      background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
    }
    
    .class-cover-4 {
      background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
    }
    
    .class-info {
      flex: 1;
      padding: 12px;
      
      .class-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
      }
      
      .class-desc {
        font-size: 12px;
        color: #999;
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .class-meta {
        font-size: 11px;
        color: #666;
        display: flex;
        gap: 12px;
      }
    }
  }
}

.coach-list {
  padding: 0 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  
  .coach-card {
    padding: 16px;
    text-align: center;
    
    .coach-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      margin: 0 auto 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .coach-icon {
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
    }
    
    .coach-avatar-1 {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .coach-avatar-2 {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    
    .coach-avatar-3 {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
    
    .coach-name {
      font-size: 15px;
      font-weight: 500;
      color: #333;
      margin-bottom: 4px;
    }
    
    .coach-title {
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
    }
    
    .coach-price {
      font-size: 14px;
      color: #667eea;
      font-weight: 500;
    }
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #999;
  font-size: 14px;
}
</style>
