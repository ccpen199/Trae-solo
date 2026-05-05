<template>
  <div class="role-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" size="small" @click="openDialog">
            <el-icon><Plus /></el-icon>
            新增角色
          </el-button>
        </div>
      </template>
      
      <el-table :data="roles" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="roleName" label="角色名称" width="150" />
        <el-table-column prop="roleCode" label="角色编码" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <el-button type="primary" link size="small" @click="editRole(scope.row)">
              编辑
            </el-button>
            <el-button 
              type="warning" 
              link 
              size="small"
              @click="assignPermissions(scope.row)"
            >
              分配权限
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small"
              :disabled="['SUPER_ADMIN', 'ADMIN', 'USER'].includes(scope.row.roleCode)"
              @click="deleteRole(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadRoles"
        @current-change="loadRoles"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>
    
    <el-dialog 
      v-model="dialogVisible" 
      :title="editingRole ? '编辑角色' : '新增角色'"
      width="500px"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" placeholder="请输入角色编码（英文）" :disabled="!!editingRole" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入描述"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
    
    <el-dialog 
      v-model="permissionDialogVisible" 
      title="分配权限"
      width="400px"
    >
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        :props="{ label: 'permissionName', children: 'children' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermissionIds"
        :default-expand-all="true"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermissions">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole as deleteRoleApi,
  getAllPermissions,
  assignPermissions
} from '@/api/user'

const loading = ref(false)
const roles = ref([])
const permissionTree = ref([])
const permissionTreeRef = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const currentRole = ref(null)
const checkedPermissionIds = ref([])

const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const editingRole = ref(null)
const formRef = ref(null)
const form = reactive({
  id: null,
  roleName: '',
  roleCode: '',
  description: '',
  status: 1
})

const rules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

const loadPermissions = async () => {
  try {
    const res = await getAllPermissions()
    const permissions = res.data || []
    
    const parentMap = {}
    const tree = []
    
    permissions.forEach(p => {
      if (!parentMap[p.id]) {
        parentMap[p.id] = { ...p, children: [] }
      }
    })
    
    permissions.forEach(p => {
      const node = parentMap[p.id]
      if (p.parentId === 0) {
        tree.push(node)
      } else if (parentMap[p.parentId]) {
        parentMap[p.parentId].children.push(node)
      }
    })
    
    permissionTree.value = tree
  } catch (error) {
    console.error('加载权限列表失败:', error)
  }
}

const loadRoles = async () => {
  loading.value = true
  try {
    const res = await getRoles({
      current: currentPage.value,
      size: pageSize.value
    })
    roles.value = res.data?.records || res.data || []
    total.value = res.data?.total || roles.value.length
  } catch (error) {
    console.error('加载角色列表失败:', error)
  } finally {
    loading.value = false
  }
}

const openDialog = (role = null) => {
  editingRole.value = role
  if (role) {
    form.id = role.id
    form.roleName = role.roleName
    form.roleCode = role.roleCode
    form.description = role.description || ''
    form.status = role.status
  } else {
    form.id = null
    form.roleName = ''
    form.roleCode = ''
    form.description = ''
    form.status = 1
  }
  dialogVisible.value = true
}

const editRole = (role) => {
  openDialog(role)
}

const submitForm = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  
  try {
    if (editingRole.value) {
      await updateRole(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createRole(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadRoles()
  } catch (error) {
    console.error('提交失败:', error)
  }
}

const assignPermissions = async (role) => {
  currentRole.value = role
  
  try {
    const res = await getAllPermissions()
    const permissions = res.data || []
    
    if (role.permissions) {
      const rolePermissionIds = permissions
        .filter(p => role.permissions.includes(p.permissionCode))
        .map(p => p.id)
      checkedPermissionIds.value = rolePermissionIds
    } else {
      checkedPermissionIds.value = []
    }
  } catch (error) {
    console.error('获取权限失败:', error)
    checkedPermissionIds.value = []
  }
  
  permissionDialogVisible.value = true
}

const submitPermissions = async () => {
  if (!currentRole.value) return
  
  const checkedNodes = permissionTreeRef.value.getCheckedNodes()
  const permissionIds = checkedNodes.map(node => node.id)
  
  try {
    await assignPermissions(currentRole.value.id, permissionIds)
    ElMessage.success('权限分配成功')
    permissionDialogVisible.value = false
  } catch (error) {
    console.error('分配权限失败:', error)
  }
}

const deleteRole = async (role) => {
  try {
    await ElMessageBox.confirm('确定要删除这个角色吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteRoleApi(role.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

onMounted(() => {
  loadPermissions()
  loadRoles()
})
</script>

<style scoped>
.role-manage {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
