<template>
  <van-popup v-model:show="visible" position="bottom" :style="{ height: '300px' }">
    <div class="share-content">
      <div class="share-title">分享给好友</div>
      <div class="share-options">
        <div class="share-item" @click="shareTo('wechat')">
          <van-icon name="wechat" size="48" color="#07C160" />
          <span>微信好友</span>
        </div>
        <div class="share-item" @click="shareTo('wechat-moments')">
          <van-icon name="friends-o" size="48" color="#07C160" />
          <span>朋友圈</span>
        </div>
        <div class="share-item" @click="shareTo('qq')">
          <van-icon name="qq" size="48" color="#12B7F5" />
          <span>QQ好友</span>
        </div>
        <div class="share-item" @click="copyLink">
          <van-icon name="link" size="48" color="#999" />
          <span>复制链接</span>
        </div>
      </div>
      <div class="share-cancel" @click="close">取消</div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref } from 'vue'
import { Popup, Icon, showToast } from 'vant'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  shareUrl: {
    type: String,
    default: ''
  },
  shareTitle: {
    type: String,
    default: '盒马鲜生'
  }
})

const emit = defineEmits(['update:show'])

const visible = ref(props.show)

const shareTo = (platform) => {
  const platforms = {
    'wechat': '微信',
    'wechat-moments': '朋友圈',
    'qq': 'QQ'
  }
  showToast(`正在打开${platforms[platform]}...`)
  close()
}

const copyLink = async () => {
  const url = props.shareUrl || window.location.href
  try {
    await navigator.clipboard.writeText(url)
    showToast('链接已复制')
    close()
  } catch (err) {
    showToast('复制失败')
  }
}

const close = () => {
  emit('update:show', false)
}
</script>

<style scoped>
.share-content {
  padding: 20px;
}

.share-title {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
}

.share-options {
  display: flex;
  justify-content: space-around;
}

.share-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.share-item span {
  font-size: 14px;
  color: #666;
}

.share-cancel {
  margin-top: 30px;
  padding: 15px;
  text-align: center;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 16px;
  color: #333;
}
</style>