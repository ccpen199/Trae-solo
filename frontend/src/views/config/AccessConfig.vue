<template>
  <div class="page-container">
    <div class="page-header">
      <span class="page-title">准入配置</span>
      <el-button type="primary" @click="saveConfig">
        <el-icon><Check /></el-icon>
        保存配置
      </el-button>
    </div>

    <el-card>
      <template #header>
        <span>未动用用户配置</span>
      </template>
      <el-form label-width="160px">
        <el-form-item label="未动用用户准入">
          <el-switch
            v-model="config.unUsedUserPass"
            active-text="通过"
            inactive-text="不通过"
          />
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>风控等级准入配置</span>
      </template>
      <el-form label-width="160px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="等级 A">
              <el-switch
                v-model="config.riskLevelAPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级 B">
              <el-switch
                v-model="config.riskLevelBPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级 C">
              <el-switch
                v-model="config.riskLevelCPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级 D">
              <el-switch
                v-model="config.riskLevelDPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级 E">
              <el-switch
                v-model="config.riskLevelEPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="等级 Z">
              <el-switch
                v-model="config.riskLevelZPass"
                active-text="通过"
                inactive-text="不通过"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>特殊情况配置</span>
      </template>
      <el-form label-width="160px">
        <el-form-item label="风控等级为空">
          <el-switch
            v-model="config.emptyLevelPass"
            active-text="通过"
            inactive-text="不通过"
          />
        </el-form-item>
        <el-form-item label="风控等级获取失败">
          <el-switch
            v-model="config.failedLevelPass"
            active-text="通过"
            inactive-text="不通过"
          />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/utils/api'

const config = reactive({
  unUsedUserPass: true,
  riskLevelAPass: true,
  riskLevelBPass: true,
  riskLevelCPass: true,
  riskLevelDPass: true,
  riskLevelEPass: true,
  riskLevelZPass: true,
  emptyLevelPass: true,
  failedLevelPass: true
})

const loadConfig = async () => {
  try {
    const res = await adminApi.getAccessConfig()
    Object.assign(config, res.data)
  } catch (error) {
    console.error('Load access config failed:', error)
  }
}

const saveConfig = async () => {
  try {
    await adminApi.updateAccessConfig(config)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onMounted(() => {
  loadConfig()
})
</script>
