<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2>社团列表</h2>
      <el-button type="primary" @click="showCreateDialog = true">创建社团</el-button>
    </div>
    
    <div class="card mb-20">
      <el-table :data="clubList" style="width: 100%">
        <el-table-column prop="name" label="社团名称" />
        <el-table-column prop="activity_direction" label="活动方向" />
        <el-table-column prop="leader_name" label="负责人" />
        <el-table-column prop="teacher_name" label="指导老师" />
        <el-table-column prop="member_count" label="成员数" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag size="small" :type="statusType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="年审状态">
          <template #default="{ row }">
            <el-tag size="small" :type="row.annual_review_passed ? 'success' : 'danger'">
              {{ row.annual_review_passed ? '通过' : '未通过' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/clubs/${row.id}`)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="showCreateDialog" title="创建社团" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="社团名称">
          <el-input v-model="createForm.name" />
        </el-form-item>
        <el-form-item label="社团描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="社团章程">
          <el-input v-model="createForm.charter" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="活动方向">
          <el-input v-model="createForm.activity_direction" />
        </el-form-item>
        <el-form-item label="指导老师">
          <el-select v-model="createForm.teacher_id" style="width: 100%">
            <el-option v-for="t in teachers" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { clubs, stats } from '@/api'

const clubList = ref([])
const teachers = ref([])
const showCreateDialog = ref(false)
const creating = ref(false)

const createForm = ref({
  name: '',
  description: '',
  charter: '',
  activity_direction: '',
  teacher_id: null
})

const loadClubs = async () => {
  const res = await clubs.list()
  clubList.value = res.data
}

const loadTeachers = async () => {
  const res = await stats.teachers()
  teachers.value = res.data
}

const handleCreate = async () => {
  if (!createForm.value.name) {
    ElMessage.warning('请输入社团名称')
    return
  }
  try {
    creating.value = true
    await clubs.create(createForm.value)
    ElMessage.success('社团创建成功，等待审批')
    showCreateDialog.value = false
    createForm.value = { name: '', description: '', charter: '', activity_direction: '', teacher_id: null }
    loadClubs()
  } catch (err) {
    ElMessage.error(err.response?.data?.error || '创建失败')
  } finally {
    creating.value = false
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

onMounted(() => {
  loadClubs()
  loadTeachers()
})
</script>
