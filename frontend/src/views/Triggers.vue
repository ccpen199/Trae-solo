<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span>触发事件</span>
      </template>
      <el-table :data="events" stripe>
        <el-table-column prop="event_code" label="事件代码" />
        <el-table-column prop="event_name" label="事件名称" />
        <el-table-column prop="event_type" label="类型">
          <template #default="{ row }">
            <el-tag size="small">{{ row.event_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { progressApi } from '../api'

const events = ref([])

onMounted(async () => {
  try {
    const result = await progressApi.getTriggerEvents()
    events.value = result.data
  } catch (error) {
    console.error('加载触发事件失败:', error)
  }
})
</script>

<style scoped>
.page-container {
  padding: 0;
}
</style>
