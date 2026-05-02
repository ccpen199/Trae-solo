<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/utils/api'

const loading = ref(false)
const activeTab = ref('system')

const systemSettings = ref({
  storeName: '餐饮管理系统',
  storeAddress: '',
  storePhone: '',
  businessHours: '10:00 - 22:00',
  taxRate: 0,
  serviceChargeRate: 0,
  autoConfirmOrder: true,
  autoPrintKitchen: true,
  notifyByWechat: false,
})

const printerSettings = ref({
  kitchenPrinterType: 'simulation',
  kitchenPrinterIp: '',
  kitchenPrinterPort: 9100,
  kitchenPrinterName: '',
  cashPrinterType: 'simulation',
  cashPrinterIp: '',
  cashPrinterPort: 9100,
  cashPrinterName: '',
  autoPrintKitchen: true,
  autoPrintReceipt: true,
  autoPrintOrderConfirm: true,
})

const tableSettings = ref({
  defaultGuestCount: 2,
  autoCalculateTableTime: true,
  autoCleanTableDelay: 10,
  requireGuestCount: false,
})

const memberSettings = ref({
  enableMemberPoints: true,
  pointsPerYuan: 1,
  pointsExchangeRate: 100,
  enableMemberDiscount: true,
  memberDiscountRate: 0.95,
  autoRegisterOnPhone: true,
})

