<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBrandConfigApi, updateBrandConfigApi } from '@/api/admin'

const loading = ref(false)
const saving = ref(false)
const activeTab = ref<'basic' | 'theme' | 'content'>('basic')

const form = reactive({
  brandName: '',
  brandLogo: '',
  brandSlogan: '',
  primaryColor: '#409eff',
  secondaryColor: '#67c23a',
  accentColor: '#f56c6c',
  headerBgColor: '#ffffff',
  sidebarBgColor: '#304156',
  footerText: '',
  aboutUs: '',
  contactInfo: '',
  userAgreement: '',
  privacyPolicy: ''
})

const colorPresets = [
  { primary: '#409eff', name: '科技蓝' },
  { primary: '#67c23a', name: '清新绿' },
  { primary: '#e6a23c', name: '活力橙' },
  { primary: '#f56c6c', name: '热情红' },
  { primary: '#909399', name: '简约灰' },
  { primary: '#722ed1', name: '优雅紫' }
]

const previewDevice = {
  name: '示例设备',
  code: 'DEV0001',
  type: 'washer',
  status: 'idle',
  location: '示例位置'
}

async function loadConfig() {
  loading.value = true
  try {
    const res = await getBrandConfigApi()
    Object.assign(form, res.data)
  } catch (error) {
    console.error('Load config error:', error)
    form.brandName = '智能洗衣'
    form.brandSlogan = '便捷洗衣，智能生活'
    form.primaryColor = '#409eff'
    form.secondaryColor = '#67c23a'
    form.accentColor = '#f56c6c'
    form.footerText = '© 2024 智能洗衣管理系统 版权所有'
    form.aboutUs = '智能洗衣管理系统致力于为用户提供便捷、智能的洗衣服务体验。'
    form.contactInfo = '客服电话：400-888-8888\n客服邮箱：service@example.com'
    form.userAgreement = '用户协议内容...'
    form.privacyPolicy = '隐私政策内容...'
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!form.brandName) {
    ElMessage.warning('请输入品牌名称')
    return
  }

  saving.value = true
  try {
    await updateBrandConfigApi(form)
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Save error:', error)
  } finally {
    saving.value = false
  }
}

function applyColorPreset(preset: any) {
  form.primaryColor = preset.primary
}

