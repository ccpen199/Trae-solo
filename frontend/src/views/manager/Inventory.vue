<template>
  <div class="inventory">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>油罐库存</span>
          <el-button type="primary" @click="dialogVisible = true">油品入库</el-button>
        </div>
      </template>
      <el-table :data="inventory" border>
        <el-table-column prop="code" label="油品" width="100" />
        <el-table-column prop="fuel_type_name" label="名称" />
        <el-table-column prop="current_volume" label="当前库存(L)" width="150">
          <template #default="{row}">
            <el-tag :type="row.current_volume < row.min_volume ? 'danger' : row.current_volume < row.max_volume * 0.2 ? 'warning' : 'success'">
              {{ row.current_volume.toFixed(2) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="min_volume" label="最低库存(L)" width="150" />
        <el-table-column prop="max_volume" label="最大库存(L)" width="150" />
        <el-table-column prop="last_updated" label="更新时间" />
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="油品入库" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="油品">
          <el-select v-model="form.fuel_type_id" placeholder="请选择">
            <el-option v-for="f in fuelTypes" :key="f.id" :label="f.code + ' - ' + f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="入库数量">
          <el-input-number v-model="form.volume" :min="0" :precision="2" />
          <span style="margin-left:10px;">L</span>
        </el-form-item>
        <el-form-item label="进价">
          <el-input-number v-model="form.unit_cost" :min="0" :precision="2" />
          <span style="margin-left:10px;">元/L</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { station } from '../../api'
import { useUserStore } from '../../utils/userStore'

const { userInfo } = useUserStore()
const inventory = ref([])
const fuelTypes = ref([])
const dialogVisible = ref(false)
const form = ref({ fuel_type_id: null, volume: 0, unit_cost: 0 })

const load = async () => {
  inventory.value = await station.getInventory(userInfo.station_id)
  fuelTypes.value = await station.fuelTypes()
}
onMounted(load)

const submit = async () => {
  try {
    await station.addInventory({ station_id: userInfo.station_id, ...form.value })
    ElMessage.success('入库成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.error || '操作失败')
  }
}
</script>
