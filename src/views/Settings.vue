<template>
  <div class="settings-container">
    <van-nav-bar title="设置" left-text="返回" @click-left="goBack" />

    <div class="settings-content">
      <div class="settings-group">
        <div class="settings-item">
          <van-icon name="bell-o" class="item-icon" />
          <span class="item-text">消息通知</span>
          <van-switch v-model="notifications" />
        </div>
        <div class="settings-item">
          <van-icon name="volume-o" class="item-icon" />
          <span class="item-text">声音提醒</span>
          <van-switch v-model="sound" />
        </div>
        <div class="settings-item">
          <van-icon name="shield-o" class="item-icon" />
          <span class="item-text">隐私设置</span>
          <van-icon name="arrow-right" class="item-arrow" />
        </div>
      </div>

      <div class="settings-group">
        <div class="settings-item" @click="aboutApp">
          <van-icon name="info-o" class="item-icon" />
          <span class="item-text">关于我们</span>
          <van-icon name="arrow-right" class="item-arrow" />
        </div>
        <div class="settings-item" @click="helpCenter">
          <van-icon name="help-o" class="item-icon" />
          <span class="item-text">帮助中心</span>
          <van-icon name="arrow-right" class="item-arrow" />
        </div>
        <div class="settings-item" @click="feedback">
          <van-icon name="message-circle-o" class="item-icon" />
          <span class="item-text">意见反馈</span>
          <van-icon name="arrow-right" class="item-arrow" />
        </div>
      </div>

      <div class="version-info">
        <span>版本号: 1.0.0</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'

const router = useRouter()

const notifications = ref(true)
const sound = ref(true)

const goBack = () => {
  router.back()
}

const aboutApp = () => {
  showToast('关于我们')
}

const helpCenter = () => {
  showToast('帮助中心')
}

const feedback = () => {
  showToast('意见反馈')
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.settings-content {
  padding: 16px;
}

.settings-group {
  background: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.settings-item:last-child {
  border-bottom: none;
}

.item-icon {
  font-size: 20px;
  color: #666;
  margin-right: 12px;
}

.item-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.item-arrow {
  font-size: 16px;
  color: #ccc;
}

.version-info {
  text-align: center;
  padding: 24px;
  color: #999;
  font-size: 14px;
}
</style>
