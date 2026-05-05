<template>
  <div class="home-page">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="banner-content">
        <h1 class="banner-title">🎉 营销活动中心</h1>
        <p class="banner-desc">参与活动，赢取丰厚奖品！</p>
      </div>
    </div>

    <!-- 活动入口卡片 -->
    <div class="activity-cards">
      <router-link to="/wheel" class="activity-card wheel-card">
        <div class="card-icon">
          <span class="icon-wheel">🎯</span>
        </div>
        <div class="card-info">
          <h3 class="card-title">幸运大转盘</h3>
          <p class="card-desc">转动转盘，赢取积分大奖</p>
          <div class="card-tags">
            <span class="tag">消耗积分</span>
            <span class="tag">概率可控</span>
          </div>
        </div>
        <div class="card-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </router-link>

      <router-link to="/egg" class="activity-card egg-card">
        <div class="card-icon">
          <span class="icon-egg">🥚</span>
        </div>
        <div class="card-info">
          <h3 class="card-title">欢乐砸金蛋</h3>
          <p class="card-desc">砸开金蛋，惊喜不断</p>
          <div class="card-tags">
            <span class="tag">低消耗</span>
            <span class="tag">高奖励</span>
          </div>
        </div>
        <div class="card-arrow">
          <el-icon><ArrowRight /></el-icon>
        </div>
      </router-link>
    </div>

    <!-- 规则说明 -->
    <div class="rules-section card">
      <div class="card-header">
        <h3 class="section-title">
          <el-icon><InfoFilled /></el-icon>
          活动规则
        </h3>
      </div>
      <div class="card-body">
        <div class="rules-list">
          <div class="rule-item">
            <div class="rule-num">1</div>
            <div class="rule-content">
              <h4>积分消耗</h4>
              <p>参与活动需要消耗相应积分，大转盘每次消耗10积分，砸金蛋每次消耗5积分</p>
            </div>
          </div>
          <div class="rule-item">
            <div class="rule-num">2</div>
            <div class="rule-content">
              <h4>抽奖机会</h4>
              <p>大转盘每日可参与3次，砸金蛋每日可参与5次，次数每日零点刷新</p>
            </div>
          </div>
          <div class="rule-item">
            <div class="rule-num">3</div>
            <div class="rule-content">
              <h4>概率说明</h4>
              <p>中奖概率由后台配置，奖品数量有限，先到先得</p>
            </div>
          </div>
          <div class="rule-item">
            <div class="rule-num">4</div>
            <div class="rule-content">
              <h4>奖品领取</h4>
              <p>积分类奖品自动到账，其他奖品需在"我的奖品"中领取</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-page {
  max-width: 900px;
  margin: 0 auto;
}

.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 48px 32px;
  margin-bottom: 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
  animation: rotate 20s linear infinite;
}

.banner-content {
  position: relative;
  z-index: 1;
}

.banner-title {
  color: white;
  font-size: 32px;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.banner-desc {
  color: rgba(255,255,255,0.9);
  font-size: 16px;
  margin: 0;
}

.activity-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.activity-card {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  text-decoration: none;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.activity-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 80px;
  height: 80px;
  opacity: 0.1;
  transition: all 0.3s ease;
}

.wheel-card::after {
  background: linear-gradient(135deg, #667eea, transparent);
  border-radius: 0 0 0 100%;
}

.egg-card::after {
  background: linear-gradient(135deg, #fa8c16, transparent);
  border-radius: 0 0 0 100%;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.activity-card:hover::after {
  opacity: 0.2;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  flex-shrink: 0;
}

.wheel-card .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.egg-card .card-icon {
  background: linear-gradient(135deg, #fa8c16 0%, #ff4d4f 100%);
}

.icon-wheel,
.icon-egg {
  font-size: 32px;
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
}

.card-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px 0;
}

.card-tags {
  display: flex;
  gap: 8px;
}

.tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  background: #f0f2ff;
  color: #667eea;
}

.egg-card .tag {
  background: #fff7e6;
  color: #fa8c16;
}

.card-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.3s ease;
}

.activity-card:hover .card-arrow {
  background: #667eea;
  color: white;
}

.egg-card:hover .card-arrow {
  background: #fa8c16;
}

.rules-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #333;
  margin: 0;
}

.rules-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.rule-item {
  display: flex;
  gap: 16px;
}

.rule-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.rule-content h4 {
  font-size: 15px;
  color: #333;
  margin: 0 0 6px 0;
}

.rule-content p {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 32px 20px;
  }
  
  .banner-title {
    font-size: 24px;
  }
  
  .activity-cards {
    grid-template-columns: 1fr;
  }
  
  .rules-list {
    grid-template-columns: 1fr;
  }
}
</style>
