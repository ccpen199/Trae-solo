<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>出库单列表</span>
          <el-button type="primary" @click="showDialog">新建出库单</el-button>
        </div>
      </template>
      <el-table :data="orders" border size="small">
        <el-table-column prop="order_no" label="出库单号" width="150" />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="product_name" label="货品" />
        <el-table-column prop="requested_quantity" label="申请数量" width="100" />
        <el-table-column prop="actual_quantity" label="实发数量" width="100" />
        <el-table-column prop="batch_strategy" label="批次策略" width="100">
          <template #default="{ row }">
            {{ { fifo: '先进先出', lifo: '后进先出', specific: '指定批次' }[row.batch_strategy] }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'partial' ? 'warning' : 'info'">
              {{ row.status === 'pending' ? '待执行' : row.status === 'completed' ? '已完成' : '部分出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">详情</el-button>
            <el-button v-if="row.status === 'pending'" size="small" type="primary" @click="execute(row)">执行</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建出库单" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="客户">
          <el-select v-model="form.customer_id" style="width: 100%" @change="onCustomerChange">
            <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="货品">
          <el-select v-model="form.product_id" style="width: 100%">
            <el-option v-for="p in customerProducts" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请数量">
          <el-input-number v-model="form.requested_quantity" :min="1" />
        </el-form-item>
        <el-form-item label="批次策略">
          <el-select v-model="form.batch_strategy" style="width: 100%">
            <el-option label="先进先出(FIFO)" value="fifo" />
            <el-option label="后进先出(LIFO)" value="lifo" />
            <el-option label="指定批次" value="specific" />
          </el-select>
        </el-form-item>
        <el-form-item label="指定批次" v-if="form.batch_strategy === 'specific'">
          <el-select v-model="form.specific_batch" style="width: 100%">
            <el-option v-for="b in availableBatches" :key="b.batch_no" :label="b.batch_no" :value="b.batch_no" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="出库单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="出库单号">{{ currentOrder.order_no }}</el-descriptions-item>
        <el-descriptions-item label="客户">{{ currentOrder.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="货品">{{ currentOrder.product_name }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ currentOrder.status }}</el-descriptions-item>
        <el-descriptions-item label="申请数量">{{ currentOrder.requested_quantity }}</el-descriptions-item>
        <el-descriptions-item label="实发数量">{{ currentOrder.actual_quantity }}</el-descriptions-item>
      </el-descriptions>
      <el-divider />
      <h4>出库明细</h4>
      <el-table :data="currentOrder.items || []" size="small" border>
        <el-table-column prop="batch_no" label="批次号" />
        <el-table-column prop="quantity" label="数量" />
        <el-table-column prop="location_code" label="库位" />
      </el-table>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { outbound, customers, inventory } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Outbound',
  data() {
    return {
      orders: [],
      customers: [],
      customerProducts: [],
      availableBatches: [],
      dialogVisible: false,
      detailVisible: false,
      currentOrder: null,
      form: {
        customer_id: null,
        product_id: null,
        requested_quantity: 1,
        batch_strategy: 'fifo',
        specific_batch: '',
        remark: ''
      }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const [ordRes, custRes] = await Promise.all([
        outbound.list(),
        customers.list()
      ])
      this.orders = ordRes.data
      this.customers = custRes.data
    },
    onCustomerChange(customerId) {
      inventory.list({ customer_id: customerId }).then(res => {
        const productMap = {}
        res.data.forEach(i => {
          if (!productMap[i.product_id]) {
            productMap[i.product_id] = { id: i.product_id, name: i.product_name }
          }
        })
        this.customerProducts = Object.values(productMap)
      })
    },
    showDialog() {
      this.form = { customer_id: null, product_id: null, requested_quantity: 1, batch_strategy: 'fifo', specific_batch: '', remark: '' }
      this.dialogVisible = true
    },
    async submit() {
      try {
        await outbound.create(this.form)
        this.dialogVisible = false
        this.load()
        ElMessage.success('创建成功')
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    },
    async viewDetail(row) {
      const res = await outbound.get(row.id)
      this.currentOrder = res.data
      this.detailVisible = true
    },
    async execute(row) {
      try {
        const res = await outbound.execute(row.id, {})
        if (res.data.has_difference) {
          ElMessage.warning(`部分出库，实际出库 ${res.data.actual_quantity}，差异 ${res.data.difference}`)
        } else {
          ElMessage.success('出库完成')
        }
        this.load()
      } catch (e) {
        ElMessage.error(e.response?.data?.error || '操作失败')
      }
    }
  },
  watch: {
    'form.product_id'(productId) {
      if (productId) {
        inventory.list({ product_id: productId }).then(res => {
          this.availableBatches = res.data
        })
      }
    }
  }
}
</script>
