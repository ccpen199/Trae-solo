<template>
  <div class="reports-page" v-if="!loading">
    <h2 class="page-title">举报管理</h2>
    
    <div class="search-bar">
      <el-select v-model="statusFilter" placeholder="状态筛选" style="width: 150px" @change="loadReports" clearable>
        <el-option label="待处理" value="pending" />
        <el-option label="已解决" value="resolved" />
        <el-option label="已驳回" value="rejected" />
      </el-select>
      <el-select v-model="typeFilter" placeholder="类型筛选" style="width: 150px" @change="loadReports" clearable>
        <el-option label="问题" value="question" />
        <el-option label="文章" value="article" />
      </el-select>
      <el-button type="primary" @click="loadReports">筛选</el-button>
    </div>

    <div class="table-card">
      <el-table :data="reports" v-loading="tableLoading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="reporter_username" label="举报人" width="120" />
        <el-table-column prop="target_type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.target_type === 'question' ? 'primary' : 'success'" size="small">
              {{ scope.row.target_type === 'question' ? '问题' : '文章' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_title" label="被举报内容" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <el-button type="text" @click="goToTarget(scope.row)">
              {{ scope.row.target_title || '查看详情' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" width="150">
          <template #default="scope">
            {{ getReasonText(scope.row.reason) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="举报时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <template v-if="scope.row.status === 'pending'">
              <el-button
                type="text"
                type="success"
                @click="handleResolve(scope.row)"
                :disabled="submitting"
              >
                处理
              </el-button>
              <el-button
                type="text"
                type="info"
                @click="handleReject(scope.row)"
                :disabled="submitting"
              >
                驳回
              </el-button>
            </template>
            <template v-else>
              <span class="handled">已处理</span>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadReports"
          @current-change="loadReports"
        />
      </div>

      <el-empty v-if="reports.length === 0 && !tableLoading" description="暂无举报" />
    </div>

    <el-dialog v-model="showResolveDialog" title="处理举报" width="500px">
      <div class="resolve-form">
        <el-form label-width="100px">
          <el-form-item label="处理方式">
            <el-radio-group v-model="resolveAction">
              <el-radio value="hide">隐藏内容</el-radio>
              <el-radio value="warn">警告用户</el-radio>
              <el-radio value="ignore">忽略举报</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="resolveNote"
              type="textarea"
              :rows="3"
              placeholder="处理备注（可选）"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button type="primary" @click="submitResolve" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const tableLoading = ref(false);
const submitting = ref(false);
const reports = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const statusFilter = ref('');
const typeFilter = ref('');

const showResolveDialog = ref(false);
const currentReport = ref(null);
const resolveAction = ref('hide');
const resolveNote = ref('');

const loadReports = async () => {
  tableLoading.value = true;
  try {
    const response = await adminApi.getReports({
      page: page.value,
      page_size: pageSize.value,
      status: statusFilter.value || undefined,
      target_type: typeFilter.value || undefined
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      reports.value = data.items || [];
      total.value = data.total || 0;
    }
  } catch (err) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
    tableLoading.value = false;
  }
};

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'resolved': 'success',
    'rejected': 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status) => {
  const map = {
    'pending': '待处理',
    'resolved': '已解决',
    'rejected': '已驳回'
  };
  return map[status] || status;
};

const getReasonText = (reason) => {
  const map = {
    'spam': '垃圾广告',
    'inappropriate': '内容不当',
    'violent': '暴力色情',
    'other': '其他'
  };
  return map[reason] || reason;
};

const handleResolve = (row) => {
  currentReport.value = row;
  resolveAction.value = 'hide';
  resolveNote.value = '';
  showResolveDialog.value = true;
};

const submitResolve = async () => {
  if (!currentReport.value) return;
  
  submitting.value = true;
  try {
    const response = await adminApi.updateReportStatus(currentReport.value.id, 'resolved');
    if (response.data?.success) {
      if (resolveAction.value === 'hide') {
        await adminApi.updateContentStatus(
          currentReport.value.target_type,
          currentReport.value.target_id,
          'hidden'
        );
      }
      ElMessage.success('处理成功');
      showResolveDialog.value = false;
      loadReports();
    } else {
      ElMessage.error(response.data?.message || '操作失败');
    }
  } catch (err) {
    ElMessage.error('操作失败');
  } finally {
    submitting.value = false;
  }
};

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要驳回该举报吗？',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    
    submitting.value = true;
    const response = await adminApi.updateReportStatus(row.id, 'rejected');
    if (response.data?.success) {
      ElMessage.success('已驳回');
      loadReports();
    } else {
      ElMessage.error(response.data?.message || '操作失败');
    }
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('操作失败');
    }
  } finally {
    submitting.value = false;
  }
};

const goToTarget = (row) => {
  if (row.target_type === 'question') {
    router.push(`/questions/${row.target_id}`);
  } else if (row.target_type === 'article') {
    router.push(`/articles/${row.target_id}`);
  }
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString();
};

onMounted(() => {
  loadReports();
});
</script>

<style scoped>
.reports-page {
  padding: 0;
}

.page-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0 0 20px 0;
  color: #303133;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.handled {
  color: #909399;
  font-size: 13px;
}

.resolve-form {
  padding: 10px 0;
}

.loading-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
</style>
