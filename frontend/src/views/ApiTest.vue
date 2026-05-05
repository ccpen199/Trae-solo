<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">接口测试</span>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>测试参数</span>
          </template>
          <el-form :model="testForm" label-width="120px">
            <el-form-item label="手机号">
              <el-input v-model="testForm.phonePlain" placeholder="请输入手机号" />
              <el-button type="primary" link @click="generatePhoneMd5">生成MD5</el-button>
            </el-form-item>
            <el-form-item label="手机号MD5">
              <el-input v-model="testForm.phoneMd5" placeholder="手机号MD5" />
            </el-form-item>
            <el-form-item label="渠道号">
              <el-select v-model="testForm.channelCode" placeholder="请选择渠道号" style="width: 100%">
                <el-option
                  v-for="channel in channels"
                  :key="channel.id"
                  :label="`${channel.channelName} (${channel.channelCode})`"
                  :value="channel.channelCode"
                />
              </el-select>
              <el-button type="primary" link @click="loadChannels">刷新渠道</el-button>
            </el-form-item>
            <el-form-item label="产品ID">
              <el-input v-model="testForm.productId" placeholder="产品ID(可选，默认使用渠道绑定的产品)" />
            </el-form-item>
            <el-form-item label="加密用户数据">
              <el-input
                v-model="testForm.encryptedData"
                type="textarea"
                :rows="3"
                placeholder="加密用户数据(可选，JSON格式)"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="runFullProcess" :loading="loading">
                <el-icon><Connection /></el-icon>
                执行完整流程测试
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <span>签名工具</span>
          </template>
          <el-form label-width="100px">
            <el-form-item label="原始文本">
              <el-input v-model="signTool.text" placeholder="请输入待加密文本" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateMd5">生成MD5</el-button>
            </el-form-item>
            <el-form-item label="MD5结果" v-if="signTool.result">
              <el-input v-model="signTool.result" readonly />
              <el-button type="primary" link @click="copyToClipboard">复制</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>测试结果</span>
            <el-tag v-if="resultData" :type="resultData.code === 200 ? 'success' : 'danger'" style="margin-left: 10px;">
              {{ resultData.code === 200 ? '成功' : '失败' }}
            </el-tag>
          </template>
          
          <template v-if="!resultData">
            <el-empty description="请执行测试查看结果" />
          </template>

          <template v-else>
            <el-descriptions :column="1" border v-if="resultData.data">
              <el-descriptions-item label="返回码">
                <el-tag :type="resultData.code === 200 ? 'success' : 'danger'">
                  {{ resultData.code }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="返回消息">
                {{ resultData.message }}
              </el-descriptions-item>
              
              <template v-if="resultData.data.accessResult">
                <el-descriptions-item label="准入校验结果">
                  <el-tag :type="resultData.data.accessResult.result === 'PASS' ? 'success' : 'danger'">
                    {{ resultData.data.accessResult.result }}
                  </el-tag>
                  <span style="margin-left: 10px; color: #909399;">
                    {{ resultData.data.accessResult.message }}
                  </span>
                </el-descriptions-item>
              </template>

              <template v-if="resultData.data.collisionResult">
                <el-descriptions-item label="撞库结果">
                  <el-tag :type="resultData.data.collisionResult.code === 200 ? 'success' : 'danger'">
                    {{ resultData.data.collisionResult.result }}
                  </el-tag>
                  <span style="margin-left: 10px; color: #909399;">
                    {{ resultData.data.collisionResult.message }}
                  </span>
                </el-descriptions-item>
              </template>

              <template v-if="resultData.data.registerResult">
                <el-descriptions-item label="注册结果">
                  <el-tag :type="resultData.data.registerResult.code === 200 ? 'success' : 'warning'">
                    {{ resultData.data.registerResult.result }}
                  </el-tag>
                  <span style="margin-left: 10px; color: #909399;">
                    {{ resultData.data.registerResult.message }}
                  </span>
                </el-descriptions-item>
              </template>

              <el-descriptions-item label="用户类型" v-if="resultData.data.isOldUser !== null">
                <el-tag :type="resultData.data.isOldUser ? 'warning' : 'primary'">
                  {{ resultData.data.isOldUser ? '老用户' : '新用户' }}
                </el-tag>
              </el-descriptions-item>

              <el-descriptions-item label="下载链接" v-if="resultData.data.downloadUrl">
                <el-link :href="resultData.data.downloadUrl" target="_blank">
                  {{ resultData.data.downloadUrl }}
                </el-link>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider>原始响应</el-divider>
            <pre class="response-json">{{ JSON.stringify(resultData, null, 2) }}</pre>
          </template>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { collisionApi, adminApi } from '@/utils/api'

const loading = ref(false)
const channels = ref([])
const resultData = ref(null)

const testForm = reactive({
  phonePlain: '13800138000',
  phoneMd5: '',
  channelCode: '',
  productId: '',
  encryptedData: ''
})

const signTool = reactive({
  text: '',
  result: ''
})

const loadChannels = async () => {
  try {
    const res = await adminApi.getChannels()
    channels.value = res.data || []
    if (channels.value.length > 0 && !testForm.channelCode) {
      testForm.channelCode = channels.value[0].channelCode
    }
  } catch (error) {
    console.error('Load channels failed:', error)
  }
}

const generatePhoneMd5 = async () => {
  if (!testForm.phonePlain) {
    ElMessage.warning('请输入手机号')
    return
  }
  try {
    const res = await collisionApi.generateMd5(testForm.phonePlain)
    testForm.phoneMd5 = res.data.md5
  } catch (error) {
    ElMessage.error('生成MD5失败')
  }
}

const generateMd5 = async () => {
  if (!signTool.text) {
    ElMessage.warning('请输入待加密文本')
    return
  }
  try {
    const res = await collisionApi.generateMd5(signTool.text)
    signTool.result = res.data.md5
  } catch (error) {
    ElMessage.error('生成MD5失败')
  }
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(signTool.result)
  ElMessage.success('已复制到剪贴板')
}

const runFullProcess = async () => {
  if (!testForm.phoneMd5) {
    ElMessage.warning('请输入手机号MD5')
    return
  }
  if (!testForm.channelCode) {
    ElMessage.warning('请选择渠道号')
    return
  }

  loading.value = true
  resultData.value = null

  try {
    const params = {
      phoneMd5: testForm.phoneMd5,
      phonePlain: testForm.phonePlain,
      channelCode: testForm.channelCode
    }
    if (testForm.productId) {
      params.productId = testForm.productId
    }
    if (testForm.encryptedData) {
      params.encryptedData = testForm.encryptedData
    }

    const res = await collisionApi.fullProcess(params)
    resultData.value = res
    ElMessage.success('测试完成')
  } catch (error) {
    console.error('Test failed:', error)
    if (error.response?.data) {
      resultData.value = error.response.data
    }
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  testForm.phonePlain = '13800138000'
  testForm.phoneMd5 = ''
  testForm.productId = ''
  testForm.encryptedData = ''
  resultData.value = null
}

onMounted(() => {
  loadChannels()
})
</script>

<style scoped>
.response-json {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
