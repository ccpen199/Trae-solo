<template>
  <div class="applications-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的办件</span>
          <el-tabs v-model="activeTab" style="margin: 0;" @tab-change="loadApplications">
            <el-tab-pane label="全部" name="" />
            <el-tab-pane label="待受理" name="pending" />
            <el-tab-pane label="办理中" name="processing" />
            <el-tab-pane label="已办结" name="completed" />
          </el-tabs>
        </div>
      </template>

      <el-table :data="applications" v-loading="loading">
        <el-table-column prop="application_no" label="办件编号" width="180" />
        <el-table-column prop="item_name" label="事项名称" min-width="200" />
        <el-table-column prop="department" label="办理部门" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submit_time" label="提交时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/applications/${row.id}`)">
              查看详情
            </el-button>
            <el-button 
              v-if="row.status === 'completed' && !row.rating" 
              type="success" 
              link 
              @click="handleEvaluate(row)"
            >
              评价
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @current-change="loadApplications"
      />
    </el-card>

    <el-dialog v-model="evaluateDialogVisible" title="服务评价" width="500px">
      <el-form :model="evaluateForm" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="evaluateForm.rating" show-score text-color="#ff9900" />
        </el-form-item>
        <el-form-item label="评价内容">
          <el-input v-model="evaluateForm.comment" type="textarea" :rows="4" placeholder="请输入您的评价..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="evaluateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEvaluate">提交评价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';

const loading = ref(false);
const applications = ref<any[]>([]);
const activeTab = ref('');
const evaluateDialogVisible = ref(false);
const currentAppId = ref<number | null>(null);

const evaluateForm = reactive({
  rating: 5,
  comment: ''
});

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    rejected: 'danger'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待受理',
    processing: '办理中',
    completed: '已办结',
    rejected: '已驳回'
  };
  return map[status] || status;
};

const loadApplications = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: activeTab.value || undefined
    };
    const res = await api.get('/applications', { params });
    if (res.code === 200) {
      applications.value = res.data.list;
      pagination.total = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

const handleEvaluate = (row: any) => {
  currentAppId.value = row.id;
  evaluateForm.rating = 5;
  evaluateForm.comment = '';
  evaluateDialogVisible.value = true;
};

const submitEvaluate = async () => {
  if (!currentAppId.value) return;
  try {
    const res = await api.post(`/applications/${currentAppId.value}/evaluate`, evaluateForm);
    if (res.code === 200) {
      ElMessage.success('评价提交成功');
      evaluateDialogVisible.value = false;
      loadApplications();
    }
  } catch (error) {
    console.error('评价失败', error);
  }
};

onMounted(() => {
  loadApplications();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
