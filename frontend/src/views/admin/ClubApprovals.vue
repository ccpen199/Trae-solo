<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">社团审批</h2>
    <div class="card">
      <el-table :data="clubs" style="width: 100%">
        <el-table-column prop="name" label="社团名称" />
        <el-table-column prop="activity_direction" label="活动方向" />
        <el-table-column prop="leader_name" label="负责人" />
        <el-table-column prop="teacher_name" label="指导老师" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" />
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="showDetail(row)">查看详情</el-button>
            <el-button type="success" link size="small" @click="approveClub(row, 'approved')" v-if="row.status === 'pending'">
              通过
            </el-button>
            <el-button type="danger" link size="small" @click="approveClub(row, 'rejected')" v-if="row.status === 'pending'">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showDetailDialog" title="社团详情" width="600px">
      <el-descriptions :column="1" border v-if="currentClub">
        <el-descriptions-item label="社团名称">{{ currentClub.name }}</el-descriptions-item>
        <el-descriptions-item label="活动方向">{{ currentClub.activity_direction }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentClub.leader_name }}</el-descriptions-item>
        <el-descriptions-item label="指导老师">{{ currentClub.teacher_name }}</el-descriptions-item>
        <el-descriptions-item label="社团描述">{{ currentClub.description }}</el-descriptions-item>
        <el-descriptions-item label="社团章程">{{ currentClub.charter }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { clubs as clubsApi } from '@/api'

const clubList = ref([])
const showDetailDialog = ref(false)
const currentClub = ref(null)

const clubs = computed(() => clubList.value)

const loadClubs = async () => {
  const res = await clubsApi.list()
  clubList.value = res.data
}

const showDetail = (row) => {
  currentClub.value = row
  showDetailDialog.value = true
}

const approveClub = async (row, status) => {
  try {
    await clubsApi.approve(row.id, { status })
    ElMessage.success('操作成功')
    loadClubs()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '操作失败')
  }
}

const statusType = (status) => {
  const map = { pending: 'warning', approved: 'success', rejected: 'danger', suspended: 'info' }
  return map[status] || ''
}

const statusText = (status) => {
  const map = { pending: '待审批', approved: '已通过', rejected: '已驳回', suspended: '已暂停' }
  return map[status] || status
}

onMounted(loadClubs)
</script>
