<template>
  <div>
    <el-card shadow="hover">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight: bold">积分规则配置</span>
          <el-button type="primary" @click="openDialog">新增规则</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)" size="small">
              {{ getCategoryLabel(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分数" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.points > 0 ? '#67C23A' : '#F56C6C' }">
              {{ row.points > 0 ? '+' : '' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewVersions(row)">版本历史</el-button>
            <el-button type="primary" link size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑规则' : '新增规则'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="规则名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="规则分类" required>
          <el-select v-model="form.category" style="width: 100%">
            <el-option label="志愿服务" value="volunteer" />
            <el-option label="垃圾分类" value="garbage" />
            <el-option label="活动参与" value="activity" />
            <el-option label="文明行为" value="civilization" />
            <el-option label="扣分项目" value="penalty" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分数" required>
          <el-input-number v-model="form.points" :min="-1000" :max="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="变更原因" v-if="isEdit">
          <el-input v-model="changeReason" type="textarea" :rows="2" placeholder="请输入变更原因，用于版本记录" />
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="form.is_active" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="versionDialogVisible" title="版本历史" width="600px">
      <el-table :data="versions" size="small">
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="name" label="规则名称" />
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column prop="change_reason" label="变更原因" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const tableData = ref([])

const dialogVisible = ref(false)
const versionDialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({})
const changeReason = ref('')
const versions = ref([])

const getCategoryLabel = (category) => {
  const labels = {
    volunteer: '志愿服务',
    garbage: '垃圾分类',
    activity: '活动参与',
    civilization: '文明行为',
    penalty: '扣分项目'
  }
  return labels[category] || category
}

const getCategoryType = (category) => {
  const types = {
    volunteer: 'primary',
    garbage: 'success',
    activity: 'warning',
    civilization: 'danger',
    penalty: 'info'
  }
  return types[category] || 'info'
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/rules')
    tableData.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const openDialog = (row = null) => {
  isEdit.value = !!row
  form.value = row ? { ...row } : {
    name: '',
    category: 'volunteer',
    points: 10,
    description: '',
    is_active: true
  }
  changeReason.value = ''
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await axios.put(`/api/rules/${form.value.id}`, {
        ...form.value,
        change_reason: changeReason.value
      })
      ElMessage.success('更新成功')
    } else {
      await axios.post('/api/rules', form.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定停用该规则吗？', '提示')
    await axios.delete(`/api/rules/${row.id}`)
    ElMessage.success('已停用')
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const viewVersions = async (row) => {
  try {
    const res = await axios.get(`/api/rules/${row.id}`)
    versions.value = res.data.versions || []
    versionDialogVisible.value = true
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
