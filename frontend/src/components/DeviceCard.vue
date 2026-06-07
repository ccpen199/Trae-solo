<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Device } from '@/stores/device'

const props = defineProps<{
  device: Device
}>()

const router = useRouter()

const statusMap: Record<string, { text: string; type: string }> = {
  idle: { text: '空闲', type: 'success' },
  running: { text: '运行中', type: 'primary' },
  paused: { text: '已暂停', type: 'warning' },
  fault: { text: '故障', type: 'danger' },
  maintenance: { text: '维护中', type: 'info' }
}

const statusInfo = computed(() => statusMap[props.device.status] || statusMap.idle)
const typeText = computed(() => (props.device.type === 'washer' ? '洗衣机' : '烘干机'))

function handleClick() {
  router.push(`/device/${props.device.id}`)
}
</script>

<template>
  <el-card class="device-card" shadow="hover" @click="handleClick">
    <div class="card-header">
      <div class="device-info">
        <el-icon :size="32" :color="statusInfo.type === 'success' ? '#67c23a' : '#409eff'">
          <component :is="device.type === 'washer' ? 'Service' : 'Odometer'" />
        </el-icon>
        <div class="device-meta">
          <div class="device-name">{{ device.name }}</div>
          <div class="device-code">{{ device.code }}</div>
        </div>
      </div>
      <el-tag :type="statusInfo.type as any" size="small">{{ statusInfo.text }}</el-tag>
    </div>
    <div class="card-body">
      <div class="info-row">
        <span class="label">类型：</span>
        <span class="value">{{ typeText }}</span>
      </div>
      <div class="info-row">
        <span class="label">位置：</span>
        <span class="value">{{ device.location }}</span>
      </div>
      <div v-if="device.remainingTime && device.status === 'running'" class="info-row">
        <span class="label">剩余时间：</span>
        <span class="value highlight">{{ device.remainingTime }} 分钟</span>
      </div>
      <div v-if="device.currentProgram" class="info-row">
        <span class="label">当前程序：</span>
        <span class="value">{{ device.currentProgram }}</span>
      </div>
    </div>
    <div class="card-footer">
      <el-button type="primary" size="small" :disabled="device.status !== 'idle'">
        {{ device.status === 'idle' ? '立即使用' : '不可用' }}
      </el-button>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.device-card {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .device-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .device-meta {
        .device-name {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        .device-code {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .card-body {
    padding: 12px 0;
    border-top: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 16px;

    .info-row {
      display: flex;
      padding: 4px 0;
      font-size: 14px;

      .label {
        color: #909399;
        min-width: 80px;
      }

      .value {
        color: #303133;

        &.highlight {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  .card-footer {
    text-align: right;
  }
}
</style>
