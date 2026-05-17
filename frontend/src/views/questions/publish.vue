<template>
  <div class="publish-page">
    <van-nav-bar title="发布问题" left-arrow @click-left="$router.back()" />
    
    <div class="form-container">
      <van-cell-group inset>
        <van-field
          v-model="form.title"
          name="title"
          label="标题"
          placeholder="请输入问题标题"
          :rules="[{ required: true, message: '请输入标题' }]"
          maxlength="100"
          show-word-limit
        />
        <van-field
          v-model="form.content"
          name="content"
          label="详情"
          type="textarea"
          placeholder="请详细描述你的问题"
          :rules="[{ required: true, message: '请输入问题详情' }]"
          :autosize="{ minHeight: 120 }"
          maxlength="1000"
          show-word-limit
        />
        <van-field
          v-model="form.category"
          is-link
          readonly
          name="category"
          label="分类"
          placeholder="请选择分类"
          @click="showCategoryPicker = true"
        />
      </van-cell-group>
      
      <div style="margin: 24px 16px;">
        <van-button round block type="primary" size="large" @click="handleSubmit" :loading="loading">
          发布问题
        </van-button>
      </div>
    </div>
    
    <van-popup v-model:show="showCategoryPicker" position="bottom">
      <van-picker
        :columns="categories"
        @confirm="onConfirmCategory"
        @cancel="showCategoryPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'

const router = useRouter()

const loading = ref(false)
const showCategoryPicker = ref(false)
const categories = ['健康', '饲养', '行为', '训练', '美容', '其他']

const form = ref({
  title: '',
  content: '',
  category: ''
})

const onConfirmCategory = ({ selectedOptions }) => {
  form.value.category = selectedOptions[0].text
  showCategoryPicker.value = false
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    showToast('请输入标题')
    return
  }
  if (!form.value.content.trim()) {
    showToast('请输入问题详情')
    return
  }
  
  loading.value = true
  try {
    await request.post('/questions', form.value)
    showToast('发布成功')
    router.back()
  } catch (error) {
    console.error('发布失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.form-container {
  padding-top: 12px;
}
</style>
