<template>
  <div class="roles">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
        </div>
      </template>

      <el-table :data="roleList" v-loading="loading" row-key="id" border>
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色代码" width="150" />
        <el-table-column prop="roleType" label="角色类型" width="120">
          <template #default="{ row }">
            <el-tag :type="roleTypeTag(row.roleType)" size="small">
              {{ roleTypeName(row.roleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="isSystem" label="系统角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isSystem ? 'warning' : 'info'" size="small">
              {{ row.isSystem ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
              {{ row.isActive ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)" :disabled="row.isSystem">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" :disabled="row.isSystem">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新建角色'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色代码(英文)" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="角色类型">
          <el-select v-model="form.roleType" placeholder="请选择角色类型" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="作者" value="author" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.isActive">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="权限">
          <el-collapse v-model="activeCollapse">
            <el-collapse-item
              v-for="(perms, module) in groupedPermissions"
              :key="module"
              :name="module"
              :title="moduleName(module)"
            >
              <div class="permission-group">
                <el-checkbox
                  v-model="form.permissionIds"
                  v-for="perm in perms"
                  :key="perm.id"
                  :label="perm.id"
                  style="width: 120px; margin-bottom: 10px"
                >
                  {{ perm.name }}
                </el-checkbox>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { request } from '@/utils/request'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const loading = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const roleList = ref<any[]>([])
const permissionList = ref<any[]>([])
const activeCollapse = ref<string[]>(['site', 'category', 'content'])
const formRef = ref<FormInstance>()

const form = reactive({
  id: '',
  name: '',
  code: '',
  roleType: 'custom' as string,
  description: '',
  isActive: true,
  permissionIds: [] as string[]
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入角色代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9_-]*$/, message: '角色代码必须以字母开头', trigger: 'blur' }
  ]
}

const groupedPermissions = computed(() => {
  const groups: Record<string, any[]> = {}
  permissionList.value.forEach(p => {
    if (!groups[p.module]) {
      groups[p.module] = []
    }
    groups[p.module].push(p)
  })
  return groups
})

function moduleName(module: string) {
  const map: Record<string, string> = {
    site: '站点管理',
    category: '栏目管理',
    content: '内容管理',
    template: '模板管理',
    user: '用户管理',
    role: '角色管理',
    comment: '评论管理',
    vote: '投票管理',
    attachment: '附件管理',
    system: '系统配置'
  }
  return map[module] || module
}

function roleTypeName(type: string) {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    editor: '编辑',
    author: '作者',
    custom: '自定义'
  }
  return map[type] || type
}

function roleTypeTag(type: string) {
  const map: Record<string, string> = {
    super_admin: 'danger',
    admin: 'primary',
    editor: 'success',
    author: 'warning',
    custom: 'info'
  }
  return map[type] || ''
}

async function loadRoles() {
  loading.value = true
  try {
    roleList.value = await request.get('/roles?includeInactive=true')
  } finally {
    loading.value = false
  }
}

async function loadPermissions() {
  try {
    const roles = await request.get('/roles')
    if (roles.length > 0) {
      const role = await request.get(`/roles/${roles[0].id}`)
      permissionList.value = role.permissions || []
    }
  } catch (e) {
    console.log('加载权限失败')
  }
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.code = ''
  form.roleType = 'custom'
  form.description = ''
  form.isActive = true
  form.permissionIds = []
}

function handleEdit(row: any) {
  isEdit.value = true
  form.id = row.id
  form.name = row.name
  form.code = row.code
  form.roleType = row.roleType
  form.description = row.description || ''
  form.isActive = row.isActive
  form.permissionIds = row.permissions?.map((p: any) => p.id) || []
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(`确定要删除角色"${row.name}"吗？`, '提示', {
    type: 'warning'
  })
  
  await request.delete(`/roles/${row.id}`)
  ElMessage.success('删除成功')
  loadRoles()
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    const data: any = { 
      ...form,
      permissionIds: form.permissionIds.length > 0 ? form.permissionIds : undefined
    }
    
    if (isEdit.value) {
      delete data.code
      await request.put(`/roles/${form.id}`, data)
      ElMessage.success('更新成功')
    } else {
      await request.post('/roles', data)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadRoles()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<style lang="scss" scoped>
.roles {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .permission-group {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
