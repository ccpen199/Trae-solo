<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type?: 'device' | 'order' | 'payment' | 'alert' | 'workorder'
}>()

const statusConfig = computed(() => {
  const configs: Record<string, Record<string, { text: string; type: string }>> = {
    device: {
      idle: { text: '空闲', type: 'success' },
      running: { text: '运行中', type: 'primary' },
      paused: { text: '已暂停', type: 'warning' },
      fault: { text: '故障', type: 'danger' },
      maintenance: { text: '维护中', type: 'info' }
    },
    order: {
      pending: { text: '待支付', type: 'warning' },
      paid: { text: '已支付', type: 'primary' },
      washing: { text: '洗涤中', type: 'primary' },
      completed: { text: '已完成', type: 'success' },
      cancelled: { text: '已取消', type: 'info' },
      refunded: { text: '已退款', type: 'info' }
    },
    payment: {
      pending: { text: '处理中', type: 'warning' },
      success: { text: '成功', type: 'success' },
      failed: { text: '失败', type: 'danger' },
      refunded: { text: '已退款', type: 'info' }
    },
    alert: {
      active: { text: '待处理', type: 'danger' },
      processing: { text: '处理中', type: 'warning' },
      resolved: { text: '已解决', type: 'success' },
      ignored: { text: '已忽略', type: 'info' }
    },
    workorder: {
      pending: { text: '待派单', type: 'warning' },
      assigned: { text: '已派单', type: 'primary' },
      processing: { text: '处理中', type: 'primary' },
      completed: { text: '已完成', type: 'success' },
      cancelled: { text: '已取消', type: 'info' }
    }
  }
  return configs[props.type || 'device'][props.status] || { text: props.status, type: 'info' }
})
</script>

<template>
  <el-tag :type="statusConfig.type as any" size="small" effect="light">
    {{ statusConfig.text }}
  </el-tag>
</template>
