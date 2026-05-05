<template>
  <div class="home-page">
    <section class="hero-section">
      <div class="container">
        <div class="hero-content">
          <h1>标准化套餐系统</h1>
          <p>为您提供一站式家装解决方案</p>
          <p class="sub-text">多种套餐可选 · 价格透明 · 品质保证</p>
          <div class="hero-actions">
            <router-link to="/packages">
              <el-button type="primary" size="large">
                浏览套餐
              </el-button>
            </router-link>
            <router-link to="/accessories">
              <el-button size="large">
                配件商城
              </el-button>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <h2 class="section-title">为什么选择我们</h2>
        <div class="features-grid">
          <div class="feature-card">
            <el-icon :size="48" color="#667eea"><PriceTag /></el-icon>
            <h3>价格透明</h3>
            <p>明码标价，无隐藏费用，套餐属性与价格实时联动</p>
          </div>
          <div class="feature-card">
            <el-icon :size="48" color="#764ba2"><Trophy /></el-icon>
            <h3>品质保证</h3>
            <p>精选优质建材，严格质检流程，让您放心装修</p>
          </div>
          <div class="feature-card">
            <el-icon :size="48" color="#f093fb"><Odometer /></el-icon>
            <h3>全程跟踪</h3>
            <p>订单进度实时更新，合同打印一键生成</p>
          </div>
          <div class="feature-card">
            <el-icon :size="48" color="#4facfe"><ChatDotRound /></el-icon>
            <h3>用户口碑</h3>
            <p>真实用户评价，让您了解真实使用体验</p>
          </div>
        </div>
      </div>
    </section>

    <section class="packages-section">
      <div class="container">
        <h2 class="section-title">热门套餐</h2>
        <div class="packages-grid" v-loading="loading">
          <div class="package-card" v-for="pkg in packages" :key="pkg.id">
            <div class="package-image">
              <el-image 
                :src="pkg.coverImage || 'https://picsum.photos/300/200?random=' + pkg.id"
                :fit="cover"
                fit="cover"
              />
              <div class="package-category">{{ pkg.category || '基础套餐' }}</div>
            </div>
            <div class="package-info">
              <h3>{{ pkg.name }}</h3>
              <p class="package-desc">{{ pkg.description || '精选优质建材，打造舒适家居环境' }}</p>
              <div class="package-footer">
                <div class="package-price">
                  <span class="price">
                    <span class="currency">¥</span>
                    <span class="amount">{{ pkg.basePrice }}</span>
                    <span class="unit">/㎡</span>
                  </span>
                </div>
                <router-link :to="'/packages/' + pkg.id">
                  <el-button type="primary">查看详情</el-button>
                </router-link>
              </div>
            </div>
          </div>
        </div>
        <div class="section-actions" v-if="packages.length > 0">
          <router-link to="/packages">
            <el-button type="primary" size="large">查看全部套餐</el-button>
          </router-link>
        </div>
      </div>
    </section>

    <section class="process-section">
      <div class="container">
        <h2 class="section-title">装修流程</h2>
        <div class="process-steps">
          <div class="step">
            <div class="step-number">1</div>
            <h3>选择套餐</h3>
            <p>浏览多种套餐，选择适合您的装修方案</p>
          </div>
          <div class="step-arrow">
            <el-icon :size="32"><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">2</div>
            <h3>填写信息</h3>
            <p>填写房屋信息和个人资料，生成个性化方案</p>
          </div>
          <div class="step-arrow">
            <el-icon :size="32"><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">3</div>
            <h3>选择配件</h3>
            <p>自由搭配家具配件，打造专属家居风格</p>
          </div>
          <div class="step-arrow">
            <el-icon :size="32"><ArrowRight /></el-icon>
          </div>
          <div class="step">
            <div class="step-number">4</div>
            <h3>确认订单</h3>
            <p>确认订单明细，生成合同并签约</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { packageApi } from '@/api/package'

const loading = ref(false)
const packages = ref([])

const fetchPackages = async () => {
  loading.value = true
  try {
    const result = await packageApi.getList({ pageSize: 4 })
    packages.value = result.data.list || []
  } catch (error) {
    console.error('获取套餐列表失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPackages()
})
</script>

<style scoped>
.home-page {
  flex: 1;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  padding: 100px 0;
  color: #fff;
  text-align: center;
}

.hero-content h1 {
  font-size: 48px;
  margin-bottom: 20px;
  font-weight: bold;
}

.hero-content p {
  font-size: 20px;
  margin-bottom: 10px;
  opacity: 0.95;
}

.hero-content .sub-text {
  font-size: 16px;
  opacity: 0.85;
  margin-bottom: 40px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.features-section {
  padding: 80px 0;
  background: #fff;
}

.section-title {
  text-align: center;
  font-size: 32px;
  margin-bottom: 50px;
  color: #333;
  font-weight: bold;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.feature-card {
  text-align: center;
  padding: 30px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.feature-card h3 {
  margin: 20px 0 10px;
  font-size: 18px;
  color: #333;
}

.feature-card p {
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.packages-section {
  padding: 80px 0;
  background: #f5f5f5;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

.package-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.package-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

.package-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.package-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.package-category {
  position: absolute;
  top: 10px;
  left: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
}

.package-info {
  padding: 20px;
}

.package-info h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.package-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.package-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.package-price {
  display: flex;
  align-items: baseline;
}

.package-price .currency {
  font-size: 14px;
  color: #f56c6c;
  font-weight: bold;
}

.package-price .amount {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
}

.package-price .unit {
  font-size: 12px;
  color: #999;
  margin-left: 2px;
}

.section-actions {
  text-align: center;
  margin-top: 40px;
}

.process-section {
  padding: 80px 0;
  background: #fff;
}

.process-steps {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 20px;
}

.step {
  text-align: center;
  max-width: 200px;
}

.step-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin: 0 auto 20px;
}

.step h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.step p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.step-arrow {
  display: flex;
  align-items: center;
  margin-top: 20px;
  color: #667eea;
}

@media (max-width: 1200px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .packages-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 32px;
  }
  .features-grid {
    grid-template-columns: 1fr;
  }
  .packages-grid {
    grid-template-columns: 1fr;
  }
  .process-steps {
    flex-direction: column;
    align-items: center;
  }
  .step-arrow {
    transform: rotate(90deg);
  }
}
</style>
