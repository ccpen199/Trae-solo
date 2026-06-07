<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">区域婚策趋势</h2>
      <p class="page-subtitle">热门婚礼策划风格和区域热度分析</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>风格偏好趋势</template>
          <div ref="styleChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>区域热度排行</template>
          <div ref="regionChartRef" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" style="margin-top: 20px;">
      <template #header>月度订单趋势</template>
      <div ref="orderChartRef" style="height: 350px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import api from '@/api'

const styleChartRef = ref(null)
const regionChartRef = ref(null)
const orderChartRef = ref(null)

let styleChart = null
let regionChart = null
let orderChart = null

async function loadTrendData() {
  try {
    const res = await api.get('/admin/trends')
    const data = res.data
    
    initStyleChart(data.styleTrends)
    initRegionChart(data.regionTrends)
    initOrderChart(data.monthlyOrders)
  } catch (e) {
    initStyleChart([
      { name: 'ins风', value: 156 },
      { name: '中式传统', value: 132 },
      { name: '森系', value: 98 },
      { name: '极简', value: 87 },
      { name: '欧式', value: 76 }
    ])
    initRegionChart([
      { name: '朝阳区', value: 324 },
      { name: '海淀区', value: 286 },
      { name: '东城区', value: 198 },
      { name: '西城区', value: 176 },
      { name: '丰台区', value: 154 }
    ])
    initOrderChart(['1月', '2月', '3月', '4月', '5月', '6月'], [120, 132, 101, 134, 90, 230])
  }
}

function initStyleChart(data) {
  styleChart = echarts.init(styleChartRef.value)
  styleChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: data
    }]
  })
}

function initRegionChart(data) {
  regionChart = echarts.init(regionChartRef.value)
  regionChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map(d => d.name) },
    series: [{
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  })
}

function initOrderChart(months, data) {
  orderChart = echarts.init(orderChartRef.value)
  orderChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: months },
    yAxis: { type: 'value' },
    series: [{
      name: '订单量',
      type: 'line',
      smooth: true,
      data: data,
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(255, 107, 157, 0.5)' },
          { offset: 1, color: 'rgba(255, 107, 157, 0.05)' }
        ])
      },
      itemStyle: { color: '#ff6b9d' }
    }]
  })
}

function handleResize() {
  styleChart?.resize()
  regionChart?.resize()
  orderChart?.resize()
}

onMounted(() => {
  loadTrendData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  styleChart?.dispose()
  regionChart?.dispose()
  orderChart?.dispose()
})
</script>
