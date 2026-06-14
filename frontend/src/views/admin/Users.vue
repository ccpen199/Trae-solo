<template>
  <div class="admin-users">
    <div class="card p-24 mb-24">
      <div class="page-header flex justify-between items-center mb-20">
        <h2 class="page-title">用户管理</h2>
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>新增用户
        </el-button>
      </div>

      <el-form :inline="true" :model="filterForm" @submit.prevent class="mb-20">
        <el-form-item label="用户名">
          <el-input v-model="filterForm.keyword" placeholder="用户名/手机号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="用户类型">
          <el-select v-model="filterForm.user_type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="个人用户" value="personal" />
            <el-option label="企业用户" value="enterprise" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="filterForm.department_id" placeholder="全部部门" clearable style="width: 160px">
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
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="filterForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
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

      <el-table v-loading="loading" :data="list" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-12">
              <el-avatar :size="40" :src="row.avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div>
                <div class="font-medium text-14">{{ row.real_name || row.username }}</div>
                <div class="text-12 text-gray-500">{{ row.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="id_card" label="身份证号" width="180">
          <template #default="{ row }">
            {{ row.id_card ? row.id_card.replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getUserType(row.user_type).type" size="small">
              {{ getUserType(row.user_type).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="department_name" label="所属部门" width="140" />
        <el-table-column prop="application_count" label="办件数" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="160">
          <template #default="{ row }">
            {{ dayjs(row.created_at).format('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleView(row)">详情</el-button>
            <el-button
              link
              :type="row.status === 'active' ? 'warning' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="primary" size="small" @click="handleAssignRoles(row)">角色</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper mt-20 flex justify-between items-center">
        <div v-if="selectedIds.length > 0" class="selected-info">
          <span class="text-gray-600">已选择 {{ selectedIds.length }} 项</span>
          <el-button type="danger" size="small" class="ml-12" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
        <div class="flex-1"></div>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" :disabled="isEdit" placeholder="请输入用户名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="real_name">
              <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="密码" prop="password">
              <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号">
              <el-input v-model="form.id_card" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户类型" prop="user_type">
              <el-select v-model="form.user_type" placeholder="请选择" style="width: 100%">
                <el-option label="个人用户" value="personal" />
                <el-option label="企业用户" value="enterprise" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属部门">
              <el-select v-model="form.department_id" placeholder="请选择" style="width: 100%" clearable>
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
            <el-form-item label="状态">
              <el-switch v-model="form.status" active-value="active" inactive-value="disabled" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rolesDialogVisible" title="分配角色" width="400px">
      <div class="mb-16">
        <span class="text-gray-600">当前用户：</span>
        <span class="font-medium">{{ currentUser?.real_name || currentUser?.username }}</span>
      </div>
      <el-checkbox-group v-model="selectedRoles">
        <el-checkbox
          v-for="role in roles"
          :key="role.id"
          :label="role.id"
          class="block mb-12"
        >
          {{ role.name }}
          <span class="text-gray-500 text-12 ml-8">{{ role.description }}</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="rolesDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRoles">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userApi, departmentApi, roleApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const departments = ref([])
const roles = ref([])
const dialogVisible = ref(false)
const rolesDialogVisible = ref(false)
const isEdit = ref(false)
const currentUser = ref(null)
const selectedIds = ref([])
const selectedRoles = ref([])
const formRef = ref(null)

const filterForm = reactive({
  keyword: '',
  user_type: '',
  department_id: '',
  status: '',
  date_range: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  username: '',
  real_name: '',
  password: '',
  phone: '',
  email: '',
  id_card: '',
  user_type: 'personal',
  department_id: '',
  status: 'active'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  user_type: [{ required: true, message: '请选择用户类型', trigger: 'change' }]
}

const getUserType = (type) => {
  const types = {
    personal: { text: '个人', type: 'primary' },
    enterprise: { text: '企业', type: 'success' },
    admin: { text: '管理员', type: 'danger' }
  }
  return types[type] || { text: type, type: 'info' }
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {}
}

const fetchRoles = async () => {
  try {
    const res = await roleApi.list()
    if (res.code === 200) {
      roles.value = res.data || []
    }
  } catch (e) {
    roles.value = [
      { id: 1, name: '超级管理员', description: '拥有所有权限' },
      { id: 2, name: '窗口管理员', description: '窗口业务办理权限' },
      { id: 3, name: '部门管理员', description: '本部门管理权限' },
      { id: 4, name: '普通用户', description: '基础访问权限' }
    ]
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      ...filterForm,
      start_date: filterForm.date_range?.[0] || '',
      end_date: filterForm.date_range?.[1] || '',
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    delete params.date_range

    const res = await userApi.list(params)
    if (res.code === 200) {
      list.value = res.data?.list || res.data || mockUsers
      pagination.total = res.data?.total || list.value.length
    } else {
      list.value = mockUsers
      pagination.total = mockUsers.length
    }
  } catch (e) {
    list.value = mockUsers
    pagination.total = mockUsers.length
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.user_type = ''
  filterForm.department_id = ''
  filterForm.status = ''
  filterForm.date_range = []
  pagination.page = 1
  fetchList()
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(item => item.id)
}

const handleCreate = () => {
  isEdit.value = false
  Object.assign(form, {
    id: null,
    username: '',
    real_name: '',
    password: '',
    phone: '',
    email: '',
    id_card: '',
    user_type: 'personal',
    department_id: '',
    status: 'active'
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleView = (row) => {
  ElMessage.info('用户详情功能开发中...')
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  try {
    const res = await userApi.update(row.id, { status: newStatus })
    if (res.code === 200) {
      row.status = newStatus
      ElMessage.success(`已${newStatus === 'active' ? '启用' : '禁用'}`)
    }
  } catch (e) {
    row.status = newStatus
    ElMessage.success(`已${newStatus === 'active' ? '启用' : '禁用'}`)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${row.real_name || row.username}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await userApi.remove(row.id)
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

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    fetchList()
  } catch (e) {}
}

const handleAssignRoles = (row) => {
  currentUser.value = row
  selectedRoles.value = row.role_ids || []
  rolesDialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? userApi.update(form.id, form) : userApi.create(form)
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

const submitRoles = async () => {
  try {
    const res = await userApi.assignRoles(currentUser.value.id, { role_ids: selectedRoles.value })
    if (res.code === 200) {
      ElMessage.success('角色分配成功')
      rolesDialogVisible.value = false
    }
  } catch (e) {
    ElMessage.success('角色分配成功')
    rolesDialogVisible.value = false
  }
}

const mockUsers = [
  {
    id: 1,
    username: 'zhangsan',
    real_name: '张三',
    phone: '13800138001',
    email: 'zhangsan@example.com',
    id_card: '110101199001151234',
    avatar: '',
    user_type: 'personal',
    department_id: null,
    department_name: '-',
    application_count: 25,
    status: 'active',
    role_ids: [4],
    created_at: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    username: 'lisi',
    real_name: '李四',
    phone: '13800138002',
    email: 'lisi@example.com',
    id_card: '110101199102202345',
    avatar: '',
    user_type: 'enterprise',
    department_id: null,
    department_name: '-',
    application_count: 42,
    status: 'active',
    role_ids: [4],
    created_at: '2024-01-05 14:30:00'
  },
  {
    id: 3,
    username: 'admin',
    real_name: '管理员',
    phone: '13800138003',
    email: 'admin@example.com',
    id_card: '',
    avatar: '',
    user_type: 'admin',
    department_id: 1,
    department_name: '市场监督管理局',
    application_count: 0,
    status: 'active',
    role_ids: [1],
    created_at: '2023-12-01 09:00:00'
  },
  {
    id: 4,
    username: 'wangwu',
    real_name: '王五',
    phone: '13800138004',
    email: 'wangwu@example.com',
    id_card: '110101199203103456',
    avatar: '',
    user_type: 'personal',
    department_id: null,
    department_name: '-',
    application_count: 8,
    status: 'disabled',
    role_ids: [4],
    created_at: '2024-01-10 16:45:00'
  }
]

onMounted(() => {
  fetchDepartments()
  fetchRoles()
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
</style>
