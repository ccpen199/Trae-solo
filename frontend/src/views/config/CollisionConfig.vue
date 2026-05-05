<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">撞库配置</span>
      <el-button type="primary" @click="saveConfig">
        <el-icon><Check /></el-icon>
        保存配置
      </el-button>
    </div>

    <el-card>
      <template #header>
        <span>撞库参数配置</span>
      </template>
      <el-form label-width="160px" :model="config">
        <el-form-item label="黑名单有效期(天)">
          <el-input-number
            v-model="config.blacklistDays"
            :min="1"
            :max="365"
            :step="1"
          />
          <span style="margin-left: 10px; color: #909399;">天内的黑名单记录有效</span>
        </el-form-item>
        <el-form-item label="最小结清天数">
          <el-input-number
            v-model="config.minClearDays"
            :min="0"
            :max="365"
            :step="1"
          />
          <span style="margin-left: 10px; color: #909399;">结清时间超过此天数才准入</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>配置说明</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="黑名单有效期">
          <p>风控黑名单检查时，只检查此天数内的黑名单记录。超过此天数的黑名单记录将被忽略。</p>
          <p style="color: #909399; font-size: 12px; margin-top: 5px;">默认值：90 天</p>
        </el-descriptions-item>
        <el-descriptions-item label="最小结清天数">
          <p>已动用用户需要检查上一次结清时间是否超过此天数。如果结清时间不足，将判定为不通过。</p>
          <p style="color: #909399; font-size: 12px; margin-top: 5px;">默认值：30 天</p>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/utils/api'

const config = reactive({
  blacklistDays: 90,
  minClearDays: 30
})

const loadConfig = async () => {
  try {
    const res = await adminApi.getCollisionConfig()
    Object.assign(config, res.data)
  } catch (error) {
    console.error('Load collision config failed:', error)
  }
}

const saveConfig = async () => {
  try {
    await adminApi.updateCollisionConfig(config)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadConfig()
})
</script>
