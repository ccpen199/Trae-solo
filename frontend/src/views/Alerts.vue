<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">报警记录</span>
      <el-button type="primary" @click="loadAlerts">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      <el-button type="warning" @click="clearAlerts" style="margin-left: 10px;">
        <el-icon><CircleClose /></el-icon>
        清除已报警状态
      </el-button>
    </div>

    <el-card>
      <el-alert
        title="报警说明"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      >
        <template #default>
          <p>接口调用连续失败 3 次会触发报警。报警记录显示最近的失败情况。</p>
        </template>
      </el-alert>

      <el-table :data="alerts" stripe v-loading="loading" empty-text="暂无报警记录">
        <el-table-column prop="apiName" label="接口名称" width="180">
          <template #default="scope">
            <el-tag :type="scope.row.isAlerted ? 'danger' : 'warning'">
              {{ scope.row.apiName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneMd5" label="手机号MD5" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.phoneMd5 || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="300" show-overflow-tooltip>
          <template #default="scope">
            <el-text type="danger">{{ scope.row.errorMessage }}</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="errorCount" label="失败次数" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.errorCount >= 3 ? 'danger' : 'warning'">
              {{ scope.row.errorCount }} 次
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isAlerted" label="是否已报警" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.isAlerted ? 'danger' : 'info'">
              {{ scope.row.isAlerted ? '已报警' : '未报警' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="首次失败时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="最后更新时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.updatedAt).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/utils/api'

const loading = ref(false)
const alerts = ref([])

const loadAlerts = async () => {
  loading.value = true
  try {
    const res = await adminApi.getAlerts()
    alerts.value = res.data || []
  } catch (error) {
    console.error('Load alerts failed:', error)
  } finally {
    loading.value = false
  }
}

const clearAlerts = async () => {
  try {
    await ElMessageBox.confirm('确定要清除所有已报警状态吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await adminApi.clearAlerts()
    ElMessage.success('已清除报警状态')
    loadAlerts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败')
    }
  }
}

onMounted(() => {
  loadAlerts()
})
</script>
