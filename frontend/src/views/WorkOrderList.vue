<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">工单管理</span>
      <el-button type="primary" @click="$router.push('/work-orders/create')">
        <el-icon><Plus /></el-icon>新建工单
      </el-button>
    </div>
    
    <el-card>
      <el-table :data="orders" border>
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
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="viewDetail(row.id)">详情</el-button>
            <el-button link size="small" type="danger" @click="deleteOrder(row.id)">删除</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus';

const router = useRouter();
const orders = ref([]);

const statusType = (status) => {
  const types = { pending: 'info', in_progress: 'warning', completed: 'success' };
  return types[status] || 'info';
};

const statusText = (status) => {
  const texts = { pending: '待执行', in_progress: '执行中', completed: '已完成' };
  return texts[status] || status;
};

const formatDate = (date) => new Date(date).toLocaleString();

const loadOrders = async () => {
  try {
    const res = await api.get('/work-orders');
    orders.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

const viewDetail = (id) => {
  router.push(`/work-execution/${id}`);
};

const deleteOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除此工单吗？', '提示', { type: 'warning' });
    await api.delete(`/work-orders/${id}`);
    ElMessage.success('删除成功');
    loadOrders();
  } catch (e) {
    if (e !== 'cancel') console.error(e);
  }
};

onMounted(loadOrders);
</script>
