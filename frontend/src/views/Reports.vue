<template>
  <div class="reports">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报表统计</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总订单数" :value="0">
            <template #suffix>单</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="总营收" :value="0" prefix="¥">
            <template #suffix>元</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="月卡订单" :value="0">
            <template #suffix>单</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="异常处理" :value="0">
            <template #suffix>单</template>
          </el-statistic>
        </el-col>
      </el-row>

      <el-divider />

      <el-empty description="报表功能开发中..." />
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const dateRange = ref([])
</script>

<style scoped>
.reports {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>