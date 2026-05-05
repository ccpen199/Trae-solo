<template>
  <div class="reports-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>经营报表</span>
          <div class="filters">
            <el-select v-model="reportType" placeholder="报表类型" style="width: 150px; margin-right: 10px">
              <el-option label="销售日报" value="daily" />
              <el-option label="销售周报" value="weekly" />
              <el-option label="销售月报" value="monthly" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 280px; margin-right: 10px"
            />
            <el-button type="primary">查询</el-button>
          </div>
        </div>
      </template>
      
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="总营业额" :value="125680" prefix="¥" value-style="color: #f56c6c" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="订单数量" :value="856" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="平均客单价" :value="146.82" prefix="¥" :precision="2" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover">
            <el-statistic title="支付笔数" :value="842" />
          </el-card>
        </el-col>
      </el-row>
      
      <el-card>
        <template #header>
          <span>热销菜品排行</span>
        </template>
        <el-table :data="topDishes" style="width: 100%">
          <el-table-column prop="rank" label="排名" width="80">
            <template #default="{ row }">
              <el-tag :type="row.rank <= 3 ? 'danger' : 'info'">{{ row.rank }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="菜品名称" />
          <el-table-column prop="quantity" label="销量" width="120" />
          <el-table-column prop="revenue" label="营收" width="150">
            <template #default="{ row }">¥{{ row.revenue }}</template>
          </el-table-column>
          <el-table-column prop="percentage" label="占比" width="150">
            <template #default="{ row }">
              <el-progress :percentage="row.percentage" :stroke-width="10" :show-text="true" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      
      <el-card style="margin-top: 20px">
        <template #header>
          <span>支付方式分布</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="6" v-for="(item, index) in paymentStats" :key="index">
            <el-card>
              <div style="text-align: center">
                <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px">{{ item.label }}</div>
                <div style="font-size: 20px; color: #409eff">¥{{ item.amount }}</div>
                <div style="color: #909399; margin-top: 5px">{{ item.percentage }}%</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

const reportType = ref('daily')
const dateRange = ref([
  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  new Date()
])

const topDishes = ref([
  { rank: 1, name: '红烧肉', quantity: 156, revenue: 9048, percentage: 15 },
  { rank: 2, name: '宫保鸡丁', quantity: 142, revenue: 5964, percentage: 12 },
  { rank: 3, name: '鱼香肉丝', quantity: 128, revenue: 4864, percentage: 10 },
  { rank: 4, name: '麻婆豆腐', quantity: 98, revenue: 2744, percentage: 8 },
  { rank: 5, name: '蛋炒饭', quantity: 86, revenue: 1548, percentage: 6 }
])

const paymentStats = ref([
  { label: '微信支付', amount: 65800, percentage: 52 },
  { label: '支付宝', amount: 38900, percentage: 31 },
  { label: '现金', amount: 12980, percentage: 10 },
  { label: '银行卡', amount: 8000, percentage: 7 }
])
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  align-items: center;
}
</style>
