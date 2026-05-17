<template>
  <div class="page-container class-detail-page">
    <van-nav-bar
      title="课程详情"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else-if="!classInfo.id" class="empty-container">
      <div class="empty-icon">😕</div>
      <div class="empty-text">课程不存在</div>
    </div>
    
    <div v-else class="detail-content">
      <div class="detail-cover">
        <span class="cover-icon">{{ getClassIcon(classInfo.name) }}</span>
      </div>
      
      <div class="detail-header card-shadow">
        <h1 class="class-name">{{ classInfo.name }}</h1>
        <div class="class-meta">
          <span>{{ classInfo.duration }}分钟</span>
          <span>难度 {{ '⭐'.repeat(classInfo.difficulty) }}</span>
        </div>
        <p class="class-desc">{{ classInfo.description }}</p>
      </div>
      
      <div class="section-title">可预约场次</div>
      <div class="schedule-list">
        <div
          v-for="schedule in schedules"
          :key="schedule.id"
          class="schedule-item card-shadow"
        >
          <div class="schedule-info">
            <div class="schedule-time">
              <van-icon name="clock-o" />
              {{ schedule.start_time }} - {{ schedule.end_time }}
            </div>
            <div class="schedule-store">
              <van-icon name="location-o" />
              {{ schedule.store_name }}
            </div>
            <div class="schedule-coach">教练: {{ schedule.coach_name }}</div>
          </div>
          <div class="schedule-action">
            <div class="booked-count">
              {{ schedule.booked_count }}/{{ schedule.capacity }}人
            </div>
            <van-button
              type="primary"
              size="small"
              class="book-btn"
              @click="bookClass(schedule.id)"
              :disabled="schedule.booked_count >= schedule.capacity"
              :loading="bookingId === schedule.id"
            >
              {{ schedule.booked_count >= schedule.capacity ? '已满' : '预约' }}
            </van-button>
          </div>
        </div>
        
        <div v-if="!schedules.length" class="empty-schedule">
          <p>暂无可用场次</p>
        </div>
      </div>
    </div>
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
const bookingId = ref(null);
const classInfo = ref({});
const schedules = ref([]);

async function fetchData() {
  try {
    loading.value = true;
    const res = await request.get(`/group/class/${route.params.id}`);
    classInfo.value = res.data.class;
    schedules.value = res.data.schedules || [];
  } catch (err) {
    console.error('获取课程详情失败:', err);
  } finally {
    loading.value = false;
  }
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
    
    bookingId.value = scheduleId;
    await request.post('/group/book', { scheduleId });
    showToast('预约成功');
    fetchData();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('预约失败:', err);
    }
  } finally {
    bookingId.value = null;
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.class-detail-page {
  .detail-cover {
    width: 100%;
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    
    .cover-icon {
      font-size: 64px;
    }
  }
  
  .detail-header {
    margin: -30px 16px 16px;
    padding: 20px;
    position: relative;
    z-index: 1;
    
    .class-name {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 12px;
    }
    
    .class-meta {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #667eea;
      margin-bottom: 12px;
    }
    
    .class-desc {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
  }
  
  .schedule-list {
    padding: 0 16px;
    
    .schedule-item {
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .schedule-info {
        flex: 1;
        
        .schedule-time,
        .schedule-store,
        .schedule-coach {
          font-size: 13px;
          color: #666;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }
      
      .schedule-action {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        
        .booked-count {
          font-size: 12px;
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
    
    .empty-schedule {
      text-align: center;
      padding: 40px;
      color: #999;
      font-size: 14px;
    }
  }
}
</style>
