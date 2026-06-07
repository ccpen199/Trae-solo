<template>
  <div class="logs-page">
    <el-card>
      <template #header>
        <span>操作日志</span>
      </template>

      <el-table :data="logs" v-loading="loading">
        <el-table-column prop="username" label="操作用户" width="120" />
        <el-table-column prop="action" label="操作类型" width="120" />
        <el-table-column prop="module" label="所属模块" width="120" />
        <el-table-column prop="detail" label="操作详情" min-width="200" />
        <el-table-column prop="ip_address" label="IP地址" width="130" />
        <el-table-column prop="created_at" label="操作时间" width="180" />
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end;"
        @current-change="loadLogs"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import api from '@/utils/api';

const loading = ref(false);
const logs = ref<any[]>([]);

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const loadLogs = async () => {
  loading.value = true;
  try {
    const res = await api.get('/admin/logs', { params: pagination });
    if (res.code === 200) {
      logs.value = res.data.list;
      pagination.total = res.data.total;
    }
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadLogs();
});
</script>
