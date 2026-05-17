<template>
  <div class="page-container coach-detail-page">
    <van-nav-bar
      title="教练详情"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    
    <div v-if="loading" class="loading-container">
      <van-loading type="spinner" color="#667eea" />
    </div>
    
    <div v-else-if="!coach.id" class="empty-container">
      <div class="empty-icon">😕</div>
      <div class="empty-text">教练不存在</div>
    </div>
    
    <div v-else class="detail-content">
      <div class="coach-header card-shadow">
        <div class="coach-avatar">
          <span class="coach-icon">{{ coach.name.charAt(0) }}</span>
        </div>
        <div class="coach-info">
          <div class="coach-name">{{ coach.name }}</div>
          <div class="coach-title">{{ coach.title }}</div>
          <div class="coach-rating">⭐ {{ coach.rating }}分</div>
          <div class="coach-price">¥{{ coach.price }}/课时</div>
        </div>
      </div>
      
      <div class="coach-specialty card-shadow">
        <div class="section-title">擅长领域</div>
        <p>{{ coach.specialty }}</p>
      </div>
      
      <div class="coach-desc card-shadow">
        <div class="section-title">个人简介</div>
        <p>{{ coach.description }}</p>
      </div>
      
      <div class="schedule-section">
        <div class="section-title">可预约时间</div>
        <div class="schedule-list">
          <div v-for="day in schedules" :key="day.date" class="day-schedule">
            <div class="day-header">
              <span class="day-date">{{ day.date }}</span>
              <span class="day-week">{{ day.weekday }}</span>
            </div>
            <div class="time-slots">
              <van-button
                v-for="slot in day.times"
                :key="slot.id"
                type="primary"
                size="small"
                plain
                class="time-btn"
                @click="bookCoach(slot)"
                :disabled="slot.is_booked"
                :loading="bookingId === slot.id"
              >
                {{ slot.start_time }} - {{ slot.end_time }}
              </van-button>
            </div>
          </div>
          
          <div v-if="!schedules.length" class="empty-schedule">
            <p>暂无可预约时间</p>
            <van-button type="primary" size="small" @click="generateSchedule">
              生成测试时间
            </van-button>
          </div>
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
const coach = ref({});
const schedules = ref([]);

async function fetchData() {
  try {
    loading.value = true;
    const res = await request.get(`/coach/coach/${route.params.id}`);
    coach.value = res.data.coach;
    schedules.value = res.data.schedules || [];
  } catch (err) {
    console.error('获取教练详情失败:', err);
  } finally {
    loading.value = false;
  }
}

async function bookCoach(slot) {
  const token = localStorage.getItem('fitlife_token');
  if (!token) {
    showToast('请先登录');
    router.push('/login');
    return;
  }
  
  try {
    await showConfirmDialog({
      title: '确认预约',
      message: `确定要预约 ${coach.value.name} 教练 ${slot.date} ${slot.start_time} 的课程吗？`
    });
    
    bookingId.value = slot.id;
    await request.post('/coach/book', {
      scheduleId: slot.id,
      coachId: coach.value.id
    });
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

async function generateSchedule() {
  try {
    await request.post('/coach/generate-schedules', { coachId: route.params.id });
    showToast('生成成功');
    fetchData();
  } catch (err) {
    console.error('生成时间失败:', err);
  }
}

onMounted(() => {
  fetchData();
});
</script>

<style lang="less" scoped>
.coach-detail-page {
  .coach-header {
    display: flex;
    padding: 20px;
    margin: 16px;
    
    .coach-avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin-right: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      
      .coach-icon {
        font-size: 32px;
        font-weight: bold;
        color: white;
      }
    }
    
    .coach-info {
      .coach-name {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 6px;
      }
      
      .coach-title {
        font-size: 13px;
        color: #667eea;
        margin-bottom: 6px;
      }
      
      .coach-rating {
        font-size: 12px;
        color: #ff9800;
        margin-bottom: 6px;
      }
      
      .coach-price {
        font-size: 18px;
        font-weight: bold;
        color: #667eea;
      }
    }
  }
  
  .coach-specialty,
  .coach-desc {
    margin: 0 16px 12px;
    padding: 16px;
    
    .section-title {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      margin-bottom: 10px;
      padding: 0;
    }
    
    p {
      font-size: 13px;
      color: #666;
      line-height: 1.6;
    }
  }
  
  .schedule-section {
    .section-title {
      padding: 16px 16px 0;
    }
    
    .schedule-list {
      padding: 0 16px 16px;
      
      .day-schedule {
        margin-bottom: 16px;
        
        .day-header {
          margin-bottom: 10px;
          
          .day-date {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-right: 8px;
          }
          
          .day-week {
            font-size: 12px;
            color: #999;
          }
        }
        
        .time-slots {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .time-btn {
            color: #667eea;
            border-color: #667eea;
            
            &.van-button--disabled {
              color: #ccc;
              border-color: #eee;
              background: #f5f5f5;
            }
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
}
</style>
