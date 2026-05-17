<template>
  <div class="create-planet-container">
    <el-header class="header-bar">
      <div class="header-content">
        <el-button :icon="ArrowLeft" text @click="goBack">返回</el-button>
        <h1 class="page-title">创建星球</h1>
      </div>
    </el-header>

    <el-main class="main-content">
      <el-steps :active="1" class="steps-bar">
        <el-step title="基本信息" description="设置星球名称和介绍" />
        <el-step title="加入设置" description="设置加入方式和费用" />
      </el-steps>

      <el-card v-loading="submitting">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
          <el-form-item label="星球名称" prop="name">
            <el-input v-model="form.name" placeholder="请输入星球名称" maxlength="50" show-word-limit />
          </el-form-item>

          <el-form-item label="星球介绍" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="请输入星球介绍，让大家了解这个星球"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item label="加入方式" prop="join_type">
            <el-radio-group v-model="form.join_type">
              <el-radio value="free">免费加入</el-radio>
              <el-radio value="paid">付费加入</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.join_type === 'paid'" label="加入费用" prop="price">
            <el-input-number v-model="form.price" :min="1" :max="9999" />
            <span class="text-note">元/人</span>
          </el-form-item>

          <el-form-item label="邀请奖励" prop="invite_reward">
            <el-input-number v-model="form.invite_reward" :min="0" :max="999" />
            <span class="text-note">元/成功邀请</span>
            <div class="tip-text">当有人通过邀请链接加入时，邀请者将获得此奖励</div>
          </el-form-item>

          <el-form-item label="公开性" prop="is_public">
            <el-switch v-model="form.is_public" active-text="公开" inactive-text="私密" />
            <div class="tip-text">公开星球会在发现页展示，所有人都可以看到</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" @click="handleSubmit" :loading="submitting">
              创建星球
            </el-button>
            <el-button size="large" @click="goBack" style="margin-left: 12px">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createPlanet } from '@/api/planet'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  name: '',
  description: '',
  join_type: 'free',
  price: 0,
  invite_reward: 0,
  is_public: 1
})

const rules = {
  name: [
    { required: true, message: '请输入星球名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '介绍不能超过 500 个字符', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const res = await createPlanet(form)

    ElMessage.success('星球创建成功')
    router.push(`/planet/${res.data.id}`)
  } catch (error) {
    console.error('创建星球失败:', error)
  } finally {
    submitting.value = false
  }
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.create-planet-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header-bar {
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0 24px;
  height: 64px;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 100%;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 0 16px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

.steps-bar {
  margin-bottom: 32px;
}

.text-note {
  color: #909399;
  margin-left: 8px;
}

.tip-text {
  color: #909399;
  font-size: 13px;
  margin-top: 4px;
}
</style>
