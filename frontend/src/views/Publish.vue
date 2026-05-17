<template>
  <div class="publish-page">
    <van-nav-bar title="发布" fixed>
      <template #right>
        <van-button type="primary" size="small" @click="submit" :loading="loading">发布</van-button>
      </template>
    </van-nav-bar>

    <div class="publish-content">
      <div class="type-selector">
        <van-button
          v-for="type in publishTypes"
          :key="type.value"
          :type="selectedType === type.value ? 'primary' : 'default'"
          size="small"
          @click="selectedType = type.value"
        >
          {{ type.label }}
        </van-button>
      </div>

      <van-field
        v-if="selectedType === 'question'"
        v-model="title"
        label="标题"
        placeholder="请输入问题标题"
        :border="false"
      />

      <van-field
        v-model="content"
        type="textarea"
        label="内容"
        placeholder="分享你的想法..."
        rows="6"
        :border="false"
        autosize
      />

      <van-field label="图片" :border="false">
        <template #input>
          <van-uploader v-model="images" multiple :max-count="9" preview-size="80px" />
        </template>
      </van-field>

      <van-field v-model="location" label="位置" placeholder="添加位置" :border="false">
        <template #left-icon>
          <van-icon name="location-o" />
        </template>
      </van-field>

      <van-field v-model="topics" label="话题" placeholder="添加话题，用逗号分隔" :border="false">
        <template #left-icon>
          <van-icon name="label-o" />
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import request from '@/utils/request'

const router = useRouter()

const publishTypes = [
  { label: '动态', value: 'post' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '提问', value: 'question' }
]

const selectedType = ref('post')
const title = ref('')
const content = ref('')
const location = ref('')
const topics = ref('')
const images = ref<any[]>([])
const loading = ref(false)

const submit = async () => {
  if (!content.value.trim()) {
    showToast('请输入内容')
    return
  }

  if (selectedType.value === 'question' && !title.value.trim()) {
    showToast('请输入标题')
    return
  }

  loading.value = true
  try {
    const imageUrls = images.value.map(img => img.url || img.objectURL).filter(Boolean)
    const topicList = topics.value ? topics.value.split(/[,，]/).map(t => t.trim()).filter(Boolean) : []

    if (selectedType.value === 'question') {
      await request.post('/questions', {
        title: title.value,
        content: content.value,
        images: imageUrls,
        topics: topicList
      })
    } else {
      await request.post('/posts', {
        content: content.value,
        images: imageUrls,
        video: selectedType.value === 'video' ? 'https://example.com/video.mp4' : undefined,
        location: location.value,
        topics: topicList
      })
    }

    showToast('发布成功')
    router.push('/community')
  } catch {
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.publish-page {
  padding-top: 46px;
  padding-bottom: 50px;
}

.publish-content {
  background: #fff;
}

.type-selector {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-bottom: 1px solid #eee;
}
</style>
