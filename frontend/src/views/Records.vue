<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">请求记录</span>
      <el-button type="primary" @click="loadRecords">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-card>
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="渠道号">
          <el-input v-model="searchForm.channelCode" placeholder="渠道号" clearable />
        </el-form-item>
        <el-form-item label="手机号MD5">
          <el-input v-model="searchForm.phoneMd5" placeholder="手机号MD5" clearable />
        </el-form-item>
        <el-form-item label="返回码">
          <el-select v-model="searchForm.returnCode" placeholder="全部" clearable>
            <el-option label="成功(200)" :value="200" />
            <el-option label="失败(403)" :value="403" />
            <el-option label="错误(500)" :value="500" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadRecords">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="records" stripe v-loading="loading">
        <el-table-column prop="channelCode" label="渠道号" width="120" />
        <el-table-column prop="productId" label="产品ID" width="120" />
        <el-table-column prop="phonePlain" label="手机号" width="130">
          <template #default="scope">
            {{ scope.row.phonePlain || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phoneMd5" label="手机号MD5" min-width="200" show-overflow-tooltip />
        <el-table-column prop="accessResult" label="准入结果" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.accessResult" :type="scope.row.accessResult === 'PASS' ? 'success' : 'danger'">
              {{ scope.row.accessResult }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="collisionResult" label="撞库结果" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.collisionResult" :type="getCollisionTagType(scope.row.collisionResult)">
              {{ scope.row.collisionResult }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isOldUser" label="用户类型" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.isOldUser !== null" :type="scope.row.isOldUser ? 'warning' : 'primary'">
              {{ scope.row.isOldUser ? '老用户' : '新用户' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="returnCode" label="返回码" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.returnCode === 200 ? 'success' : 'danger'">
              {{ scope.row.returnCode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadRecords"
        @current-change="loadRecords"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <el-dialog v-model="detailVisible" title="记录详情" width="700px">
      <el-descriptions :column="1" border v-if="currentRecord">
        <el-descriptions-item label="渠道号">{{ currentRecord.channelCode }}</el-descriptions-item>
        <el-descriptions-item label="产品ID">{{ currentRecord.productId }}</el-descriptions-item>
        <el-descriptions-item label="明文手机号">{{ currentRecord.phonePlain || '-' }}</el-descriptions-item>
        <el-descriptions-item label="MD5手机号">{{ currentRecord.phoneMd5 }}</el-descriptions-item>
        <el-descriptions-item label="准入结果">
          <el-tag :type="currentRecord.accessResult === 'PASS' ? 'success' : 'danger'">
            {{ currentRecord.accessResult || '-' }}
          </el-tag>
          <span v-if="currentRecord.accessCode" style="margin-left: 10px;">({{ currentRecord.accessCode }})</span>
        </el-descriptions-item>
        <el-descriptions-item label="撞库结果">
          <el-tag :type="getCollisionTagType(currentRecord.collisionResult)">
            {{ currentRecord.collisionResult || '-' }}
          </el-tag>
          <span v-if="currentRecord.collisionCode" style="margin-left: 10px;">({{ currentRecord.collisionCode }})</span>
        </el-descriptions-item>
        <el-descriptions-item label="注册结果">
          <el-tag :type="currentRecord.registerCode === 200 ? 'success' : 'warning'">
            {{ currentRecord.registerResult || '-' }}
          </el-tag>
          <span v-if="currentRecord.registerCode" style="margin-left: 10px;">({{ currentRecord.registerCode }})</span>
        </el-descriptions-item>
        <el-descriptions-item label="用户类型">
          <el-tag v-if="currentRecord.isOldUser !== null" :type="currentRecord.isOldUser ? 'warning' : 'primary'">
            {{ currentRecord.isOldUser ? '老用户' : '新用户' }}
          </el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="返回码">
          <el-tag :type="currentRecord.returnCode === 200 ? 'success' : 'danger'">
            {{ currentRecord.returnCode }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="返回消息">{{ currentRecord.returnMessage }}</el-descriptions-item>
        <el-descriptions-item label="下载链接">
          <el-link v-if="currentRecord.downloadUrl" :href="currentRecord.downloadUrl" target="_blank">
            {{ currentRecord.downloadUrl }}
          </el-link>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ new Date(currentRecord.createdAt).toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ new Date(currentRecord.updatedAt).toLocaleString() }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/utils/api'

const loading = ref(false)
const records = ref([])
const detailVisible = ref(false)
const currentRecord = ref(null)

const searchForm = reactive({
  channelCode: '',
  phoneMd5: '',
  returnCode: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const getCollisionTagType = (result) => {
  if (!result) return 'info'
  if (result === 'NEW_USER' || result === 'OLD_USER') return 'success'
  if (result === 'REJECT') return 'danger'
  return 'info'
}

const loadRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    }
    
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })

    const res = await adminApi.getRecords(params)
    records.value = res.data.records || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('Load records failed:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.channelCode = ''
  searchForm.phoneMd5 = ''
  searchForm.returnCode = null
  pagination.page = 1
  loadRecords()
}

const viewDetail = (row) => {
  currentRecord.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadRecords()
})
</script>
