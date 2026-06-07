<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useDeviceStore } from '@/stores/device'
import { useUserStore } from '@/stores/user'
import DeviceCard from '@/components/DeviceCard.vue'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { getDeviceByCodeApi } from '@/api/device'

const router = useRouter()
const deviceStore = useDeviceStore()
const userStore = useUserStore()

const activeView = ref<'map' | 'list'>('list')
const searchKeyword = ref('')
const statusFilter = ref('')
const typeFilter = ref('')
const scanDialogVisible = ref(false)
const scanCode = ref('')
const mapRef = ref<HTMLDivElement>()
let map: any = null

const filteredDevices = computed(() => {
  return deviceStore.devices.filter((device) => {
    const matchKeyword = !searchKeyword.value ||
      device.name.includes(searchKeyword.value) ||
      device.code.includes(searchKeyword.value) ||
      device.location.includes(searchKeyword.value)
    const matchStatus = !statusFilter.value || device.status === statusFilter.value
    const matchType = !typeFilter.value || device.type === typeFilter.value
    return matchKeyword && matchStatus && matchType
  })
})

const stats = computed(() => ({
  total: deviceStore.devices.length,
  idle: deviceStore.devices.filter((d) => d.status === 'idle').length,
  running: deviceStore.devices.filter((d) => d.status === 'running').length,
  fault: deviceStore.devices.filter((d) => d.status === 'fault').length
}))

async function loadDevices() {
  try {
    await deviceStore.fetchDevices()
  } catch (error) {
    console.error('Load devices error:', error)
  }
}

function showScanDialog() {
  scanDialogVisible.value = true
  scanCode.value = ''
}

async function handleScanSubmit() {
  if (!scanCode.value.trim()) {
    ElMessage.warning('请输入设备编号')
    return
  }
  try {
    const res = await getDeviceByCodeApi(scanCode.value.trim())
    scanDialogVisible.value = false
    router.push(`/device/${res.data.id}`)
  } catch (error) {
    console.error('Scan error:', error)
  }
}

function goToOrders() {
  router.push('/orders')
}

function goToAdmin() {
  router.push('/admin/dashboard')
}

function logout() {
  userStore.logout()
  router.push('/login')
}

function initMap() {
  if (!mapRef.value) return
  import('leaflet').then((L) => {
    map = L.map(mapRef.value!).setView([39.9042, 116.4074], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)

    filteredDevices.value.forEach((device) => {
      if (device.lat && device.lng) {
        const marker = L.marker([device.lat, device.lng]).addTo(map)
        marker.bindPopup(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 4px 0;">${device.name}</h4>
            <p style="margin: 4px 0;">编号: ${device.code}</p>
            <p style="margin: 4px 0;">位置: ${device.location}</p>
            <p style="margin: 4px 0;">状态: ${device.status}</p>
          </div>
        `)
      }
    })
  })
}

onMounted(() => {
  loadDevices()
  if (activeView.value === 'map') {
    setTimeout(initMap, 100)
  }
})
</script>

<template>
  <div class="home-page">
    <PageHeader title="设备列表">
      <template #extra>
        <div class="header-actions">
          <el-button type="primary" icon="Camera" @click="showScanDialog">扫码使用</el-button>
          <el-button icon="List" @click="goToOrders">我的订单</el-button>
          <el-button v-if="userStore.isAdmin" icon="Setting" @click="goToAdmin">管理后台</el-button>
          <el-button type="danger" plain icon="SwitchButton" @click="logout">退出</el-button>
        </div>
      </template>
    </PageHeader>

    <div class="content-wrapper">
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">总设备</div>
        </div>
        <div class="stat-item success">
          <div class="stat-value">{{ stats.idle }}</div>
          <div class="stat-label">空闲中</div>
        </div>
        <div class="stat-item primary">
          <div class="stat-value">{{ stats.running }}</div>
          <div class="stat-label">运行中</div>
        </div>
        <div class="stat-item danger">
          <div class="stat-value">{{ stats.fault }}</div>
          <div class="stat-label">故障</div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-left">
          <el-radio-group v-model="activeView" size="default">
            <el-radio-button value="list">列表视图</el-radio-button>
            <el-radio-button value="map">地图视图</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-right">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备名称/编号/位置"
            clearable
            prefix-icon="Search"
            style="width: 240px; margin-right: 12px;"
          />
          <el-select
            v-model="statusFilter"
            placeholder="状态筛选"
            clearable
            style="width: 120px; margin-right: 12px;"
          >
            <el-option label="空闲" value="idle" />
            <el-option label="运行中" value="running" />
            <el-option label="已暂停" value="paused" />
            <el-option label="故障" value="fault" />
          </el-select>
          <el-select
            v-model="typeFilter"
            placeholder="类型筛选"
            clearable
            style="width: 120px;"
          >
            <el-option label="洗衣机" value="washer" />
            <el-option label="烘干机" value="dryer" />
          </el-select>
        </div>
      </div>

      <div v-if="activeView === 'list'" class="device-list">
        <EmptyState
          v-if="filteredDevices.length === 0"
          description="暂无设备"
          icon="Box"
        />
        <el-row v-else :gutter="20">
          <el-col
            v-for="device in filteredDevices"
            :key="device.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
            class="device-col"
          >
            <DeviceCard :device="device" />
          </el-col>
        </el-row>
      </div>

      <div v-else class="map-container">
        <div ref="mapRef" class="map"></div>
      </div>
    </div>

    <el-dialog v-model="scanDialogVisible" title="扫码使用" width="400px">
      <el-form label-width="80px">
        <el-form-item label="设备编号">
          <el-input
            v-model="scanCode"
            placeholder="请输入或扫描设备编号"
            clearable
            size="large"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="scanDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleScanSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;

  .header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .stats-bar {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .stat-item {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

      &.success .stat-value {
        color: #67c23a;
      }

      &.primary .stat-value {
        color: #409eff;
      }

      &.danger .stat-value {
        color: #f56c6c;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;

    .filter-right {
      display: flex;
      align-items: center;
    }
  }

  .device-list {
    .device-col {
      margin-bottom: 20px;
    }
  }

  .map-container {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    height: calc(100vh - 320px);
    min-height: 500px;

    .map {
      width: 100%;
      height: 100%;
    }
  }
}

@media (max-width: 768px) {
  .home-page {
    .stats-bar {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-bar {
      flex-direction: column;
      gap: 12px;
      align-items: stretch;

      .filter-right {
        flex-wrap: wrap;
        gap: 8px;

        :deep(.el-input),
        :deep(.el-select) {
          width: 100% !important;
          margin-right: 0 !important;
        }
      }
    }
  }
}
</style>
