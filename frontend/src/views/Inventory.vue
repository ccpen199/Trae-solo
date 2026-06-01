<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>库存列表</span>
          <div>
            <el-select v-model="filter.customer_id" placeholder="选择客户" clearable style="width: 150px; margin-right: 10px" @change="load">
              <el-option v-for="c in customers" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
            <el-input v-model="filter.batch_no" placeholder="批次号" clearable style="width: 150px" @clear="load" @keyup.enter="load" />
          </div>
        </div>
      </template>
      <el-table :data="inventory" border size="small">
        <el-table-column prop="batch_no" label="批次号" width="140" fixed />
        <el-table-column prop="customer_name" label="客户" width="100" />
        <el-table-column prop="product_name" label="货品" />
        <el-table-column prop="location_code" label="库位" width="100" />
        <el-table-column prop="zone_name" label="温区" width="100" />
        <el-table-column prop="quantity" label="总数量" width="90" />
        <el-table-column prop="available_quantity" label="可用数量" width="90" />
        <el-table-column prop="storage_days" label="仓储天数" width="100">
          <template #default="{ row }">
            {{ Math.ceil(row.storage_days || 0) }}天
          </template>
        </el-table-column>
        <el-table-column prop="expiry_date" label="过期日期" width="120" />
        <el-table-column prop="inbound_time" label="入库时间" width="160" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { inventory as inventoryApi, customers } from '../api'

export default {
  name: 'Inventory',
  data() {
    return {
      inventory: [],
      customers: [],
      filter: {
        customer_id: null,
        batch_no: ''
      }
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const [invRes, custRes] = await Promise.all([
        inventoryApi.list(this.filter),
        customers.list()
      ])
      this.inventory = invRes.data
      this.customers = custRes.data
    }
  }
}
</script>
