<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>我的报名</h2>
    </div>

    <div class="card">
      <el-table :data="applications" style="width: 100%">
        <el-table-column prop="club_name" label="社团" />
        <el-table-column prop="campaign_title" label="纳新活动" />
        <el-table-column prop="reason" label="申请理由" show-overflow-tooltip />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="applied_at" label="申请时间" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { recruitment } from '@/api'

const applications = ref([])

const loadData = async () => {
  const res = await recruitment.myApplications()
  applications.value = res.data
}

const statusType = (status) => {
  const map = { pending: 'warning', interview: 'primary', accepted: 'success', rejected: 'danger' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待处理', interview: '面试中', accepted: '已录取', rejected: '已拒绝' }
  return map[status] || status
}

onMounted(loadData)
</script>
