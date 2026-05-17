<template>
  <div class="page-container">
    <van-nav-bar title="分享卡片" left-arrow @click-left="$router.back()" />

    <div class="page-content share-content" v-loading="loading">
      <div class="card-preview" :style="{ background: selectedStyle.bg }">
        <div class="card-excerpt" :style="{ color: selectedStyle.text, fontSize: fontSizePx }">{{ poem?.excerpt }}</div>
        <div class="card-author" :style="{ color: selectedStyle.text }">
          「{{ poem?.title }}」 - {{ poem?.author }}
        </div>
        <div class="card-footer" :style="{ color: selectedStyle.text }">
          来自「西窗烛」
        </div>
      </div>

      <div class="settings-section">
        <h3>卡片样式</h3>
        <div class="style-options">
          <div
            v-for="(style, index) in styles"
            :key="index"
            class="style-option"
            :class="{ active: selectedIndex === index }"
            :style="{ background: style.bg }"
            @click="selectedIndex = index"
          >
            <span :style="{ color: style.text }">样式 {{ index + 1 }}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3>字体大小</h3>
        <van-slider v-model="fontSize" :min="14" :max="28" />
        <div class="size-preview">当前大小: {{ fontSize }}px</div>
      </div>
    </div>

    <div class="share-actions">
      <div class="share-platforms">
        <div class="platform-item" @click="copyLink">
          <van-icon name="link" size="24" color="#8b5a2b" />
          <span>复制链接</span>
        </div>
        <div class="platform-item" @click="shareToWechat">
          <van-icon name="wechat" size="24" color="#07c160" />
          <span>微信</span>
        </div>
        <div class="platform-item" @click="shareToWeibo">
          <van-icon name="weibo-circle" size="24" color="#e6162d" />
          <span>微博</span>
        </div>
        <div class="platform-item" @click="nativeShare">
          <van-icon name="share-o" size="24" color="#1989fa" />
          <span>更多</span>
        </div>
      </div>
      <van-button type="primary" block @click="handleSave">
        <van-icon name="photo-o" size="16" /> 保存到相册
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showDialog } from 'vant'
import { poemsApi } from '@/api'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const poem = ref(null)
const selectedIndex = ref(0)
const fontSize = ref(20)

const fontSizePx = computed(() => fontSize.value + 'px')

const styles = [
  { bg: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', text: '#333' },
  { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
  { bg: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)', text: '#fff' }
]

const selectedStyle = computed(() => styles[selectedIndex.value])

const shareUrl = computed(() => {
  if (poem.value) {
    return `${window.location.origin}/poem/${poem.value.id}`
  }
  return window.location.href
})

const shareText = computed(() => {
  if (poem.value) {
    return `${poem.value.excerpt}\n「${poem.value.title}」 - ${poem.value.author}\n来自「西窗烛」`
  }
  return '来自「西窗烛」的诗词分享'
})

const loadPoem = async () => {
  if (!route.query.poemId) return

  loading.value = true
  try {
    const res = await poemsApi.getPoem(route.query.poemId)
    poem.value = res.data
  } catch (e) {
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  showToast('已保存到相册')
}

const copyLink = () => {
  const text = `${shareText.value}\n${shareUrl.value}`
  navigator.clipboard.writeText(text).then(() => {
    showToast('链接已复制')
  }).catch(() => {
    showToast('复制失败，请手动复制')
  })
}

const shareToWechat = () => {
  showDialog({
    title: '分享到微信',
    message: '请复制链接后在微信中粘贴分享',
    confirmButtonText: '复制链接'
  }).then(() => {
    copyLink()
  }).catch(() => {})
}

const shareToWeibo = () => {
  const url = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl.value)}&title=${encodeURIComponent(shareText.value)}`
  window.open(url, '_blank')
  showToast('正在跳转到微博')
}

const nativeShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: '西窗烛 - 诗词分享',
        text: shareText.value,
        url: shareUrl.value
      })
      showToast('分享成功')
    } catch (e) {
      if (e.name !== 'AbortError') {
        copyLink()
      }
    }
  } else {
    showDialog({
      title: '分享',
      message: '您的浏览器不支持原生分享，请选择复制链接',
      confirmButtonText: '复制链接'
    }).then(() => {
      copyLink()
    }).catch(() => {})
  }
}

onMounted(() => {
  loadPoem()
})
</script>

<style lang="less" scoped>
.share-content {
  padding: 20px;
  padding-bottom: 180px;
}

.card-preview {
  border-radius: 16px;
  padding: 60px 24px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

  .card-excerpt {
    line-height: 1.8;
    text-align: center;
    margin-bottom: 40px;
    font-weight: 500;
    letter-spacing: 2px;
  }

  .card-author {
    text-align: center;
    font-size: 14px;
    opacity: 0.8;
  }

  .card-footer {
    text-align: center;
    font-size: 12px;
    margin-top: 30px;
    opacity: 0.6;
  }
}

.settings-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  h3 {
    font-size: 14px;
    color: #333;
    margin-bottom: 16px;
    font-weight: 600;
  }

  .style-options {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;

    .style-option {
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;

      &.active {
        border-color: #8b5a2b;
        transform: scale(1.05);
      }
    }
  }

  .size-preview {
    text-align: center;
    margin-top: 12px;
    font-size: 12px;
    color: #666;
  }
}

.share-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #eee;
}

.share-platforms {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;

  .platform-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    span {
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
