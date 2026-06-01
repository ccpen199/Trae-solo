<template>
  <div class="logs">
    <el-card>
      <template #header><span>操作日志</span></template>
      <el-table :data="list" size="small" v-loading="loading">
        <el-table-column prop="action_time" label="时间" width="160">
          <template #default="{ row }">{{ formatTime(row.action_time) }}</template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ actionText(row.action) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appointment_no" label="预约号" width="120" />
        <el-table-column prop="visitor_name" label="访客" width="100" />
        <el-table-column prop="details" label="详情" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { logs } from '../api'

const list = ref([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    const res = await logs.list()
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const actionText = (a) => ({
  create_appointment: '创建预约',
  review: '审核',
  checkin: '入园',
  checkout: '离园',
  parking_entry: '车辆入场',
  parking_exit: '车辆出场'
}[a] || a)

const formatTime = (t) => t ? t.slice(0, 16) : ''

onMounted(loadData)
</script>
