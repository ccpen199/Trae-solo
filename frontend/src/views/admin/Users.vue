<template>
  <div class="users-page" v-if="!loading">
    <h2 class="page-title">用户管理</h2>
    
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名或手机号"
        style="width: 300px"
        clearable
        @keyup.enter="loadUsers"
        @clear="loadUsers"
      >
        <template #prefix>
          <el-icon><search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="loadUsers">搜索</el-button>
    </div>

    <div class="table-card">
      <el-table :data="users" v-loading="tableLoading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="phone" label="手机号" width="140">
          <template #default="scope">
            {{ scope.row.phone ? maskPhone(scope.row.phone) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'info'" size="small">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              :type="scope.row.status === 'active' ? 'danger' : 'primary'"
              @click="toggleStatus(scope.row)"
              :disabled="submitting"
            >
              {{ scope.row.status === 'active' ? '禁用' : '启用' }}
            </el-button>
            <el-button type="text" @click="goToUser(scope.row.id)">
              查看
            </el-button>
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
          @size-change="loadUsers"
          @current-change="loadUsers"
        />
      </div>

      <el-empty v-if="users.length === 0 && !tableLoading" description="暂无用户" />
    </div>
  </div>

  <div v-if="loading" class="loading-container">
    <el-skeleton :count="5" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import { adminApi } from '@/api';

const router = useRouter();

const loading = ref(true);
const tableLoading = ref(false);
const submitting = ref(false);
const users = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');

const loadUsers = async () => {
  tableLoading.value = true;
  try {
    const response = await adminApi.getUsers({
      page: page.value,
      page_size: pageSize.value,
      keyword: searchKeyword.value.trim() || undefined
    });
    if (response.data?.success) {
      const data = response.data.data || {};
      users.value = data.items || [];
      total.value = data.total || 0;
    }
  } catch (err) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
    tableLoading.value = false;
  }
};

const toggleStatus = async (row) => {
  const newStatus = row.status === 'active' ? 'banned' : 'active';
  const action = newStatus === 'banned' ? '禁用' : '启用';
  
  try {
    await ElMessageBox.confirm(
      `确定要${action}该用户吗？`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    );
    
    submitting.value = true;
    const response = await adminApi.updateUserStatus(row.id, newStatus);
    if (response.data?.success) {
      ElMessage.success(`${action}成功`);
      loadUsers();
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

const maskPhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

const formatTime = (time) => {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString();
};

const goToUser = (id) => {
  router.push(`/user/${id}`);
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.users-page {
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

.loading-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}
</style>
