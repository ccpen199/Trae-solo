<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">检查对象管理</h2>
      <el-button type="primary" @click="openDialog()">
        <el-icon><Plus /></el-icon>
        新增单位
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="风险等级">
          <el-select v-model="searchForm.risk_level" placeholder="全部" clearable style="width: 120px">
            <el-option label="高风险" value="high" />
            <el-option label="中风险" value="medium" />
            <el-option label="低风险" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="重点检查">
          <el-select v-model="searchForm.is_focus" placeholder="全部" clearable style="width: 120px">
            <el-option label="是" value="true" />
            <el-option label="否" value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadUnits">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="units" border stripe>
      <el-table-column prop="name" label="单位名称" min-width="150" />
      <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
      <el-table-column prop="industry" label="行业" width="120" />
      <el-table-column label="风险等级" width="100">
        <template #default="{ row }">
          <span :class="`risk-${row.risk_level}`">
            {{ riskLevelMap[row.risk_level] }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="fire_facilities" label="消防设施" min-width="150" show-overflow-tooltip />
      <el-table-column prop="responsible_person" label="责任人" width="100" />
      <el-table-column prop="phone" label="联系电话" width="130" />
      <el-table-column label="重点检查" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.is_focus" type="danger" size="small">是</el-tag>
          <el-tag v-else size="small">否</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editUnit.id ? '编辑单位' : '新增单位'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="单位名称" required>
          <el-input v-model="form.name" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="地址" required>
          <el-input v-model="form.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="行业">
          <el-input v-model="form.industry" placeholder="请输入行业类型" />
        </el-form-item>
        <el-form-item label="风险等级" required>
          <el-select v-model="form.risk_level" style="width: 100%">
            <el-option label="高风险" value="high" />
            <el-option label="中风险" value="medium" />
            <el-option label="低风险" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="消防设施">
          <el-input v-model="form.fire_facilities" type="textarea" :rows="2" placeholder="请列出主要消防设施" />
        </el-form-item>
        <el-form-item label="责任人">
          <el-input v-model="form.responsible_person" placeholder="请输入责任人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api'

const units = ref([])
const dialogVisible = ref(false)
const editUnit = ref({})

const searchForm = reactive({
  risk_level: '',
  is_focus: ''
})

const form = reactive({
  name: '',
  address: '',
  industry: '',
  risk_level: 'medium',
  fire_facilities: '',
  responsible_person: '',
  phone: ''
})

const riskLevelMap = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
}

const loadUnits = async () => {
  const params = {}
  if (searchForm.risk_level) params.risk_level = searchForm.risk_level
  if (searchForm.is_focus) params.is_focus = searchForm.is_focus
  
  units.value = await api.getUnits(params)
}

const resetSearch = () => {
  searchForm.risk_level = ''
  searchForm.is_focus = ''
  loadUnits()
}

const openDialog = (row = null) => {
  editUnit.value = row || {}
  if (row) {
    Object.assign(form, row)
  } else {
    Object.keys(form).forEach(key => {
      form[key] = key === 'risk_level' ? 'medium' : ''
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!form.name || !form.address) {
    ElMessage.warning('请填写必填项')
    return
  }
  
  if (editUnit.value.id) {
    await api.updateUnit(editUnit.value.id, form)
    ElMessage.success('更新成功')
  } else {
    await api.createUnit(form)
    ElMessage.success('创建成功')
  }
  
  dialogVisible.value = false
  loadUnits()
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该单位吗？', '提示', { type: 'warning' })
    await api.deleteUnit(row.id)
    ElMessage.success('删除成功')
    loadUnits()
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadUnits()
})
</script>
