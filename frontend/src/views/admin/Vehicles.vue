<template>
  <div class="admin-vehicles">
    <el-card>
      <template #header>
        <span>车辆管理</span>
      </template>
      <el-table :data="vehicles" v-loading="loading">
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="vehicle_type" label="车型" width="100" />
        <el-table-column prop="vehicle_length" label="车长" width="100">
          <template #default="{ row }">{{ row.vehicle_length }}米</template>
        </el-table-column>
        <el-table-column prop="max_weight" label="载重" width="80">
          <template #default="{ row }">{{ row.max_weight }}吨</template>
        </el-table-column>
        <el-table-column prop="max_volume" label="容积" width="80">
          <template #default="{ row }">{{ row.max_volume }}方</template>
        </el-table-column>
        <el-table-column prop="driver_name" label="所属司机" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="success">正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { vehicleAPI } from '@/api'

const vehicles = ref([])
const loading = ref(false)

const loadVehicles = async () => {
  loading.value = true
  const res = await vehicleAPI.list()
  if (res.success) {
    vehicles.value = res.data
  }
  loading.value = false
}

onMounted(() => {
  loadVehicles()
})
</script>
