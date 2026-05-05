<template>
  <div class="page-container">
    <div class="page-header">
      <h2>部门管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增部门
      </el-button>
    </div>

    <el-table 
      :data="tableData" 
      v-loading="loading" 
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="80" align="center" />
      <el-table-column prop="name" label="部门名称" width="200" align="center">
        <template #default="{ row }">
          <div class="dept-name-cell">
            <el-icon class="dept-icon" :color="row.status === 1 ? '#409eff' : '#c0c4cc'">
              <OfficeBuilding />
            </el-icon>
            <span class="dept-name">{{ row.name }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="manager" label="部门经理" width="150" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain" size="small" v-if="row.manager">
            <el-icon><User /></el-icon>
            {{ row.manager }}
          </el-tag>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="部门描述" min-width="250" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.description">{{ row.description }}</span>
          <span v-else style="color: #c0c4cc">暂无描述</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <div class="status-badge" :class="'status-' + row.status">
            <el-icon v-if="row.status === 1"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
            <span>{{ row.status === 1 ? '启用' : '禁用' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="handleEdit(row)" title="编辑部门">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button type="danger" size="small" link @click="handleDelete(row)" title="删除部门">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="dept-stats" v-if="tableData.length > 0">
      <div class="stat-item">
        <span class="stat-label">部门总数</span>
        <span class="stat-value">{{ tableData.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已启用</span>
        <span class="stat-value active">{{ tableData.filter(d => d.status === 1).length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">已禁用</span>
        <span class="stat-value inactive">{{ tableData.filter(d => d.status === 0).length }}</span>
      </div>
    </div>
  </div>

  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="部门名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入部门名称（不能为空）" maxlength="50" show-word-limit>
          <template #prefix>
            <el-icon><OfficeBuilding /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="部门经理">
        <el-input v-model="form.manager" placeholder="请输入部门经理姓名" maxlength="50" show-word-limit>
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="部门描述">
        <el-input 
          v-model="form.description" 
          type="textarea" 
          :rows="4" 
          placeholder="请输入部门描述信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio :value="1">
            <el-icon style="color: #67c23a"><CircleCheck /></el-icon>
            启用
          </el-radio>
          <el-radio :value="0">
            <el-icon style="color: #f56c6c"><CircleClose /></el-icon>
            禁用
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">
        <el-icon><Close /></el-icon>
        取消
      </el-button>
      <el-button type="primary" @click="handleSubmit">
        <el-icon><Check /></el-icon>
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { departmentApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  manager: '',
  description: '',
  status: 1,
})

const rules = {
  name: [
    { required: true, message: '部门名称不能为空', trigger: 'blur' },
    { min: 1, max: 50, message: '部门名称长度在1-50个字符', trigger: 'blur' }
  ],
}

const dialogTitle = computed(() => isEdit.value ? '编辑部门' : '新增部门')

const loadDepartments = async () => {
  loading.value = true
  try {
    const res = await departmentApi.list()
    if (res.success) {
      tableData.value = res.data
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Load departments error:', error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, {
    name: '',
    manager: '',
    description: '',
    status: 1,
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    manager: row.manager || '',
    description: row.description || '',
    status: row.status,
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门【${row.name}】吗？删除后无法恢复。`, 
      '确认删除', 
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      }
    )
    const res = await departmentApi.delete(row.id)
    if (res.success) {
      ElMessage.success(res.message)
      loadDepartments()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete department error:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!form.name || !form.name.trim()) {
    ElMessage.warning('部门名称不能为空')
    return
  }

  try {
    let res
    if (isEdit.value) {
      res = await departmentApi.update(editingId.value, form)
    } else {
      res = await departmentApi.create(form)
    }
    if (res.success) {
      ElMessage.success(res.message)
      dialogVisible.value = false
      loadDepartments()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('Submit error:', error)
  }
}

onMounted(() => {
  loadDepartments()
})
</script>

<style scoped>
.dept-name-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dept-icon {
  margin-right: 6px;
  font-size: 18px;
}

.dept-name {
  font-weight: 600;
  color: #303133;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  gap: 4px;
}

.status-badge.status-1 {
  background: #e6f7e6;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.status-badge.status-0 {
  background: #fff1f0;
  color: #f5222d;
  border: 1px solid #ffa39e;
}

.dept-stats {
  display: flex;
  gap: 40px;
  margin-top: 20px;
  padding: 15px 20px;
  background: #f9f9f9;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #909399;
  font-size: 14px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.stat-value.active {
  color: #67c23a;
}

.stat-value.inactive {
  color: #f56c6c;
}
</style>
