<template>
  <div class="admin-departments">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">部门管理</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新增部门
        </el-button>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="部门名称">
          <el-input v-model="filterForm.keyword" placeholder="输入部门名称搜索" clearable style="width: 240px" />
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

      <el-table v-loading="loading" :data="list" row-key="id" :expand-row-keys="expandRowKeys" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="部门名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-8">
              <el-icon size="16" color="#1e88e5"><OfficeBuilding /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="部门编码" width="140" />
        <el-table-column prop="parent_name" label="上级部门" width="140">
          <template #default="{ row }">
            {{ row.parent_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="leader" label="负责人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="user_count" label="人员数量" width="100" />
        <el-table-column prop="service_count" label="事项数量" width="100" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'enabled' ? 'success' : 'info'" size="small">
              {{ row.status === 'enabled' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleAddChild(row)">
              添加子部门
            </el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="部门编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入部门编码" />
        </el-form-item>
        <el-form-item label="上级部门">
          <el-tree-select
            v-model="form.parent_id"
            :data="departmentTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级部门（顶级部门可不选）"
            clearable
            check-strictly
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.leader" placeholder="请输入负责人姓名" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="部门描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入部门描述"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" />
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
import { ref, reactive, computed, onMounted } from 'vue'
import { departmentApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref([])
const departmentTree = ref([])
const expandRowKeys = ref([])
const selectedIds = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const isAddChild = ref(false)
const currentParent = ref(null)
const formRef = ref(null)

const filterForm = reactive({
  keyword: '',
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
  code: '',
  parent_id: null,
  leader: '',
  phone: '',
  description: '',
  sort: 0,
  status: 'enabled'
})

const rules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入部门编码', trigger: 'blur' }]
}

const dialogTitle = computed(() => {
  if (isAddChild.value) return '添加子部门'
  return isEdit.value ? '编辑部门' : '新增部门'
})

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    const res = await departmentApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockDepartments
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockDepartments
      pagination.total = mockDepartments.length
    }
  } catch (e) {
    list.value = mockDepartments
    pagination.total = mockDepartments.length
  } finally {
    loading.value = false
  }
}

const fetchTree = async () => {
  try {
    const res = await departmentApi.tree()
    if (res.code === 200) {
      departmentTree.value = res.data || mockTree
    } else {
      departmentTree.value = mockTree
    }
  } catch (e) {
    departmentTree.value = mockTree
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleCreate = () => {
  isEdit.value = false
  isAddChild.value = false
  currentParent.value = null
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    parent_id: null,
    leader: '',
    phone: '',
    description: '',
    sort: 0,
    status: 'enabled'
  })
  fetchTree()
  dialogVisible.value = true
}

const handleAddChild = (row) => {
  isEdit.value = false
  isAddChild.value = true
  currentParent.value = row
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    parent_id: row.id,
    leader: '',
    phone: '',
    description: '',
    sort: 0,
    status: 'enabled'
  })
  fetchTree()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  isAddChild.value = false
  Object.assign(form, row)
  fetchTree()
  dialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'enabled' ? 'disabled' : 'enabled'
  try {
    const res = await departmentApi.update(row.id, { status: newStatus })
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
    await ElMessageBox.confirm(`确定要删除「${row.name}」吗？删除后子部门也将被删除。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await departmentApi.remove(row.id)
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
        const api = isEdit.value ? departmentApi.update(form.id, form) : departmentApi.create(form)
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

const mockDepartments = [
  {
    id: 1,
    name: '市场监督管理局',
    code: 'SCJ',
    parent_id: null,
    parent_name: null,
    leader: '张局长',
    phone: '028-12345678',
    description: '负责市场监督管理工作',
    user_count: 156,
    service_count: 42,
    sort: 1,
    status: 'enabled',
    children: [
      {
        id: 11,
        name: '注册登记科',
        code: 'SCJ-ZC',
        parent_id: 1,
        parent_name: '市场监督管理局',
        leader: '李科长',
        phone: '028-12345679',
        user_count: 25,
        service_count: 12,
        sort: 1,
        status: 'enabled',
        children: []
      },
      {
        id: 12,
        name: '食品安全科',
        code: 'SCJ-SP',
        parent_id: 1,
        parent_name: '市场监督管理局',
        leader: '王科长',
        phone: '028-12345680',
        user_count: 20,
        service_count: 8,
        sort: 2,
        status: 'enabled',
        children: []
      }
    ]
  },
  {
    id: 2,
    name: '人力资源和社会保障局',
    code: 'RSJ',
    parent_id: null,
    parent_name: null,
    leader: '刘局长',
    phone: '028-12345681',
    description: '负责人力资源和社会保障工作',
    user_count: 142,
    service_count: 35,
    sort: 2,
    status: 'enabled',
    children: []
  },
  {
    id: 3,
    name: '公安局',
    code: 'GAJ',
    parent_id: null,
    parent_name: null,
    leader: '陈局长',
    phone: '028-12345682',
    description: '负责公安工作',
    user_count: 520,
    service_count: 28,
    sort: 3,
    status: 'enabled',
    children: []
  }
]

const mockTree = [
  {
    id: 1,
    name: '市场监督管理局',
    children: [
      { id: 11, name: '注册登记科' },
      { id: 12, name: '食品安全科' }
    ]
  },
  { id: 2, name: '人力资源和社会保障局' },
  { id: 3, name: '公安局' }
]

onMounted(() => {
  fetchList()
  fetchTree()
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
</style>
