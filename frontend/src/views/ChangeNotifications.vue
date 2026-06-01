<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">工艺变更通知</span>
    </div>
    
    <el-card>
      <el-table :data="notifications" border>
        <el-table-column prop="sop_title" label="作业指导书" />
        <el-table-column prop="old_version" label="旧版本" width="100">
          <template #default="{ row }">{{ row.old_version || '-' }}</template>
        </el-table-column>
        <el-table-column prop="new_version" label="新版本" width="100" />
        <el-table-column prop="change_description" label="变更说明" />
        <el-table-column prop="affected_work_order_ids" label="影响工单" width="200" />
        <el-table-column prop="created_at" label="通知时间" width="180">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="notifications.length === 0" description="暂无变更通知" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';

const notifications = ref([]);

const formatDate = (date) => new Date(date).toLocaleString();

const loadData = async () => {
  try {
    const ordersRes = await api.get('/work-orders');
    const allNotifications = [];
    
    for (const order of ordersRes.data) {
      try {
        const res = await api.get(`/work-orders/${order.id}/notifications`);
        allNotifications.push(...res.data);
      } catch (e) {
        console.error(e);
      }
    }
    
    notifications.value = allNotifications.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  } catch (e) {
    console.error(e);
  }
};

onMounted(loadData);
</script>
