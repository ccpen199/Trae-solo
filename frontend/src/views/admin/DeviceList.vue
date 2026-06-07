<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDeviceListApi, createDeviceApi, updateDeviceApi, deleteDeviceApi } from '@/api/device'
import StatusBadge from '@/components/StatusBadge.vue'
import type { Device } from '@/stores/device'

const loading = ref(false)
const devices = ref<Device[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const searchKeyword = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentDevice = ref<any>({})
const dialogLoading = ref(false)

const formRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入设备位置', trigger: 'blur' }],
  lat: [{ required: true, message: '请输入纬度', trigger: 'blur' }],
  lng: [{ required: true, message: '请输入经度', trigger: 'blur' }]
}

async function loadDevices() {
  loading.value = true
  try {
    const res = await getDeviceListApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: statusFilter.value,
      type: typeFilter.value,
      keyword: searchKeyword.value
    })
    devices.value = res.data.list || res.data
    pagination.value.total = res.data.total || devices.value.length
  } catch (error) {
    console.error('Load devices error:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadDevices()
}

function handleReset() {
  searchKeyword.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
  pagination.value.page = 1
  loadDevices()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadDevices()
}

function handleAdd() {
  isEdit.value = false
  currentDevice.value = {
    name: '',
    code: '',
    type: 'washer',
    status: 'idle',
    location: '',
    lat: 39.9042,
    lng: 116.4074,
    firmwareVersion: 'v1.0.0'
  }
  dialogVisible.value = true
}

function handleEdit(row: any) {
  isEdit.value = true
  currentDevice.value = { ...row }
  dialogVisible.value = true
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备【${row.name}】吗？`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    await deleteDeviceApi(row.id)
    ElMessage.success('删除成功')
    loadDevices()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

async function handleSubmit() {
  dialogLoading.value = true
  try {
    if (isEdit.value) {
      await updateDeviceApi(currentDevice.value.id, currentDevice.value)
      ElMessage.success('更新成功')
    } else {
      await createDeviceApi(currentDevice.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadDevices()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    dialogLoading.value = false
  }
}

const typeMap: Record<string, string> = {
  washer: '洗衣机',
  dryer: '烘干机'
}

onMounted(() => {
  loadDevices()
})
</script>

<template>
  <div class="device-list-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="{}" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchKeyword"
            placeholder="设备名称/编号/位置"
            clearable
            style="width: 200px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="statusFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="空闲" value="idle" />
            <el-option label="运行中" value="running" />
            <el-option label="已暂停" value="paused" />
            <el-option label="故障" value="fault" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="typeFilter" placeholder="全部" clearable style="width: 120px;">
            <el-option label="洗衣机" value="washer" />
            <el-option label="烘干机" value="dryer" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="handleAdd">新增设备</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="devices"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="设备名称" min-width="120" />
        <el-table-column prop="code" label="设备编号" min-width="120" />
        <el-table-column label="设备类型" width="100">
          <template #default="{ row }">{{ typeMap[row.type] }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" type="device" />
          </template>
        </el-table-column>
        <el-table-column prop="location" label="位置" min-width="150" />
        <el-table-column label="经纬度" width="180">
          <template #default="{ row }">
            {{ row.lat?.toFixed(4) }}, {{ row.lng?.toFixed(4) }}
          </template>
        </el-table-column>
        <el-table-column prop="firmwareVersion" label="固件版本" width="120" />
        <el-table-column prop="remainingTime" label="剩余时间(分)" width="120">
          <template #default="{ row }">{{ row.remainingTime || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          @current-change="handlePageChange"
          @size-change="loadDevices"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑设备' : '新增设备'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="currentDevice"
        :rules="formRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="currentDevice.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备编号" prop="code">
              <el-input v-model="currentDevice.code" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="currentDevice.type" style="width: 100%;">
                <el-option label="洗衣机" value="washer" />
                <el-option label="烘干机" value="dryer" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态" prop="status">
              <el-select v-model="currentDevice.status" style="width: 100%;">
                <el-option label="空闲" value="idle" />
                <el-option label="运行中" value="running" />
                <el-option label="已暂停" value="paused" />
                <el-option label="故障" value="fault" />
                <el-option label="维护中" value="maintenance" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备位置" prop="location">
              <el-input v-model="currentDevice.location" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纬度" prop="lat">
              <el-input-number v-model="currentDevice.lat" :precision="6" :step="0.0001" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度" prop="lng">
              <el-input-number v-model="currentDevice.lng" :precision="6" :step="0.0001" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="固件版本">
              <el-input v-model="currentDevice.firmwareVersion" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="dialogLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.device-list-page {
  .filter-card {
    margin-bottom: 20px;

    .filter-form {
      margin-bottom: 0;
    }
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
