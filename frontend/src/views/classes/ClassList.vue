<template>
  <div class="class-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>班级管理</span>
          <el-button type="primary" @click="handleAdd">新增班级</el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="年级">
          <el-select v-model="searchForm.grade" placeholder="请选择年级" clearable>
            <el-option v-for="grade in gradeOptions" :key="grade" :label="grade" :value="grade" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="在读" value="active" />
            <el-option label="毕业" value="graduated" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="班级名称/代码" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="classList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="grade" label="年级" width="100" />
        <el-table-column prop="className" label="班级名称" width="150" />
        <el-table-column prop="classCode" label="班级代码" width="120" />
        <el-table-column prop="homeroomTeacherName" label="班主任" width="100">
          <template #default="{ row }">
            {{ row.homeroomTeacherName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="studentCount" label="学生人数" width="100">
          <template #default="{ row }">
            {{ row.studentCount || 0 }}人
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="年级" prop="grade">
          <el-select v-model="formData.grade" placeholder="请选择年级" style="width: 100%">
            <el-option v-for="grade in gradeOptions" :key="grade" :label="grade" :value="grade" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="formData.className" placeholder="请输入班级名称" />
        </el-form-item>
        <el-form-item label="班级代码" prop="classCode">
          <el-input v-model="formData.classCode" placeholder="请输入班级代码" />
        </el-form-item>
        <el-form-item label="班主任" prop="homeroomTeacherId">
          <el-select v-model="formData.homeroomTeacherId" placeholder="请选择班主任" style="width: 100%" clearable filterable>
            <el-option v-for="item in teacherList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="在读" value="active" />
            <el-option label="毕业" value="graduated" />
            <el-option label="停用" value="inactive" />
          </el-select>
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
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/request';

const router = useRouter();

const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

const gradeOptions = ['2020级', '2021级', '2022级', '2023级', '2024级', '2025级'];

const searchForm = reactive({
  grade: '',
  status: '',
  keyword: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const classList = ref([]);
const teacherList = ref([]);

const formData = reactive({
  grade: '2024级',
  className: '',
  classCode: '',
  homeroomTeacherId: null,
  status: 'active'
});

const formRules = {
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  className: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  classCode: [{ required: true, message: '请输入班级代码', trigger: 'blur' }]
};

const dialogTitle = computed(() => isEdit.value ? '编辑班级' : '新增班级');

const getStatusType = (status) => {
  const types = {
    active: 'success',
    graduated: 'primary',
    inactive: 'info'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    active: '在读',
    graduated: '毕业',
    inactive: '停用'
  };
  return texts[status] || status;
};

const loadTeachers = async () => {
  try {
    const response = await api.get('/teachers', { params: { pageSize: 1000 } });
    teacherList.value = response.data.teachers || [];
  } catch (error) {
    console.error('加载教师列表失败:', error);
  }
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    };
    const response = await api.get('/classes', { params });
    classList.value = response.data.classes || [];
    pagination.total = response.data.pagination?.total || 0;
  } catch (error) {
    console.error('加载班级列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.grade = '';
  searchForm.status = '';
  searchForm.keyword = '';
  handleSearch();
};

const handleAdd = () => {
  isEdit.value = false;
  formData.grade = '2024级';
  formData.className = '';
  formData.classCode = '';
  formData.homeroomTeacherId = null;
  formData.status = 'active';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.grade = row.grade || '2024级';
  formData.className = row.className || '';
  formData.classCode = row.classCode || '';
  formData.homeroomTeacherId = row.homeroomTeacherId || null;
  formData.status = row.status || 'active';
  dialogVisible.value = true;
};

const handleView = (row) => {
  router.push(`/classes/${row.id}`);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该班级吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await api.delete(`/classes/${row.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate();
  
  try {
    if (isEdit.value) {
      await api.put(`/classes/${formData.id}`, formData);
      ElMessage.success('更新成功');
    } else {
      await api.post('/classes', formData);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error('提交失败:', error);
  }
};

onMounted(() => {
  loadTeachers();
  loadData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
