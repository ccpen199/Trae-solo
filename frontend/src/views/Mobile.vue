<template>
  <div class="mobile-container">
    <div class="page-header" style="text-align: center;">
      <h2>📱 移动端功能</h2>
      <p style="color: #909399;">离线重点企业档案 · 扫码调取合作方资质</p>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :xs="12" :sm="12">
        <el-card class="card-shadow" style="text-align: center; cursor: pointer;" @click="$router.push('/mobile/offline')">
          <el-icon :size="48" color="#1e3a8a"><FolderOpened /></el-icon>
          <h3 style="margin: 16px 0 8px;">离线档案</h3>
          <p style="color: #909399; font-size: 14px;">查看已保存的重点企业档案，无网络时也可查看</p>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12">
        <el-card class="card-shadow" style="text-align: center; cursor: pointer;" @click="$router.push('/mobile/qrcode')">
          <el-icon :size="48" color="#1e3a8a"><Camera /></el-icon>
          <h3 style="margin: 16px 0 8px;">扫码查询</h3>
          <p style="color: #909399; font-size: 14px;">扫描二维码快速调取合作方资质信息</p>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow" style="margin-bottom: 20px;">
      <template #header>
        <span style="font-weight: bold;">📋 功能说明</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="离线档案">
          支持将重点企业档案下载到本地，在无网络环境下仍可查看企业六维信息
        </el-descriptions-item>
        <el-descriptions-item label="二维码扫描">
          扫描企业资质二维码，快速获取企业工商、资质、人员、信用等核心信息
        </el-descriptions-item>
        <el-descriptions-item label="风险预警">
          扫码后自动检测企业风险状态，黑名单、失信、异常经营实时预警
        </el-descriptions-item>
        <el-descriptions-item label="快捷操作">
          支持一键生成尽调报告、加入重点关注、发起合作方风险评估
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">📱 快捷入口</span>
      </template>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <el-button type="primary" size="large" @click="$router.push('/mobile/offline')">
          <el-icon><FolderOpened /></el-icon>
          离线档案
        </el-button>
        <el-button type="success" size="large" @click="$router.push('/mobile/qrcode')">
          <el-icon><Camera /></el-icon>
          扫码查询
        </el-button>
        <el-button type="warning" size="large" @click="$router.push('/search')">
          <el-icon><Search /></el-icon>
          企业查询
        </el-button>
        <el-button type="info" size="large" @click="$router.push('/dashboard')">
          <el-icon><DataAnalysis /></el-icon>
          风险仪表盘
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { FolderOpened, Camera, Search, DataAnalysis } from '@element-plus/icons-vue';
</script>
