<template>
  <div class="guide-page">
    <van-swipe 
      class="guide-swipe" 
      :show-indicators="true"
      indicator-color="#667eea"
    >
      <van-swipe-item>
        <div class="guide-slide">
          <div class="guide-image">
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20furniture%20showroom%20elegant%20interior%20design%203d%20rendering&image_size=landscape_16_9" 
              alt="海量家具"
            />
          </div>
          <div class="guide-content">
            <h2 class="guide-title">海量家具任选</h2>
            <p class="guide-desc">
              汇集国内外知名品牌，数万款优质家具<br/>
              沙发、床、餐桌、柜子，一站式购齐
            </p>
          </div>
        </div>
      </van-swipe-item>
      
      <van-swipe-item>
        <div class="guide-slide">
          <div class="guide-image">
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=virtual%20reality%20home%20design%203d%20visualization%20technology&image_size=landscape_16_9" 
              alt="VR预览"
            />
          </div>
          <div class="guide-content">
            <h2 class="guide-title">VR沉浸式体验</h2>
            <p class="guide-desc">
              360°全景查看每一件家具<br/>
              身临其境感受摆放效果，装修不踩坑
            </p>
          </div>
        </div>
      </van-swipe-item>
      
      <van-swipe-item>
        <div class="guide-slide">
          <div class="guide-image">
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20interior%20designer%20planning%20living%20room%20layout&image_size=landscape_16_9" 
              alt="空间搭配"
            />
          </div>
          <div class="guide-content">
            <h2 class="guide-title">专业空间搭配</h2>
            <p class="guide-desc">
              资深设计师精心搭配方案<br/>
              北欧、美式、日式、现代，风格自由切换
            </p>
          </div>
        </div>
      </van-swipe-item>
      
      <van-swipe-item>
        <div class="guide-slide">
          <div class="guide-image">
            <img 
              src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=community%20platform%20home%20renovation%20tips%20sharing&image_size=landscape_16_9" 
              alt="社区交流"
            />
          </div>
          <div class="guide-content">
            <h2 class="guide-title">社区互动交流</h2>
            <p class="guide-desc">
              装修攻略、避坑指南、真实评价<br/>
              与业主、设计师一起探讨装修心得
            </p>
          </div>
          
          <van-button 
            type="primary" 
            size="large" 
            round
            class="start-btn"
            @click="goToHome"
          >
            开始体验
          </van-button>
        </div>
      </van-swipe-item>
    </van-swipe>
    
    <van-button 
      type="default" 
      size="small" 
      round
      class="skip-btn"
      @click="goToHome"
      v-if="currentStep < 3"
    >
      跳过
    </van-button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref(0)

const goToHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.guide-page {
  height: 100vh;
  width: 100%;
  background: #fff;
  position: relative;
}

.guide-swipe {
  height: 100%;
}

.guide-slide {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 60px 24px 100px;
  box-sizing: border-box;
}

.guide-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.guide-image img {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.guide-content {
  text-align: center;
  margin-top: 40px;
}

.guide-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin: 0 0 16px;
}

.guide-desc {
  font-size: 15px;
  color: #666;
  line-height: 1.8;
  margin: 0;
}

.start-btn {
  margin-top: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
}

.skip-btn {
  position: absolute;
  top: 50px;
  right: 24px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #666;
}

:deep(.van-swipe__indicators) {
  bottom: 80px;
}
</style>
