<template>
  <div class="fuel">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card>
          <template #header>加油收银</template>
          <el-form :model="form" label-width="100px">
            <el-form-item label="油枪">
              <el-select v-model="form.nozzle_id" placeholder="请选择油枪" @change="onNozzleChange">
                <el-option v-for="n in nozzles" :key="n.id" :label="n.nozzle_number + ' - ' + n.fuel_type_name" :value="n.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="加油升数">
              <el-input-number v-model="form.volume" :min="1" :precision="2" :step="1" size="large" style="width: 200px;" />
              <span style="margin-left: 10px; color: #999;">L</span>
            </el-form-item>
            <el-form-item label="会员手机号">
              <el-input v-model="form.member_phone" placeholder="输入会员手机号（选填）" @blur="onMemberBlur" style="width: 250px;" />
              <el-button type="primary" link @click="searchMember">查询会员</el-button>
            </el-form-item>
            <el-form-item v-if="memberInfo" label="会员信息">
              <el-tag type="success">{{ memberInfo.name || memberInfo.phone }}</el-tag>
              <el-tag style="margin-left: 10px;">余额: ¥{{ memberInfo.balance.toFixed(2) }}</el-tag>
              <el-tag style="margin-left: 10px;">积分: {{ memberInfo.points }}</el-tag>
            </el-form-item>
            <el-form-item v-if="availableCoupons.length > 0" label="使用优惠券">
              <el-select v-model="form.member_coupon_id" placeholder="选择优惠券" @change="calculate">
                <el-option v-for="c in availableCoupons" :key="c.id" 
                  :label="c.name + ' - ' + (c.type === 'fixed' ? '减' + c.value : c.value + '折')" 
                  :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="支付方式">
              <el-radio-group v-model="form.payment_method">
                <el-radio value="cash">现金</el-radio>
                <el-radio value="wechat">微信</el-radio>
                <el-radio value="alipay">支付宝</el-radio>
                <el-radio value="balance" :disabled="!memberInfo || memberInfo.balance < calcResult.final_amount">余额支付</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <el-divider />
          <div class="calc-result" v-if="calcResult.unit_price">
            <el-row :gutter="20">
              <el-col :span="8"><div class="item"><span>单价</span><b>¥{{ calcResult.unit_price.toFixed(2) }}/L</b></div></el-col>
              <el-col :span="8"><div class="item"><span>原价</span><b>¥{{ calcResult.original_amount.toFixed(2) }}</b></div></el-col>
              <el-col :span="8"><div class="item"><span>会员优惠</span><b class="discount">-¥{{ calcResult.discount_amount.toFixed(2) }}</b></div></el-col>
              <el-col :span="8"><div class="item"><span>优惠券</span><b class="discount">-¥{{ calcResult.coupon_amount.toFixed(2) }}</b></div></el-col>
              <el-col :span="8"><div class="item"><span>获得积分</span><b class="points">+{{ calcResult.points_earned }}</b></div></el-col>
              <el-col :span="8"><div class="item total"><span>应付金额</span><b>¥{{ calcResult.final_amount.toFixed(2) }}</b></div></el-col>
            </el-row>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <el-button type="primary" size="large" @click="calculate" :disabled="!form.nozzle_id || !form.volume">计算金额</el-button>
            <el-button type="success" size="large" @click="submit" :disabled="!calcResult.final_amount">确认收款</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card>
          <template #header>油品价格</template>
          <el-table :data="prices" border size="small">
            <el-table-column prop="code" label="油品" width="80" />
            <el-table-column prop="fuel_type_name" label="名称" />
            <el-table-column prop="price" label="价格(元/L)" width="120">
              <template #default="{row}">¥{{ row.price.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
        <el-card style="margin-top: 20px;" v-if="myShift">
          <template #header>当前班次</template>
          <p><strong>班次：</strong>{{ myShift.shift_name }}</p>
          <p><strong>开始时间：</strong>{{ myShift.start_time }}</p>
          <p><strong>交易笔数：</strong>{{ myShift.stats?.transaction_count || 0 }}</p>
          <p><strong>总金额：</strong>¥{{ myShift.stats?.total_amount?.toFixed(2) || '0.00' }}</p>
          <p><strong>现金：</strong>¥{{ myShift.stats?.cash_amount?.toFixed(2) || '0.00' }}</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { station, transaction, shift, member as memberApi } from '../../api'
