<template>
  <div class="access-page">
    <div class="page-header">
      <h2 class="page-title">门禁认证</h2>
      <div class="header-actions">
        <el-button @click="loadRecords">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="section-card">
          <template #header>
            <span style="font-weight: 600;">我的房号认证状态</span>
          </template>
          <div v-if="userRooms.length === 0" class="empty-state">
            <el-icon size="48"><House /></el-icon>
            <p>暂无绑定房号</p>
            <el-button type="primary" @click="$router.push('/profile/rooms')">去绑定</el-button>
          </div>
          <div v-else class="room-list">
            <div v-for="room in userRooms" :key="room.id" class="room-item">
              <div class="room-header">
                <el-icon><House /></el-icon>
                <span class="room-name">{{ room.building_name }} {{ room.unit_number }}</span>
                <el-tag :type="room.bind_status === 'verified' ? 'success' : 'warning'" size="small">
                  {{ room.bind_status === 'verified' ? '已认证' : '审核中' }}
                </el-tag>
              </div>
              <div class="room-detail">
                <span>关系：{{ room.relation === 'owner' ? '业主' : '租户' }}</span>
                <span v-if="room.verified_at">认证时间：{{ room.verified_at }}</span>
              </div>
            </div>
          </div>
        </el-card>
        
        <el-card class="section-card" style="margin-top: 20px;">
          <template #header>
            <span style="font-weight: 600;">开门方式</span>
          </template>
          <div class="door-methods">
            <div class="method-item" @click="goToVerify">
              <div class="method-icon qr">
                <el-icon><QrCode /></el-icon>
              </div>
              <div class="method-info">
                <div class="method-name">扫码开门</div>
                <div class="method-desc">使用二维码进行门禁认证</div>
              </div>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="method-item">
              <div class="method-icon card">
                <el-icon><CreditCard /></el-icon>
              </div>
              <div class="method-info">
                <div class="method-name">门禁卡</div>
                <div class="method-desc">绑定门禁卡，刷卡通行</div>
              </div>
              <el-tag type="info" size="small">已绑定</el-tag>
            </div>
            <div class="method-item">
              <div class="method-icon face">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="method-info">
                <div class="method-name">人脸识别</div>
                <div class="method-desc">刷脸快速通行</div>
              </div>
              <el-tag type="warning" size="small">未开通</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card class="section-card">
          <template #header>
            <span style="font-weight: 600;">门禁通行记录</span>
          </template>
          <div class="filter-bar">
            <el-select v-model="filter.device_id" placeholder="选择设备" clearable style="width: 200px; margin-right: 15px;">
              <el-option v-for="d in devices" :key="d.id" :label="d.name" :value="d.id" />
            </el-select>
            <el-select v-model="filter.result" placeholder="认证结果" clearable style="width: 150px;">
              <el-option label="成功" value="success" />
              <el-option label="失败" value="fail" />
            </el-select>
          </div>
          <el-table :data="records" v-loading="loading" stripe>
            <el-table-column prop="access_time" label="时间" width="180" />
            <el-table-column prop="device_name" label="设备" width="150" />
            <el-table-column prop="device_location" label="位置" />
            <el-table-column prop="access_type" label="认证方式" width="100">
              <template #default="{ row }">
                <el-tag size="small">
                  {{ { card: '门禁卡', qrcode: '二维码', face: '人脸', password: '密码' }[row.access_type] || row.access_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="体温" width="100">
              <template #default="{ row }">
                <span v-if="row.temperature" :style="{ color: row.temperature > 37.3 ? '#f56c6c' : '#67c23a' }">
                  {{ row.temperature }}℃
                </span>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="口罩" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.mask_detected" type="success" size="small">已戴</el-tag>
                <el-tag v-else type="danger" size="small">未戴</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="结果" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.result === 'success'" type="success" size="small">成功</el-tag>
                <el-tag v-else type="danger" size="small">失败</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { getUserRooms, getAccessRecords, getAccessDevices } from '../api'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const records = ref([])
const userRooms = ref([])
const devices = ref([])

const filter = reactive({
  device_id: null,
  result: ''
})

async function loadRecords() {
  loading.value = true
  try {
    const params = { user_id: userStore.userId }
    if (filter.device_id) params.device_id = filter.device_id
    if (filter.result) params.status = filter.result
    
    const res = await getAccessRecords(params)
    records.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadUserRooms() {
  const res = await getUserRooms({ user_id: userStore.userId })
  userRooms.value = res.data
}

async function loadDevices() {
  const res = await getAccessDevices()
  devices.value = res.data
}

function goToVerify() {
  router.push('/access/verify')
}

watch([() => filter.device_id, () => filter.result], () => {
  loadRecords()
})

onMounted(() => {
  loadUserRooms()
  loadDevices()
  loadRecords()
})
</script>

<style scoped>
.access-page {
  padding: 0;
}

.section-card {
  border: none;
  border-radius: 12px;
}

.room-list {
  max-height: 300px;
  overflow-y: auto;
}

.room-item {
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.room-item:last-child {
  border-bottom: none;
}

.room-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.room-name {
  flex: 1;
  font-size: 16px;
  font-weight: 500;
}

.room-detail {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
  padding-left: 26px;
}

.door-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-item:hover {
  background: #e8f4ff;
}

.method-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.method-icon.qr { background: linear-gradient(135deg, #667eea, #764ba2); }
.method-icon.card { background: linear-gradient(135deg, #f093fb, #f5576c); }
.method-icon.face { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.method-info {
  flex: 1;
}

.method-name {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 3px;
}

.method-desc {
  font-size: 12px;
  color: #909399;
}

.filter-bar {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-state p {
  margin: 15px 0;
}
</style>
