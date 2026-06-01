<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; color: #409EFF">📦</div>
            <div style="font-size: 28px; font-weight: bold">{{ stats.customers }}</div>
            <div style="color: #666">客户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; color: #67C23A">📦</div>
            <div style="font-size: 28px; font-weight: bold">{{ stats.products }}</div>
            <div style="color: #666">货品种类</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; color: #E6A23C">🗄️</div>
            <div style="font-size: 28px; font-weight: bold">{{ stats.inventoryItems }}</div>
            <div style="color: #666">库存批次</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center">
            <div style="font-size: 32px; color: #F56C6C">⚠️</div>
            <div style="font-size: 28px; font-weight: bold">{{ stats.alerts }}</div>
            <div style="color: #666">温度告警</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>最近入库记录</template>
          <el-table :data="recentInbound" size="small">
            <el-table-column prop="record_no" label="单号" width="150" />
            <el-table-column prop="product_name" label="货品" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>最近出库记录</template>
          <el-table :data="recentOutbound" size="small">
            <el-table-column prop="order_no" label="单号" width="150" />
            <el-table-column prop="product_name" label="货品" />
            <el-table-column prop="requested_quantity" label="数量" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { customers, products, inventory, temperature, inbound, outbound } from '../api'

export default {
  name: 'Dashboard',
  data() {
    return {
      stats: {
        customers: 0,
        products: 0,
        inventoryItems: 0,
        alerts: 0
      },
      recentInbound: [],
      recentOutbound: []
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    async loadData() {
      const [custRes, prodRes, invRes, alertRes, inboundRes, outboundRes] = await Promise.all([
        customers.list().catch(() => ({ data: [] })),
        products.list().catch(() => ({ data: [] })),
        inventory.list().catch(() => ({ data: [] })),
        temperature.alerts({ status: 'open' }).catch(() => ({ data: [] })),
        inbound.records().catch(() => ({ data: [] })),
        outbound.list().catch(() => ({ data: [] }))
      ])
      this.stats.customers = custRes.data?.length || 0
      this.stats.products = prodRes.data?.length || 0
      this.stats.inventoryItems = invRes.data?.length || 0
      this.stats.alerts = alertRes.data?.length || 0
      this.recentInbound = (inboundRes.data || []).slice(0, 5)
      this.recentOutbound = (outboundRes.data || []).slice(0, 5)
    }
  }
}
</script>
