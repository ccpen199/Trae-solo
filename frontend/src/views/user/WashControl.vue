<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDeviceStore, type Device } from '@/stores/device'
import { createOrderApi } from '@/api/order'
import PageHeader from '@/components/PageHeader.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EmptyState from '@/components/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const deviceStore = useDeviceStore()

const deviceId = computed(() => Number(route.params.id))
const device = computed<Device | null>(() => deviceStore.currentDevice)
const loading = computed(() => deviceStore.loading)

const programOptions = [
  { value: 'standard', label: '标准洗', duration: 30, price: 5 },
  { value: 'quick', label: '快速洗', duration: 15, price: 3 },
  { value: 'heavy', label: '大件洗', duration: 45, price: 8 },
  { value: 'delicate', label: '轻柔洗', duration: 25, price: 6 },
  { value: 'dry', label: '烘干', duration: 30, price: 5 }
]

const selectedProgram = ref('standard')
const extendMinutes = ref(15)
const showExtendDialog = ref(false)
const currentOrderId = ref<number | null>(null)

const selectedProgramInfo = computed(() => {
  return programOptions.find((p) => p.value === selectedProgram.value) || programOptions[0]
})

const totalPrice = computed(() => {
  const basePrice = selectedProgramInfo.value.price
  return basePrice
})

const countdownRef = ref<InstanceType<typeof CountdownTimer>>()

async function loadDevice() {
  try {
    await deviceStore.fetchDeviceDetail(deviceId.value)
  } catch (error) {
    console.error('Load device error:', error)
  }
}

async function handleStart() {
  if (!device.value) return

  try {
    const amount = totalPrice.value
    const duration = selectedProgramInfo.value.duration

    const confirm = await ElMessageBox.confirm(
      `即将启动【${selectedProgramInfo.value.label}】，时长 ${duration} 分钟，费用 ¥${amount}`,
      '确认启动',
      { confirmButtonText: '确认支付并启动', cancelButtonText: '取消', type: 'primary' }
    )

    if (confirm) {
      const res = await createOrderApi({
        deviceId: device.value.id,
        program: selectedProgram.value,
        duration: duration,
        amount: amount
      })

      currentOrderId.value = res.data.id
      router.push(`/payment/${res.data.id}`)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Start wash error:', error)
    }
  }
}

async function handlePause() {
  if (!device.value) return
  try {
    await ElMessageBox.confirm('确定要暂停洗涤吗？', '暂停确认', {
      confirmButtonText: '确定暂停',
      cancelButtonText: '继续洗涤',
      type: 'warning'
    })
    await deviceStore.pauseWash(device.value.id)
    countdownRef.value?.stop()
    ElMessage.success('已暂停')
    await loadDevice()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Pause error:', error)
    }
  }
}

async function handleContinue() {
  if (!device.value) return
  try {
    await deviceStore.continueWash(device.value.id)
    countdownRef.value?.start()
    ElMessage.success('已继续')
    await loadDevice()
  } catch (error) {
    console.error('Continue error:', error)
  }
}

async function handleExtend() {
  showExtendDialog.value = false
  try {
    await ElMessageBox.confirm(
      `确定要续洗 ${extendMinutes.value} 分钟吗？将额外收取费用。`,
      '续洗确认',
      { confirmButtonText: '确认续洗', cancelButtonText: '取消', type: 'primary' }
    )
    ElMessage.success(`已申请续洗 ${extendMinutes.value} 分钟`)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Extend error:', error)
    }
  }
}

function handleFinish() {
  ElMessage.success('洗涤完成！请取走您的衣物')
  router.push('/orders')
}

onMounted(() => {
  loadDevice()
})
</script>

