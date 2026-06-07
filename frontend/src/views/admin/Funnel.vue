<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">转化漏斗分析</h2>
      <p class="page-subtitle">从攻略浏览到下单的用户转化路径</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="card-shadow">
          <template #header>用户转化漏斗</template>
          <div ref="funnelChartRef" style="height: 450px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow">
          <template #header>流失归因分析</template>
          <div class="attrition-list">
            <div class="attrition-item" v-for="item in attritionData" :key="item.name">
              <div class="attrition-header flex-between">
                <span class="attrition-name">{{ item.name }}</span>
                <span class="attrition-rate">{{ item.rate }}%</span>
              </div>
              <el-progress :percentage="item.rate" :color="item.color" />
              <p class="attrition-desc">{{ item.desc }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" style="margin-top: 20px;">
      <template #header>渠道来源分析</template>
      <div ref="channelChartRef" style="height: 350px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'

const funnelChartRef = ref(null)
const channelChartRef = ref(null)

let funnelChart = null
let channelChart = null

const attritionData = [
  { name: '攻略浏览→注册', rate: 35, color: '#409EFF', desc: '主要原因：注册流程繁琐' },
  { name: '注册→完善资料', rate: 28, color: '#67C23A', desc: '主要原因：资料项过多' },
  { name: '完善资料→浏览商家', rate: 45, color: '#E6A23C', desc: '主要原因：推荐不精准' },
  { name: '浏览商家→下单', rate: 22, color: '#F56C6C', desc: '主要原因：价格敏感、对比犹豫' }
]

async function loadFunnelData() {
  try {
    const res = await api.get('/admin/funnel')
    const data = res.data
    initFunnelChart(data.funnelData || [
      { name: '攻略浏览', value: 10000 },
      { name: '用户注册', value: 6500 },
      { name: '完善资料', value: 4680 },
      { name: '浏览商家', value: 2574 },
      { name: '提交订单', value: 2008 },
      { name: '完成支付', value: 1566 }
    ])
    initChannelChart(data.channelData || [
      { name: '朋友圈广告', value: 3500 },
      { name: '小红书', value: 2800 },
      { name: '亲友推荐', value: 2100 },
      { name: '搜索引擎', value: 1200 },
      { name: '其他', value: 400 }
    ])
  } catch (e) {
    initFunnelChart([
      { name: '攻略浏览', value: 10000 },
      { name: '用户注册', value: 6500 },
      { name: '完善资料', value: 4680 },
      { name: '浏览商家', value: 2574 },
      { name: '提交订单', value: 2008 },
      { name: '完成支付', value: 1566 }
    ])
    initChannelChart([
      { name: '朋友圈广告', value: 3500 },
      { name: '小红书', value: 2800 },
      { name: '亲友推荐', value: 2100 },
      { name: '搜索引擎', value: 1200 },
      { name: '其他', value: 400 }
    ])
  }
}

function initFunnelChart(data) {
  funnelChart = echarts.init(funnelChartRef.value)
  funnelChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    series: [{
      type: 'funnel',
      left: '10%',
      top: 60,
      bottom: 60,
      width: '80%',
      min: 0,
      max: 10000,
      minSize: '0%',
      maxSize: '100%',
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside', formatter: '{b}\n{c}', fontSize: 14 },
      labelLine: { length: 10, lineStyle: { width: 1, type: 'solid' } },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      emphasis: { label: { fontSize: 16 } },
      data: data
    }]
  })
}

function initChannelChart(data) {
  channelChart = echarts.init(channelChartRef.value)
  channelChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '60%',
      center: ['50%', '50%'],
      data: data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  })
}

function handleResize() {
  funnelChart?.resize()
  channelChart?.resize()
}

onMounted(() => {
  loadFunnelData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  funnelChart?.dispose()
  channelChart?.dispose()
})
</script>

<style scoped lang="scss">
.attrition-list {
  .attrition-item {
    padding: 16px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .attrition-header {
      margin-bottom: 8px;
      
      .attrition-name {
        font-weight: 500;
        color: #303133;
      }
      
      .attrition-rate {
        font-weight: 600;
        color: #ff6b9d;
      }
    }
    
    .attrition-desc {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
