<template>
  <div class="schedule-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-radio-group v-model="viewType" size="small">
              <el-radio-button value="my">我的日程</el-radio-button>
              <el-radio-button value="department">部门日程</el-radio-button>
            </el-radio-group>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-left: 15px;"
              @change="loadData"
            />
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索日程标题"
              style="width: 180px; margin-left: 15px;"
              clearable
              @keyup.enter="search"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增日程
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="scheduleList" v-loading="loading" border stripe>
        <el-table-column prop="title" label="日程标题" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">
              {{ getTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" min-width="220">
          <template #default="{ row }">
            <div v-if="row.isAllDay">
              <el-tag type="info" size="small">全天</el-tag>
              {{ formatDate(row.startTime) }}
            </div>
            <div v-else>
              <div>{{ formatDateTime(row.startTime) }}</div>
              <div style="color: #999; font-size: 12px;">至 {{ formatDateTime(row.endTime) }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="地点" width="150" show-overflow-tooltip />
        <el-table-column prop="visibility" label="可见性" width="100">
          <template #default="{ row }">
            <el-tag :type="getVisibilityTag(row.visibility)" size="small">
              {{ getVisibilityText(row.visibility) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">
              详情
            </el-button>
            <el-button type="primary" link size="small" @click="handleEdit(row)" v-if="canEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)" v-if="canEdit(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="日程标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入日程标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%;">
            <el-option label="个人" value="personal" />
            <el-option label="部门" value="department" />
            <el-option label="会议" value="meeting" />
          </el-select>
        </el-form-item>
        <el-form-item label="全天" prop="isAllDay">
          <el-switch v-model="form.isAllDay" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="form.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="form.endTime"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="请输入地点" />
        </el-form-item>
        <el-form-item label="提醒" prop="reminder">
          <el-select v-model="form.reminder" placeholder="请选择提醒时间" style="width: 100%;">
            <el-option label="不提醒" :value="0" />
            <el-option label="提前5分钟" :value="5" />
            <el-option label="提前15分钟" :value="15" />
            <el-option label="提前30分钟" :value="30" />
            <el-option label="提前1小时" :value="60" />
            <el-option label="提前1天" :value="1440" />
          </el-select>
        </el-form-item>
        <el-form-item label="可见性" prop="visibility">
          <el-radio-group v-model="form.visibility">
            <el-radio label="private">私有</el-radio>
            <el-radio label="department">部门可见</el-radio>
            <el-radio label="public">公开</el-radio>
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
      title="日程详情"
      v-model="detailDialogVisible"
      width="500px"
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item label="标题">{{ currentSchedule.title }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="getTypeTag(currentSchedule.type)">{{ getTypeText(currentSchedule.type) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="时间">
          <span v-if="currentSchedule.isAllDay">
            全天：{{ formatDate(currentSchedule.startTime) }}
          </span>
          <span v-else>
            {{ formatDateTime(currentSchedule.startTime) }} 至 {{ formatDateTime(currentSchedule.endTime) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="地点">{{ currentSchedule.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ currentSchedule.creator?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可见性">
          <el-tag :type="getVisibilityTag(currentSchedule.visibility)">
            {{ getVisibilityText(currentSchedule.visibility) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusTag(currentSchedule.status)">
            {{ getStatusText(currentSchedule.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="描述">{{ currentSchedule.description || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/user';
import { 
  getMySchedules, 
  getDepartmentSchedules,
  createSchedule, 
  updateSchedule, 
  deleteSchedule 
} from '@/api/schedule';

const userStore = useUserStore();

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const formRef = ref(null);
const scheduleList = ref([]);
const currentSchedule = ref({});

const viewType = ref('my');
const dateRange = ref([]);

const searchForm = reactive({
  keyword: ''
});

const isEdit = ref(false);

const dialogTitle = computed(() => isEdit.value ? '编辑日程' : '新增日程');

const form = reactive({
  id: '',
  title: '',
  type: 'personal',
  isAllDay: false,
  startTime: '',
  endTime: '',
  location: '',
  reminder: 0,
  visibility: 'private',
  description: ''
});

const rules = {
  title: [
    { required: true, message: '请输入日程标题', trigger: 'blur' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ]
};

const formatDate = (date) => {
  return dayjs(date).format('YYYY-MM-DD');
};

const formatDateTime = (date) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

const getTypeText = (type) => {
  const map = {
    personal: '个人',
    department: '部门',
    meeting: '会议'
  };
  return map[type] || type;
};

const getTypeTag = (type) => {
  const map = {
    personal: 'success',
    department: 'primary',
    meeting: 'warning'
  };
  return map[type] || '';
};

const getVisibilityText = (visibility) => {
  const map = {
    private: '私有',
    department: '部门可见',
    public: '公开'
  };
  return map[visibility] || visibility;
};

const getVisibilityTag = (visibility) => {
  const map = {
    private: 'info',
    department: 'primary',
    public: 'success'
  };
  return map[visibility] || '';
};

const getStatusText = (status) => {
  const map = {
    pending: '待确认',
    confirmed: '已确认',
    cancelled: '已取消',
    completed: '已完成'
  };
  return map[status] || status;
};

const getStatusTag = (status) => {
  const map = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'info'
  };
  return map[status] || '';
};

const canEdit = (row) => {
  return row.creatorId === userStore.userInfo?.id;
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {};
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dayjs(dateRange.value[0]).startOf('day').toISOString();
      params.endDate = dayjs(dateRange.value[1]).endOf('day').toISOString();
    }

    let res;
    if (viewType.value === 'my') {
      res = await getMySchedules(params);
    } else {
      res = await getDepartmentSchedules(params);
    }
    
    scheduleList.value = res.data || [];
  } catch (error) {
    console.error('加载日程列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const search = () => {
  loadData();
};

const resetForm = () => {
  form.id = '';
  form.title = '';
  form.type = 'personal';
  form.isAllDay = false;
  form.startTime = '';
  form.endTime = '';
  form.location = '';
  form.reminder = 0;
  form.visibility = 'private';
  form.description = '';
};

const handleAdd = () => {
  isEdit.value = false;
  resetForm();
  
  const now = dayjs();
  form.startTime = now.toDate();
  form.endTime = now.add(1, 'hour').toDate();
  
  dialogVisible.value = true;
};

const handleView = (row) => {
  currentSchedule.value = row;
  detailDialogVisible.value = true;
};

const handleEdit = (row) => {
  isEdit.value = true;
  form.id = row.id;
  form.title = row.title;
  form.type = row.type;
  form.isAllDay = row.isAllDay;
  form.startTime = dayjs(row.startTime).toDate();
  form.endTime = dayjs(row.endTime).toDate();
  form.location = row.location || '';
  form.reminder = row.reminder || 0;
  form.visibility = row.visibility;
  form.description = row.description || '';
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除日程"${row.title}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await deleteSchedule(row.id);
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
        const data = {
          title: form.title,
          type: form.type,
          isAllDay: form.isAllDay,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location,
          reminder: form.reminder,
          visibility: form.visibility,
          description: form.description
        };
        
        if (isEdit.value) {
          await updateSchedule(form.id, data);
          ElMessage.success('更新成功');
        } else {
          await createSchedule(data);
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
.schedule-container {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}
</style>
