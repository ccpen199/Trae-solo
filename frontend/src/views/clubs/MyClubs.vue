<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>我的社团</h2>
    </div>

    <div class="card">
      <el-table :data="myClubs" style="width: 100%">
        <el-table-column prop="name" label="社团名称" />
        <el-table-column prop="activity_direction" label="活动方向" />
        <el-table-column prop="member_role" label="我的角色">
          <template #default="{ row }">
            <el-tag size="small" :type="row.member_role === 'leader' ? 'success' : 'info'">
              {{ row.member_role === 'leader' ? '负责人' : '成员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="member_count" label="成员数" />
        <el-table-column prop="status" label="社团状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/clubs/${row.id}`)">详情</el-button>
            <el-button type="success" link @click="$router.push(`/funds/${row.id}`)" v-if="row.member_role === 'leader'">经费</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { clubs } from '@/api'

const myClubs = ref([])

const loadData = async () => {
  const res = await clubs.my()
  myClubs.value = res.data
}

const statusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'info' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回', suspended: '已暂停' }
  return map[status] || status
}

onMounted(loadData)
</script>
