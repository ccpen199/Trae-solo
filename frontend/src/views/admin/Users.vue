<template>
  <div class="admin-users-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
        </div>
      </template>

      <el-table :data="users" v-loading="loading">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="user_type" label="用户类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.user_type === 'admin' ? 'danger' : row.user_type === 'legal' ? 'warning' : 'primary'" size="small">
              {{ row.user_type === 'admin' ? '管理员' : row.user_type === 'legal' ? '法人' : '自然人' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="实名状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.police_verified ? 'success' : 'warning'" size="small">
              {{ row.police_verified ? '已实名' : '未实名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status ? 'success' : 'danger'" size="small">
              {{ row.status ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @current-change="loadUsers"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '@/utils/api';

const loading = ref(false);
const users = ref<any[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
});

const loadUsers = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/users', { params: pagination });
    if (res.code === 200) {
      users.value = res.data.list;
      pagination.total = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
