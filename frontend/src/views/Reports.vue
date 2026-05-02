<template>
  <div class="reports-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="page-title">报表管理</span>
          <div>
            <el-date-picker
              v-model="queryForm.period"
              type="month"
              placeholder="选择月份"
              value-format="YYYY-MM"
              style="width: 150px; margin-right: 10px;"
            />
            <el-button type="primary" @click="loadReports">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="资产负债表" name="balance">
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="report-header">
                <h2 class="report-title">资产负债表</h2>
                <p class="report-period">会计期间：{{ queryForm.period }}</p>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <h3 class="section-title">资产</h3>
              <el-table :data="balanceSheet?.assets || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>资产总计：</span>
                <span class="total-value">¥{{ balanceSheet?.totalAssets?.toFixed(2) || '0.00' }}</span>
              </div>
            </el-col>

            <el-col :span="12">
              <h3 class="section-title">负债和所有者权益</h3>
              <h4 class="sub-section-title">负债</h4>
              <el-table :data="balanceSheet?.liabilities || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>负债总计：</span>
                <span class="total-value">¥{{ balanceSheet?.totalLiabilities?.toFixed(2) || '0.00' }}</span>
              </div>

              <h4 class="sub-section-title">所有者权益</h4>
              <el-table :data="balanceSheet?.equity || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>所有者权益总计：</span>
                <span class="total-value">¥{{ balanceSheet?.totalEquity?.toFixed(2) || '0.00' }}</span>
              </div>

              <div class="balance-check" :class="{ balanced: balanceSheet?.isBalanced }">
                <el-tag :type="balanceSheet?.isBalanced ? 'success' : 'danger'">
                  {{ balanceSheet?.isBalanced ? '资产负债表平衡' : '资产负债表不平衡' }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="利润表" name="profit">
          <el-row :gutter="20">
            <el-col :span="24">
              <div class="report-header">
                <h2 class="report-title">利润表</h2>
                <p class="report-period">会计期间：{{ queryForm.period }}</p>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12" :offset="6">
              <h3 class="section-title">一、营业收入</h3>
              <el-table :data="profitSheet?.revenues || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>营业收入合计：</span>
                <span class="total-value">¥{{ profitSheet?.totalRevenue?.toFixed(2) || '0.00' }}</span>
              </div>

              <h3 class="section-title">二、营业成本</h3>
              <el-table :data="profitSheet?.costs || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>营业成本合计：</span>
                <span class="total-value">¥{{ profitSheet?.totalCost?.toFixed(2) || '0.00' }}</span>
              </div>

              <h3 class="section-title">三、期间费用</h3>
              <el-table :data="profitSheet?.expenses || []" border size="small">
                <el-table-column prop="code" label="科目代码" width="100" />
                <el-table-column prop="name" label="科目名称" />
                <el-table-column prop="balance" label="金额" width="150" align="right">
                  <template #default="{ row }">
                    {{ row.balance?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
              </el-table>
              <div class="total-row">
                <span>期间费用合计：</span>
                <span class="total-value">¥{{ profitSheet?.totalExpenses?.toFixed(2) || '0.00' }}</span>
              </div>

              <div class="net-profit">
                <h3 class="section-title">四、净利润</h3>
                <div class="total-row highlight">
                  <span>净利润：</span>
                  <span class="total-value" :class="profitSheet?.netProfit >= 0 ? 'profit' : 'loss'">
                    ¥{{ profitSheet?.netProfit?.toFixed(2) || '0.00' }}
                    <el-tag v-if="profitSheet?.netProfit >= 0" type="success">盈利</el-tag>
                    <el-tag v-else type="danger">亏损</el-tag>
                  </span>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '../api'

const activeTab = ref('balance')
const loading = ref(false)
const balanceSheet = ref({})
const profitSheet = ref({})

const queryForm = reactive({
  period: dayjs().format('YYYY-MM')
})

async function loadReports() {
  loading.value = true
  try {
    const balanceResult = await api.getBalanceSheet(queryForm.period)
    if (balanceResult.success) {
      balanceSheet.value = balanceResult.data
    }

    const profitResult = await api.getProfitSheet(queryForm.period)
    if (profitResult.success) {
      profitSheet.value = profitResult.data
    }
  } catch (error) {
    console.error('加载报表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.report-header {
  text-align: center;
  margin-bottom: 30px;
}

.report-title {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.report-period {
  font-size: 14px;
  color: #909399;
  margin-top: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin: 20px 0 10px 0;
}

.sub-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #606266;
  margin: 15px 0 10px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-top: none;
  font-weight: bold;
  font-size: 14px;
}

.total-value {
  font-size: 16px;
}

.balance-check {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: #fef0f0;
  border-radius: 4px;
}

.balance-check.balanced {
  background: #f0f9eb;
}

.net-profit {
  margin-top: 30px;
}

.total-row.highlight {
  background: #ecf5ff;
  border: 2px solid #409eff;
  font-size: 16px;
}

.profit {
  color: #67c23a;
}

.loss {
  color: #f56c6c;
}
</style>
