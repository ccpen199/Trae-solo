<template>
  <div class="teams">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>团队管理</span>
          <el-button type="primary" @click="openTeamDialog">
            <el-icon><Plus /></el-icon>
            新建团队
          </el-button>
        </div>
      </template>

      <el-table :data="teams" v-loading="loading">
        <el-table-column prop="name" label="团队名称" />
        <el-table-column prop="route" label="线路" />
        <el-table-column prop="departure_date" label="出团日期" width="120" />
        <el-table-column prop="sales_manager" label="销售负责人" width="120" />
        <el-table-column prop="tourist_count" label="游客人数" width="100" align="center" />
        <el-table-column prop="reservation_count" label="预订数" width="90" align="center" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '进行中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="goToDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="editTeam(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteTeam(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="teamDialogVisible" :title="isEditing ? '编辑团队' : '新建团队'" width="500px">
      <el-form :model="teamForm" label-width="100px">
        <el-form-item label="团队名称">
          <el-input v-model="teamForm.name" placeholder="请输入团队名称" />
        </el-form-item>
        <el-form-item label="线路">
          <el-input v-model="teamForm.route" placeholder="请输入线路" />
        </el-form-item>
        <el-form-item label="出团日期">
          <el-date-picker v-model="teamForm.departure_date" type="date" placeholder="选择日期" />
        </el-form-item>
        <el-form-item label="销售负责人">
          <el-input v-model="teamForm.sales_manager" placeholder="请输入" />
        </el-form-item>
        <el-form-item label="状态" v-if="isEditing">
          <el-select v-model="teamForm.status">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teamDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTeam">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { teamApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const teams = ref([])
const teamDialogVisible = ref(false)
const isEditing = ref(false)

const teamForm = ref({
  name: '',
  route: '',
  departure_date: '',
  sales_manager: '',
  status: 'active'
})

const loadTeams = async () => {
  loading.value = true
  try {
    const res = await teamApi.getAll()
    if (res.success) {
      teams.value = res.data
    }
  } catch (error) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const openTeamDialog = (row = null) => {
  isEditing.value = !!row
  if (row) {
    teamForm.value = { ...row }
  } else {
    teamForm.value = {
      name: '',
      route: '',
      departure_date: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      sales_manager: '',
      status: 'active'
    }
  }
  teamDialogVisible.value = true
}

const editTeam = (row) => {
  openTeamDialog(row)
}

const saveTeam = async () => {
  try {
    if (isEditing.value) {
      await teamApi.update(teamForm.value.id, teamForm.value)
      ElMessage.success('更新成功')
    } else {
      await teamApi.create(teamForm.value)
      ElMessage.success('创建成功')
    }
    teamDialogVisible.value = false
    loadTeams()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteTeam = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该团队吗？相关预订将被释放。', '提示', { type: 'warning' })
    await teamApi.delete(row.id)
    ElMessage.success('删除成功')
    loadTeams()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const goToDetail = (row) => {
  router.push(`/teams/${row.id}`)
}

onMounted(() => {
  loadTeams()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
