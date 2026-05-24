<template>
  <div class="vehicles">
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span>我的车辆</span>
          <el-button type="primary" @click="dialogVisible = true">添加车辆</el-button>
        </div>
      </template>
      <el-table :data="vehicles" border>
        <el-table-column prop="plate_number" label="车牌号" width="150" />
        <el-table-column prop="brand" label="品牌" />
        <el-table-column prop="model" label="型号" />
        <el-table-column prop="fuel_type_name" label="适用油品" />
        <el-table-column label="默认车辆" width="120">
          <template #default="{row}">
            <el-tag v-if="row.default_flag" type="success">默认</el-tag>
            <el-button v-else link type="primary" @click="setDefault(row.id)">设为默认</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{row}">
            <el-button type="danger" link @click="remove(row.id)">解绑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="添加车辆" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="车牌号"><el-input v-model="form.plate_number" placeholder="请输入车牌号" /></el-form-item>
        <el-form-item label="品牌"><el-input v-model="form.brand" /></el-form-item>
        <el-form-item label="型号"><el-input v-model="form.model" /></el-form-item>
        <el-form-item label="油品">
          <el-select v-model="form.fuel_type_id" placeholder="请选择">
            <el-option v-for="f in fuelTypes" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设为默认">
          <el-switch v-model="form.default_flag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addVehicle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { member, station } from '../../api'

const vehicles = ref([])
const fuelTypes = ref([])
const dialogVisible = ref(false)
const form = ref({ plate_number: '', brand: '', model: '', fuel_type_id: null, default_flag: false })

const loadData = async () => {
  vehicles.value = await member.getVehicles()
  fuelTypes.value = await station.fuelTypes()
}
onMounted(loadData)

const addVehicle = async () => {
  try {
    await member.addVehicle(form.value)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    form.value = { plate_number: '', brand: '', model: '', fuel_type_id: null, default_flag: false }
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '添加失败')
  }
}

const setDefault = async (id) => {
  await member.setDefaultVehicle(id)
  ElMessage.success('设置成功')
  loadData()
}

const remove = async (id) => {
  try {
    await ElMessageBox.confirm('确定解绑此车辆？', '提示', { type: 'warning' })
    await member.deleteVehicle(id)
    ElMessage.success('解绑成功')
    loadData()
  } catch (e) {}
}
</script>
