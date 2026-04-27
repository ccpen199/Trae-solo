<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">良率分析</h2>
    </div>

    <el-card style="margin-bottom: 20px;">
      <div class="filter-bar">
        <span style="margin-right: 8px;">统计周期：</span>
        <el-select v-model="statsDays" style="width: 120px;" @change="loadYieldData">
          <el-option label="近7天" :value="7" />
          <el-option label="近14天" :value="14" />
          <el-option label="近30天" :value="30" />
        </el-select>
        <el-button type="primary" @click="loadYieldData">刷新</el-button>
      </div>

      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ yieldData.totalQty }}</div>
            <div class="stat-label">总报工数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #67c23a;">{{ yieldData.passQty }}</div>
            <div class="stat-label">合格数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ yieldData.failQty }}</div>
            <div class="stat-label">不合格数量</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value" :style="{ color: yieldData.yieldRate >= 95 ? '#67c23a' : '#f56c6c' }">
              {{ yieldData.yieldRate }}%
            </div>
            <div class="stat-label">良率</div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-bottom: 20px;">
      <template #header>
        <span class="card-title">工单良率排名</span>
      </template>
      <el-table :data="workOrderYields" v-loading="loading" border stripe>
        <el-table-column type="index" label="排名" width="60" />
        <el-table-column prop="workOrderNo" label="工单号" width="160" />
        <el-table-column prop="productName" label="产品名称" />
        <el-table-column prop="totalQty" label="总报工" width="100" align="center" />
        <el-table-column prop="passQty" label="合格" width="100" align="center">
          <template #default="scope">
            <span style="color: #67c23a;">{{ scope.row.passQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failQty" label="不合格" width="100" align="center">
          <template #default="scope">
            <span style="color: #f56c6c;">{{ scope.row.failQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="yieldRate" label="良率" width="120" align="center">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.yieldRate"
              :stroke-width="18"
              :color="scope.row.yieldRate >= 95 ? '#67c23a' : '#e6a23c'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card>
      <template #header>
        <span class="card-title">工序良率统计</span>
      </template>
      <el-table :data="processYields" v-loading="loading" border stripe>
        <el-table-column prop="processName" label="工序名称" />
        <el-table-column prop="totalQty" label="总报工" width="100" align="center" />
        <el-table-column prop="passQty" label="合格" width="100" align="center">
          <template #default="scope">
            <span style="color: #67c23a;">{{ scope.row.passQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="failQty" label="不合格" width="100" align="center">
          <template #default="scope">
            <span style="color: #f56c6c;">{{ scope.row.failQty }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="yieldRate" label="良率" width="120" align="center">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.yieldRate"
              :stroke-width="18"
              :color="scope.row.yieldRate >= 95 ? '#67c23a' : '#e6a23c'"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { reportApi } from '@/api/report';

const loading = ref(false);
const statsDays = ref(7);

const yieldData = reactive({
  totalQty: 0,
  passQty: 0,
  failQty: 0,
  yieldRate: 0,
});

const workOrderYields = ref<any[]>([]);
const processYields = ref<any[]>([]);

const loadYieldData = async () => {
  loading.value = true;
  try {
    const response = await reportApi.getYield({ days: statsDays.value });
    const data = response.data || {};

    yieldData.totalQty = data.totalQty || 0;
    yieldData.passQty = data.passQty || 0;
    yieldData.failQty = data.failQty || 0;
    yieldData.yieldRate = data.yieldRate || 0;

    workOrderYields.value = data.workOrderYields || [];
    processYields.value = data.processYields || [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadYieldData();
});
</script>
