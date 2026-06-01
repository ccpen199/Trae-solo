<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">工序执行</span>
    </div>
    
    <el-card>
      <el-alert v-if="notifications.length > 0" type="warning" :title="'有 ' + notifications.length + ' 条工艺变更通知，请确认'" style="margin-bottom: 20px;">
        <template #default>
          <div v-for="n in notifications" :key="n.id" style="margin: 8px 0; padding: 8px; background: #fff; border-radius: 4px;">
            <strong>{{ n.sop_title }}</strong> 版本变更: {{ n.new_version }}
            <br>
            <span style="color: #909399;">{{ n.change_description }}</span>
          </div>
        </template>
      </el-alert>
      
      <el-table :data="orders" border @row-click="goToDetail">
        <el-table-column prop="order_no" label="工单号" width="140" />
        <el-table-column prop="product_name" label="产品" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="current_process_name" label="当前工序" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'completed'" link type="primary" size="small" @click.stop="goToDetail(row.id)">
              开始执行
            </el-button>
            <el-button v-else link size="small" @click.stop="goToDetail(row.id)">查看记录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';

const router = useRouter();
const orders = ref([]);
const notifications = ref([]);

const statusType = (status) => {
  const types = { pending: 'info', in_progress: 'warning', completed: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { pending: '待执行', in_progress: '执行中', completed: '已完成' };
  return texts[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleString();

const goToDetail = (id) => {
  router.push(`/work-execution/${id}`);
};

const loadData = async () => {
  try {
    const res = await api.get('/work-orders');
    orders.value = res.data.filter(o => o.status !== 'completed');
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadData);
</script>
