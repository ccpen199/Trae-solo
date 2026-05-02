<template>
  <div class="user-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增用户
          </el-button>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" width="200" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" width="200" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="请选择角色" width="150">
            <el-option label="采购人员" value="PURCHASER" />
            <el-option label="仓库管理" value="WAREHOUSE_MANAGER" />
            <el-option label="生产班组" value="PRODUCTION_LEADER" />
            <el-option label="质检人员" value="QUALITY_INSPECTOR" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.isActive"
              @change="handleStatusChange(row.id, row.isActive)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.id)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" style="margin-top: 20px;">
        <el-pagination
          v-model:current-page="pageInfo.page"
          v-model:page-size="pageInfo.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pageInfo.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username" v-if="!isEdit">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色">
            <el-option label="采购人员" value="PURCHASER" />
            <el-option label="仓库管理" value="WAREHOUSE_MANAGER" />
            <el-option label="生产班组" value="PRODUCTION_LEADER" />
            <el-option label="质检人员" value="QUALITY_INSPECTOR" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { get, post, put, del } from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userList = ref<any[]>([])
const pageInfo = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const searchForm = reactive({
  username: '',
  name: '',
  role: '',
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  username: '',
  name: '',
  password: '',
  role: '',
})

const rules = reactive<FormRules>({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
})

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    PURCHASER: '采购人员',
    WAREHOUSE_MANAGER: '仓库管理',
    PRODUCTION_LEADER: '生产班组',
    QUALITY_INSPECTOR: '质检人员',
    ADMIN: '管理员',
  }
  return roleMap[role] || role
}

const getRoleType = (role: string) => {
  const typeMap: Record<string, string> = {
    PURCHASER: 'primary',
    WAREHOUSE_MANAGER: 'success',
    PRODUCTION_LEADER: 'warning',
    QUALITY_INSPECTOR: 'danger',
    ADMIN: 'info',
  }
  return typeMap[role] || 'info'
}

const loadUsers = async () => {
  try {
    const response = await get('/users', {
      params: {
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
        ...searchForm,
      },
    })
    userList.value = response.data.list
    pageInfo.total = response.data.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  }
}

const handleSearch = () => {
  pageInfo.page = 1
  loadUsers()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key as keyof typeof searchForm] = ''
  })
  pageInfo.page = 1
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pageInfo.pageSize = size
  loadUsers()
}

const handleCurrentChange = (current: number) => {
  pageInfo.page = current
  loadUsers()
}

const handleAdd = () => {
  isEdit.value = false
  Object.keys(form).forEach(key => {
    form[key as keyof typeof form] = ''
  })
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.username = row.username
  form.name = row.name
  form.role = row.role
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      if (isEdit.value) {
        await put(`/users/${form.id}`, {
          name: form.name,
          role: form.role,
        })
        ElMessage.success('编辑成功')
      } else {
        await post('/users', form)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      loadUsers()
    } catch (error) {
      ElMessage.error(isEdit.value ? '编辑失败' : '新增失败')
    }
  })
}

const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await del(`/users/${id}`)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    // 取消删除
  }
}

const handleStatusChange = async (id: string, isActive: boolean) => {
  try {
    await put(`/users/${id}`, { isActive })
    ElMessage.success('状态更新成功')
  } catch (error) {
    ElMessage.error('状态更新失败')
    loadUsers() // 重新加载数据
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.user-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .search-form {
    margin-bottom: 20px;
  }
}
</style>
