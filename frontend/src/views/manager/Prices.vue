<template>
  <div class="prices">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>油价管理</span>
          <el-button type="primary" @click="dialogVisible = true">调整油价</el-button>
        </div>
      </template>
      <el-table :data="prices" border>
        <el-table-column prop="code" label="油品" width="100" />
        <el-table-column prop="fuel_type_name" label="名称" />
        <el-table-column prop="price" label="当前价格(元/L)" width="150">
          <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="effective_from" label="生效时间" width="200" />
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="调整油价" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="油品">
          <el-select v-model="form.fuel_type_id" placeholder="请选择">
            <el-option v-for="f in fuelTypes" :key="f.id" :label="f.code + ' - ' + f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="新价格">
          <el-input-number v-model="form.price" :min="0" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="form.effective_from" type="datetime" placeholder="选择时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确认调整</el-button>
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
const prices = ref([])
const fuelTypes = ref([])
const dialogVisible = ref(false)
const form = ref({ fuel_type_id: null, price: 0, effective_from: null })

const load = async () => {
  prices.value = await station.getPrices(userInfo.station_id)
  fuelTypes.value = await station.fuelTypes()
}
onMounted(load)

const submit = async () => {
  try {
    await station.adjustPrice({ station_id: userInfo.station_id, ...form.value })
    ElMessage.success('油价调整成功')
    dialogVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.error || '操作失败')
  }
}
</script>