function handleLogoUpload(file: any) {
  const reader = new FileReader()
  reader.onload = (e) => {
    form.brandLogo = e.target?.result as string
  }
  reader.readAsDataURL(file.raw)
  return false
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="brand-config-page">
    <el-row :gutter="20">
      <el-col :xs="24" :lg="16">
        <el-card class="config-card" v-loading="loading">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本信息" name="basic">
              <el-form label-width="120px">
                <el-form-item label="品牌名称">
                  <el-input v-model="form.brandName" placeholder="请输入品牌名称" />
                </el-form-item>
                <el-form-item label="品牌Logo">
                  <el-upload
                    :auto-upload="false"
                    :show-file-list="false"
                    :before-upload="handleLogoUpload"
                    accept="image/*"
                    class="logo-upload"
                  >
                    <div v-if="form.brandLogo" class="logo-preview">
                      <img :src="form.brandLogo" alt="Logo" />
                    </div>
                    <div v-else class="logo-placeholder">
                      <el-icon :size="48"><Upload /></el-icon>
                      <p>点击上传Logo</p>
                    </div>
                  </el-upload>
                </el-form-item>
                <el-form-item label="品牌标语">
                  <el-input v-model="form.brandSlogan" placeholder="请输入品牌标语" />
                </el-form-item>
                <el-form-item label="页脚文字">
                  <el-input v-model="form.footerText" placeholder="请输入页脚版权信息" />
                </el-form-item>
                <el-form-item label="关于我们">
                  <el-input
                    v-model="form.aboutUs"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入关于我们的介绍"
                  />
                </el-form-item>
                <el-form-item label="联系方式">
                  <el-input
                    v-model="form.contactInfo"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入客服电话、邮箱等联系方式"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="主题配置" name="theme">
              <el-form label-width="120px">
                <el-form-item label="预设主题">
                  <div class="color-presets">
                    <div
                      v-for="preset in colorPresets"
                      :key="preset.primary"
                      class="preset-item"
                      :class="{ active: form.primaryColor === preset.primary }"
                      @click="applyColorPreset(preset)"
                    >
                      <div class="preset-color" :style="{ background: preset.primary }"></div>
                      <span>{{ preset.name }}</span>
                    </div>
                  </div>
                </el-form-item>
                <el-form-item label="主色调">
                  <el-color-picker v-model="form.primaryColor" size="large" />
                  <span class="color-value">{{ form.primaryColor }}</span>
                </el-form-item>
                <el-form-item label="辅助色">
                  <el-color-picker v-model="form.secondaryColor" size="large" />
                  <span class="color-value">{{ form.secondaryColor }}</span>
                </el-form-item>
                <el-form-item label="强调色">
                  <el-color-picker v-model="form.accentColor" size="large" />
                  <span class="color-value">{{ form.accentColor }}</span>
                </el-form-item>
                <el-form-item label="头部背景色">
                  <el-color-picker v-model="form.headerBgColor" size="large" />
                  <span class="color-value">{{ form.headerBgColor }}</span>
                </el-form-item>
                <el-form-item label="侧边栏背景色">
                  <el-color-picker v-model="form.sidebarBgColor" size="large" />
                  <span class="color-value">{{ form.sidebarBgColor }}</span>
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="协议内容" name="content">
              <el-form label-width="120px">
                <el-form-item label="用户协议">
                  <el-input
                    v-model="form.userAgreement"
                    type="textarea"
                    :rows="10"
                    placeholder="请输入用户协议内容"
                  />
                </el-form-item>
                <el-form-item label="隐私政策">
                  <el-input
                    v-model="form.privacyPolicy"
                    type="textarea"
                    :rows="10"
                    placeholder="请输入隐私政策内容"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>

          <div class="action-section">
            <el-button :loading="saving" type="primary" size="large" @click="handleSave">
              保存配置
            </el-button>
            <el-button size="large" @click="loadConfig">重置</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="preview-card">
          <template #header>
            <span>实时预览</span>
          </template>

          <div class="preview-wrapper">
            <div class="preview-header" :style="{ background: form.headerBgColor }">
              <div class="brand-info">
                <div v-if="form.brandLogo" class="logo">
                  <img :src="form.brandLogo" alt="Logo" />
                </div>
                <el-icon v-else :size="24" :color="form.primaryColor"><Service /></el-icon>
                <span class="brand-name" :style="{ color: form.primaryColor }">{{ form.brandName || '品牌名称' }}</span>
              </div>
            </div>

            <div class="preview-content">
              <p class="slogan">{{ form.brandSlogan || '品牌标语' }}</p>

              <el-card class="preview-device-card" shadow="hover">
                <div class="card-header">
                  <div class="device-info">
                    <el-icon :size="28" :color="form.primaryColor"><Service /></el-icon>
                    <div class="device-meta">
                      <div class="device-name">{{ previewDevice.name }}</div>
                      <div class="device-code">{{ previewDevice.code }}</div>
                    </div>
                  </div>
                  <el-tag :color="form.primaryColor" size="small">空闲</el-tag>
                </div>
                <div class="card-body">
                  <div class="info-row">
                    <span class="label">位置：</span>
                    <span class="value">{{ previewDevice.location }}</span>
                  </div>
                </div>
                <div class="card-footer">
                  <el-button :style="{ background: form.primaryColor, borderColor: form.primaryColor }" type="primary" size="small">
                    立即使用
                  </el-button>
                </div>
              </el-card>

              <div class="preview-buttons">
                <el-button :style="{ background: form.primaryColor, borderColor: form.primaryColor }" type="primary">主按钮</el-button>
                <el-button :style="{ color: form.primaryColor, borderColor: form.primaryColor }">次要按钮</el-button>
                <el-button :style="{ color: form.secondaryColor, borderColor: form.secondaryColor }">辅助按钮</el-button>
              </div>
            </div>

            <div class="preview-footer">
              {{ form.footerText || '页脚文字' }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.brand-config-page {
  .config-card {
    .action-section {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .color-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .preset-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 2px solid #ebeef5;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover,
        &.active {
          border-color: #409eff;
          background: #ecf5ff;
        }

        .preset-color {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid #ebeef5;
        }
      }
    }

    .color-value {
      margin-left: 12px;
      font-family: monospace;
      color: #606266;
    }

    .logo-upload {
      .logo-preview {
        width: 120px;
        height: 120px;
        border: 2px dashed #dcdfe6;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      }

      .logo-placeholder {
        width: 120px;
        height: 120px;
        border: 2px dashed #dcdfe6;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        cursor: pointer;

        p {
          margin: 8px 0 0 0;
          font-size: 12px;
        }
      }
    }
  }

  .preview-card {
    position: sticky;
    top: 0;

    .preview-wrapper {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      overflow: hidden;

      .preview-header {
        padding: 16px;
        border-bottom: 1px solid #ebeef5;

        .brand-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .logo {
            width: 28px;
            height: 28px;

            img {
              max-width: 100%;
              max-height: 100%;
            }
          }

          .brand-name {
            font-size: 16px;
            font-weight: 600;
          }
        }
      }

      .preview-content {
        padding: 16px;

        .slogan {
          text-align: center;
          color: #909399;
          margin-bottom: 16px;
        }

        .preview-device-card {
          margin-bottom: 20px;

          :deep(.el-card__body) {
            padding: 16px;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;

            .device-info {
              display: flex;
              align-items: center;
              gap: 8px;

              .device-meta {
                .device-name {
                  font-size: 14px;
                  font-weight: 600;
                }

                .device-code {
                  font-size: 12px;
                  color: #909399;
                }
              }
            }
          }

          .card-body {
            padding: 8px 0;
            border-top: 1px solid #ebeef5;
            border-bottom: 1px solid #ebeef5;
            margin-bottom: 12px;

            .info-row {
              font-size: 13px;

              .label {
                color: #909399;
              }
            }
          }

          .card-footer {
            text-align: right;
          }
        }

        .preview-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
      }

      .preview-footer {
        padding: 12px 16px;
        background: #f5f7fa;
        text-align: center;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}
</style>
