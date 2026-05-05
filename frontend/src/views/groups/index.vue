<template>
  <div class="groups-page">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>分组列表</span>
              <el-button type="primary" size="small" @click="handleAdd">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </div>
          </template>
          
          <div class="group-list">
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-item"
              :class="{ active: selectedGroup?.id === group.id }"
              @click="selectGroup(group)"
            >
              <div class="group-name">
                <el-icon><FolderOpened /></el-icon>
                {{ group.name }}
              </div>
              <div class="group-actions">
                <el-button type="primary" link size="small" @click.stop="handleEdit(group)">编辑</el-button>
                <el-button type="danger" link size="small" @click.stop="handleDelete(group)">删除</el-button>
              </div>
            </div>
            
            <el-empty v-if="groups.length === 0" description="暂无分组" />
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span v-if="selectedGroup">{{ selectedGroup.name }} - 名片列表</span>
              <span v-else>请选择一个分组</span>
            </div>
          </template>
          
          <template v-if="selectedGroup">
            <el-table
              v-loading="loading"
              :data="groupCards"
              style="width: 100%"
            >
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="companyName" label="公司" min-width="180" />
              <el-table-column prop="positionName" label="职位" width="120" />
              <el-table-column prop="mobile" label="手机" width="130" />
              <el-table-column prop="email" label="邮箱" min-width="180" />
              <el-table-column label="操作" width="100">
                <template #default="{ row }">
                  <el-button type="danger" link @click="removeFromGroup(row)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.size"
                :page-sizes="[10, 20, 50]"
                :total="pagination.total"
                layout="total, sizes, prev, pager, next"
                @size-change="loadGroupCards"
                @current-change="loadGroupCards"
              />
            </div>
          </template>
          
          <el-empty v-else description="请从左侧选择一个分组" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-dialog
      v-model="showDialog"
      :title="editingGroup ? '编辑分组' : '新增分组'"
      width="400px"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="groupForm.name" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="groupForm.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="业务" value="BUSINESS" />
            <el-option label="客户" value="CLIENT" />
            <el-option label="项目" value="PROJECT" />
            <el-option label="部门" value="DEPARTMENT" />
            <el-option label="自定义" value="CUSTOM" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { groupApi } from '@/api'

const loading = ref(false)
const saving = ref(false)
const groups = ref([])
const selectedGroup = ref(null)
const groupCards = ref([])
const showDialog = ref(false)
const editingGroup = ref(null)
const groupFormRef = ref(null)

const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

const groupForm = reactive({
  name: '',
  type: 'CUSTOM',
  description: ''
})

const groupRules = {
  name: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
}

const loadGroups = async () => {
  try {
    const result = await groupApi.list()
    groups.value = result.data || []
  } catch (error) {
    console.error('加载分组失败:', error)
  }
}

const loadGroupCards = async () => {
  if (!selectedGroup.value) return
  
  loading.value = true
  try {
    const result = await groupApi.getCards(selectedGroup.value.id, {
      page: pagination.page - 1,
      size: pagination.size
    })
    groupCards.value = result.data?.content || []
    pagination.total = result.data?.totalElements || 0
  } catch (error) {
    console.error('加载分组名片失败:', error)
  } finally {
    loading.value = false
  }
}

const selectGroup = (group) => {
  selectedGroup.value = group
  pagination.page = 1
  loadGroupCards()
}

const resetForm = () => {
  groupForm.name = ''
  groupForm.type = 'CUSTOM'
  groupForm.description = ''
}

const handleAdd = () => {
  editingGroup.value = null
  resetForm()
  showDialog.value = true
}

const handleEdit = (group) => {
  editingGroup.value = group
  Object.assign(groupForm, {
    name: group.name || '',
    type: group.type || 'CUSTOM',
    description: group.description || ''
  })
  showDialog.value = true
}

const handleSave = async () => {
  const valid = await groupFormRef.value.validate().catch(() => false)
  if (!valid) return
  
  saving.value = true
  try {
    if (editingGroup.value) {
      await groupApi.update(editingGroup.value.id, groupForm)
      ElMessage.success('更新成功')
    } else {
      await groupApi.create(groupForm)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    editingGroup.value = null
    resetForm()
    loadGroups()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

const handleDelete = async (group) => {
  try {
    await ElMessageBox.confirm('确定要删除该分组吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await groupApi.delete(group.id)
    ElMessage.success('删除成功')
    if (selectedGroup.value?.id === group.id) {
      selectedGroup.value = null
    }
    loadGroups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const removeFromGroup = async (card) => {
  try {
    await ElMessageBox.confirm('确定要将该名片从分组中移除吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await groupApi.removeCard(selectedGroup.value.id, card.id)
    ElMessage.success('已从分组移除')
    loadGroupCards()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('移除失败:', error)
    }
  }
}

onMounted(() => {
  loadGroups()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-list {
  max-height: 600px;
  overflow-y: auto;
}

.group-item {
  padding: 12px 15px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  transition: all 0.3s;
}

.group-item:hover {
  background: #f5f7fa;
}

.group-item.active {
  background: #ecf5ff;
  color: #409EFF;
}

.group-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-actions {
  opacity: 0;
  transition: opacity 0.3s;
}

.group-item:hover .group-actions {
  opacity: 1;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
