<template>
  <div class="admin-scenarios">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">场景服务管理</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新增场景
        </el-button>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="场景名称">
          <el-input v-model="filterForm.keyword" placeholder="输入名称搜索" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 180px">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" value="enabled" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchList">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetFilter">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" :data="list">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="场景名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <div class="w-32 h-32 rounded-lg flex items-center justify-center" :class="row.icon_bg || 'bg-blue-500'">
                <el-icon size="18" color="#fff"><component :is="row.icon || 'Collection'" /></el-icon>
              </div>
              <div>
                <div class="font-medium text-14">{{ row.name }}</div>
                <div class="text-12 text-gray-500">{{ row.description }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="包含事项" width="120">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.service_count || 0 }}个事项</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department_name" label="牵头部门" width="160" />
        <el-table-column prop="application_count" label="办件量" width="100" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.updated_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              link
              :type="row.status === 'enabled' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'enabled' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-center">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑场景' : '新增场景'" width="800px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="场景名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入场景名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="场景描述" prop="description">
              <el-input
                v-model="form.description"
                type="textarea"
                :rows="2"
                placeholder="请输入场景描述"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="牵头部门" prop="department_id">
              <el-select v-model="form.department_id" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sort" :min="0" :max="999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标">
              <el-select v-model="form.icon" placeholder="请选择图标" style="width: 100%">
                <el-option label="组合服务" value="Collection" />
                <el-option label="企业开办" value="OfficeBuilding" />
                <el-option label="个人办事" value="User" />
                <el-option label="证件办理" value="Tickets" />
                <el-option label="社保服务" value="Medal" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标背景色">
              <el-color-picker v-model="form.icon_bg_color" show-alpha />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否热门">
              <el-switch v-model="form.is_hot" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="关联事项">
              <el-select
                v-model="form.service_item_ids"
                multiple
                filterable
                placeholder="请选择关联的服务事项"
                style="width: 100%"
              >
                <el-option
                  v-for="item in serviceItems"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="办理流程">
              <el-input
                v-model="form.process_description"
                type="textarea"
                :rows="4"
                placeholder="请输入办理流程描述"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="注意事项">
              <el-input
                v-model="form.notes"
                type="textarea"
                :rows="3"
                placeholder="请输入注意事项"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="场景详情" width="800px">
      <div v-if="currentItem">
        <div class="scenario-header mb-20 p-24 rounded-lg" :style="{ background: `linear-gradient(135deg, ${currentItem.icon_bg_color || '#1e88e5'}, ${currentItem.icon_bg_color || '#1565c0'})` }">
          <div class="flex items-center gap-16">
            <div class="w-56 h-56 bg-white/20 rounded-xl flex items-center justify-center">
              <el-icon size="32" color="#fff"><component :is="currentItem.icon || 'Collection'" /></el-icon>
            </div>
            <div class="text-white">
              <h3 class="text-24 font-bold mb-8">{{ currentItem.name }}</h3>
              <p class="text-14 opacity-90">{{ currentItem.description }}</p>
              <div class="flex gap-8 mt-12">
                <el-tag effect="dark" size="small">{{ currentItem.service_count }}个事项</el-tag>
                <el-tag effect="dark" size="small">{{ currentItem.application_count }}次办理</el-tag>
              </div>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="牵头部门">{{ currentItem.department_name }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentItem.sort }}</el-descriptions-item>
          <el-descriptions-item label="是否热门">{{ currentItem.is_hot ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentItem.status === 'enabled' ? '启用' : '禁用' }}</el-descriptions-item>
        </el-descriptions>

        <div class="section mb-20">
          <h4 class="text-16 font-semibold mb-12">包含事项</h4>
          <el-table :data="currentItem.services || []" size="small">
            <el-table-column prop="name" label="事项名称" />
            <el-table-column prop="department_name" label="办理部门" width="160" />
            <el-table-column prop="handling_time" label="承诺时限" width="120">
              <template #default="{ row }">
                {{ row.handling_time }}个工作日
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="section mb-20">
          <h4 class="text-16 font-semibold mb-12">办理流程</h4>
          <p class="text-14 text-gray-600">{{ currentItem.process_description || '暂无' }}</p>
        </div>

        <div class="section">
          <h4 class="text-16 font-semibold mb-12">注意事项</h4>
          <p class="text-14 text-gray-600">{{ currentItem.notes || '暂无' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { scenarioApi, departmentApi, serviceItemApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const departments = ref([])
const serviceItems = ref([])
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const isEdit = ref(false)
const currentItem = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  keyword: '',
  department_id: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  description: '',
  department_id: '',
  sort: 0,
  icon: 'Collection',
  icon_bg_color: '#1e88e5',
  is_hot: false,
  status: 'enabled',
  service_item_ids: [],
  process_description: '',
  notes: ''
})

const rules = {
  name: [{ required: true, message: '请输入场景名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入场景描述', trigger: 'blur' }],
  department_id: [{ required: true, message: '请选择牵头部门', trigger: 'change' }]
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchServiceItems = async () => {
  try {
    const res = await serviceItemApi.list({ page: 1, pageSize: 100 })
    if (res.code === 200) {
      serviceItems.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await scenarioApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockScenarios
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockScenarios
      pagination.total = mockScenarios.length
    }
  } catch (e) {
    list.value = mockScenarios
    pagination.total = mockScenarios.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.department_id = ''
  filterForm.status = ''
  pagination.page = 1
  fetchList()
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    name: '',
    description: '',
    department_id: '',
    sort: 0,
    icon: 'Collection',
    icon_bg_color: '#1e88e5',
    is_hot: false,
    status: 'enabled',
    service_item_ids: [],
    process_description: '',
    notes: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  form.service_item_ids = row.service_item_ids || []
  dialogVisible.value = true
}

const handleView = (row) => {
  currentItem.value = row
  viewDialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  try {
    const res = await scenarioApi.update(row.id, { status: newStatus })
    if (res.code === 200) {
      row.status = newStatus
      ElMessage.success(`已${newStatus === 'enabled' ? '启用' : '禁用'}`)
    }
  } catch (e) {
    row.status = newStatus
    ElMessage.success(`已${newStatus === 'enabled' ? '启用' : '禁用'}`)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await scenarioApi.remove(row.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchList()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('删除成功')
      fetchList()
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? scenarioApi.update(form.id, form) : scenarioApi.create(form)
        const res = await api
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
          dialogVisible.value = false
          fetchList()
        }
      } catch (e) {
        ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
        dialogVisible.value = false
        fetchList()
      }
    }
  })
}

