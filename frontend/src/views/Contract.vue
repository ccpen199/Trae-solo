<template>
  <div class="contract-page">
    <div class="container">
      <div class="contract-header">
        <h1 class="contract-title">装修服务合同</h1>
        <div class="contract-actions">
          <el-button 
            type="primary" 
            size="large"
            :loading="loading"
            @click="handleGenerateContract"
          >
            <el-icon><Document /></el-icon>
            生成PDF合同
          </el-button>
          <el-button 
            size="large"
            :loading="loading"
            @click="handlePrint"
          >
            <el-icon><Printer /></el-icon>
            打印合同
          </el-button>
        </div>
      </div>
      
      <div class="contract-content" ref="contractContentRef">
        <div class="contract-header-info">
          <h2 class="contract-main-title">标准化套餐装修服务合同</h2>
          <div class="contract-no">
            合同编号：{{ contractData?.orderNo || '待生成' }}
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第一条 合同双方</h3>
          <div class="section-content">
            <p><strong>甲方（业主）：</strong></p>
            <div class="info-table">
              <div class="info-row">
                <span class="info-label">姓名：</span>
                <span class="info-value">{{ contractData?.snapshotUser?.realName || '未填写' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">身份证号：</span>
                <span class="info-value">{{ contractData?.snapshotUser?.idCard || '未填写' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">联系电话：</span>
                <span class="info-value">{{ contractData?.snapshotUser?.phone || '未填写' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">房屋地址：</span>
                <span class="info-value">
                  {{ contractData?.snapshotUser?.province || '' }}
                  {{ contractData?.snapshotUser?.city || '' }}
                  {{ contractData?.snapshotUser?.district || '' }}
                  {{ contractData?.snapshotUser?.project || '' }}
                  {{ contractData?.snapshotUser?.building ? contractData.snapshotUser.building + '栋' : '' }}
                  {{ contractData?.snapshotUser?.floor ? contractData.snapshotUser.floor + '层' : '' }}
                  {{ contractData?.snapshotUser?.roomNumber || '' }}
                </span>
              </div>
              <div class="info-row">
                <span class="info-label">户型：</span>
                <span class="info-value">{{ contractData?.snapshotUser?.houseType || '未填写' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">房屋面积：</span>
                <span class="info-value">{{ contractData?.snapshotUser?.houseArea ? contractData.snapshotUser.houseArea + '㎡' : '未填写' }}</span>
              </div>
            </div>
            
            <p class="mt-20"><strong>乙方（服务方）：</strong></p>
            <div class="info-table">
              <div class="info-row">
                <span class="info-label">公司名称：</span>
                <span class="info-value">标准化套餐服务有限公司</span>
              </div>
              <div class="info-row">
                <span class="info-label">联系电话：</span>
                <span class="info-value">400-888-8888</span>
              </div>
              <div class="info-row">
                <span class="info-label">地址：</span>
                <span class="info-value">北京市朝阳区服务中心大厦</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第二条 服务内容</h3>
          <div class="section-content">
            <p>乙方为甲方提供以下装修服务：</p>
            
            <div class="contract-table" v-if="contractData?.packageItems && contractData.packageItems.length > 0">
              <h4 class="subsection-title">2.1 装修套餐</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>套餐名称</th>
                    <th>套餐属性</th>
                    <th>房屋面积</th>
                    <th>单价（元/㎡）</th>
                    <th>小计（元）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in contractData.packageItems" :key="index">
                    <td>{{ item.packageName }}</td>
                    <td>
                      <template v-if="item.selectedAttributes && item.selectedAttributes.length">
                        <span v-for="attr in item.selectedAttributes" :key="attr.attributeId" class="attr-tag">
                          {{ attr.attributeName }}: {{ attr.value }}
                        </span>
                      </template>
                      <template v-else>-</template>
                    </td>
                    <td>{{ item.houseArea }}㎡</td>
                    <td>{{ item.unitPrice }}</td>
                    <td>{{ (item.unitPrice * item.houseArea).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="contract-table" v-if="contractData?.accessoryItems && contractData.accessoryItems.length > 0">
              <h4 class="subsection-title">2.2 家具配件</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>配件名称</th>
                    <th>分类</th>
                    <th>单价（元）</th>
                    <th>数量</th>
                    <th>小计（元）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in contractData.accessoryItems" :key="index">
                    <td>{{ item.name }}</td>
                    <td>{{ item.categoryName || '配件' }}</td>
                    <td>{{ item.unitPrice }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ (item.unitPrice * item.quantity).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="contract-table" v-if="contractData?.upgradeItems && contractData.upgradeItems.length > 0">
              <h4 class="subsection-title">2.3 优化改造包</h4>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>改造包名称</th>
                    <th>描述</th>
                    <th>单价（元）</th>
                    <th>数量</th>
                    <th>小计（元）</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in contractData.upgradeItems" :key="index">
                    <td>{{ item.name }}</td>
                    <td>{{ item.description || '-' }}</td>
                    <td>{{ item.unitPrice }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ (item.unitPrice * item.quantity).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第三条 合同金额</h3>
          <div class="section-content">
            <div class="amount-summary">
              <div class="amount-row">
                <span class="amount-label">套餐总价：</span>
                <span class="amount-value">¥{{ calculatePackageTotal() }}</span>
              </div>
              <div class="amount-row" v-if="calculateAccessoryTotal() > 0">
                <span class="amount-label">配件总价：</span>
                <span class="amount-value">¥{{ calculateAccessoryTotal() }}</span>
              </div>
              <div class="amount-row" v-if="calculateUpgradeTotal() > 0">
                <span class="amount-label">改造包总价：</span>
                <span class="amount-value">¥{{ calculateUpgradeTotal() }}</span>
              </div>
              <div class="amount-row total-row">
                <span class="amount-label">合同总金额（大写）：</span>
                <span class="amount-value">{{ amountInWords }}</span>
              </div>
              <div class="amount-row total-row">
                <span class="amount-label">合同总金额（小写）：</span>
                <span class="amount-value">¥{{ contractData?.totalAmount || '0.00' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第四条 付款方式</h3>
          <div class="section-content">
            <p>4.1 本合同签订后，甲方应向乙方支付合同总金额的 30% 作为首付款。</p>
            <p>4.2 装修工程进行到 50% 时，甲方应向乙方支付合同总金额的 40%。</p>
            <p>4.3 装修工程竣工验收合格后 3 个工作日内，甲方应向乙方支付剩余的 30%。</p>
            <p>4.4 付款方式：银行转账、微信支付、支付宝支付均可。</p>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第五条 工期约定</h3>
          <div class="section-content">
            <p>5.1 预计工期：自开工之日起 60 个工作日。</p>
            <p>5.2 开工日期：双方另行协商确定。</p>
            <p>5.3 如遇不可抗力因素（如自然灾害、政府行为等），工期相应顺延。</p>
            <p>5.4 因甲方原因导致工期延误的，工期相应顺延。</p>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第六条 质量标准</h3>
          <div class="section-content">
            <p>6.1 乙方应严格按照国家及地方相关装修规范标准进行施工。</p>
            <p>6.2 装修材料应符合国家环保标准，乙方应提供材料质量证明文件。</p>
            <p>6.3 装修工程质量保修期为 2 年，自竣工验收合格之日起计算。</p>
            <p>6.4 保修期内，如因施工质量问题造成损坏，乙方负责免费维修。</p>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第七条 违约责任</h3>
          <div class="section-content">
            <p>7.1 如甲方未按约定时间付款，每逾期一日，应按逾期金额的 0.1% 向乙方支付违约金。</p>
            <p>7.2 如乙方未按约定工期完成装修，每逾期一日，应按合同总金额的 0.1% 向甲方支付违约金。</p>
            <p>7.3 如因乙方施工质量问题造成甲方损失的，乙方应承担赔偿责任。</p>
            <p>7.4 一方违约致使合同无法履行的，另一方有权解除合同，并要求违约方承担相应的违约责任。</p>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第八条 争议解决</h3>
          <div class="section-content">
            <p>8.1 本合同履行过程中如发生争议，双方应友好协商解决。</p>
            <p>8.2 协商不成的，任何一方均可向合同签订地（北京市朝阳区）人民法院提起诉讼。</p>
          </div>
        </div>
        
        <div class="contract-section">
          <h3 class="section-title">第九条 其他约定</h3>
          <div class="section-content">
            <p>9.1 本合同未尽事宜，双方可另行签订补充协议。补充协议与本合同具有同等法律效力。</p>
            <p>9.2 本合同一式两份，甲乙双方各执一份，具有同等法律效力。</p>
            <p>9.3 本合同自双方签字（或盖章）之日起生效。</p>
          </div>
        </div>
        
        <div class="contract-signatures">
          <div class="signature-block">
            <h4>甲方（签字）：</h4>
            <div class="signature-line">___________________________</div>
            <p>日期：{{ currentDate }}</p>
          </div>
          <div class="signature-block">
            <h4>乙方（盖章）：</h4>
            <div class="signature-line">___________________________</div>
            <p>日期：{{ currentDate }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { orderApi } from '@/api/order'
import { contractApi } from '@/api/contract'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const contractContentRef = ref(null)
const contractData = ref(null)

const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日')
})

const amountInWords = computed(() => {
  const amount = contractData.value?.totalAmount || 0
  const digits = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const positions = ['', '拾', '佰', '仟', '万', '拾', '佰', '仟', '亿']
  
  if (amount === 0) return '零元整'
  
  const intPart = Math.floor(amount)
  const decPart = Math.round((amount - intPart) * 100)
  
  const convertInt = (num) => {
    if (num === 0) return '零'
    let result = ''
    let pos = 0
    let lastZero = false
    
    while (num > 0) {
      const digit = num % 10
      if (digit === 0) {
        if (!lastZero) {
          result = digits[digit] + result
          lastZero = true
        }
      } else {
        result = digits[digit] + positions[pos] + result
        lastZero = false
      }
      pos++
      num = Math.floor(num / 10)
    }
    
    result = result.replace(/零+$/g, '')
    
    return result
  }
  
  let result = ''
  
  if (intPart > 0) {
    result += convertInt(intPart) + '元'
  }
  
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10)
    const fen = decPart % 10
    if (jiao > 0) {
      result += digits[jiao] + '角'
    }
    if (fen > 0) {
      result += digits[fen] + '分'
    }
  } else {
    result += '整'
  }
  
  return result || '零元整'
})

const calculatePackageTotal = () => {
  if (!contractData.value?.packageItems) return '0.00'
  return contractData.value.packageItems.reduce((sum, item) => sum + item.unitPrice * item.houseArea, 0).toFixed(2)
}

const calculateAccessoryTotal = () => {
  if (!contractData.value?.accessoryItems) return 0
  return contractData.value.accessoryItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
}

const calculateUpgradeTotal = () => {
  if (!contractData.value?.upgradeItems) return 0
  return contractData.value.upgradeItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2)
}

const fetchContractData = async () => {
  const orderNo = route.params.orderNo
  if (!orderNo) return
  
  loading.value = true
  try {
    const result = await orderApi.getDetail(orderNo)
    contractData.value = result.data
  } catch (error) {
    console.error('获取合同数据失败:', error)
    ElMessage.error('获取合同数据失败')
  } finally {
    loading.value = false
  }
}

const handleGenerateContract = async () => {
  if (!contractData.value?.id) {
    ElMessage.warning('暂无订单数据')
    return
  }
  
  loading.value = true
  try {
    const result = await contractApi.generate(contractData.value.id)
    
    if (result.data.pdfUrl) {
      window.open(result.data.pdfUrl, '_blank')
    }
    
    ElMessage.success('PDF合同生成成功')
  } catch (error) {
    console.error('生成合同失败:', error)
    ElMessage.error(error.response?.data?.message || '生成合同失败')
  } finally {
    loading.value = false
  }
}

const handlePrint = () => {
  if (contractContentRef.value) {
    window.print()
  }
}

onMounted(() => {
  fetchContractData()
})
</script>

<style scoped>
.contract-page {
  padding: 30px 0;
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
}

.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.contract-title {
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.contract-actions {
  display: flex;
  gap: 10px;
}

.contract-content {
  background: #fff;
  padding: 40px 60px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.contract-header-info {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #333;
}

.contract-main-title {
  font-size: 28px;
  color: #333;
  font-weight: bold;
  margin-bottom: 15px;
}

.contract-no {
  font-size: 14px;
  color: #666;
}

.contract-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-bottom: 15px;
  padding-left: 10px;
  border-left: 3px solid #667eea;
}

.section-content {
  padding-left: 13px;
}

.section-content p {
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 10px;
  text-indent: 2em;
}

.section-content p:last-child {
  margin-bottom: 0;
}

.section-content p.mt-20 {
  margin-top: 20px;
}

.info-table {
  margin: 10px 0;
  padding: 15px;
  background: #fafafa;
  border-radius: 8px;
}

.info-row {
  display: flex;
  margin-bottom: 10px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-size: 14px;
  color: #666;
  width: 100px;
  flex-shrink: 0;
}

.info-value {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.contract-table {
  margin: 20px 0;
}

.subsection-title {
  font-size: 15px;
  color: #333;
  font-weight: bold;
  margin-bottom: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  border: 1px solid #e4e7ed;
  padding: 10px;
  text-align: center;
}

.data-table th {
  background: #f5f7fa;
  font-weight: bold;
  color: #333;
}

.data-table td {
  color: #606266;
}

.attr-tag {
  display: inline-block;
  font-size: 12px;
  color: #667eea;
  background: #f0f2ff;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 5px;
  margin-bottom: 4px;
}

.amount-summary {
  margin: 15px 0;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.amount-row {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  margin-bottom: 10px;
  font-size: 14px;
}

.amount-row:last-child {
  margin-bottom: 0;
}

.amount-row.total-row {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.amount-label {
  color: #666;
  margin-right: 20px;
}

.amount-value {
  color: #333;
}

.amount-row.total-row .amount-value {
  color: #f56c6c;
}

.contract-signatures {
  display: flex;
  justify-content: space-between;
  margin-top: 60px;
  padding-top: 40px;
  border-top: 1px solid #e4e7ed;
}

.signature-block {
  width: 40%;
}

.signature-block h4 {
  font-size: 14px;
  color: #333;
  font-weight: bold;
  margin-bottom: 10px;
}

.signature-line {
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
}

.signature-block p {
  font-size: 13px;
  color: #666;
}

@media print {
  .contract-page {
    background: #fff;
    padding: 0;
  }
  
  .contract-header {
    display: none;
  }
  
  .contract-content {
    box-shadow: none;
    padding: 20px;
  }
}
</style>