import { useUserStore } from '../../utils/userStore'

const { userInfo, updateUser } = useUserStore()
const nozzles = ref([])
const prices = ref([])
const myShift = ref(null)
const memberInfo = ref(null)
const availableCoupons = ref([])

const form = ref({
  station_id: userInfo.value.station_id,
  nozzle_id: null,
  fuel_type_id: null,
  volume: 0,
  member_phone: '',
  member_coupon_id: null,
  payment_method: 'cash'
})

const calcResult = ref({
  unit_price: 0, original_amount: 0, discount_amount: 0, coupon_amount: 0,
  final_amount: 0, points_earned: 0
})

const loadData = async () => {
  nozzles.value = await station.getNozzles(userInfo.value.station_id)
  prices.value = await station.getPrices(userInfo.value.station_id)
  try { myShift.value = await shift.myShift() } catch (e) {}
}
onMounted(loadData)

const onNozzleChange = (id) => {
  const nozzle = nozzles.value.find(n => n.id === id)
  if (nozzle) {
    form.value.fuel_type_id = nozzle.fuel_type_id
    calculate()
  }
}

const searchMember = async () => {
  if (!form.value.member_phone) {
    memberInfo.value = null
    availableCoupons.value = []
    return
  }
  try {
    const token = localStorage.getItem('token')
    const res = await fetch('/api/auth/member/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ phone: form.value.member_phone, password: 'dummy' })
    })
    const data = await res.json()
    if (data.member) {
      memberInfo.value = data.member
      const coupons = await memberApi.getCoupons('available')
      availableCoupons.value = coupons
    }
  } catch (e) {
    ElMessage.warning('会员不存在')
  }
}
const onMemberBlur = searchMember

const calculate = async () => {
  if (!form.value.nozzle_id || !form.value.volume) return
  try {
    const res = await transaction.calculate({
      station_id: user.station_id,
      nozzle_id: form.value.nozzle_id,
      fuel_type_id: form.value.fuel_type_id,
      volume: form.value.volume,
      member_phone: form.value.member_phone,
      member_coupon_id: form.value.member_coupon_id
    })
    calcResult.value = res
  } catch (e) {
    ElMessage.error(e.error || '计算失败')
  }
}

const submit = async () => {
  if (!calcResult.value.final_amount) {
    ElMessage.warning('请先计算金额')
    return
  }
  try {
    const result = await transaction.create(form.value)
    ElMessage.success('交易完成')
    if (result.member) {
      updateUser({
        balance: result.member.balance,
        points: result.member.points,
        level_id: result.member.level_id,
        level_name: result.member.level_name,
        discount_rate: result.member.discount_rate
      })
    }
    form.value = {
      station_id: userInfo.value.station_id,
      nozzle_id: null,
      fuel_type_id: null,
      volume: 0,
      member_phone: '',
      member_coupon_id: null,
      payment_method: 'cash'
    }
    calcResult.value = { unit_price: 0, original_amount: 0, discount_amount: 0, coupon_amount: 0, final_amount: 0, points_earned: 0 }
    memberInfo.value = null
    availableCoupons.value = []
    myShift.value = await shift.myShift()
  } catch (e) {
    ElMessage.error(e.error || '交易失败')
  }
}
</script>

<style scoped>
.calc-result { background: #f5f7fa; padding: 20px; border-radius: 8px; }
.calc-result .item { text-align: center; }
.calc-result .item span { display: block; color: #666; margin-bottom: 5px; }
.calc-result .item b { font-size: 18px; }
.calc-result .item .discount { color: #f56c6c; }
.calc-result .item .points { color: #e6a23c; }
.calc-result .item.total b { font-size: 24px; color: #409eff; }
</style>
