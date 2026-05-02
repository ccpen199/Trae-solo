<template>
  <div class="course-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>课程管理</span>
          <el-button type="primary" @click="handleAdd">新增课程</el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="课程类型">
          <el-select v-model="searchForm.courseType" placeholder="请选择类型" clearable>
            <el-option label="必修课" value="required" />
            <el-option label="选修课" value="elective" />
            <el-option label="任选课" value="optional" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已取消" value="cancelled" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="课程名称/代码" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="courseList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="courseCode" label="课程代码" width="120" />
        <el-table-column prop="courseName" label="课程名称" width="180" />
        <el-table-column prop="courseType" label="课程类型" width="100">
          <template #default="{ row }">
            {{ getCourseTypeText(row.courseType) }}
          </template>
        </el-table-column>
        <el-table-column prop="credits" label="学分" width="80" />
        <el-table-column prop="hours" label="学时" width="80" />
        <el-table-column prop="teacherName" label="授课教师" width="100">
          <template #default="{ row }">
            {{ row.teacherName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="term" label="学期" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
            <el-button 
              v-if="row.status === 'draft'" 
              type="success" 
              link 
              @click="handlePublish(row)"
            >发布</el-button>
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
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程代码" prop="courseCode">
              <el-input v-model="formData.courseCode" placeholder="请输入课程代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程名称" prop="courseName">
              <el-input v-model="formData.courseName" placeholder="请输入课程名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程类型" prop="courseType">
              <el-select v-model="formData.courseType" placeholder="请选择类型" style="width: 100%">
                <el-option label="必修课" value="required" />
                <el-option label="选修课" value="elective" />
                <el-option label="任选课" value="optional" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授课教师" prop="teacherId">
              <el-select v-model="formData.teacherId" placeholder="请选择教师" style="width: 100%" clearable filterable>
                <el-option v-for="item in teacherList" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学分" prop="credits">
              <el-input-number v-model="formData.credits" :min="0.5" :max="10" :step="0.5" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学时" prop="hours">
              <el-input-number v-model="formData.hours" :min="1" :max="200" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学期" prop="term">
              <el-select v-model="formData.term" placeholder="请选择学期" style="width: 100%">
                <el-option label="第1学期" value="第1学期" />
                <el-option label="第2学期" value="第2学期" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学年" prop="academicYear">
              <el-select v-model="formData.academicYear" placeholder="请选择学年" style="width: 100%">
                <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最大人数" prop="maxStudents">
              <el-input-number v-model="formData.maxStudents" :min="1" :max="200" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最小人数" prop="minStudents">
              <el-input-number v-model="formData.minStudents" :min="1" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="课程描述" prop="description">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入课程描述" />
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

const currentYear = new Date().getFullYear();
const academicYearOptions = [
  `${currentYear}-${currentYear + 1}学年`,
  `${currentYear - 1}-${currentYear}学年`,
  `${currentYear - 2}-${currentYear - 1}学年`
];

const searchForm = reactive({
  courseType: '',
  status: '',
  keyword: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const courseList = ref([]);
const teacherList = ref([]);

const formData = reactive({
  courseCode: '',
  courseName: '',
  courseType: 'required',
  teacherId: null,
  credits: 3,
  hours: 48,
  term: '第1学期',
  academicYear: `${currentYear}-${currentYear + 1}学年`,
  maxStudents: 50,
  minStudents: 5,
  description: ''
});

const formRules = {
  courseCode: [{ required: true, message: '请输入课程代码', trigger: 'blur' }],
  courseName: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  courseType: [{ required: true, message: '请选择课程类型', trigger: 'change' }],
  credits: [{ required: true, message: '请输入学分', trigger: 'blur' }],
  hours: [{ required: true, message: '请输入学时', trigger: 'blur' }],
  term: [{ required: true, message: '请选择学期', trigger: 'change' }],
  academicYear: [{ required: true, message: '请选择学年', trigger: 'change' }]
};

const dialogTitle = computed(() => isEdit.value ? '编辑课程' : '新增课程');

const getCourseTypeText = (type) => {
  const types = {
    required: '必修课',
    elective: '选修课',
    optional: '任选课'
  };
  return types[type] || type;
};

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    published: 'success',
    cancelled: 'danger',
    completed: 'primary'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    published: '已发布',
    cancelled: '已取消',
    completed: '已完成'
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
    const response = await api.get('/courses', { params });
    courseList.value = response.data.courses || [];
    pagination.total = response.data.pagination?.total || 0;
  } catch (error) {
    console.error('加载课程列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.courseType = '';
  searchForm.status = '';
  searchForm.keyword = '';
  handleSearch();
};

const handleAdd = () => {
  isEdit.value = false;
  formData.courseCode = '';
  formData.courseName = '';
  formData.courseType = 'required';
  formData.teacherId = null;
  formData.credits = 3;
  formData.hours = 48;
  formData.term = '第1学期';
  formData.academicYear = `${currentYear}-${currentYear + 1}学年`;
  formData.maxStudents = 50;
  formData.minStudents = 5;
  formData.description = '';
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  formData.id = row.id;
  formData.courseCode = row.courseCode || '';
  formData.courseName = row.courseName || '';
  formData.courseType = row.courseType || 'required';
  formData.teacherId = row.teacherId || null;
  formData.credits = row.credits || 3;
  formData.hours = row.hours || 48;
  formData.term = row.term || '第1学期';
  formData.academicYear = row.academicYear || `${currentYear}-${currentYear + 1}学年`;
  formData.maxStudents = row.maxStudents || 50;
  formData.minStudents = row.minStudents || 5;
  formData.description = row.description || '';
  dialogVisible.value = true;
};

const handleView = (row) => {
  router.push(`/courses/${row.id}`);
};

const handlePublish = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布该课程吗？发布后学生可以选课。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await api.post(`/courses/${row.id}/publish`);
    ElMessage.success('发布成功');
    loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布失败:', error);
    }
  }
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该课程吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await api.delete(`/courses/${row.id}`);
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
      await api.put(`/courses/${formData.id}`, formData);
      ElMessage.success('更新成功');
    } else {
      await api.post('/courses', formData);
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
