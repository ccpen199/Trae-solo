<template>
  <div class="appointment-page">
    <van-nav-bar
      title="预约办理"
      left-text="返回"
      left-arrow
      @click-left="onBack"
    />

    <div class="page-content">
      <div class="select-section card">
        <div class="section-title">选择网点</div>
        <van-field
          v-model="form.outletName"
          label="服务网点"
          placeholder="请选择网点"
          readonly
          is-link
          @click="showOutletPicker = true"
        />
      </div>

      <div class="select-section card">
        <div class="section-title">选择业务</div>
        <van-field
          v-model="form.serviceName"
          label="服务事项"
          placeholder="请选择业务"
          readonly
          is-link
          @click="showServicePicker = true"
        />
      </div>

      <div class="select-section card">
        <div class="section-title">选择时间</div>
        <van-field
          v-model="form.date"
          label="预约日期"
          type="date"
          placeholder="请选择日期"
        />
        
        <div class="time-slots">
          <div 
            v-for="slot in timeSlots" 
            :key="slot.value"
            class="time-slot"
            :class="{ 
              active: form.time === slot.value,
              disabled: slot.disabled 
            }"
            @click="selectTime(slot)"
          >
            <span class="slot-time">{{ slot.label }}</span>
            <span class="slot-status">{{ slot.status }}</span>
          </div>
        </div>
      </div>

      <div class="info-section card">
        <div class="section-title">预约信息</div>
        <div class="info-item">
          <span class="info-label">姓名</span>
          <span class="info-value">{{ userInfo?.real_name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">手机号</span>
          <span class="info-value">{{ userInfo?.phone }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">证件号</span>
          <span class="info-value">{{ userInfo?.id_card }}</span>
        </div>
      </div>

      <div class="notice-section">
        <van-icon name="info-o" color="#ff9800" />
        <div class="notice-text">
          <p>1. 请按时到达办理网点，超时预约将自动失效</p>
          <p>2. 如需取消预约，请提前1小时操作</p>
          <p>3. 请携带相关证件原件办理</p>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <van-button type="primary" size="large" block @click="submitAppointment">
        确认预约
      </van-button>
    </div>

    <van-popup v-model:show="showOutletPicker" round position="bottom" :style="{ height: '50%' }">
      <div class="picker-header">
        <span>选择网点</span>
        <van-icon name="close" size="20" @click="showOutletPicker = false" />
      </div>
      <div class="picker-list">
        <div 
          v-for="outlet in outlets" 
          :key="outlet.id"
          class="picker-item"
          :class="{ selected: form.outletId === outlet.id }"
          @click="selectOutlet(outlet)"
        >
          <div class="picker-name">{{ outlet.name }}</div>
          <div class="picker-addr">{{ outlet.address }}</div>
        </div>
      </div>
    </van-popup>

    <van-popup v-model:show="showServicePicker" round position="bottom" :style="{ height: '50%' }">
      <div class="picker-header">
        <span>选择服务</span>
        <van-icon name="close" size="20" @click="showServicePicker = false" />
      </div>
      <div class="picker-list">
        <div 
          v-for="item in services" 
          :key="item.id"
          class="picker-item"
          :class="{ selected: form.serviceId === item.id }"
          @click="selectService(item)"
        >
          <div class="picker-name">{{ item.name }}</div>
          <div class="picker-addr">{{ item.category }}</div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import { showToast, showSuccessToast } from 'vant'
import { getOutlets } from '../api/outlets'
import { getUserInfo, createAppointment } from '../api/users'
import request from '../api/request'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const userInfo = ref(null)
const outlets = ref([])
const services = ref([])

const showOutletPicker = ref(false)
const showServicePicker = ref(false)

const form = reactive({
  outletId: null,
  outletName: '',
  serviceId: null,
  serviceName: '',
  date: new Date().toISOString().split('T')[0],
  time: ''
})

const timeSlots = ref([
  { value: '09:00-10:00', label: '09:00-10:00', status: '空闲', disabled: false },
  { value: '10:00-11:00', label: '10:00-11:00', status: '较少', disabled: false },
  { value: '11:00-12:00', label: '11:00-12:00', status: '适中', disabled: false },
  { value: '14:00-15:00', label: '14:00-15:00', status: '繁忙', disabled: false },
  { value: '15:00-16:00', label: '15:00-16:00', status: '适中', disabled: false },
  { value: '16:00-17:00', label: '16:00-17:00', status: '空闲', disabled: false },
])

function onBack() {
  router.back()
}

async function loadUserInfo() {
  try {
    const data = await getUserInfo(userStore.currentUserId)
    userInfo.value = data
  } catch (e) {
    console.error(e)
  }
}

async function loadOutlets() {
  try {
    const data = await getOutlets({ pageSize: 20 })
    outlets.value = data || []
    if (route.query.outletId) {
      const outlet = outlets.value.find(o => o.id == route.query.outletId)
      if (outlet) {
        form.outletId = outlet.id
        form.outletName = outlet.name
      }
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadServices() {
  try {
    const data = await request.get('/admin/service-items')
    services.value = data || []
  } catch (e) {
    console.error(e)
  }
}

function selectOutlet(outlet) {
  form.outletId = outlet.id
  form.outletName = outlet.name
  showOutletPicker.value = false
}

function selectService(item) {
  form.serviceId = item.id
  form.serviceName = item.name
  showServicePicker.value = false
}

function selectTime(slot) {
  if (slot.disabled) return
  form.time = slot.value
}

async function submitAppointment() {
  if (!form.outletId) {
    showToast('请选择网点')
    return
  }
  if (!form.serviceId) {
    showToast('请选择服务事项')
    return
  }
  if (!form.time) {
    showToast('请选择时间')
    return
  }

  try {
    await createAppointment({
      userId: userStore.currentUserId,
      outletId: form.outletId,
      serviceItemId: form.serviceId,
      date: form.date,
      time: form.time
    })
    showSuccessToast('预约成功')
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadUserInfo()
  loadOutlets()
  loadServices()
})
</script>

<style scoped>
.appointment-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 80px;
}

:deep(.van-nav-bar) {
  position: sticky;
  top: 0;
  z-index: 10;
}

.page-content {
  padding: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.time-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
}

.time-slot {
  padding: 12px 8px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.time-slot.active {
  background: #e3f2fd;
  border-color: #1976d2;
}

.time-slot.disabled {
  opacity: 0.5;
}

.slot-time {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.slot-status {
  font-size: 11px;
  color: #999;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
}

.notice-section {
  display: flex;
  gap: 10px;
  padding: 16px;
  background: #fff8e1;
  border-radius: 10px;
  margin-top: 12px;
}

.notice-text {
  flex: 1;
  font-size: 13px;
  color: #f57c00;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #f0f0f0;
}

.picker-list {
  height: calc(100% - 60px);
  overflow-y: auto;
}

.picker-item {
  padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.picker-item.selected {
  background: #e3f2fd;
}

.picker-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.picker-addr {
  font-size: 13px;
  color: #999;
}
</style>
