<template>
  <div class="users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>未审核用户</span>
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名/企业编号/企业名称"
            style="width: 300px"
            clearable
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column label="企业信息" min-width="300">
          <template #default="{ row }">
            <div v-if="row.enterprise">
              <div><strong>编号：</strong>{{ row.enterprise.enterpriseCode }}</div>
              <div><strong>名称：</strong>{{ row.enterprise.enterpriseName }}</div>
              <div><strong>类型：</strong>{{ enterpriseTypeMap[row.enterprise.enterpriseType] }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">查看</el-button>
            <el-button type="success" link @click="handleApprove(row)">审核通过</el-button>
            <el-button type="warning" link @click="handleReject(row)">拒绝</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border v-if="currentUser">
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">
          {{ formatTime(currentUser.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="企业编号" :span="2">
          {{ currentUser.enterprise?.enterpriseCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="企业名称" :span="2">
          {{ currentUser.enterprise?.enterpriseName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="企业类型">
          {{ currentUser.enterprise ? enterpriseTypeMap[currentUser.enterprise.enterpriseType] : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentUser.status)">
            {{ userStatusMap[currentUser.status] }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="拒绝原因" width="400px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="4"
        placeholder="请输入拒绝原因"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { adminApi } from '@/api/admin';
import { enterpriseTypeMap, userStatusMap, UserStatus, EnterpriseType } from '@/types';

const loading = ref(false);
const userList = ref<any[]>([]);
const total = ref(0);
const detailVisible = ref(false);
const rejectVisible = ref(false);
const currentUser = ref<any>(null);
const rejectReason = ref('');

const searchForm = reactive({
  keyword: '',
  page: 1,
  pageSize: 20,
});

const getStatusType = (status: UserStatus) => {
  const map: Record<UserStatus, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
  };
  return map[status] || 'info';
};

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN');
};

const loadData = async () => {
  loading.value = true;
  try {
    const result = await adminApi.getPendingUsers({
      page: searchForm.page,
      pageSize: searchForm.pageSize,
      keyword: searchForm.keyword,
    });
    userList.value = result.data?.users || [];
    total.value = result.data?.total || 0;
  } catch (error) {
    console.error('Load data error:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchForm.page = 1;
  loadData();
};

const handleView = (row: any) => {
  currentUser.value = row;
  detailVisible.value = true;
};

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要审核通过该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminApi.approveUser(row.id);
    ElMessage.success('审核通过');
    loadData();
  } catch {
    // 取消操作
  }
};

const handleReject = (row: any) => {
  currentUser.value = row;
  rejectReason.value = '';
  rejectVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因');
    return;
  }
  try {
    await adminApi.rejectUser(currentUser.value.id, rejectReason.value);
    ElMessage.success('已拒绝');
    rejectVisible.value = false;
    loadData();
  } catch (error) {
    console.error('Reject error:', error);
  }
};

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？删除后无法恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    await adminApi.deleteUser(row.id);
    ElMessage.success('删除成功');
    loadData();
  } catch {
    // 取消操作
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.users-page {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
