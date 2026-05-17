<template>
  <div class="page-container coach-page">
    <div class="page-header">
      <div class="title">私教预约</div>
      <div class="subtitle">专业教练一对一指导</div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else class="coach-list">
      <div
        v-for="(coach, index) in coachList"
        :key="coach.id"
        class="coach-card card-shadow"
        @click="goToDetail(coach.id)"
      >
        <div :class="['coach-avatar', 'coach-avatar-' + ((index % 3) + 1)]">
          <span class="coach-icon">{{ coach.name.charAt(0) }}</span>
        </div>
        <div class="coach-info">
          <div class="coach-name">
            {{ coach.name }}
            <span class="coach-rating">⭐ {{ coach.rating }}</span>
          </div>
          <div class="coach-title">{{ coach.title }}</div>
          <div class="coach-specialty">擅长: {{ coach.specialty }}</div>
          <div class="coach-desc">{{ coach.description }}</div>
        </div>
        <div class="coach-price">
          ¥{{ coach.price }}
          <span class="price-unit">/课时</span>
        </div>
      </div>
      
      <div v-if="!coachList.length" class="empty-container">
        <div class="empty-icon">🏋️</div>
        <div class="empty-text">暂无教练</div>
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
const activeTabbar = ref(route.path);
const coachList = ref([]);

async function fetchData() {
  try {
    loading.value = true;
    const res = await request.get('/coach/coaches');
    coachList.value = res.data || [];
  } catch (err) {
    console.error('获取教练列表失败:', err);
  } finally {
    loading.value = false;
  }
}

function goToDetail(id) {
  router.push(`/coach/${id}`);
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.coach-page {
  .coach-list {
    padding: 16px;
  }
  
  .coach-card {
    display: flex;
    padding: 16px;
    margin-bottom: 12px;
    position: relative;
    
    .coach-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      margin-right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .coach-icon {
        font-size: 28px;
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
    
    .coach-info {
      flex: 1;
      
      .coach-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .coach-rating {
          font-size: 12px;
          color: #ff9800;
        }
      }
      
      .coach-title {
        font-size: 12px;
        color: #667eea;
        margin-bottom: 6px;
      }
      
      .coach-specialty {
        font-size: 11px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .coach-desc {
        font-size: 11px;
        color: #bbb;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 180px;
      }
    }
    
    .coach-price {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      font-size: 20px;
      font-weight: bold;
      color: #667eea;
      
      .price-unit {
        font-size: 11px;
        color: #999;
        font-weight: normal;
      }
    }
  }
}
</style>
