<template>
  <div>
    <div style="margin-bottom: 10px; color: #666; font-size: 12px">
      📡 数据更新时间: {{ lastUpdateTime }} (每10秒自动刷新)
    </div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8" v-for="zone in zones" :key="zone.id">
        <el-card shadow="hover" :class="{ 'alert-card': hasOpenAlert(zone.id) }">
          <div style="text-align: center">
            <div style="font-size: 24px; font-weight: bold">{{ zone.name }}</div>
            <div style="font-size: 32px; color: #409EFF; margin: 10px 0; font-weight: bold">
              {{ getLatestTemp(zone.id) }}°C
            </div>
            <div style="color: #666; font-size: 12px">
              范围: {{ zone.min_temp }}°C ~ {{ zone.max_temp }}°C
            </div>
            <div style="color: #999; font-size: 11px; margin-top: 5px">
              更新: {{ getRecordTime(zone.id) }}
            </div>
            <el-tag v-if="hasOpenAlert(zone.id)" type="danger" style="margin-top: 10px">告警中</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-bottom: 20px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>温度趋势</span>
          <div>
            <el-select v-model="selectedZone" placeholder="选择温区" style="width: 150px; margin-right: 10px" @change="loadTrend">
              <el-option v-for="z in zones" :key="z.id" :label="z.name" :value="z.id" />
            </el-select>
            <el-select v-model="trendHours" style="width: 120px" @change="loadTrend">
              <el-option label="最近1小时" :value="1" />
              <el-option label="最近6小时" :value="6" />
              <el-option label="最近24小时" :value="24" />
            </el-select>
          </div>
        </div>
      </template>
      <div ref="chartRef" style="height: 300px"></div>
    </el-card>

    <el-card>
      <template #header>
        <span>温度告警</span>
      </template>
      <el-table :data="alerts" border size="small">
        <el-table-column prop="zone_name" label="温区" width="100" />
        <el-table-column prop="start_time" label="开始时间" width="160" />
        <el-table-column prop="end_time" label="结束时间" width="160" />
        <el-table-column prop="max_temp" label="最高温" width="90" />
        <el-table-column prop="min_temp" label="最低温" width="90" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'danger' : row.status === 'handled' ? 'success' : 'info'">
              {{ row.status === 'open' ? '处理中' : row.status === 'handled' ? '已处理' : '已恢复' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status === 'open'" size="small" type="primary" @click="handleAlert(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="handleDialogVisible" title="处理告警" width="600px">
      <el-form label-width="100px">
        <el-form-item label="影响库存">
          <el-table :data="affectedInventory" size="small" border>
            <el-table-column prop="batch_no" label="批次号" width="120" />
            <el-table-column prop="product_name" label="货品" />
            <el-table-column prop="available_quantity" label="数量" width="100" />
          </el-table>
        </el-form-item>
        <el-form-item label="处理措施">
          <el-input v-model="handlingMeasures" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { temperature, temperatureZones } from '../api'
import { ElMessage } from 'element-plus'

export default {
  name: 'Temperature',
  data() {
    return {
      zones: [],
      records: [],
      alerts: [],
      trendData: [],
      selectedZone: 1,
      trendHours: 24,
      chart: null,
      handleDialogVisible: false,
      handlingAlertId: null,
      handlingMeasures: '',
      affectedInventory: [],
      lastUpdateTime: new Date().toLocaleString(),
      timer: null
    }
  },
  mounted() {
    this.load()
    this.timer = setInterval(() => this.load(), 10000)
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    async load() {
      const [zoneRes, recRes, alertRes] = await Promise.all([
        temperatureZones.list(),
        temperature.records(),
        temperature.alerts()
      ])
      this.zones = zoneRes.data
      this.records = recRes.data
      this.alerts = alertRes.data
      this.lastUpdateTime = new Date().toLocaleString()
      if (!this.selectedZone && this.zones.length > 0) {
        this.selectedZone = this.zones[0].id
      }
      this.loadTrend()
    },
    async loadTrend() {
      const res = await temperature.trend({ zone_id: this.selectedZone, hours: this.trendHours })
      this.trendData = res.data
      this.renderChart()
    },
    getLatestTemp(zoneId) {
      const zoneRecords = this.records.filter(r => r.temperature_zone_id === zoneId)
      if (zoneRecords.length === 0) return '--'
      return zoneRecords[0].temperature
    },
    getRecordTime(zoneId) {
      const zoneRecords = this.records.filter(r => r.temperature_zone_id === zoneId)
      if (zoneRecords.length === 0) return '--'
      return zoneRecords[0].record_time?.slice(11, 19) || '--'
    },
    hasOpenAlert(zoneId) {
      return this.alerts.some(a => a.temperature_zone_id === zoneId && a.status === 'open')
    },
    renderChart() {
      this.$nextTick(() => {
        if (!this.$refs.chartRef) return
        if (this.chart) {
          this.chart.dispose()
        }
        this.chart = echarts.init(this.$refs.chartRef)
        const zone = this.zones.find(z => z.id === this.selectedZone)
        const option = {
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { 
            type: 'category', 
            data: this.trendData.map(d => d.time_bucket.slice(11, 16)),
            axisLabel: { rotate: 30 }
          },
          yAxis: { type: 'value' },
          series: [
            {
              name: '平均温度',
              type: 'line',
              data: this.trendData.map(d => d.avg_temp),
              smooth: true,
              lineStyle: { width: 2 },
              itemStyle: { color: '#409EFF' }
            },
            {
              name: '上限',
              type: 'line',
              data: this.trendData.map(() => zone?.max_temp || 0),
              lineStyle: { type: 'dashed', color: '#f56c6c' },
              symbol: 'none'
            },
            {
              name: '下限',
              type: 'line',
              data: this.trendData.map(() => zone?.min_temp || 0),
              lineStyle: { type: 'dashed', color: '#f56c6c' },
              symbol: 'none'
            }
          ]
        }
        this.chart.setOption(option)
        this.chart.resize()
      })
    },
    async handleAlert(row) {
      this.handlingAlertId = row.id
      this.handlingMeasures = ''
      const res = await temperature.handleAlert(row.id, { handling_measures: '' })
      this.affectedInventory = res.data.affected_inventory || []
      this.handleDialogVisible = true
    },
    async submitHandle() {
      await temperature.handleAlert(this.handlingAlertId, { handling_measures: this.handlingMeasures })
      this.handleDialogVisible = false
      this.load()
      ElMessage.success('处理完成')
    }
  }
}
</script>

<style scoped>
.alert-card {
  border: 2px solid #f56c6c;
}
</style>
