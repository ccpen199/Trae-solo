<template>
  <div class="home">
    <div class="header">
      <div class="logo">⛽ 加油站会员系统</div>
      <div class="nav">
        <el-button type="primary" @click="$router.push('/login?type=member')">会员登录</el-button>
        <el-button @click="$router.push('/login?type=staff')">员工登录</el-button>
        <el-button type="success" @click="$router.push('/register')">注册会员</el-button>
      </div>
    </div>
    <div class="hero">
      <h1>智慧加油站 · 会员服务平台</h1>
      <p>一站式加油、储值、积分、发票，会员专享优惠</p>
      <div class="features">
        <div class="feature"><el-icon size="40"><Coin /></el-icon><span>储值优惠</span></div>
        <div class="feature"><el-icon size="40"><Discount /></el-icon><span>会员折扣</span></div>
        <div class="feature"><el-icon size="40"><Medal /></el-icon><span>积分兑换</span></div>
        <div class="feature"><el-icon size="40"><Document /></el-icon><span>电子发票</span></div>
      </div>
    </div>
    <div class="stations">
      <h2>合作油站</h2>
      <el-row :gutter="20">
        <el-col :span="12" v-for="s in stations" :key="s.id">
          <el-card shadow="hover">
            <h3>{{ s.name }}</h3>
            <p><el-icon><Location /></el-icon> {{ s.address }}</p>
            <el-button type="primary" link @click="$router.push('/login?type=member')">前往加油</el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { station } from '../api'
import { Coin, Discount, Medal, Document, Location } from '@element-plus/icons-vue'

const stations = ref([])
onMounted(async () => {
  try {
    stations.value = await station.list()
  } catch (e) {
    stations.value = [{ id: 1, name: '中心加油站', address: '北京市朝阳区建国路88号' }]
  }
})
</script>

<style scoped>
.home { min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; padding: 20px 50px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0.1); }
.logo { font-size: 24px; font-weight: bold; color: #409eff; }
.nav { display: flex; gap: 10px; }
.hero { text-align: center; padding: 80px 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.hero h1 { font-size: 48px; margin-bottom: 20px; }
.hero p { font-size: 20px; margin-bottom: 40px; }
.features { display: flex; justify-content: center; gap: 60px; }
.feature { display: flex; flex-direction: column; align-items: center; gap: 10px; font-size: 18px; }
.stations { max-width: 1200px; margin: 60px auto; padding: 0 20px; }
.stations h2 { margin-bottom: 30px; font-size: 28px; }
.stations h3 { margin-bottom: 10px; }
.stations p { color: #666; margin-bottom: 15px; }
</style>
