<template>
  <div class="evidence-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div>
            <el-button type="info" size="small" @click="router.back()" style="margin-right: 12px;">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="page-title">证据管理</span>
          </div>
          <el-button 
            v-if="userStore.isLawyer" 
            type="primary" 
            @click="showUpload = true"
          >
            <el-icon><Upload /></el-icon>
            上传证据
          </el-button>
        </div>
      </template>
      
      <el-table :data="evidences" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="证据名称" min-width="200">
          <template #default="{ row }">
            <div class="evidence-title">
              <el-icon><Document /></el-icon>
              <span>{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="file_name" label="文件名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="uploader_name" label="上传人" width="100" />
        <el-table-column prop="hash" label="存证哈希" min-width="180">
          <template #default="{ row }">
            <el-text size="small" type="info">{{ row.hash?.substring(0, 16) }}...</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="上传时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="verifyEvidence(row)">
              验真
            </el-button>
            <el-button size="small" type="info" text>
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="!loading && evidences.length === 0" description="暂无证据" />
    </el-card>
    
    <el-dialog v-model="showUpload" title="上传证据" width="500px">
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="证据名称">
          <el-input v-model="uploadForm.title" placeholder="请输入证据名称" />
        </el-form-item>
        <el-form-item label="证据类型">
          <el-select v-model="uploadForm.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="书证" value="document" />
            <el-option label="物证" value="physical" />
            <el-option label="证人证言" value="testimony" />
            <el-option label="鉴定意见" value="expert" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            drag
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">支持图片、PDF、Word等格式文件</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="请输入证据描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">
          上传并存证
        </el-button>
      </template>
    </el-dialog>
    
    <el-dialog v-model="showVerify" title="证据验真结果" width="500px">
      <div v-if="verifyResult" class="verify-result">
        <el-result
          :icon="verifyResult.valid ? 'success' : 'error'"
          :title="verifyResult.valid ? '证据完整有效' : '证据已被篡改'"
          :sub-title="verifyResult.valid ? '证据文件未被修改，哈希值匹配' : '证据文件哈希值与存证记录不符'"
        >
          <template #extra>
            <div class="hash-info">
              <div class="hash-item">
                <span class="label">存证哈希：</span>
                <span class="value">{{ verifyResult.storedHash }}</span>
              </div>
              <div class="hash-item">
                <span class="label">当前哈希：</span>
                <span class="value" :class="{ 'hash-mismatch': !verifyResult.valid }">{{ verifyResult.currentHash }}</span>
              </div>
              <div class="hash-item">
                <span class="label">区块链交易ID：</span>
                <span class="value">{{ verifyResult.blockchainTxId }}</span>
              </div>
            </div>
          </template>
        </el-result>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { evidenceApi } from '../../api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const caseId = computed(() => route.params.id)
const loading = ref(false)
const uploading = ref(false)
const showUpload = ref(false)
const showVerify = ref(false)
const evidences = ref([])
const verifyResult = ref(null)
const uploadRef = ref(null)
const uploadForm = ref({
  title: '',
  type: 'document',
  description: '',
  file: null
})

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const handleFileChange = (file) => {
  uploadForm.value.file = file.raw
  if (!uploadForm.value.title) {
    uploadForm.value.title = file.name
  }
}

const loadEvidences = async () => {
  loading.value = true
  try {
    evidences.value = await evidenceApi.getList(caseId.value)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const submitUpload = async () => {
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  if (!uploadForm.value.title) {
    ElMessage.warning('请输入证据名称')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', uploadForm.value.file)
    formData.append('title', uploadForm.value.title)
    formData.append('type', uploadForm.value.type)
    formData.append('description', uploadForm.value.description)

    await evidenceApi.upload(caseId.value, formData)
    ElMessage.success('证据上传成功，已完成区块链存证')
    showUpload.value = false
    resetUploadForm()
    loadEvidences()
  } catch (e) {
    console.error(e)
  } finally {
    uploading.value = false
  }
}

const resetUploadForm = () => {
  uploadForm.value = {
    title: '',
    type: 'document',
    description: '',
    file: null
  }
  uploadRef.value?.clearFiles()
}

const verifyEvidence = async (row) => {
  try {
    verifyResult.value = await evidenceApi.verify(caseId.value, row.id)
    showVerify.value = true
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadEvidences()
})
</script>

<style scoped>
.evidence-page {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.evidence-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hash-info {
  text-align: left;
  padding: 0 20px;
}

.hash-item {
  display: flex;
  padding: 8px 0;
  font-size: 13px;
  font-family: monospace;
}

.hash-item .label {
  color: #909399;
  min-width: 120px;
}

.hash-item .value {
  color: #303133;
  word-break: break-all;
}

.hash-mismatch {
  color: #f56c6c !important;
}
</style>
