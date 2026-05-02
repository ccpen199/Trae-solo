<template>
  <div>
    <h2 style="margin-bottom: 20px;">报告管理</h2>
    
    <el-card>
      <template #header>
        <div class="table-header">
          <span>报告列表</span>
          <el-button type="primary" size="small" @click="showGenerateDialog = true">
            <el-icon><DocumentAdd /></el-icon>
            生成报告
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="报告类型">
          <el-select v-model="searchForm.type" placeholder="全部类型" clearable style="width: 150px;">
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="季报" value="quarterly" />
            <el-option label="年报" value="annual" />
            <el-option label="事件报告" value="event" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="reports" v-loading="loading" stripe>
        <el-table-column prop="reportCode" label="报告编号" width="180" />
        <el-table-column prop="title" label="报告标题" />
        <el-table-column prop="type" label="报告类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getReportTypeTag(row.type)" size="small">
              {{ getReportTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reportPeriod" label="报告周期" width="120">
          <template #default="{ row }">
            {{ row.reportPeriod || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="generatedBy" label="生成人" width="100" />
        <el-table-column prop="createdAt" label="生成时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewReport(row)">查看</el-button>
            <el-button type="primary" link size="small" @click="exportReport(row)">导出</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <el-dialog v-model="showGenerateDialog" title="生成报告" width="500px">
      <el-form :model="generateForm" :rules="generateRules" ref="generateFormRef" label-width="100px">
        <el-form-item label="报告类型" prop="type">
          <el-select v-model="generateForm.type" placeholder="请选择报告类型" style="width: 100%;">
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="季报" value="quarterly" />
            <el-option label="年报" value="annual" />
            <el-option label="事件报告" value="event" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告日期" prop="date">
          <el-date-picker
            v-model="generateForm.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%;"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="报告标题" prop="title">
          <el-input v-model="generateForm.title" placeholder="请输入报告标题（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleGenerateReport" :loading="generating">生成</el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showDetailDialog" title="报告详情" width="800px">
      <el-descriptions :column="2" border v-if="currentReport">
        <el-descriptions-item label="报告编号">{{ currentReport.reportCode }}</el-descriptions-item>
        <el-descriptions-item label="报告类型">{{ getReportTypeName(currentReport.type) }}</el-descriptions-item>
        <el-descriptions-item label="报告标题" :span="2">{{ currentReport.title }}</el-descriptions-item>
        <el-descriptions-item label="生成人">{{ currentReport.generatedBy || '系统' }}</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ formatTime(currentReport.createdAt) }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <div v-if="currentReport.content" style="background: #f5f7fa; padding: 20px; border-radius: 4px;">
        <pre style="white-space: pre-wrap; margin: 0; font-family: inherit;">{{ JSON.stringify(currentReport.content, null, 2) }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getReports, generateReport as generateReportApi } from '@/api/report';
import dayjs from 'dayjs';

const loading = ref(false);
const generating = ref(false);
const showGenerateDialog = ref(false);
const showDetailDialog = ref(false);
const generateFormRef = ref(null);
const currentReport = ref(null);

const searchForm = reactive({
  type: '',
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const reports = ref([]);

const generateForm = reactive({
  type: '',
  date: dayjs().format('YYYY-MM-DD'),
  title: '',
});

const generateRules = {
  type: [{ required: true, message: '请选择报告类型', trigger: 'change' }],
};

const getReportTypeTag = (type) => {
  const tags = {
    daily: 'primary',
    weekly: 'success',
    monthly: 'warning',
    quarterly: 'info',
    annual: 'danger',
    event: 'danger',
  };
  return tags[type] || 'info';
};

const getReportTypeName = (type) => {
  const names = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    quarterly: '季报',
    annual: '年报',
    event: '事件报告',
  };
  return names[type] || type;
};

const formatTime = (time) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

const loadReports = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort: '-createdAt',
    };
    const res = await getReports(params);
    reports.value = res.data || [];
    pagination.total = res.total || reports.value.length;
  } catch (error) {
    console.error('加载报告列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadReports();
};

const handleReset = () => {
  searchForm.type = '';
  pagination.page = 1;
  loadReports();
};

const handleSizeChange = (size) => {
  pagination.pageSize = size;
  loadReports();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadReports();
};

const viewReport = (row) => {
  currentReport.value = row;
  showDetailDialog.value = true;
};

const exportReport = (row) => {
  ElMessage.info('导出功能开发中');
};

const handleGenerateReport = async () => {
  if (!generateFormRef.value) return;
  
  await generateFormRef.value.validate(async (valid) => {
    if (valid) {
      generating.value = true;
      try {
        const options = {
          date: generateForm.date,
          title: generateForm.title,
        };
        await generateReportApi(generateForm.type, options);
        ElMessage.success('报告生成成功');
        showGenerateDialog.value = false;
        loadReports();
      } catch (error) {
        console.error('生成报告失败:', error);
      } finally {
        generating.value = false;
      }
    }
  });
};

onMounted(() => {
  loadReports();
});
</script>
