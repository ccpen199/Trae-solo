<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">规则配置</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增规则
      </el-button>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-select v-model="filters.ruleType" placeholder="规则类型" clearable style="width: 150px;" @change="loadData">
          <el-option label="行为类" value="behavior" />
          <el-option label="订阅类" value="subscription" />
          <el-option label="支付类" value="payment" />
          <el-option label="资料类" value="profile" />
          <el-option label="客服类" value="support" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 120px;" @change="loadData">
          <el-option label="启用" :value="1" />
          <el-option label="停用" :value="0" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="rule_code" label="规则编码" width="140" />
        <el-table-column prop="rule_name" label="规则名称" min-width="150" />
        <el-table-column prop="rule_type" label="规则类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getRuleTypeText(row.rule_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rule_expression" label="规则表达式" min-width="200" show-overflow-tooltip />
        <el-table-column prop="risk_score" label="风险分值" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">+{{ row.risk_score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="责任人" width="100" />
        <el-table-column prop="valid_from" label="有效期起" width="120" />
        <el-table-column prop="valid_to" label="有效期止" width="120" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="规则编码" prop="rule_code">
          <el-input v-model="form.rule_code" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="规则名称" prop="rule_name">
          <el-input v-model="form.rule_name" />
        </el-form-item>
        <el-form-item label="规则类型" prop="rule_type">
          <el-select v-model="form.rule_type" style="width: 100%;">
            <el-option label="行为类" value="behavior" />
            <el-option label="订阅类" value="subscription" />
            <el-option label="支付类" value="payment" />
            <el-option label="资料类" value="profile" />
            <el-option label="客服类" value="support" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则表达式">
          <el-input v-model="form.rule_expression" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="风险分值" prop="risk_score">
          <el-input-number v-model="form.risk_score" :min="0" :max="100" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="责任人">
          <el-select v-model="form.owner_id" style="width: 100%;">
            <el-option v-for="u in users" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import api from '../../api'

const list = ref([])
const users = ref([])
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref()
const dateRange = ref([])

const filters = reactive({
  ruleType: '',
  status: ''
})

const form = reactive({
  id: null,
  rule_code: '',
  rule_name: '',
  rule_type: 'behavior',
  rule_expression: '',
  risk_score: 10,
  owner_id: null,
  valid_from: '',
  valid_to: '',
  sort_order: 0,
  status: 1,
  remark: ''
})

const rules = {
  rule_code: [{ required: true, message: '请输入规则编码', trigger: 'blur' }],
  rule_name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  rule_type: [{ required: true, message: '请选择规则类型', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/config/rules', { params: filters })
    list.value = res.data.list
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const loadUsers = async () => {
  try {
    const res = await api.get('/config/users')
    users.value = res.data.list
  } catch (e) {
    console.error(e)
  }
}

const resetFilters = () => {
  filters.ruleType = ''
  filters.status = ''
  loadData()
}

const openCreateDialog = () => {
  dialogTitle.value = '新增规则'
  isEdit.value = false
  Object.assign(form, {
    id: null,
    rule_code: '',
    rule_name: '',
    rule_type: 'behavior',
    rule_expression: '',
    risk_score: 10,
    owner_id: null,
    valid_from: '',
    valid_to: '',
    sort_order: 0,
    status: 1,
    remark: ''
  })
  dateRange.value = []
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑规则'
  isEdit.value = true
  Object.assign(form, { ...row })
  dateRange.value = row.valid_from && row.valid_to ? [row.valid_from, row.valid_to] : []
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (dateRange.value && dateRange.value.length === 2) {
        form.valid_from = dateRange.value[0]
        form.valid_to = dateRange.value[1]
      }
      
      if (isEdit.value) {
        await api.put(`/config/rules/${form.id}`, form)
        ElMessage.success('更新成功')
      } else {
        await api.post('/config/rules', form)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      loadData()
    } catch (e) {
      console.error(e)
    } finally {
      submitLoading.value = false
    }
  })
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除规则"${row.rule_name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.delete(`/config/rules/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const getRuleTypeText = (type) => {
  const texts = {
    behavior: '行为类',
    subscription: '订阅类',
    payment: '支付类',
    profile: '资料类',
    support: '客服类'
  }
  return texts[type] || type
}

onMounted(() => {
  loadData()
  loadUsers()
})
</script>
