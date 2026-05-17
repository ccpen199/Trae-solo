<template>
  <div class="page-container bookings-page">
    <van-nav-bar
      title="我的预约"
      left-text="返回"
      left-arrow
      @click-left="router.back()"
    />
    
    <van-tabs v-model:active="activeTab">
      <van-tab title="团课预约">
        <div v-if="loadingGroup" class="loading-container">
          <van-loading type="spinner" color="#667eea" />
        </div>
        
        <div v-else-if="!groupBookings.length" class="empty-container">
          <div class="empty-icon">📅</div>
          <div class="empty-text">暂无团课预约</div>
        </div>
        
        <div v-else class="booking-list">
          <div
            v-for="item in groupBookings" :key="item.id" class="booking-item card-shadow">
            <div class="booking-header">
              <span class="class-name">{{ item.class_name }}</span>
              <van-tag type="primary">已预约</van-tag>
            </div>
            <div class="booking-info">
              <div><van-icon name="clock-o" /> {{ item.start_time }}</div>
              <div><van-icon name="location-o" /> {{ item.store_name }}</div>
              <div><van-icon name="user-o" /> 教练: {{ item.coach_name }}</div>
            </div>
            <van-button
              type="danger"
              size="small"
              plain
              class="cancel-btn"
              @click="cancelGroupBooking(item.id)"
            >
              取消预约
            </van-button>
          </div>
        </div>
      </van-tab>
      
      <van-tab title="私教预约">
        <div v-if="loadingCoach" class="loading-container">
          <van-loading type="spinner" color="#667eea" />
        </div>
        
        <div v-else-if="!coachBookings.length" class="empty-container">
          <div class="empty-icon">🏋️</div>
          <div class="empty-text">暂无私教预约</div>
        </div>
        
        <div v-else class="booking-list">
          <div
            v-for="item in coachBookings" :key="item.id" class="booking-item card-shadow">
            <div class="booking-header">
              <span class="class-name">{{ item.coach_name }}</span>
              <van-tag type="primary">已预约</van-tag>
            </div>
            <div class="booking-info">
              <div><van-icon name="clock-o" /> {{ item.date }} {{ item.start_time }} - {{ item.end_time }}</div>
              <div><van-icon name="medal-o" /> {{ item.title }}</div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import request from '../../utils/request';

const router = useRouter();
const activeTab = ref(0);
const loadingGroup = ref(false);
const loadingCoach = ref(false);
const groupBookings = ref([]);
const coachBookings = ref([]);

async function fetchGroupBookings() {
  try {
    loadingGroup.value = true;
    const res = await request.get('/group/my-bookings');
    groupBookings.value = res.data || [];
  } catch (err) {
    console.error('获取团课预约失败:', err);
  } finally {
    loadingGroup.value = false;
  }
}

async function fetchCoachBookings() {
  try {
    loadingCoach.value = true;
    const res = await request.get('/coach/my-bookings');
    coachBookings.value = res.data || [];
  } catch (err) {
    console.error('获取私教预约失败:', err);
  } finally {
    loadingCoach.value = false;
  }
}

async function cancelGroupBooking(bookingId) {
  try {
    await showConfirmDialog({
      title: '确认取消',
      message: '确定要取消该预约吗？'
    });
    
    await request.post('/group/cancel-booking', { bookingId });
    showToast('取消成功');
    fetchGroupBookings();
  } catch (err) {
    if (err !== 'cancel') {
      console.error('取消失败:', err);
    }
  }
}

onMounted(() => {
  fetchGroupBookings();
  fetchCoachBookings();
});
</script>

<style lang="less" scoped>
.bookings-page {
  .booking-list {
    padding: 16px;
  }
  
  .booking-item {
    padding: 16px;
    margin-bottom: 12px;
    
    .booking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      .class-name {
        font-size: 16px;
        font-weight: 500;
        color: #333;
      }
    }
    
    .booking-info {
      font-size: 13px;
      color: #666;
      line-height: 2;
      
      .van-icon {
        margin-right: 6px;
      }
    }
    
    .cancel-btn {
      margin-top: 12px;
      border-color: #f44336;
      color: #f44336;
    }
  }
}
</style>
