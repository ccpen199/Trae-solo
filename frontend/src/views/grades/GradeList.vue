<template>
  <div class="grade-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>成绩管理</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="课程">
          <el-select v-model="searchForm.courseId" placeholder="请选择课程" clearable filterable>
            <el-option v-for="item in courseOptions" :key="item.id" :label="item.courseName" :value="item.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已审核" value="approved" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="学期">
          <el-select v-model="searchForm.term" placeholder="请选择学期" clearable>
            <el-option label="第1学期" value="第1学期" />
            <el-option label="第2学期" value="第2学期" />
          </el-select>
        </el-form-item>
        <el-form-item label="学年">
          <el-select v-model="searchForm.academicYear" placeholder="请选择学年" clearable>
            <el-option v-for="year in academicYearOptions" :key="year" :label="year" :value="year" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="gradeList" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="studentNumber" label="学号" width="120" />
        <el-table-column prop="studentName" label="姓名" width="100" />
        <el-table-column prop="className" label="班级" width="120">
          <template #default="{ row }">
            {{ row.className || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程" width="150" />
        <el-table-column prop="teacherName" label="授课教师" width="100" />
        <el-table-column prop="credits" label="学分" width="80" />
        <el-table-column prop="usualScore" label="平时成绩" width="100">
          <template #default="{ row }">
            {{ row.usualScore !== undefined ? row.usualScore : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="midtermScore" label="期中成绩" width="100">
          <template #default="{ row }">
            {{ row.midtermScore !== undefined ? row.midtermScore : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="finalScore" label="期末成绩" width="100">
          <template #default="{ row }">
            {{ row.finalScore !== undefined ? row.finalScore : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalScore" label="总成绩" width="100">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.totalScore)">
              {{ row.totalScore !== undefined ? row.totalScore : '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="gradeLevel" label="等级" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.gradeLevel)">
              {{ row.gradeLevel || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              link 
              v-if="row.status === 'draft' && isTeacher"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button type="primary" link @click="handleView(row)">详情</el-button>
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

    <el-dialog v-model="dialogVisible" title="编辑成绩" width="600px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学生姓名">
              <el-input :value="currentStudent?.studentName || ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号">
              <el-input :value="currentStudent?.studentNumber || ''" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程名称">
              <el-input :value="currentStudent?.courseName || ''" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学分">
              <el-input :value="currentStudent?.credits || ''" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider>成绩录入</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="平时成绩" prop="usualScore">
              <el-input-number 
                v-model="editForm.usualScore" 
                :min="0" 
                :max="100" 
                :precision="1"
                style="width: 100%" 
              />
              <span style="font-size: 12px; color: #909399">占比30%</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期中成绩" prop="midtermScore">
              <el-input-number 
                v-model="editForm.midtermScore" 
                :min="0" 
                :max="100" 
                :precision="1"
                style="width: 100%" 
              />
              <span style="font-size: 12px; color: #909399">占比30%</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="期末成绩" prop="finalScore">
              <el-input-number 
                v-model="editForm.finalScore" 
                :min="0" 
                :max="100" 
                :precision="1"
                style="width: 100%" 
              />
              <span style="font-size: 12px; color: #909399">占比40%</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-divider>自动计算</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="总成绩">
              <el-tag :type="getScoreTagType(calculatedTotal)" size="large">
                {{ calculatedTotal !== null ? calculatedTotal.toFixed(1) : '-' }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="绩点">
              <el-tag :type="getScoreTagType(calculatedTotal)" size="large">
                {{ calculatedGp !== null ? calculatedGp.toFixed(1) : '-' }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级">
              <el-tag :type="getLevelTagType(calculatedLevel)" size="large">
                {{ calculatedLevel || '-' }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/api/request';

const userStore = useUserStore();
const isTeacher = computed(() => userStore.user?.role === 'teacher' || userStore.user?.role === 'homeroom_teacher');

const currentYear = new Date().getFullYear();
const academicYearOptions = [
  `${currentYear}-${currentYear + 1}学年`,
  `${currentYear - 1}-${currentYear}学年`,
  `${currentYear - 2}-${currentYear - 1}学年`
];

const loading = ref(false);
const dialogVisible = ref(false);
const editFormRef = ref(null);
const currentStudent = ref(null);

const searchForm = reactive({
  courseId: null,
  status: '',
  term: '',
  academicYear: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const gradeList = ref([]);
const courseOptions = ref([]);

const editForm = reactive({
  id: null,
  usualScore: 0,
  midtermScore: 0,
  finalScore: 0
});

const editRules = {
  usualScore: [{ required: true, message: '请输入平时成绩', trigger: 'blur' }],
  midtermScore: [{ required: true, message: '请输入期中成绩', trigger: 'blur' }],
  finalScore: [{ required: true, message: '请输入期末成绩', trigger: 'blur' }]
};

const calculatedTotal = computed(() => {
  if (editForm.usualScore === undefined || editForm.midtermScore === undefined || editForm.finalScore === undefined) {
    return null;
  }
  return editForm.usualScore * 0.3 + editForm.midtermScore * 0.3 + editForm.finalScore * 0.4;
});

const calculatedGp = computed(() => {
  if (calculatedTotal.value === null) return null;
  const score = calculatedTotal.value;
  if (score >= 90) return 4.0;
  if (score >= 85) return 3.7;
  if (score >= 82) return 3.3;
  if (score >= 78) return 3.0;
  if (score >= 75) return 2.7;
  if (score >= 72) return 2.3;
  if (score >= 68) return 2.0;
  if (score >= 64) return 1.5;
  if (score >= 60) return 1.0;
  return 0.0;
});

const calculatedLevel = computed(() => {
  if (calculatedTotal.value === null) return '';
  const score = calculatedTotal.value;
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 82) return 'B+';
  if (score >= 78) return 'B';
  if (score >= 75) return 'B-';
  if (score >= 72) return 'C+';
  if (score >= 68) return 'C';
  if (score >= 64) return 'C-';
  if (score >= 60) return 'D';
  return 'F';
});

const getScoreTagType = (score) => {
  if (score === null || score === undefined) return 'info';
  if (score >= 90) return 'success';
  if (score >= 80) return 'primary';
  if (score >= 60) return 'warning';
  return 'danger';
};

const getLevelTagType = (level) => {
  const types = {
    'A': 'success',
    'A-': 'success',
    'B+': 'primary',
    'B': 'primary',
    'B-': 'primary',
    'C+': 'warning',
    'C': 'warning',
    'C-': 'warning',
    'D': 'info',
    'F': 'danger'
  };
  return types[level] || 'info';
};

const getStatusType = (status) => {
  const types = {
    draft: 'info',
    submitted: 'primary',
    approved: 'success',
    archived: 'warning'
  };
  return types[status] || 'info';
};

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已审核',
    archived: '已归档'
  };
  return texts[status] || status;
};

const loadCourses = async () => {
  try {
    const response = await api.get('/courses', { params: { pageSize: 1000, status: 'published' } });
    courseOptions.value = response.data.courses || [];
  } catch (error) {
    console.error('加载课程列表失败:', error);
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
    
    let endpoint = '/grades';
    if (isTeacher.value) {
      endpoint = '/grades/my-teacher';
    }
    
    const response = await api.get(endpoint, { params });
    gradeList.value = response.data.grades || [];
    pagination.total = response.data.pagination?.total || 0;
  } catch (error) {
    console.error('加载成绩列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.courseId = null;
  searchForm.status = '';
  searchForm.term = '';
  searchForm.academicYear = '';
  handleSearch();
};

const handleEdit = (row) => {
  currentStudent.value = row;
  editForm.id = row.id;
  editForm.usualScore = row.usualScore ?? 0;
  editForm.midtermScore = row.midtermScore ?? 0;
  editForm.finalScore = row.finalScore ?? 0;
  dialogVisible.value = true;
};

const handleView = (row) => {
  ElMessageBox.alert(`
    <div style="line-height: 2;">
      <p><strong>学生：</strong>${row.studentName || '-'}</p>
      <p><strong>学号：</strong>${row.studentNumber || '-'}</p>
      <p><strong>课程：</strong>${row.courseName || '-'}</p>
      <p><strong>平时成绩：</strong>${row.usualScore !== undefined ? row.usualScore : '-'}</p>
      <p><strong>期中成绩：</strong>${row.midtermScore !== undefined ? row.midtermScore : '-'}</p>
      <p><strong>期末成绩：</strong>${row.finalScore !== undefined ? row.finalScore : '-'}</p>
      <p><strong>总成绩：</strong>${row.totalScore !== undefined ? row.totalScore : '-'}</p>
      <p><strong>绩点：</strong>${row.gradePoint !== undefined ? row.gradePoint : '-'}</p>
      <p><strong>等级：</strong>${row.gradeLevel || '-'}</p>
      <p><strong>状态：</strong>${getStatusText(row.status)}</p>
    </div>
  `, '成绩详情', {
    confirmButtonText: '确定',
    dangerouslyUseHTMLString: true
  });
};

const handleSave = async () => {
  if (!editFormRef.value) return;
  
  await editFormRef.value.validate();
  
  try {
    await api.put(`/grades/${editForm.id}`, editForm);
    ElMessage.success('保存成功');
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error('保存失败:', error);
  }
};

onMounted(() => {
  loadCourses();
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
