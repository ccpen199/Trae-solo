<template>
  <div class="bottlenecks-page">
    <el-card>
      <template #header>
        <span>跨部门协同堵点分析</span>
      </template>

      <el-row :gutter="20" class="alert-row">
        <el-col :span="12">
          <el-alert
            :title="`待补正材料: ${bottleneckData.supplementCount || 0} 件`"
            type="warning"
            :closable="false"
            show-icon
          />
        </el-col>
        <el-col :span="12">
          <el-alert
            :title="`超期催办: ${bottleneckData.overdueReminders || 0} 件`"
            type="error"
            :closable="false"
            show-icon
          />
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>各部门待办积压情况</span>
            </template>
            <el-table :data="bottleneckData.pendingByDepartment || []">
              <el-table-column prop="department" label="部门" />
              <el-table-column prop="pending_count" label="待办数量" width="100" />
              <el-table-column label="平均等待天数" width="120">
                <template #default="{ row }">
                  <el-tag :type="row.avg_wait_days > 5 ? 'danger' : row.avg_wait_days > 3 ? 'warning' : 'info'">
                    {{ row.avg_wait_days?.toFixed(1) || 0 }} 天
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <span>慢节点分析</span>
            </template>
            <el-table :data="bottleneckData.slowNodes || []">
              <el-table-column prop="node_name" label="节点名称" />
              <el-table-column prop="department" label="所属部门" width="120" />
              <el-table-column prop="count" label="待办数" width="80" />
              <el-table-column label="平均等待" width="100">
                <template #default="{ row }">
                  {{ row.avg_wait_days?.toFixed(1) || 0 }} 天
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <el-card style="margin-top: 20px;">
        <template #header>
          <span>优化建议</span>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(suggestion, idx) in bottleneckData.suggestions || []"
            :key="idx"
            type="primary"
            icon="Bulb"
          >
            {{ suggestion }}
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

const bottleneckData = ref<any>({});

const loadData = async () => {
  try {
    const res = await api.get('/admin/bottlenecks');
    if (res.code === 200) {
      bottleneckData.value = res.data;
    }
  } catch (error) {
    console.error('加载堵点分析失败', error);
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.alert-row {
  margin-bottom: 20px;
}
</style>
