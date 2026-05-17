<template>
  <div class="page-container group-page">
    <div class="page-header">
      <div class="title">团课预约</div>
      <div class="subtitle">发现更多优质课程</div>
    </div>
    
    <van-tabs v-model:active="activeTab" color="#667eea">
      <van-tab title="课程列表">
        <div v-if="loading" class="loading-container">
          <van-loading type="spinner" color="#667eea" />
        </div>
        
        <div v-else-if="!classList.length" class="empty-container">
          <div class="empty-icon">📅</div>
          <div class="empty-text">暂无课程</div>
        </div>
        
        <div v-else class="schedule-list">
          <div
            v-for="(schedule, index) in scheduleList"
            :key="schedule.id"
            class="schedule-card card-shadow"
            @click="goToDetail(schedule.class_id)"
          >
            <div :class="['schedule-cover', 'schedule-cover-' + ((index % 4) + 1)]">
              <span class="schedule-icon">{{ getClassIcon(schedule.class_name) }}</span>
            </div>
            <div class="schedule-info">
              <div class="schedule-name">{{ schedule.class_name }}</div>
              <div class="schedule-coach">教练: {{ schedule.coach_name }}</div>
              <div class="schedule-time">
                <van-icon name="clock-o" />
                {{ schedule.start_time }}
              </div>
              <div class="schedule-store">
                <van-icon name="location-o" />
                {{ schedule.store_name }}
              </div>
            </div>
            <div class="schedule-book">
              <div class="booked-count">
                {{ schedule.booked_count }}/{{ schedule.capacity }}
              </div>
              <van-button
                type="primary"
                size="small"
                class="book-btn"
                @click.stop="bookClass(schedule.id)"
                :disabled="schedule.booked_count >= schedule.capacity"
              >
                {{ schedule.booked_count >= schedule.capacity ? '已满' : '预约' }}
              </van-button>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
    
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
import { showToast, showConfirmDialog } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const activeTab = ref(0);
const activeTabbar = ref(route.path);
const scheduleList = ref([]);
const classList = ref([]);

async function fetchData() {
  try {
    loading.value = true;
    const res = await request.get('/group/classes');
    scheduleList.value = res.data.schedules || [];
    classList.value = res.data.classes || [];
  } catch (err) {
    console.error('获取团课列表失败:', err);
  } finally {
    loading.value = false;
  }
}

function goToDetail(id) {
  router.push(`/group-class/${id}`);
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

async function bookClass(scheduleId) {
  const token = localStorage.getItem('fitlife_token');
  if (!token) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  
  try {
    await showConfirmDialog({
      title: '确认预约',
      message: '确定要预约该课程吗？'
    });
    
    await request.post('/group/book', { scheduleId });
    showToast('预约成功');
    fetchData();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('预约失败:', err);
    }
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.group-page {
  .schedule-list {
    padding: 16px;
  }
  
  .schedule-card {
    display: flex;
    margin-bottom: 12px;
    padding: 12px;
    position: relative;
    
    .schedule-cover {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      .schedule-icon {
        font-size: 32px;
      }
    }
    
    .schedule-cover-1 {
      background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    }
    
    .schedule-cover-2 {
      background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    }
    
    .schedule-cover-3 {
      background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%);
    }
    
    .schedule-cover-4 {
      background: linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);
    }
    
    .schedule-info {
      flex: 1;
      
      .schedule-name {
        font-size: 15px;
        font-weight: 500;
        color: #333;
        margin-bottom: 6px;
      }
      
      .schedule-coach {
        font-size: 12px;
        color: #666;
        margin-bottom: 4px;
      }
      
      .schedule-time,
      .schedule-store {
        font-size: 11px;
        color: #999;
        margin-bottom: 2px;
      }
    }
    
    .schedule-book {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      
      .booked-count {
        font-size: 11px;
        color: #667eea;
      }
      
      .book-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 15px;
        padding: 0 16px;
        font-size: 12px;
      }
    }
  }
}
</style>
