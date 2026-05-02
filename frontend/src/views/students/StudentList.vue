<template>
  <div class="student-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <el-button type="primary" @click="handleAdd">新增学生</el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="searchForm.studentNumber" placeholder="请输入学号" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="班级">
          <el-select v-model="searchForm.classId" placeholder="请选择班级" clearable>
            <el-option v-for="item in classList" :key="item.id" :label="item.className" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="studentList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="studentNumber" label="学号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 'male' ? '男' : '女' }}
          </template>
        </el-table-column>
        <el-table-column prop="className" label="班级" width="150" />
        <el-table-column prop="major" label="专业" width="150" />
        <el-table-column prop="enrollmentStatus" label="学籍状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.enrollmentStatus)">
              {{ getStatusText(row.enrollmentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enrollmentDate" label="入学日期" width="120" />
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="学号" prop="studentNumber">
          <el-input v-model="formData.studentNumber" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="班级" prop="classId">
          <el-select v-model="formData.classId" placeholder="请选择班级" style="width: 100%">
            <el-option v-for="item in classList" :key="item.id" :label="item.className" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="专业" prop="major">
          <el-input v-model="formData.major" placeholder="请输入专业" />
        </el-form-item>
        <el-form-item label="入学日期" prop="enrollmentDate">
          <el-date-picker
            v-model="formData.enrollmentDate"
            type="date"
            placeholder="请选择入学日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入电子邮箱" />
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
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/request';

const router = useRouter();

const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const formRef = ref(null);

const searchForm = reactive({
  name: '',
  studentNumber: '',
  classId: null
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const studentList = ref([]);
const classList = ref([]);

const formData = reactive({
  username: '',
  name: '',
  gender: 'male',
  password: '123456',
  studentNumber: '',
  classId: null,
  major: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
  phone: '',
  email: ''
});

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  studentNumber: [{ required: true, message: '请输入学号', trigger: 'blur' }]
};

const dialogTitle = computed(() => isEdit.value ? '编辑学生' : '新增学生');

const getStatusType = (status) => {
  const types = {
    enrolled: 'info',
    studying: 'success',
    suspended: 'warning',
    withdrawn: 'danger',
    graduated: 'primary'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    enrolled: '已注册',
    studying: '在读中',
    suspended: '休学',
    withdrawn: '退学',
    graduated: '已毕业'
  };
  return texts[status] || status;
};

const loadClasses = async () => {
  try {
    const response = await api.get('/classes', { params: { pageSize: 1000 } });
    classList.value = response.data.classes || [];
  } catch (error) {
    console.error('加载班级列表失败:', error);
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
    const response = await api.get('/students', { params });
    studentList.value = response.data.students || [];
    pagination.total = response.data.pagination?.total || 0;
  } catch (error) {
    console.error('加载学生列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.name = '';
  searchForm.studentNumber = '';
  searchForm.classId = null;
  handleSearch();
};

const handleAdd = () => {
  isEdit.value = false;
  formData.username = '';
  formData.name = '';
  formData.gender = 'male';
  formData.password = '123456';
  formData.studentNumber = '';
  formData.classId = null;
  formData.major = '';
  formData.enrollmentDate = new Date().toISOString().split('T')[0];
  formData.phone = '';
  formData.email = '';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  formData.username = row.username || '';
  formData.name = row.name || '';
  formData.gender = row.gender || 'male';
  formData.studentNumber = row.studentNumber || '';
  formData.classId = row.classId;
  formData.major = row.major || '';
  formData.enrollmentDate = row.enrollmentDate;
  formData.phone = row.phone || '';
  formData.email = row.email || '';
  formData.id = row.id;
  dialogVisible.value = true;
};

const handleView = (row) => {
  router.push(`/students/${row.id}`);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该学生吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await api.delete(`/students/${row.id}`);
    ElMessage.success('删除成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
    }
  }
};

const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

const convertToSnakeCase = (obj) => {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[camelToSnake(key)] = obj[key];
    }
  }
  return result;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate();
  
  try {
    const submitData = convertToSnakeCase(formData);
    
    if (isEdit.value) {
      await api.put(`/students/${formData.id}`, submitData);
      ElMessage.success('更新成功');
    } else {
      await api.post('/students', submitData);
      ElMessage.success('添加成功');
    }
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error('提交失败:', error);
  }
};

onMounted(() => {
  loadClasses();
  loadData();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
