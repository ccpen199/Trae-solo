<template>
  <div class="scan-container">
    <van-nav-bar title="扫码" left-text="返回" @click-left="goBack" />
    
    <div class="scan-content">
      <div class="scan-box">
        <div class="scan-frame">
          <div class="corner top-left"></div>
          <div class="corner top-right"></div>
          <div class="corner bottom-left"></div>
          <div class="corner bottom-right"></div>
        </div>
        <div class="scan-line"></div>
      </div>
      
      <div class="scan-tips">
        <p>将商品条码/二维码对准扫描框</p>
      </div>
      
      <div class="scan-actions">
        <van-button type="default" icon="image" @click="selectImage">相册选择</van-button>
        <van-button type="primary" icon="flash" @click="toggleFlash">闪光灯</van-button>
      </div>
      
      <div class="manual-input">
        <van-field 
          v-model="barcode" 
          placeholder="手动输入条码" 
          @confirm="searchBarcode"
        />
        <van-button type="primary" @click="searchBarcode">搜索</van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Button, Field, showToast } from 'vant'
import { productApi } from '../services/api'

const router = useRouter()
const barcode = ref('')
const flashOn = ref(false)

const goBack = () => {
  router.back()
}

const selectImage = () => {
  showToast('相册功能开发中')
}

const toggleFlash = () => {
  flashOn.value = !flashOn.value
  showToast(flashOn.value ? '闪光灯已开启' : '闪光灯已关闭')
}

const searchBarcode = () => {
  if (!barcode.value.trim()) {
    showToast('请输入条码')
    return
  }
  
  productApi.searchByBarcode(barcode.value).then(res => {
    if (res.code === 200) {
      router.push(`/product/${res.data.id}`)
    } else {
      showToast('未找到该商品')
    }
  }).catch(() => {
    showToast('搜索失败')
  })
}
</script>

<style scoped>
.scan-container {
  min-height: 100vh;
  background: #1a1a1a;
}

.scan-content {
  padding: 20px;
}

.scan-box {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 50px auto;
}

.scan-frame {
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid #ff6b6b;
}

.corner.top-left {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}

.corner.top-right {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}

.corner.bottom-left {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
}

.corner.bottom-right {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 10px;
  right: 10px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #ff6b6b, transparent);
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 10px; }
  100% { top: calc(100% - 13px); }
}

.scan-tips {
  text-align: center;
  color: #999;
  margin-bottom: 30px;
}

.scan-actions {
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
}

.scan-actions .van-button {
  flex: 1;
}

.manual-input {
  display: flex;
  gap: 10px;
}

.manual-input .van-field {
  flex: 1;
  background: white;
}
</style>