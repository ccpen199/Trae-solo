<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDeviceStore, type Device } from '@/stores/device'
import PageHeader from '@/components/PageHeader.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

const deviceId = computed(() => Number(route.params.id))
const loading = computed(() => deviceStore.loading)
const device = computed<Device | null>(() => deviceStore.currentDevice)

const typeText = computed(() => (device.value?.type === 'washer' ? '洗衣机' : '烘干机'))

async function loadDevice() {
  try {
    await deviceStore.fetchDeviceDetail(deviceId.value)
  } catch (error) {
    console.error('Load device error:', error)
  }
}

function startWash() {
  if (device.value?.status !== 'idle') return
  router.push(`/wash/${device.value.id}`)
}

onMounted(() => {
  loadDevice()
})
</script>

<template>
  <div class="device-detail-page">
    <PageHeader :title="device?.name || '设备详情'" show-back />

    <div v-if="loading" class="loading-wrapper">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="!device" class="content-wrapper">
      <EmptyState description="设备不存在" icon="Warning" />
    </div>

    <div v-else class="content-wrapper">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <div class="device-title">
                  <el-icon :size="28" color="#409eff">
                    <component :is="device.type === 'washer' ? 'Service' : 'Odometer'" />
                  </el-icon>
                  <div>
                    <h2>{{ device.name }}</h2>
                    <span class="device-code">{{ device.code }}</span>
                  </div>
                </div>
                <StatusBadge :status="device.status" type="device" />
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="设备类型">
                {{ typeText }}
              </el-descriptions-item>
              <el-descriptions-item label="所在位置">
                {{ device.location }}
              </el-descriptions-item>
              <el-descriptions-item label="当前状态">
                <StatusBadge :status="device.status" type="device" />
              </el-descriptions-item>
              <el-descriptions-item label="固件版本">
                {{ device.firmwareVersion || '-' }}
              </el-descriptions-item>
              <el-descriptions-item v-if="device.remainingTime" label="剩余时间">
                <span class="highlight">{{ device.remainingTime }} 分钟</span>
              </el-descriptions-item>
              <el-descriptions-item v-if="device.currentProgram" label="当前程序">
                {{ device.currentProgram }}
              </el-descriptions-item>
              <el-descriptions-item label="上次维护">
                {{ device.lastMaintenance || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="累计耗电">
                {{ device.powerConsumption || 0 }} kWh
              </el-descriptions-item>
              <el-descriptions-item label="累计耗水">
                {{ device.waterConsumption || 0 }} L
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="device.status === 'running'" class="running-info">
              <el-alert
                title="设备正在运行中"
                type="info"
                :closable="false"
                show-icon
              >
                <template #default>
                  <div v-if="device.remainingTime">
                    预计还需 <strong>{{ device.remainingTime }}</strong> 分钟完成
                  </div>
                </template>
              </el-alert>
            </div>

            <div class="action-section">
              <el-button
                v-if="device.status === 'idle'"
                type="primary"
                size="large"
                icon="VideoPlay"
                @click="startWash"
              >
                立即使用
              </el-button>
              <el-button
                v-else-if="device.status === 'running'"
                type="primary"
                size="large"
                @click="startWash"
              >
                查看控制
              </el-button>
              <el-button
                v-else
                type="primary"
                size="large"
                disabled
              >
                设备暂不可用
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="8">
          <el-card class="info-card">
            <template #header>
              <span>设备位置</span>
            </template>
            <div class="location-info">
              <el-icon size="20" color="#409eff"><Location /></el-icon>
              <span>{{ device.location }}</span>
            </div>
            <div class="map-placeholder">
              <el-icon size="48" color="#c0c4cc"><MapLocation /></el-icon>
              <p>地图加载中...</p>
            </div>
          </el-card>

          <el-card class="info-card">
            <template #header>
              <span>使用说明</span>
            </template>
            <div class="instructions">
              <ol>
                <li>确认设备处于空闲状态</li>
                <li>点击"立即使用"选择洗涤程序</li>
                <li>放入衣物并关好门</li>
                <li>支付后设备自动启动</li>
                <li>等待洗涤完成后取走衣物</li>
              </ol>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.device-detail-page {
  min-height: 100vh;
  background: #f5f7fa;

  .loading-wrapper {
    padding: 24px;
  }

  .content-wrapper {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .detail-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .device-title {
        display: flex;
        align-items: center;
        gap: 12px;

        h2 {
          margin: 0;
          font-size: 20px;
          color: #303133;
        }

        .device-code {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .highlight {
      color: #409eff;
      font-weight: 600;
    }

    .running-info {
      margin-top: 20px;
    }

    .action-section {
      margin-top: 24px;
      text-align: center;
    }
  }

  .info-card {
    margin-bottom: 20px;

    .location-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 15px;
    }

    .map-placeholder {
      height: 180px;
      background: #f5f7fa;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;

      p {
        margin: 8px 0 0 0;
      }
    }

    .instructions {
      ol {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 8px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }
  }
}
</style>
