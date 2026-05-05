<template>
  <div class="inventory-page">
    <el-card>
      <template #header>
        <div class="header-actions">
          <span>库存管理</span>
          <div>
            <el-button type="primary" style="margin-right: 10px">入库</el-button>
            <el-button type="warning">出库</el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="inventoryList" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="物品名称" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'dish' ? 'primary' : 'success'">
              {{ row.type === 'dish' ? '菜品' : '原材料' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="库存数量" width="120">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.quantity <= row.minStock }">
              {{ row.quantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="预警值" width="100">
          <template #default="{ row }">
            {{ row.minStock }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.quantity <= row.minStock ? 'danger' : 'success'">
              {{ row.quantity <= row.minStock ? '预警' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" type="primary">调整</el-button>
            <el-button size="small" type="info">日志</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const loading = ref(false)
const inventoryList = ref([])

const fetchInventory = async () => {
  loading.value = true
  try {
    const res = await api.inventory.getList()
    inventoryList.value = res.data || []
  } catch (error) {
    console.error('Fetch inventory error:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchInventory()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}
</style>