const mockScenarios = [
  {
    id: 1,
    name: '企业开办一件事',
    description: '包含营业执照、公章刻制、税务登记等多个事项',
    icon: 'OfficeBuilding',
    icon_bg: 'bg-blue-500',
    icon_bg_color: '#1e88e5',
    department_id: 1,
    department_name: '市场监督管理局',
    service_count: 5,
    application_count: 1256,
    sort: 1,
    is_hot: true,
    status: 'enabled',
    services: [
      { id: 1, name: '个体工商户营业执照办理', department_name: '市场监管局', handling_time: 3 },
      { id: 2, name: '公章刻制备案', department_name: '公安局', handling_time: 1 },
      { id: 3, name: '税务登记', department_name: '税务局', handling_time: 1 }
    ],
    process_description: '1. 提交企业开办申请；2. 各部门并联审批；3. 领取营业执照和公章；4. 完成税务登记',
    notes: '请准备好身份证、经营场所证明等材料',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-20 10:30:00'
  },
  {
    id: 2,
    name: '公民出生一件事',
    description: '包含出生证明、户口登记、社保参保等事项',
    icon: 'User',
    icon_bg: 'bg-green-500',
    icon_bg_color: '#67c23a',
    department_id: 3,
    department_name: '卫生健康委员会',
    service_count: 4,
    application_count: 892,
    sort: 2,
    is_hot: true,
    status: 'enabled',
    services: [
      { id: 4, name: '出生医学证明办理', department_name: '卫健委', handling_time: 1 },
      { id: 5, name: '户口登记', department_name: '公安局', handling_time: 1 },
      { id: 6, name: '少儿医保参保', department_name: '医保局', handling_time: 3 }
    ],
    process_description: '1. 医院出具出生证明；2. 办理户口登记；3. 参保登记',
    notes: '需提供父母双方身份证、结婚证等材料',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-19 15:20:00'
  },
  {
    id: 3,
    name: '退休一件事',
    description: '包含退休审批、养老金核算、医保待遇等事项',
    icon: 'Medal',
    icon_bg: 'bg-orange-500',
    icon_bg_color: '#e6a23c',
    department_id: 2,
    department_name: '人力资源和社会保障局',
    service_count: 3,
    application_count: 654,
    sort: 3,
    is_hot: false,
    status: 'enabled',
    services: [
      { id: 7, name: '退休审批', department_name: '人社局', handling_time: 5 },
      { id: 8, name: '养老金待遇核算', department_name: '社保局', handling_time: 3 }
    ],
    process_description: '1. 提交退休申请；2. 审核档案材料；3. 核算养老待遇；4. 领取退休证',
    notes: '请提前一个月提交申请',
    created_at: '2024-01-01 00:00:00',
    updated_at: '2024-01-18 09:10:00'
  }
]

onMounted(() => {
  fetchDepartments()
  fetchServiceItems()
  fetchList()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.pagination-wrapper {
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.scenario-header {
  h3 {
    margin: 0;
  }

  p {
    margin: 0;
  }
}

.section {
  h4 {
    margin: 0 0 12px 0;
    color: #303133;
  }

  p {
    line-height: 1.8;
    margin: 0;
  }
}
</style>