const saveSystemSettings = async () => {
  try {
    loading.value = true
    ElMessage.success('系统设置已保存')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const savePrinterSettings = async () => {
  try {
    loading.value = true
    ElMessage.success('打印机设置已保存')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const saveTableSettings = async () => {
  try {
    loading.value = true
    ElMessage.success('桌台设置已保存')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const saveMemberSettings = async () => {
  try {
    loading.value = true
    ElMessage.success('会员设置已保存')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}

const testPrinter = async (printerType: string) => {
  try {
    ElMessage.info('正在发送测试打印...')
    await request.post('/print/test', { printerType })
    ElMessage.success('测试打印已发送')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '测试打印失败')
  }
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm('确定要恢复所有设置到默认值吗？此操作不可撤销。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    ElMessage.success('设置已恢复默认值')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

onMounted(() => {
  // 加载设置数据
})
</script>

<template>
  <div class="settings-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">系统设置</span>
          <el-button type="danger" size="small" @click="resetSettings">
            <el-icon><Warning /></el-icon>
            恢复默认
          </el-button>
        </div>
      </template>
    </el-card>

    <el-tabs v-model="activeTab" type="border-card" class="settings-tabs">
      <el-tab-pane label="系统设置" name="system">
        <el-card class="setting-section">
          <template #header>
            <span class="section-title">门店信息</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="门店名称">
              <el-input v-model="systemSettings.storeName" style="width: 300px" />
            </el-form-item>
            <el-form-item label="门店地址">
              <el-input v-model="systemSettings.storeAddress" style="width: 400px" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="systemSettings.storePhone" style="width: 200px" />
            </el-form-item>
            <el-form-item label="营业时间">
              <el-input v-model="systemSettings.businessHours" style="width: 200px">
                <template #prefix>
                  <el-icon><Clock /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">费率设置</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="税率">
              <el-input-number v-model="systemSettings.taxRate" :min="0" :max="100" :precision="2" />
              <span class="unit">%</span>
            </el-form-item>
            <el-form-item label="服务费">
              <el-input-number
                v-model="systemSettings.serviceChargeRate"
                :min="0"
                :max="100"
                :precision="2"
              />
              <span class="unit">%</span>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">自动化设置</span>
          </template>
          <el-form label-width="200px">
            <el-form-item label="自动确认订单">
              <el-switch v-model="systemSettings.autoConfirmOrder" active-text="开" inactive-text="关" />
              <span class="form-desc">开启后，新订单无需手动确认，直接进入制作状态</span>
            </el-form-item>
            <el-form-item label="自动打印后厨单">
              <el-switch v-model="systemSettings.autoPrintKitchen" active-text="开" inactive-text="关" />
              <span class="form-desc">开启后，订单确认时自动打印后厨单</span>
            </el-form-item>
            <el-form-item label="微信通知">
              <el-switch v-model="systemSettings.notifyByWechat" active-text="开" inactive-text="关" />
              <span class="form-desc">开启后，订单状态变更通过微信通知相关人员</span>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="action-bar">
          <el-button type="primary" size="large" :loading="loading" @click="saveSystemSettings">
            保存设置
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="打印机设置" name="printer">
        <el-card class="setting-section">
          <template #header>
            <span class="section-title">后厨打印机</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="打印模式">
              <el-radio-group v-model="printerSettings.kitchenPrinterType">
                <el-radio label="simulation">模拟打印</el-radio>
                <el-radio label="network">网络打印机</el-radio>
                <el-radio label="usb">USB打印机</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="printerSettings.kitchenPrinterType === 'network'" label="打印机IP">
              <el-input v-model="printerSettings.kitchenPrinterIp" placeholder="192.168.1.100" style="width: 250px" />
            </el-form-item>
            <el-form-item v-if="printerSettings.kitchenPrinterType === 'network'" label="端口">
              <el-input-number
                v-model="printerSettings.kitchenPrinterPort"
                :min="1"
                :max="65535"
              />
            </el-form-item>
            <el-form-item v-if="printerSettings.kitchenPrinterType === 'usb'" label="打印机名称">
              <el-input v-model="printerSettings.kitchenPrinterName" placeholder="选择打印机" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testPrinter('kitchen')">
                <el-icon><Printer /></el-icon>
                测试打印
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">收银打印机</span>
          </template>
          <el-form label-width="120px">
            <el-form-item label="打印模式">
              <el-radio-group v-model="printerSettings.cashPrinterType">
                <el-radio label="simulation">模拟打印</el-radio>
                <el-radio label="network">网络打印机</el-radio>
                <el-radio label="usb">USB打印机</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="printerSettings.cashPrinterType === 'network'" label="打印机IP">
              <el-input v-model="printerSettings.cashPrinterIp" placeholder="192.168.1.101" style="width: 250px" />
            </el-form-item>
            <el-form-item v-if="printerSettings.cashPrinterType === 'network'" label="端口">
              <el-input-number
                v-model="printerSettings.cashPrinterPort"
                :min="1"
                :max="65535"
              />
            </el-form-item>
            <el-form-item v-if="printerSettings.cashPrinterType === 'usb'" label="打印机名称">
              <el-input v-model="printerSettings.cashPrinterName" placeholder="选择打印机" style="width: 300px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="testPrinter('cash')">
                <el-icon><Printer /></el-icon>
                测试打印
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">自动打印设置</span>
          </template>
          <el-form label-width="140px">
            <el-form-item label="订单确认时打印后厨单">
              <el-switch v-model="printerSettings.autoPrintKitchen" active-text="开" inactive-text="关" />
            </el-form-item>
            <el-form-item label="支付完成时打印小票">
              <el-switch v-model="printerSettings.autoPrintReceipt" active-text="开" inactive-text="关" />
            </el-form-item>
            <el-form-item label="订单确认时打印确认单">
              <el-switch v-model="printerSettings.autoPrintOrderConfirm" active-text="开" inactive-text="关" />
            </el-form-item>
          </el-form>
        </el-card>

        <div class="action-bar">
          <el-button type="primary" size="large" :loading="loading" @click="savePrinterSettings">
            保存设置
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="桌台设置" name="table">
        <el-card class="setting-section">
          <template #header>
            <span class="section-title">桌台参数</span>
          </template>
          <el-form label-width="140px">
            <el-form-item label="默认客人数">
              <el-input-number v-model="tableSettings.defaultGuestCount" :min="1" :max="20" />
              <span class="unit">人</span>
            </el-form-item>
            <el-form-item label="自动计算用餐时长">
              <el-switch v-model="tableSettings.autoCalculateTableTime" active-text="开" inactive-text="关" />
              <span class="form-desc">根据开单和结账时间自动计算用餐时长</span>
            </el-form-item>
            <el-form-item label="自动清台延迟">
              <el-input-number v-model="tableSettings.autoCleanTableDelay" :min="0" :max="60" />
              <span class="unit">分钟（0表示立即清台）</span>
            </el-form-item>
            <el-form-item label="必须填写客人数">
              <el-switch v-model="tableSettings.requireGuestCount" active-text="开" inactive-text="关" />
              <span class="form-desc">开单时必须填写客人数量</span>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="action-bar">
          <el-button type="primary" size="large" :loading="loading" @click="saveTableSettings">
            保存设置
          </el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="会员设置" name="member">
        <el-card class="setting-section">
          <template #header>
            <span class="section-title">积分设置</span>
          </template>
          <el-form label-width="140px">
            <el-form-item label="启用积分">
              <el-switch v-model="memberSettings.enableMemberPoints" active-text="开" inactive-text="关" />
            </el-form-item>
            <el-form-item label="每消费金额">
              <el-input-number v-model="memberSettings.pointsPerYuan" :min="0.01" :max="100" :precision="2" />
              <span class="unit">元获得1积分</span>
            </el-form-item>
            <el-form-item label="积分兑换比例">
              <el-input-number v-model="memberSettings.pointsExchangeRate" :min="1" :max="1000" />
              <span class="unit">积分 = 1元</span>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">折扣设置</span>
          </template>
          <el-form label-width="140px">
            <el-form-item label="启用会员折扣">
              <el-switch v-model="memberSettings.enableMemberDiscount" active-text="开" inactive-text="关" />
            </el-form-item>
            <el-form-item label="会员折扣率">
              <el-input-number
                v-model="memberSettings.memberDiscountRate"
                :min="0.1"
                :max="1"
                :precision="2"
                :step="0.05"
              />
              <span class="unit">（0.95表示95折）</span>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-section mt-20">
          <template #header>
            <span class="section-title">注册设置</span>
          </template>
          <el-form label-width="140px">
            <el-form-item label="手机号自动注册">
              <el-switch v-model="memberSettings.autoRegisterOnPhone" active-text="开" inactive-text="关" />
              <span class="form-desc">输入手机号时如无会员自动注册</span>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="action-bar">
          <el-button type="primary" size="large" :loading="loading" @click="saveMemberSettings">
            保存设置
          </el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.settings-tabs {
  :deep(.el-tabs__header) {
    margin: 0;
  }

  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
  }
}

.setting-section {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
}

.mt-20 {
  margin-top: 20px;
}

.unit {
  margin-left: 8px;
  font-size: 14px;
  color: #909399;
}

.form-desc {
  margin-left: 12px;
  font-size: 13px;
  color: #909399;
}

.action-bar {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: flex-end;
}
</style>
