<template>
  <div class="coupons">
    <el-tabs v-model="status">
      <el-tab-pane label="可使用" name="available"></el-tab-pane>
      <el-tab-pane label="已使用" name="used"></el-tab-pane>
      <el-tab-pane label="已过期" name="expired"></el-tab-pane>
    </el-tabs>
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8" v-for="c in coupons" :key="c.id">
        <el-card class="coupon-card" shadow="hover">
          <div class="coupon-left">
            <div class="amount">
              <span v-if="c.type === 'fixed'">¥{{ c.value }}</span>
              <span v-else>{{ c.value }}折</span>
            </div>
            <div class="name">{{ c.name }}</div>
          </div>
          <div class="coupon-right">
            <div class="condition">满{{ c.min_amount }}元可用</div>
            <div class="date">{{ c.valid_from }} 至 {{ c.valid_to }}</div>
            <el-tag size="small" :type="c.status === 'available' ? 'success' : 'info'">
              {{ c.status === 'available' ? '可使用' : c.status === 'used' ? '已使用' : '已过期' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { member } from '../../api'

const status = ref('available')
const coupons = ref([])

const load = async () => {
  coupons.value = await member.getCoupons(status.value)
}
watch(status, load)
onMounted(load)
</script>

<style scoped>
.coupon-card { margin-bottom: 20px; }
.coupon-card :deep(.el-card__body) { display: flex; padding: 15px; }
.coupon-left { width: 40%; border-right: 2px dashed #e6e6e6; text-align: center; }
.coupon-left .amount { font-size: 36px; font-weight: bold; color: #f56c6c; }
.coupon-left .name { color: #666; margin-top: 5px; }
.coupon-right { width: 60%; padding-left: 15px; }
.coupon-right .condition { margin-bottom: 5px; }
.coupon-right .date { color: #999; font-size: 12px; margin-bottom: 10px; }
</style>
