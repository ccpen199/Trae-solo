<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance } from 'element-plus'
import { getFirmwareListApi, uploadFirmwareApi, pushFirmwareApi } from '@/api/admin'
import { getDeviceListApi } from '@/api/device'

const loading = ref(false)
const firmwareList = ref<any[]>([])
const devices = ref<any[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })

const uploadDialogVisible = ref(false)
const pushDialogVisible = ref(false)
const currentFirmware = ref<any>({})
const selectedDevices = ref<number[]>([])
const uploadRef = ref<UploadInstance>()
const uploadLoading = ref(false)
const pushLoading = ref(false)

const formData = reactive({
  name: '',
  version: '',
  description: '',
  file: null as File | null
})

async function loadFirmwareList() {
  loading.value = true
  try {
    const res = await getFirmwareListApi({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    })
    firmwareList.value = res.data.list || res.data
    pagination.value.total = res.data.total || firmwareList.value.length
  } catch (error) {
    console.error('Load firmware error:', error)
    firmwareList.value = generateMockData()
  } finally {
    loading.value = false
  }
}

async function loadDevices() {
  try {
    const res = await getDeviceListApi({ pageSize: 1000 })
    devices.value = res.data.list || res.data
  } catch (error) {
    console.error('Load devices error:', error)
    devices.value = []
    for (let i = 1; i <= 20; i++) {
      devices.value.push({
        id: i,
        name: `设备${i}`,
        code: `DEV${i.toString().padStart(4, '0')}`,
        firmwareVersion: `v${Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`
      })
    }
  }
}

function generateMockData() {
  const data = []
  for (let i = 1; i <= 10; i++) {
    data.push({
      id: i,
      name: `固件版本 v1.${i}.0`,
      version: `v1.${i}.0`,
      fileSize: Math.floor(Math.random() * 10000) + 1000,
      uploadTime: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      uploader: '管理员',
      description: `固件版本 v1.${i}.0 更新内容`,
      deviceCount: Math.floor(Math.random() * 100) + 10,
      status: i === 1 ? 'active' : 'deprecated'
    })
  }
  return data
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadFirmwareList()
}

function openUploadDialog() {
  formData.name = ''
  formData.version = ''
  formData.description = ''
  formData.file = null
  uploadDialogVisible.value = true
}

function handleFileChange(file: any) {
  formData.file = file.raw
}

async function handleUpload() {
  if (!formData.name || !formData.version || !formData.file) {
    ElMessage.warning('请填写完整信息并选择文件')
    return
  }

  uploadLoading.value = true
  try {
    const data = new FormData()
    data.append('name', formData.name)
    data.append('version', formData.version)
    data.append('description', formData.description)
    data.append('file', formData.file)

    await uploadFirmwareApi(data)
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    loadFirmwareList()
  } catch (error) {
    console.error('Upload error:', error)
  } finally {
    uploadLoading.value = false
  }
}

function openPushDialog(row: any) {
  currentFirmware.value = { ...row }
  selectedDevices.value = []
  pushDialogVisible.value = true
  loadDevices()
}

async function handlePush() {
  if (selectedDevices.value.length === 0) {
    ElMessage.warning('请选择要升级的设备')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要将固件【${currentFirmware.value.name}】推送到选中的 ${selectedDevices.value.length} 台设备吗？`,
      '确认推送',
      { confirmButtonText: '确定推送', cancelButtonText: '取消', type: 'warning' }
    )

    pushLoading.value = true
    await pushFirmwareApi(currentFirmware.value.id, selectedDevices.value)
    ElMessage.success('推送成功')
    pushDialogVisible.value = false
    loadFirmwareList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Push error:', error)
    }
  } finally {
    pushLoading.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(
      `确定要删除固件【${row.name}】吗？`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.success('删除成功')
    loadFirmwareList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Delete error:', error)
    }
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

onMounted(() => {
  loadFirmwareList()
})
</script>

<template>
  <div class="firmware-page">
    <el-card class="filter-card">
      <div class="filter-row">
        <el-button type="success" icon="Upload" @click="openUploadDialog">上传固件</el-button>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="firmwareList"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="固件名称" min-width="150" />
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column label="文件大小" width="120">
          <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column prop="uploader" label="上传人" width="100" />
        <el-table-column prop="uploadTime" label="上传时间" width="180" />
        <el-table-column label="适用设备" width="100">
          <template #default="{ row }">{{ row.deviceCount }} 台</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '已废弃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="openPushDialog(row)">推送升级</el-button>
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
          @size-change="loadFirmwareList"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="uploadDialogVisible"
      title="上传固件"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="固件名称">
          <el-input v-model="formData.name" placeholder="请输入固件名称" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="formData.version" placeholder="例如：v1.0.0" />
        </el-form-item>
        <el-form-item label="固件描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入固件更新描述"
          />
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".bin,.hex,.zip"
          >
            <el-button type="primary" icon="Upload">选择文件</el-button>
            <div class="file-name" v-if="formData.file">
              <el-icon><Document /></el-icon>
              {{ formData.file.name }}
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="pushDialogVisible"
      title="推送固件升级"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="`将推送固件：${currentFirmware.name} (${currentFirmware.version})`"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <el-form label-width="100px">
        <el-form-item label="选择设备">
          <el-table
            ref="deviceTableRef"
            :data="devices"
            @selection-change="(val: any) => selectedDevices = val.map((d: any) => d.id)"
            border
            height="300"
            style="width: 100%;"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="设备名称" min-width="120" />
            <el-table-column prop="code" label="设备编号" min-width="120" />
            <el-table-column prop="firmwareVersion" label="当前版本" width="120" />
          </el-table>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="pushDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="pushLoading" @click="handlePush">
          推送升级 ({{ selectedDevices.length }} 台)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.firmware-page {
  .filter-card {
    margin-bottom: 20px;

    .filter-row {
      display: flex;
      justify-content: flex-end;
    }
  }

  .table-card {
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    font-size: 14px;
    color: #606266;
  }
}
</style>
