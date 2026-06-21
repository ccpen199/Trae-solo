<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-white mb-1">用户与权限管理</h1>
      <p class="text-neutral-400 text-sm">用户账号、角色权限、部门组织架构管理</p>
    </div>

    <el-tabs v-model="activeTab" class="!mb-0" @tab-change="onTabChange">
      <el-tab-pane label="用户管理" name="users">
        <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 mb-5">
          <div class="flex flex-wrap gap-4 items-end">
            <div class="flex-1 min-w-[200px]">
              <label class="text-sm text-neutral-400 block mb-1.5">搜索</label>
              <el-input v-model="userFilters.keyword" placeholder="姓名/手机号/用户名..." clearable>
                <template #prefix><Search class="w-4 h-4 text-neutral-500" /></template>
              </el-input>
            </div>
            <div class="w-44">
              <label class="text-sm text-neutral-400 block mb-1.5">所属部门</label>
              <el-select v-model="userFilters.departmentId" placeholder="全部" clearable class="!w-full">
                <el-option v-for="d in departmentOptions" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </div>
            <div class="w-32">
              <label class="text-sm text-neutral-400 block mb-1.5">角色</label>
              <el-select v-model="userFilters.role" placeholder="全部" clearable class="!w-full">
                <el-option v-for="r in roleOptions" :key="r.key" :label="r.name" :value="r.key" />
              </el-select>
            </div>
            <div class="w-32">
              <label class="text-sm text-neutral-400 block mb-1.5">状态</label>
              <el-select v-model="userFilters.isActive" placeholder="全部" clearable class="!w-full">
                <el-option label="正常" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </div>
            <div class="flex gap-2">
              <button @click="loadUsers" class="btn-primary !px-5">查询</button>
              <button @click="resetUserFilters" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">重置</button>
              <button @click="openUserDialog()" class="btn-primary !px-5 flex items-center gap-1">
                <Plus class="w-4 h-4" /> 新增用户
              </button>
            </div>
          </div>
        </div>

        <div class="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
          <el-table :data="filteredUsers" class="!bg-transparent" row-key="id"
            :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
            :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
            <el-table-column label="用户信息" min-width="220">
              <template #default="{ row }">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-gov-blue/30 flex items-center justify-center text-gov-blue font-medium">
                    {{ row.realName.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-white font-medium">{{ row.realName }}</div>
                    <div class="text-xs text-neutral-500">{{ row.username }}</div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="手机号" width="140">
              <template #default="{ row }">
                <span class="text-sm text-neutral-400">{{ row.phone }}</span>
              </template>
            </el-table-column>
            <el-table-column label="所属部门" min-width="180">
              <template #default="{ row }">
                <span class="text-sm text-neutral-400">{{ row.departmentName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="角色" width="140">
              <template #default="{ row }">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="getRoleClass(row.role)">
                  {{ getRoleLabel(row.role) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <span class="text-xs px-2 py-0.5 rounded-full"
                  :class="row.isActive ? 'bg-green-500/20 text-green-400' : 'bg-neutral-500/20 text-neutral-400'">
                  {{ row.isActive ? '正常' : '禁用' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                <span class="text-sm text-neutral-500">{{ row.createTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right" align="center">
              <template #default="{ row }">
                <button @click="openUserDialog(row)" class="text-blue-400 hover:text-blue-300 text-sm mr-3">编辑</button>
                <button @click="openRoleAssign(row)" class="text-purple-400 hover:text-purple-300 text-sm mr-3">分配角色</button>
                <button @click="toggleUserStatus(row)" class="text-sm" :class="row.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'">
                  {{ row.isActive ? '禁用' : '启用' }}
                </button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="角色管理" name="roles">
        <div class="flex justify-between items-center mb-5">
          <p class="text-neutral-400 text-sm">管理系统角色及其菜单权限</p>
          <button @click="openRoleDialog()" class="btn-primary !px-5 flex items-center gap-1">
            <Plus class="w-4 h-4" /> 新增角色
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="role in roles" :key="role.id"
               class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 hover:border-neutral-700 transition-all">
            <div class="flex items-start justify-between mb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-white font-semibold">{{ role.name }}</h3>
                  <span v-if="role.builtin" class="text-xs px-1.5 py-0.5 rounded bg-gov-blue/20 text-gov-blue">系统内置</span>
                </div>
                <p class="text-xs text-neutral-500">{{ role.key }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg" :class="getRoleBgClass(role.key) + ' flex items-center justify-center'">
                <component :is="getRoleIcon(role.key)" class="w-5 h-5" :class="getRoleIconColor(role.key)" />
              </div>
            </div>
            <p class="text-sm text-neutral-400 mb-4">{{ role.description }}</p>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-neutral-500" />
                <span class="text-xs text-neutral-500">{{ role.userCount }} 位用户</span>
              </div>
              <div class="flex gap-2">
                <button @click="openRoleDialog(role)" class="text-xs text-blue-400 hover:text-blue-300">编辑</button>
                <button @click="openPermissionMatrix(role)" class="text-xs text-purple-400 hover:text-purple-300">权限配置</button>
              </div>
            </div>
          </div>
        </div>

        <el-dialog v-model="matrixVisible" :title="currentRole ? `权限配置 - ${currentRole.name}` : ''" width="720px"
          class="!bg-neutral-900" :close-on-click-modal="false">
          <div v-if="currentRole" class="space-y-4">
            <p class="text-sm text-neutral-400 mb-3">勾选授予该角色的菜单与操作权限</p>
            <div class="space-y-2">
              <div v-for="group in permissionGroups" :key="group.key" class="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700/50">
                <div class="flex items-center gap-2 mb-3">
                  <el-checkbox :model-value="isGroupAllChecked(group)" @change="(v: any) => toggleGroup(group, v)">
                    <span class="text-white text-sm font-medium">{{ group.name }}</span>
                  </el-checkbox>
                </div>
                <div class="flex flex-wrap gap-3 ml-6">
                  <el-checkbox v-for="perm in group.children" :key="perm.key"
                    :model-value="permissionMap[perm.key]"
                    @change="(v: any) => togglePermission(perm.key, v)">
                    <span class="text-sm text-neutral-300">{{ perm.name }}</span>
                  </el-checkbox>
                </div>
              </div>
            </div>
          </div>
          <template #footer>
            <button @click="matrixVisible = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">取消</button>
            <button @click="savePermissions" class="btn-primary !px-5">保存权限</button>
          </template>
        </el-dialog>
      </el-tab-pane>

      <el-tab-pane label="部门管理" name="departments">
        <div class="flex justify-between items-center mb-5">
          <p class="text-neutral-400 text-sm">组织架构与部门管理</p>
          <button @click="openDeptDialog()" class="btn-primary !px-5 flex items-center gap-1">
            <Plus class="w-4 h-4" /> 新增部门
          </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">
          <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 lg:col-span-1">
            <h3 class="text-white font-semibold mb-4">组织架构</h3>
            <el-tree
              :data="deptTree"
              node-key="id"
              default-expand-all
              :expand-on-click-node="false"
              v-model:current-node-key="selectedDeptId"
              @node-click="onDeptClick"
              :props="{ label: 'name', children: 'children' }"
              class="!bg-transparent"
            >
              <template #default="{ node, data }">
                <span class="flex items-center gap-1.5 text-sm" :class="selectedDeptId === data.id ? 'text-gov-blue' : 'text-neutral-300'">
                  <Building2 class="w-3.5 h-3.5" />
                  {{ data.name }}
                  <span class="text-xs text-neutral-500">({{ data.userCount || 0 }})</span>
                </span>
              </template>
            </el-tree>
          </div>

          <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 lg:col-span-3">
            <div v-if="selectedDept" class="space-y-5">
              <div class="flex items-center justify-between pb-4 border-b border-neutral-700/50">
                <div>
                  <h3 class="text-lg font-semibold text-white">{{ selectedDept.name }}</h3>
                  <p class="text-sm text-neutral-500 mt-1">部门编号: {{ selectedDept.id }}</p>
                </div>
                <div class="flex gap-2">
                  <button @click="openDeptDialog(selectedDept)" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-4 text-sm">编辑部门</button>
                  <button @click="openDeptDialog(null, selectedDept.id)" class="btn-primary !px-4 text-sm flex items-center gap-1">
                    <Plus class="w-3.5 h-3.5" /> 添加子部门
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="p-4 rounded-lg bg-neutral-700/30">
                  <div class="text-xs text-neutral-500 mb-1">部门简称</div>
                  <div class="text-white text-sm">{{ selectedDept.shortName }}</div>
                </div>
                <div class="p-4 rounded-lg bg-neutral-700/30">
                  <div class="text-xs text-neutral-500 mb-1">负责人</div>
                  <div class="text-white text-sm">{{ selectedDept.leader || '未设置' }}</div>
                </div>
                <div class="p-4 rounded-lg bg-neutral-700/30">
                  <div class="text-xs text-neutral-500 mb-1">联系电话</div>
                  <div class="text-white text-sm">{{ selectedDept.phone || '未设置' }}</div>
                </div>
                <div class="p-4 rounded-lg bg-neutral-700/30 col-span-3">
                  <div class="text-xs text-neutral-500 mb-1">部门职责</div>
                  <div class="text-white text-sm">{{ selectedDept.description || '暂未描述' }}</div>
                </div>
              </div>

              <div>
                <h4 class="text-sm font-semibold text-white mb-3">部门成员 ({{ deptUsers.length }} 人)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div v-for="u in deptUsers" :key="u.id" class="p-3 rounded-lg bg-neutral-700/30 flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-gov-blue/30 flex items-center justify-center text-gov-blue text-sm">
                      {{ u.realName.charAt(0) }}
                    </div>
                    <div class="flex-1">
                      <div class="text-white text-sm">{{ u.realName }}</div>
                      <div class="text-xs text-neutral-500">{{ getRoleLabel(u.role) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="py-16 text-center text-neutral-500">
              <Building2 class="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>请从左侧选择部门查看详情</p>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="userDialogVisible" :title="editingUser ? '编辑用户' : '新增用户'" width="520px"
      class="!bg-neutral-900" :close-on-click-modal="false">
      <el-form v-if="userForm" :model="userForm" label-width="100px" label-position="right">
        <el-form-item label="姓名">
          <el-input v-model="userForm.realName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" placeholder="请输入登录用户名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-select v-model="userForm.departmentId" placeholder="请选择部门" class="!w-full">
            <el-option v-for="d in departmentOptions" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" placeholder="请选择角色" class="!w-full">
            <el-option v-for="r in roleOptions" :key="r.key" :label="r.name" :value="r.key" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <button @click="userDialogVisible = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">取消</button>
        <button @click="saveUser" class="btn-primary !px-5">保存</button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" :title="editingRole ? '编辑角色' : '新增角色'" width="480px"
      class="!bg-neutral-900" :close-on-click-modal="false">
      <el-form v-if="roleForm" :model="roleForm" label-width="100px" label-position="right">
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色Key">
          <el-input v-model="roleForm.key" placeholder="请输入角色标识" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="角色职责描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <button @click="roleDialogVisible = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">取消</button>
        <button @click="saveRole" class="btn-primary !px-5">保存</button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Search, Plus, Users, Building2, Shield, UserCog, Crown, Briefcase, Sparkles
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import type { User, Department, UserRole } from '@/types'
import { mockUsers } from '@/mock/data/users'
import { mockDepartments } from '@/mock/data/services'

const activeTab = ref('users')
const users = ref<User[]>(mockUsers)

const userFilters = reactive({
  keyword: '',
  departmentId: '',
  role: '',
  isActive: '' as '' | 'active' | 'inactive'
})

const roles = ref([
  { id: 'r_001', name: '超级管理员', key: 'platform_admin' as UserRole, description: '拥有系统所有功能的最高权限', builtin: true, userCount: 1 },
  { id: 'r_002', name: '平台运营管理员', key: 'platform_operate' as UserRole, description: '平台数据监控、报告管理、运营配置', builtin: true, userCount: 2 },
  { id: 'r_003', name: '部门管理员', key: 'department_admin' as UserRole, description: '负责本部门的工单、用户、事项管理', builtin: true, userCount: 12 },
  { id: 'r_004', name: '部门经办人员', key: 'department_staff' as UserRole, description: '处理具体办件、工单的业务人员', builtin: true, userCount: 86 },
  { id: 'r_005', name: '办事群众', key: 'citizen' as UserRole, description: '个人用户，可申报事项、提交诉求', builtin: true, userCount: 15200 },
  { id: 'r_006', name: '企业用户', key: 'enterprise' as UserRole, description: '企业法人用户，办理企业相关事项', builtin: true, userCount: 3800 }
])

const roleOptions = computed(() => roles.value.map(r => ({ key: r.key, name: r.name })))
const departmentOptions = computed(() => mockDepartments.map(d => ({ id: d.id, name: d.name })))

const deptTree = ref<any[]>(mockDepartments.map(d => ({ ...d, children: [] })))
const selectedDeptId = ref('')
const selectedDept = computed(() => mockDepartments.find(d => d.id === selectedDeptId.value) || null)
const deptUsers = computed(() => users.value.filter(u => u.departmentId === selectedDeptId.value))

const permissionGroups = [
  {
    key: 'dashboard', name: '驾驶舱', children: [
      { key: 'dashboard:view', name: '查看总览' },
      { key: 'dashboard:export', name: '导出数据' }
    ]
  },
  {
    key: 'services', name: '事项管理', children: [
      { key: 'services:view', name: '查看事项' },
      { key: 'services:add', name: '新增事项' },
      { key: 'services:edit', name: '编辑事项' },
      { key: 'services:delete', name: '删除事项' }
    ]
  },
  {
    key: 'tickets', name: '工单管理', children: [
      { key: 'tickets:view', name: '查看工单' },
      { key: 'tickets:assign', name: '分配工单' },
      { key: 'tickets:reply', name: '回复工单' },
      { key: 'tickets:close', name: '关闭工单' }
    ]
  },
  {
    key: 'evaluations', name: '评价管理', children: [
      { key: 'evaluations:view', name: '查看评价' },
      { key: 'evaluations:rectify', name: '发起整改' },
      { key: 'evaluations:verify', name: '整改验证' }
    ]
  },
  {
    key: 'reports', name: '报告管理', children: [
      { key: 'reports:view', name: '查看报告' },
      { key: 'reports:generate', name: '生成报告' },
      { key: 'reports:export', name: '导出报告' }
    ]
  },
  {
    key: 'monitor', name: '系统监控', children: [
      { key: 'monitor:view', name: '查看监控' },
      { key: 'monitor:alert', name: '告警配置' }
    ]
  },
  {
    key: 'admin', name: '系统管理', children: [
      { key: 'admin:users', name: '用户管理' },
      { key: 'admin:roles', name: '角色权限' },
      { key: 'admin:departments', name: '部门管理' }
    ]
  }
]

const allPermissions = computed(() => permissionGroups.flatMap(g => g.children.map(c => c.key)))
const permissionMap = reactive<Record<string, boolean>>({})

const userDialogVisible = ref(false)
const editingUser = ref<User | null>(null)
const userForm = ref<any>(null)

const roleDialogVisible = ref(false)
const editingRole = ref<any>(null)
const roleForm = ref<any>(null)

const matrixVisible = ref(false)
const currentRole = ref<any>(null)

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (userFilters.keyword) {
      const kw = userFilters.keyword.toLowerCase()
      if (!u.realName.toLowerCase().includes(kw) && !u.phone.includes(kw) && !u.username.toLowerCase().includes(kw)) return false
    }
    if (userFilters.departmentId && u.departmentId !== userFilters.departmentId) return false
    if (userFilters.role && u.role !== userFilters.role) return false
    if (userFilters.isActive) {
      if (userFilters.isActive === 'active' && !u.isActive) return false
      if (userFilters.isActive === 'inactive' && u.isActive) return false
    }
    return true
  })
})

const getRoleLabel = (role?: UserRole) => {
  const map: Record<UserRole, string> = {
    citizen: '办事群众', enterprise: '企业用户', department_staff: '部门经办',
    department_admin: '部门管理员', platform_admin: '平台管理员', platform_operate: '运营管理员'
  }
  return map[role || 'citizen'] || role
}
const getRoleClass = (role?: UserRole) => {
  const map: Record<UserRole, string> = {
    citizen: 'bg-green-500/20 text-green-400', enterprise: 'bg-blue-500/20 text-blue-400',
    department_staff: 'bg-cyan-500/20 text-cyan-400', department_admin: 'bg-purple-500/20 text-purple-400',
    platform_operate: 'bg-orange-500/20 text-orange-400', platform_admin: 'bg-red-500/20 text-red-400'
  }
  return map[role || 'citizen'] || 'bg-neutral-500/20 text-neutral-400'
}
const getRoleBgClass = (key: string) => {
  if (key.includes('admin')) return 'bg-red-500/20'
  if (key.includes('operate')) return 'bg-orange-500/20'
  if (key.includes('department_admin')) return 'bg-purple-500/20'
  if (key.includes('department_staff')) return 'bg-cyan-500/20'
  if (key.includes('enterprise')) return 'bg-blue-500/20'
  return 'bg-green-500/20'
}
const getRoleIconColor = (key: string) => {
  if (key.includes('admin')) return 'text-red-400'
  if (key.includes('operate')) return 'text-orange-400'
  if (key.includes('department_admin')) return 'text-purple-400'
  if (key.includes('department_staff')) return 'text-cyan-400'
  if (key.includes('enterprise')) return 'text-blue-400'
  return 'text-green-400'
}
const getRoleIcon = (key: string) => {
  if (key.includes('platform_admin')) return Crown
  if (key.includes('admin')) return Shield
  if (key.includes('operate')) return Sparkles
  if (key.includes('department')) return UserCog
  if (key.includes('enterprise')) return Briefcase
  return Users
}

const onTabChange = () => {
  selectedDeptId.value = ''
}
const onDeptClick = (data: any) => {
  selectedDeptId.value = data.id
}

const loadUsers = () => {}
const resetUserFilters = () => {
  userFilters.keyword = ''
  userFilters.departmentId = ''
  userFilters.role = ''
  userFilters.isActive = ''
}

const openUserDialog = (user?: User) => {
  editingUser.value = user || null
  userForm.value = user ? { ...user } : {
    realName: '', username: '', phone: '', email: '', departmentId: '', role: 'citizen'
  }
  userDialogVisible.value = true
}
const saveUser = () => {
  if (!userForm.value?.realName) {
    ElMessage.warning('请填写姓名')
    return
  }
  if (editingUser.value) {
    Object.assign(editingUser.value, userForm.value)
    ElMessage.success('用户信息已更新')
  } else {
    ElMessage.success('用户创建成功')
  }
  userDialogVisible.value = false
}
const openRoleAssign = (user: User) => {
  ElMessage.info(`角色分配 - ${user.realName}`)
}
const toggleUserStatus = (user: User) => {
  user.isActive = !user.isActive
  ElMessage.success(`已${user.isActive ? '启用' : '禁用'}该用户`)
}

const openRoleDialog = (role?: any) => {
  editingRole.value = role || null
  roleForm.value = role ? { ...role } : { name: '', key: '', description: '' }
  roleDialogVisible.value = true
}
const saveRole = () => {
  if (!roleForm.value?.name || !roleForm.value?.key) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (editingRole.value) {
    Object.assign(editingRole.value, roleForm.value)
    ElMessage.success('角色已更新')
  } else {
    ElMessage.success('角色已创建')
  }
  roleDialogVisible.value = false
}

const isGroupAllChecked = (group: any) => group.children.every((c: any) => permissionMap[c.key])
const toggleGroup = (group: any, checked: boolean) => {
  group.children.forEach((c: any) => { permissionMap[c.key] = checked })
}
const togglePermission = (key: string, checked: boolean) => {
  permissionMap[key] = checked
}
const openPermissionMatrix = (role: any) => {
  currentRole.value = role
  allPermissions.value.forEach(p => { permissionMap[p] = role.key === 'platform_admin' })
  matrixVisible.value = true
}
const savePermissions = () => {
  ElMessage.success('权限配置已保存')
  matrixVisible.value = false
}

const openDeptDialog = (dept?: Department | null, parentId?: string) => {
  ElMessage.info(dept ? '编辑部门' : (parentId ? '添加子部门' : '新增部门'))
}

onMounted(() => {})
</script>
