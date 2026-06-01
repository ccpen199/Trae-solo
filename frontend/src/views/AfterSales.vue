<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">售后管理</h1>
      <span style="color: #909399; font-size: 14px">售后申请由客户/团长在订单详情页发起，运营端在此审核</span>
    </div>
    
    <el-card>
      <el-table :data="afterSalesList" border stripe>
        <el-table-column prop="order_no" label="订单号" width="160" />
        <el-table-column prop="leader_name" label="团长" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag>{{ row.type === 'refund' ? '退款' : row.type === 'exchange' ? '换货' : '其他' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">
              {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已拒绝' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" width="180" />
        <el-table-column label="操作" :width="currentRole === 'admin' ? 200 : 100" fixed="right">
          <template #default="{ row }">
            <template v-if="currentRole === 'admin' && row.status === 'pending'">
              <el-button size="small" type="success" @click="handle(row, 'approved')">通过</el-button>
              <el-button size="small" type="danger" @click="handle(row, 'rejected')">拒绝</el-button>
            </template>
            <template v-else-if="row.status !== 'pending'">
              <el-tag :type="row.status === 'approved' ? 'success' : 'danger'">
                {{ row.status === 'approved' ? '已通过' : '已拒绝' }}
              </el-tag>
            </template>
            <span v-else style="color: #909399; font-size: 12px">待审核</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { afterSalesAPI } from '../api';

const props = defineProps({
  currentRole: {
    type: String,
    default: 'admin'
  }
});

const afterSalesList = ref([]);

const loadAfterSales = async () => {
  try {
    const res = await afterSalesAPI.list();
    afterSalesList.value = res.data || [];
  } catch (error) {
    ElMessage.error('加载售后列表失败');
  }
};

const handle = async (row, status) => {
  try {
    const action = status === 'approved' ? '通过' : '拒绝';
    await ElMessageBox.confirm(`确认${action}该售后申请？`, '提示', { type: 'warning' });
    await afterSalesAPI.handle(row.id, { status, handled_by: 'admin' });
    ElMessage.success('处理成功');
    loadAfterSales();
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('处理失败');
  }
};

onMounted(() => {
  loadAfterSales();
});
</script>
