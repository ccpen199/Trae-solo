<template>
  <div class="schedule-page">
    <div class="page-header">
      <h1>排班管理</h1>
    </div>
    
    <div class="page-content" style="padding: 16px;">
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">添加排班</h3>
        
        <div class="alert alert-warning">
          提示：只能申请后三天的排班，距离排班开始不足24小时取消可能触发惩罚机制
        </div>
        
        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label">选择日期</label>
          <input 
            type="date" 
            v-model="newSchedule.scheduleDate"
            class="form-input"
            :min="todayStr"
            :max="maxDateStr"
          >
        </div>
        
        <div class="form-group">
          <label class="form-label">排班时间</label>
          <div class="time-input-group">
            <input 
              type="time" 
              v-model="newSchedule.startTime"
              class="form-input"
            >
            <span class="time-separator">至</span>
            <input 
              type="time" 
              v-model="newSchedule.endTime"
              class="form-input"
            >
          </div>
        </div>
        
        <button 
          class="btn btn-primary btn-block"
          @click="addSchedule"
          :disabled="adding"
        >
          {{ adding ? '添加中...' : '添加排班' }}
        </button>
      </div>
      
      <div class="card">
        <h3 style="font-size: 16px; margin-bottom: 16px;">我的排班</h3>
        
        <div v-if="loading" class="loading">
          加载中...
        </div>
        
        <div v-else-if="schedules.length === 0" class="empty-state" style="padding: 20px;">
          <div class="empty-icon" style="font-size: 32px;">📅</div>
          <p>暂无排班记录</p>
        </div>
        
        <div v-else>
          <div 
            v-for="schedule in schedules" 
            :key="schedule.id"
            style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;"
          >
            <div class="flex-between">
              <div>
                <div style="font-size: 14px; font-weight: 500;">{{ formatDate(schedule.scheduleDate) }}</div>
                <div style="font-size: 12px; color: #999; margin-top: 4px;">
                  {{ schedule.startTime }} - {{ schedule.endTime }}
                </div>
              </div>
              <div>
                <span class="card-badge badge-delivery" style="margin-right: 8px;">{{ schedule.status === 'confirmed' ? '已确认' : schedule.status }}</span>
                <button 
                  class="btn btn-danger" 
                  style="padding: 6px 12px; font-size: 12px;"
                  @click="cancelSchedule(schedule)"
                >取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/rider')">
        <div class="nav-icon">🏠</div>
        <div class="nav-text">首页</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/orders')">
        <div class="nav-icon">📋</div>
        <div class="nav-text">订单</div>
      </div>
      <div class="nav-item active" @click="$router.push('/rider/schedule')">
        <div class="nav-icon">📅</div>
        <div class="nav-text">排班</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-text">我的</div>
      </div>
    </div>
    
    <div v-if="showCancelWarning" class="modal-overlay" @click="showCancelWarning = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">确认取消排班？</h3>
        <div class="modal-content">
          <p v-if="cancelWarning" class="alert alert-warning">
            ⚠️ {{ cancelWarning }}
          </p>
          <p>确定要取消以下排班吗？</p>
          <p style="margin-top: 8px; font-weight: 500;">
            {{ formatDate(currentSchedule?.scheduleDate) }} {{ currentSchedule?.startTime }} - {{ currentSchedule?.endTime }}
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCancelWarning = false">取消</button>
          <button class="btn btn-danger" @click="confirmCancel" :disabled="canceling">
            {{ canceling ? '取消中...' : '确认取消' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { scheduleApi } from '../../api'

const today = new Date()
const maxDate = new Date(today)
maxDate.setDate(maxDate.getDate() + 3)

const todayStr = today.toISOString().split('T')[0]
const maxDateStr = maxDate.toISOString().split('T')[0]

const newSchedule = ref({
  scheduleDate: '',
  startTime: '09:00',
  endTime: '18:00'
})

const schedules = ref([])
const loading = ref(false)
const adding = ref(false)
const canceling = ref(false)

const showCancelWarning = ref(false)
const currentSchedule = ref(null)
const cancelWarning = ref('')

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadSchedules = async () => {
  loading.value = true
  try {
    const response = await scheduleApi.getList()
    if (response.data.success) {
      schedules.value = response.data.data
    }
  } catch (err) {
    console.error('加载排班失败:', err)
  } finally {
    loading.value = false
  }
}

const addSchedule = async () => {
  if (!newSchedule.value.scheduleDate) {
    alert('请选择日期')
    return
  }
  
  if (newSchedule.value.startTime >= newSchedule.value.endTime) {
    alert('结束时间必须大于开始时间')
    return
  }
  
  adding.value = true
  try {
    const response = await scheduleApi.create(newSchedule.value)
    if (response.data.success) {
      alert('排班添加成功')
      loadSchedules()
    }
  } catch (err) {
    alert(err.response?.data?.message || '添加失败')
  } finally {
    adding.value = false
  }
}

const cancelSchedule = (schedule) => {
  currentSchedule.value = schedule
  
  const scheduleDate = new Date(schedule.scheduleDate)
  const startTimeParts = schedule.startTime.split(':')
  scheduleDate.setHours(parseInt(startTimeParts[0]), parseInt(startTimeParts[1]))
  
  const now = new Date()
  const hoursUntilSchedule = (scheduleDate - now) / (1000 * 60 * 60)
  
  if (hoursUntilSchedule < 24) {
    cancelWarning.value = '警告：距离排班开始不足24小时，取消可能触发惩罚机制'
  } else {
    cancelWarning.value = ''
  }
  
  showCancelWarning.value = true
}

const confirmCancel = async () => {
  if (!currentSchedule.value) return
  
  canceling.value = true
  try {
    const response = await scheduleApi.cancel(currentSchedule.value.id)
    if (response.data.success) {
      alert(response.data.warning || '排班已取消')
      showCancelWarning.value = false
      loadSchedules()
    }
  } catch (err) {
    alert(err.response?.data?.message || '取消失败')
  } finally {
    canceling.value = false
  }
}

onMounted(() => {
  loadSchedules()
})
</script>
