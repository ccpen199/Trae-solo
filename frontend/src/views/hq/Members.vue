<template>
  <div class="members">
    <el-card>
      <template #header>会员分析</template>
      <el-row :gutter="20">
        <el-col :span="8" v-for="l in memberData.by_level || []" :key="l.id">
          <el-card>
            <div class="level-stat">
              <div class="level-name">{{ l.name }}</div>
              <div class="count">{{ l.member_count }} 人</div>
              <div class="balance">总余额: ¥{{ (l.total_balance || 0).toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
    <el-card style="margin-top: 20px;">
      <template #header>消费TOP10会员</template>
      <el-table :data="memberData.top_members || []" border>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="level_name" label="等级" width="120" />
        <el-table-column prop="total_spend" label="消费金额(元)" width="150">
          <template #default="{row}">¥{{ row.total_spend?.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="transaction_count" label="交易次数" width="120" />
        <el-table-column prop="last_visit" label="最后访问" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { report } from '../../api'

const memberData = ref({})
onMounted(async () => {
  memberData.value = await report.memberAnalysis({ days: 30 })
})
</script>

<style scoped>
.level-stat { text-align: center; padding: 10px 0; }
.level-name { font-size: 18px; font-weight: bold; color: #409eff; margin-bottom: 10px; }
.level-stat .count { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
.level-stat .balance { color: #666; font-size: 12px; }
</style>
