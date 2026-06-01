<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">客户管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="搜索客户名称/编号/联系人" clearable style="width: 250px;" @change="loadData" />
        <el-select v-model="filters.level" placeholder="客户等级" clearable style="width: 120px;" @change="loadData">
          <el-option label="A级" value="A" />
          <el-option label="B级" value="B" />
          <el-option label="C级" value="C" />
          <el-option label="D级" value="D" />
        </el-select>
        <el-select v-model="filters.region" placeholder="区域" clearable style="width: 120px;" @change="loadData">
          <el-option label="华北" value="华北" />
          <el-option label="华东" value="华东" />
          <el-option label="华南" value="华南" />
          <el-option label="华中" value="华中" />
          <el-option label="西南" value="西南" />
          <el-option label="西北" value="西北" />
          <el-option label="东北" value="东北" />
        </el-select>
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="customer_no" label="客户编号" width="120" />
        <el-table-column prop="name" label="客户名称" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/customers/${row.id}`)">
              {{ row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="company" label="公司名称" min-width="150" />
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="level" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}级</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contact_name" label="联系人" width="100" />
        <el-table-column prop="contact_phone" label="联系电话" width="130" />
        <el-table-column prop="total_amount" label="累计消费" width="120">
          <template #default="{ row }">¥{{ (row.total_amount || 0).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="expiration_date" label="到期日期" width="120" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/customers/${row.id}`)">详情</el-button>
            <el-button type="primary" size="small" link @click="openAssessDialog(row)">评估</el-button>
            <el-button type="primary" size="small" link @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex-between mt-20">
        <span>共 {{ total }} 条记录</span>
        <el-pagination 
          :current-page="page" 
          :page-size="pageSize" 
          :total="total"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="客户编号" prop="customer_no">
          <el-input v-model="form.customer_no" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="客户名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="公司名称">
          <el-input v-model="form.company" />
        </el-form-item>
        <el-form-item label="行业">
          <el-input v-model="form.industry" />
        </el-form-item>
        <el-form-item label="客户等级" prop="level">
          <el-select v-model="form.level" style="width: 100%;">
            <el-option label="A级" value="A" />
            <el-option label="B级" value="B" />
            <el-option label="C级" value="C" />
            <el-option label="D级" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.contact_phone" />
        </el-form-item>
        <el-form-item label="联系邮箱">
          <el-input v-model="form.contact_email" />
        </el-form-item>
        <el-form-item label="区域">
          <el-select v-model="form.region" style="width: 100%;">
            <el-option label="华北" value="华北" />
            <el-option label="华东" value="华东" />
            <el-option label="华南" value="华南" />
            <el-option label="华中" value="华中" />
            <el-option label="西南" value="西南" />
            <el-option label="西北" value="西北" />
            <el-option label="东北" value="东北" />
          </el-select>
        </el-form-item>
        <el-form-item label="累计消费">
          <el-input-number v-model="form.total_amount" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="form.expiration_date" type="date" style="width: 100%;" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">停用</el-radio>
          </el-radio-group>
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
import { useRouter } from 'vue-router'
import api from '../../api'

const router = useRouter()
const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEdit = ref(false)
const formRef = ref()

const filters = reactive({
  keyword: '',
  level: '',
  region: ''
})

const form = reactive({
  id: null,
  customer_no: '',
  name: '',
  company: '',
  industry: '',
  level: 'B',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  region: '',
  total_amount: 0,
  expiration_date: '',
  status: 1
})

const rules = {
  customer_no: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await api.get('/customers', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        ...filters
      }
    })
    list.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.keyword = ''
  filters.level = ''
  filters.region = ''
  page.value = 1
  loadData()
}

const handlePageChange = (p) => {
  page.value = p
  loadData()
}

const handleSizeChange = (size) => {
  pageSize.value = size
  page.value = 1
  loadData()
}

const openCreateDialog = () => {
  dialogTitle.value = '新增客户'
  isEdit.value = false
  Object.assign(form, {
    id: null,
    customer_no: '',
    name: '',
    company: '',
    industry: '',
    level: 'B',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    region: '',
    total_amount: 0,
    expiration_date: '',
    status: 1
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  dialogTitle.value = '编辑客户'
  isEdit.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const openAssessDialog = async (row) => {
  ElMessageBox.confirm(`确定要对客户"${row.name}"进行风险评估吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info'
  }).then(async () => {
    try {
      await api.post('/assessments', { customer_id: row.id })
      ElMessage.success('评估创建成功')
      router.push('/assessments')
    } catch (e) {
      console.error(e)
    }
  }).catch(() => {})
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitLoading.value = true
    try {
      if (isEdit.value) {
        await api.put(`/customers/${form.id}`, form)
        ElMessage.success('更新成功')
      } else {
        await api.post('/customers', form)
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

const getLevelType = (level) => {
  const types = { A: 'success', B: 'primary', C: 'warning', D: 'danger' }
  return types[level] || 'info'
}

onMounted(() => {
  loadData()
})
</script>
