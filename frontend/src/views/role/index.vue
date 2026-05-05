<template>
  <div class="role-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <div>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('role:add')">
              <el-icon><Plus /></el-icon>
              新增角色
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="roleList" v-loading="loading" border stripe>
        <el-table-column prop="name" label="角色名称" min-width="150" />
        <el-table-column prop="code" label="角色编码" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'system' ? 'danger' : 'primary'" size="small">
              {{ row.type === 'system' ? '系统' : '自定义' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAssignPermission(row)" v-if="hasPermission('role:assign')">
              分配权限
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="hasPermission('role:edit')">
              编辑
            </el-button>
            <el-button 
              type="danger" 
              link 
              size="small" 
              @click="handleDelete(row)" 
              v-if="hasPermission('role:delete') && row.type !== 'system'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      title="分配权限"
      v-model="permissionDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-tree
        ref="permissionTreeRef"
        :data="permissionTree"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedPermissionIds"
        :props="{ label: 'name', children: 'children' }"
        :default-expand-all="true"
      />
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPermissions" :loading="permissionSubmitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  getAllPermissions,
  assignPermissions
} from '@/api/role';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const permissionSubmitLoading = ref(false);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const formRef = ref(null);
const permissionTreeRef = ref(null);
const roleList = ref([]);
const permissionTree = ref([]);
const checkedPermissionIds = ref([]);
const currentRoleId = ref('');

const isEdit = ref(false);

const dialogTitle = computed(() => isEdit.value ? '编辑角色' : '新增角色');

const form = reactive({
  id: '',
  name: '',
  code: '',
  sort: 0,
  status: 'active',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
};

const hasPermission = (code) => {
  return userStore.hasPermission(code);
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await getRoles();
    roleList.value = res.data || [];
  } catch (error) {
    console.error('加载角色列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadPermissions = async () => {
  try {
    const res = await getAllPermissions();
    const allPermissions = res.data || [];
    
    const menuPerms = allPermissions.filter(p => p.type === 'menu');
    const buttonPerms = allPermissions.filter(p => p.type === 'button');
    
    const tree = menuPerms.map(menu => ({
      ...menu,
      children: buttonPerms
        .filter(btn => btn.code.startsWith(menu.code + ':'))
        .map(btn => ({ ...btn }))
    }));
    
    permissionTree.value = tree;
  } catch (error) {
    console.error('加载权限列表失败:', error);
  }
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.code = '';
  form.sort = 0;
  form.status = 'active';
  form.description = '';
};

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  form.id = row.id;
  form.name = row.name;
  form.code = row.code || '';
  form.sort = row.sort;
  form.status = row.status;
  form.description = row.description || '';
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRole(row.id);
      ElMessage.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }).catch(() => {});
};

const handleAssignPermission = async (row) => {
  currentRoleId.value = row.id;
  await loadPermissions();
  
  try {
    const roleRes = await getRoles();
    const roles = roleRes.data || [];
    const currentRole = roles.find(r => r.id === row.id);
    
    if (currentRole && currentRole.permissions) {
      checkedPermissionIds.value = currentRole.permissions.map(p => p.id);
    } else {
      checkedPermissionIds.value = [];
    }
  } catch (error) {
    console.error('获取角色权限失败:', error);
    checkedPermissionIds.value = [];
  }
  
  permissionDialogVisible.value = true;
};

const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (isEdit.value) {
          await updateRole(form.id, form);
          ElMessage.success('更新成功');
        } else {
          await createRole(form);
          ElMessage.success('创建成功');
        }
        dialogVisible.value = false;
        loadData();
      } catch (error) {
        console.error('提交失败:', error);
      } finally {
        submitLoading.value = false;
      }
    }
  });
};

const submitPermissions = async () => {
  if (!permissionTreeRef.value) return;
  
  const checkedKeys = permissionTreeRef.value.getCheckedKeys();
  const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys();
  const allCheckedIds = [...checkedKeys, ...halfCheckedKeys];
  
  permissionSubmitLoading.value = true;
  try {
    await assignPermissions(currentRoleId.value, allCheckedIds);
    ElMessage.success('分配权限成功');
    permissionDialogVisible.value = false;
  } catch (error) {
    console.error('分配权限失败:', error);
  } finally {
    permissionSubmitLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.role-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
