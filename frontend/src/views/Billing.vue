<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>费用计算</span>
          <el-button type="success" @click="calculate">试算费用</el-button>
        </div>
      </template>
      <el-form :inline="true" :model="calcForm">
        <el-form-item label="客户">
          <el-select v-model="calcForm.customer_id" style="width: 200px">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起始日期">
          <el-date-picker v-model="calcForm.period_start" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="calcForm.period_end" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <el-divider v-if="calcResult" />
      <div v-if="calcResult">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-statistic title="仓储费" :value="calcResult.storage_fee" precision="2" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="操作费" :value="calcResult.handling_fee" precision="2" />
          </el-col>
          <el-col :span="8">
            <el-statistic title="总计" :value="calcResult.total_amount" precision="2" />
          </el-col>
        </el-row>
        <el-button type="primary" style="margin-top: 20px" @click="createBill">生成账单</el-button>
        <el-table :data="calcResult.details || []" size="small" border style="margin-top: 20px">
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ row.type === 'storage' ? '仓储费' : '操作费' }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
          <el-table-column prop="quantity" label="数量" width="100" />
          <el-table-column prop="unit_price" label="单价" width="100" />
          <el-table-column prop="amount" label="金额" width="100" />
        </el-table>
      </div>
    </el-card>

    <el-card>
      <template #header>
        <span>账单列表</span>
      </template>
      <el-table :data="bills" border size="small">
        <el-table-column prop="bill_no" label="账单号" width="150" />
        <el-table-column prop="customer_name" label="客户" width="120" />
        <el-table-column prop="period_start" label="起始日期" width="120" />
        <el-table-column prop="period_end" label="结束日期" width="120" />
        <el-table-column prop="storage_fee" label="仓储费" width="100" />
        <el-table-column prop="handling_fee" label="操作费" width="100" />
        <el-table-column prop="total_amount" label="总金额" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'paid' ? 'success' : 'warning'">
              {{ row.status === 'paid' ? '已支付' : '未支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="viewBill(row)">详情</el-button>
            <el-button v-if="row.status === 'unpaid'" size="small" type="success" @click="pay(row)">付款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="detailVisible" title="账单详情" width="700px">
      <el-descriptions :column="2" border v-if="currentBill">
        <el-descriptions-item label="账单号">{{ currentBill.bill_no }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentBill.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="周期">{{ currentBill.period_start }} ~ {{ currentBill.period_end }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentBill.status === 'paid' ? '已支付' : '未支付' }}</el-descriptions-item>
        <el-descriptions-item label="仓储费">{{ currentBill.storage_fee }}</el-descriptions-item>
        <el-descriptions-item label="操作费">{{ currentBill.handling_fee }}</el-descriptions-item>
        <el-descriptions-item label="总金额" :span="2">{{ currentBill.total_amount }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <h4>明细</h4>
      <el-table :data="currentBill.details || []" size="small" border>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            {{ row.type === 'storage' ? '仓储费' : '操作费' }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unit_price" label="单价" width="100" />
        <el-table-column prop="amount" label="金额" width="100" />
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { billing, customers } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Billing',
  data() {
    return {
      bills: [],
      customers: [],
      calcForm: {
        customer_id: null,
        period_start: new Date(new Date().setDate(1)).toISOString().slice(0, 10),
        period_end: new Date().toISOString().slice(0, 10)
      },
      calcResult: null,
      detailVisible: false,
      currentBill: null
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const [billRes, custRes] = await Promise.all([
        billing.records(),
        customers.list()
      ])
      this.bills = billRes.data
      this.customers = custRes.data
    },
    async calculate() {
      if (!this.calcForm.customer_id) {
        ElMessage.warning('请选择客户')
        return
      }
      const res = await billing.calculate(this.calcForm)
      this.calcResult = res.data
    },
    async createBill() {
      const res = await billing.create(this.calcForm)
      ElMessage.success('账单已生成')
      this.calcResult = null
      this.load()
    },
    async viewBill(row) {
      const res = await billing.get(row.id)
      this.currentBill = res.data
      this.detailVisible = true
    },
    async pay(row) {
      await billing.pay(row.id)
      ElMessage.success('付款完成')
      this.load()
    }
  }
}
</script>
