<template>
  <div class="page-container">
    <van-nav-bar title="发布" left-arrow @click-left="$router.back()">
      <template #right>
        <van-button type="primary" size="small" plain @click="handleSubmit" :loading="loading">
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <div class="page-content create-content">
      <van-field
        v-model="formData.title"
        label="标题"
        placeholder="请输入标题"
        maxlength="50"
        :rules="[{ required: true, message: '请输入标题' }]"
      />

      <van-field
        v-model="formData.channelId"
        label="频道"
        readonly
        is-link
        placeholder="请选择频道"
        @click="showChannelPicker = true"
        :rules="[{ required: true, message: '请选择频道' }]"
      />

      <van-field
        v-model="formData.content"
        type="textarea"
        label="内容"
        placeholder="请输入内容"
        rows="8"
        maxlength="2000"
        :rules="[{ required: true, message: '请输入内容' }]"
        autosize
      />
    </div>

    <van-popup v-model:show="showChannelPicker" position="bottom" round>
      <van-picker
        :columns="channelColumns"
        @confirm="onChannelConfirm"
        @cancel="showChannelPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { communityApi } from '@/api'

const router = useRouter()

const loading = ref(false)
const showChannelPicker = ref(false)
const channels = ref([])
const formData = ref({
  title: '',
  channelId: '',
  content: '',
  images: []
})

const channelColumns = computed(() => {
  return channels.value.map(c => ({ text: c.name, value: c.id }))
})

const loadChannels = async () => {
  try {
    const res = await communityApi.getChannels()
    channels.value = res.data || []
  } catch (e) {}
}

const onChannelConfirm = ({ selectedOptions }) => {
  formData.value.channelId = selectedOptions[0].value
  showChannelPicker.value = false
}

const handleSubmit = async () => {
  if (!formData.value.title) {
    showToast('请输入标题')
    return
  }
  if (!formData.value.channelId) {
    showToast('请选择频道')
    return
  }
  if (!formData.value.content) {
    showToast('请输入内容')
    return
  }

  loading.value = true
  try {
    await communityApi.createPost(formData.value)
    showToast('发布成功')
    router.back()
  } catch (e) {
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadChannels()
})
</script>

<style lang="less" scoped>
.create-content {
  padding: 12px;
}
</style>