<template>
  <div class="wash-control-page">
    <PageHeader :title="device?.name || '洗衣控制'" show-back />

    <div v-if="loading" class="content-wrapper">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="!device" class="content-wrapper">
      <EmptyState description="设备不存在" icon="Warning" />
    </div>

    <div v-else class="content-wrapper">
      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <el-card class="control-card">
            <div class="device-status">
              <div class="status-left">
                <el-icon :size="48" color="#409eff">
                  <component :is="device.type === 'washer' ? 'Service' : 'Odometer'" />
                </el-icon>
                <div>
                  <h3>{{ device.name }}</h3>
                  <span class="device-code">{{ device.code }}</span>
                </div>
              </div>
              <StatusBadge :status="device.status" type="device" />
            </div>

            <div v-if="device.status === 'idle'" class="program-section">
              <h4 class="section-title">选择洗涤程序</h4>
              <div class="program-grid">
                <div
                  v-for="program in programOptions"
                  :key="program.value"
                  class="program-item"
                  :class="{ active: selectedProgram === program.value }"
                  @click="selectedProgram = program.value"
                >
                  <div class="program-name">{{ program.label }}</div>
                  <div class="program-info">
                    <span class="duration">{{ program.duration }}分钟</span>
                    <span class="price">¥{{ program.price }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="device.status === 'running' || device.status === 'paused'" class="timer-section">
              <CountdownTimer
                v-if="device.remainingTime"
                ref="countdownRef"
                :initial-seconds="device.remainingTime * 60"
                :auto-start="device.status === 'running'"
                @finish="handleFinish"
              />

              <div v-if="device.currentProgram" class="current-program">
                当前程序：<strong>{{ device.currentProgram }}</strong>
              </div>
            </div>

            <div class="action-section">
              <el-button
                v-if="device.status === 'idle'"
                type="primary"
                size="large"
                icon="VideoPlay"
                class="action-btn"
                @click="handleStart"
              >
                启动洗涤 - ¥{{ totalPrice }}
              </el-button>

              <template v-else-if="device.status === 'running'">
                <el-button
                  type="warning"
                  size="large"
                  icon="VideoPause"
                  class="action-btn"
                  @click="handlePause"
                >
                  暂停
                </el-button>
                <el-button
                  type="primary"
                  size="large"
                  icon="Clock"
                  class="action-btn"
                  @click="showExtendDialog = true"
                >
                  续洗
                </el-button>
              </template>

              <template v-else-if="device.status === 'paused'">
                <el-button
                  type="success"
                  size="large"
                  icon="VideoPlay"
                  class="action-btn"
                  @click="handleContinue"
                >
                  继续
                </el-button>
              </template>

              <el-button
                v-else
                type="primary"
                size="large"
                class="action-btn"
                disabled
              >
                设备不可用
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :lg="12">
          <el-card class="info-card">
            <template #header>
              <span>费用明细</span>
            </template>
            <div class="fee-details">
              <div class="fee-row">
                <span class="fee-label">洗涤程序</span>
                <span class="fee-value">{{ selectedProgramInfo.label }}</span>
              </div>
              <div class="fee-row">
                <span class="fee-label">洗涤时长</span>
                <span class="fee-value">{{ selectedProgramInfo.duration }} 分钟</span>
              </div>
              <div class="fee-row total">
                <span class="fee-label">总计</span>
                <span class="fee-value price">¥{{ totalPrice }}</span>
              </div>
            </div>
          </el-card>

          <el-card class="info-card">
            <template #header>
              <span>温馨提示</span>
            </template>
            <div class="tips">
              <el-alert
                title="使用前请检查设备内是否有遗留物品"
                type="info"
                :closable="false"
                show-icon
                style="margin-bottom: 12px;"
              />
              <el-alert
                title="请根据衣物材质选择合适的洗涤程序"
                type="warning"
                :closable="false"
                show-icon
                style="margin-bottom: 12px;"
              />
              <el-alert
                title="洗涤完成后请及时取走衣物，避免影响他人使用"
                type="success"
                :closable="false"
                show-icon
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="showExtendDialog" title="续洗" width="400px">
      <el-form label-width="80px">
        <el-form-item label="续洗时长">
          <el-select v-model="extendMinutes" size="large" style="width: 100%;">
            <el-option label="15分钟" :value="15" />
            <el-option label="30分钟" :value="30" />
            <el-option label="45分钟" :value="45" />
            <el-option label="60分钟" :value="60" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExtendDialog = false">取消</el-button>
        <el-button type="primary" @click="handleExtend">确认续洗</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.wash-control-page {
  min-height: 100vh;
  background: #f5f7fa;

  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 24px;
  }

  .control-card {
    .device-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #ebeef5;

      .status-left {
        display: flex;
        align-items: center;
        gap: 16px;

        h3 {
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

    .program-section {
      margin-bottom: 24px;

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 16px 0;
      }

      .program-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;

        .program-item {
          padding: 16px;
          border: 2px solid #ebeef5;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;

          &:hover {
            border-color: #409eff;
          }

          &.active {
            border-color: #409eff;
            background: #ecf5ff;
          }

          .program-name {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
          }

          .program-info {
            display: flex;
            justify-content: space-between;
            font-size: 13px;

            .duration {
              color: #606266;
            }

            .price {
              color: #f56c6c;
              font-weight: 600;
            }
          }
        }
      }
    }

    .timer-section {
      text-align: center;
      margin-bottom: 24px;

      .current-program {
        margin-top: 16px;
        font-size: 15px;
        color: #606266;
      }
    }

    .action-section {
      display: flex;
      gap: 12px;
      justify-content: center;

      .action-btn {
        min-width: 160px;
        height: 48px;
        font-size: 16px;
      }
    }
  }

  .info-card {
    margin-bottom: 20px;

    .fee-details {
      .fee-row {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f2f6fc;
        font-size: 15px;

        &:last-child {
          border-bottom: none;
        }

        &.total {
          padding-top: 16px;
          margin-top: 4px;
          border-top: 2px solid #ebeef5;
          border-bottom: none;

          .fee-label {
            font-weight: 600;
            font-size: 16px;
          }

          .fee-value.price {
            font-size: 24px;
            color: #f56c6c;
          }
        }

        .fee-label {
          color: #606266;
        }

        .fee-value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
}
</style>
