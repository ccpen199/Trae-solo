<template>
  <div class="organization-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>机构管理</span>
          <div>
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索机构名称/编码"
              style="width: 200px; margin-right: 10px;"
              clearable
              @keyup.enter="search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="handleAdd" v-if="hasPermission('organization:add')">
              <el-icon><Plus /></el-icon>
              新增机构
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table
        :data="organizationList"
        row-key="id"
        border
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        v-loading="loading"
      >
        <el-table-column prop="name" label="机构名称" min-width="200" />
        <el-table-column prop="code" label="机构编码" width="150" />
        <el-table-column prop="type" label="机构类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="hasPermission('organization:edit')">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="hasPermission('organization:delete')">
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
        <el-form-item label="机构名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入机构名称" />
        </el-form-item>
        <el-form-item label="机构编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入机构编码" />
        </el-form-item>
        <el-form-item label="上级机构" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="orgTreeData"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级机构"
            check-strictly
            clearable
            :default-expand-all="true"
          />
        </el-form-item>
        <el-form-item label="机构类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择机构类型" style="width: 100%;">
            <el-option label="公司" value="company" />
            <el-option label="部门" value="department" />
            <el-option label="小组" value="group" />
          </el-select>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/store/user';
import { 
  getOrganizations, 
  createOrganization, 
  updateOrganization, 
  deleteOrganization 
} from '@/api/organization';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const formRef = ref(null);
const organizationList = ref([]);
const orgTreeData = ref([]);

const searchForm = reactive({
  keyword: ''
});

const isEdit = ref(false);

const dialogTitle = computed(() => isEdit.value ? '编辑机构' : '新增机构');

const form = reactive({
  id: '',
  name: '',
  code: '',
  parentId: '',
  type: 'department',
  sort: 0,
  status: 'active',
  description: ''
});

const rules = {
  name: [
    { required: true, message: '请输入机构名称', trigger: 'blur' }
  ]
};

const hasPermission = (code) => {
  return userStore.hasPermission(code);
};

const getTypeText = (type) => {
  const map = {
    company: '公司',
    department: '部门',
    group: '小组'
  };
  return map[type] || type;
};

const getTypeTag = (type) => {
  const map = {
    company: 'danger',
    department: 'primary',
    group: 'success'
  };
  return map[type] || '';
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      asTree: true
    };
    if (searchForm.keyword) {
      params.keyword = searchForm.keyword;
      params.asTree = false;
    }
    
    const res = await getOrganizations(params);
    organizationList.value = res.data || [];
    
    if (!searchForm.keyword) {
      orgTreeData.value = [{ id: '', name: '无（顶级机构）', children: res.data || [] }];
    }
  } catch (error) {
    console.error('加载机构列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const search = () => {
  loadData();
};

const resetForm = () => {
  form.id = '';
  form.name = '';
  form.code = '';
  form.parentId = '';
  form.type = 'department';
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
  form.parentId = row.parentId || '';
  form.type = row.type;
  form.sort = row.sort;
  form.status = row.status;
  form.description = row.description || '';
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除机构"${row.name}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteOrganization(row.id);
      ElMessage.success('删除成功');
      loadData();
    } catch (error) {
      console.error('删除失败:', error);
    }
  }).catch(() => {});
};

const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true;
      try {
        if (isEdit.value) {
          await updateOrganization(form.id, form);
          ElMessage.success('更新成功');
        } else {
          await createOrganization(form);
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

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.organization-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
