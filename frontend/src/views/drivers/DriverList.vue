<template>
  <div class="driver-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>司机列表</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>添加司机
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="driver_license" label="驾驶证号" width="150" />
        <el-table-column prop="license_type" label="驾照类型" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vehicle_plate" label="绑定车辆" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑司机' : '添加司机'"
      width="500px"
    >
      <el-form :model="driverForm" :rules="driverRules" ref="driverFormRef" label-width="100px">
        <el-form-item label="姓名" prop="real_name">
          <el-input v-model="driverForm.real_name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="driverForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="身份证号" prop="id_card">
          <el-input v-model="driverForm.id_card" placeholder="请输入身份证号" />
        </el-form-item>
        <el-form-item label="驾驶证号" prop="driver_license">
          <el-input v-model="driverForm.driver_license" placeholder="请输入驾驶证号" />
        </el-form-item>
        <el-form-item label="驾照类型" prop="license_type">
          <el-select v-model="driverForm.license_type" placeholder="请选择驾照类型" style="width: 100%">
            <el-option label="A1" value="A1" />
            <el-option label="A2" value="A2" />
            <el-option label="B1" value="B1" />
            <el-option label="B2" value="B2" />
            <el-option label="C1" value="C1" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="driverForm.status">
            <el-radio :value="1">在职</el-radio>
            <el-radio :value="0">离职</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getDriverList, createDriver, updateDriver } from '@/api/drivers'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const driverFormRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const driverForm = reactive({
  real_name: '',
  phone: '',
  id_card: '',
  driver_license: '',
  license_type: '',
  status: 1
})

const driverRules = {
  real_name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

const fetchDriverList = async () => {
  loading.value = true
  try {
    const res = await getDriverList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取司机列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchDriverList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchDriverList()
}

const openCreateDialog = () => {
  isEdit.value = false
  Object.assign(driverForm, {
    real_name: '',
    phone: '',
    id_card: '',
    driver_license: '',
    license_type: '',
    status: 1
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  driverForm.id = row.id
  Object.assign(driverForm, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!driverFormRef.value) return
  
  await driverFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateDriver(driverForm.id, driverForm)
          ElMessage.success('编辑成功')
        } else {
          await createDriver(driverForm)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchDriverList()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchDriverList()
})
</script>

<style scoped>
.driver-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
