<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">岗位管理</h1>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        新增岗位
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-table :data="positions" stripe style="width: 100%;">
        <el-table-column prop="position_code" label="岗位编码" width="120" />
        <el-table-column prop="position_name" label="岗位名称" width="150" />
        <el-table-column prop="department" label="所属部门" width="120" />
        <el-table-column prop="description" label="岗位描述" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" @click="viewRequirements(row)">查看要求</el-button>
              <el-button size="small" type="danger" @click="deletePosition(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showAddDialog" title="新增岗位" width="500px">
      <el-form :model="positionForm" label-width="100px">
        <el-form-item label="岗位编码">
          <el-input v-model="positionForm.position_code" />
        </el-form-item>
        <el-form-item label="岗位名称">
          <el-input v-model="positionForm.position_name" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-input v-model="positionForm.department" />
        </el-form-item>
        <el-form-item label="岗位描述">
          <el-input v-model="positionForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="savePosition">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReqDialog" :title="`${currentPosition?.position_name} - 岗位要求`" width="600px">
      <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
        <span style="font-weight: 600;">要求列表</span>
        <el-button size="small" type="primary" @click="showAddReqDialog = true">添加要求</el-button>
      </div>
      <el-table :data="currentPosition?.requirements || []" stripe>
        <el-table-column prop="requirement_type" label="要求类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.requirement_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="requirement_content" label="要求内容" />
        <el-table-column prop="retraining_cycle" label="复训周期(月)" width="120" />
      </el-table>

      <el-dialog v-model="showAddReqDialog" title="添加岗位要求" width="400px">
        <el-form :model="reqForm" label-width="100px">
          <el-form-item label="要求类型">
            <el-select v-model="reqForm.requirement_type" style="width: 100%;">
              <el-option label="技能" value="技能" />
              <el-option label="证书" value="证书" />
              <el-option label="培训" value="培训" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="要求内容">
            <el-input v-model="reqForm.requirement_content" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="复训周期(月)">
            <el-input-number v-model="reqForm.retraining_cycle" :min="0" style="width: 100%;" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddReqDialog = false">取消</el-button>
          <el-button type="primary" @click="saveRequirement">保存</el-button>
        </template>
      </el-dialog>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { positionsAPI } from '@/api'

const positions = ref([])
const showAddDialog = ref(false)
const showReqDialog = ref(false)
const showAddReqDialog = ref(false)
const currentPosition = ref(null)

const positionForm = ref({
  position_code: '',
  position_name: '',
  department: '',
  description: ''
})

const reqForm = ref({
  requirement_type: '技能',
  requirement_content: '',
  retraining_cycle: 0
})

const loadPositions = async () => {
  try {
    const res = await positionsAPI.list()
    positions.value = res.data || []
  } catch (err) {
    ElMessage.error('加载岗位列表失败')
  }
}

const savePosition = async () => {
  try {
    await positionsAPI.create(positionForm.value)
    ElMessage.success('创建成功')
    showAddDialog.value = false
    loadPositions()
  } catch (err) {
    ElMessage.error('创建失败')
  }
}

const viewRequirements = async (row) => {
  try {
    const res = await positionsAPI.get(row.id)
    currentPosition.value = res.data
    showReqDialog.value = true
  } catch (err) {
    ElMessage.error('加载岗位要求失败')
  }
}

const saveRequirement = async () => {
  try {
    await positionsAPI.addRequirement(currentPosition.value.id, reqForm.value)
    ElMessage.success('添加成功')
    showAddReqDialog.value = false
    viewRequirements(currentPosition.value)
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const deletePosition = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该岗位吗？', '提示', { type: 'warning' })
    await positionsAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadPositions()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadPositions()
})
</script>
