// 安装引擎 - 负责智能派工和安装任务管理
import logger from '../config/logger';
import { InstallationAssignmentContext, InstallerInfo, InstallationStatus } from '../types';

interface AssignInstallerOptions {
  orderId: string;
  availableInstallers: InstallerInfo[];
  context: InstallationAssignmentContext;
}

interface AssignmentResult {
  success: boolean;
  installer?: InstallerInfo;
  message: string;
  score?: number;
  estimatedDuration?: number;
  scheduledDate?: Date;
}

export class InstallationEngine {
  // 智能派工算法
  async assignInstaller(options: AssignInstallerOptions): Promise<AssignmentResult> {
    const { orderId, availableInstallers, context } = options;
    
    try {
      logger.info(`[InstallationEngine] 开始智能派工: orderId=${orderId}, installers=${availableInstallers.length}`);
      
      // 如果没有可用的安装师傅
      if (availableInstallers.length === 0) {
        return {
          success: false,
          message: '暂无可用的安装师傅'
        };
      }
      
      // 计算每个安装师傅的匹配得分
      const scoredInstallers = availableInstallers.map(installer => {
        let score = 0;
        
        // 基础分数
        score += 50;
        
        // 难度匹配
        if (context.difficultyLevel) {
          const difficultyScore = this.calculateDifficultyScore(installer, context.difficultyLevel);
          score += difficultyScore;
        }
        
        // 距离评分（模拟）
        const distanceScore = this.calculateDistanceScore(installer, context.customerAddress);
        score += distanceScore;
        
        // 可用性评分
        if (installer.isAvailable) {
          score += 20;
        }
        
        // 经验评分
        score += (installer.experienceYears || 0) * 5;
        
        // 评分评分
        score += (installer.rating || 0) * 10;
        
        return {
          installer,
          score
        };
      });
      
      // 按分数排序
      scoredInstallers.sort((a, b) => b.score - a.score);
      
      // 选择得分最高的安装师傅
      const bestInstaller = scoredInstallers[0];
      
      if (bestInstaller.score < 60) {
        return {
          success: false,
          message: '没有找到合适的安装师傅'
        };
      }
      
      // 生成预计安装时间
      const estimatedDuration = this.calculateEstimatedDuration(context);
      
      // 生成预计安装日期
      const scheduledDate = this.calculateScheduledDate(context.preferredDate);
      
      logger.info(`[InstallationEngine] 派工成功: orderId=${orderId}, installerId=${bestInstaller.installer.id}, score=${bestInstaller.score}`);
      
      return {
        success: true,
        installer: bestInstaller.installer,
        message: '派工成功',
        score: bestInstaller.score,
        estimatedDuration,
        scheduledDate
      };
    } catch (error: any) {
      logger.error(`[InstallationEngine] 派工失败: orderId=${orderId}, error=${error.message}`);
      return {
        success: false,
        message: `派工失败: ${error.message}`
      };
    }
  }
  
  // 计算难度匹配得分
  private calculateDifficultyScore(installer: InstallerInfo, difficultyLevel: string): number {
    const skillLevel = installer.skillLevel || 'BEGINNER';
    
    const difficultyMap: Record<string, number> = {
      'EASY': 10,
      'MEDIUM': 20,
      'HARD': 30,
      'EXPERT': 40
    };
    
    const skillMap: Record<string, number> = {
      'BEGINNER': 10,
      'INTERMEDIATE': 20,
      'ADVANCED': 30,
      'EXPERT': 40
    };
    
    const difficultyScore = difficultyMap[difficultyLevel] || 10;
    const skillScore = skillMap[skillLevel] || 10;
    
    // 如果技能等级大于等于难度等级，获得满分
    if (skillScore >= difficultyScore) {
      return 30;
    }
    // 如果技能等级低于难度等级，根据差距扣分
    return Math.max(0, 30 - (difficultyScore - skillScore) * 5);
  }
  
  // 计算距离得分（模拟）
  private calculateDistanceScore(installer: InstallerInfo, customerAddress: any): number {
    // 模拟距离计算，实际项目中应该使用真实的地理距离计算
    const distance = Math.random() * 50; // 0-50公里
    
    if (distance <= 5) {
      return 30; // 5公里以内，满分
    } else if (distance <= 15) {
      return 25; // 5-15公里
    } else if (distance <= 30) {
      return 20; // 15-30公里
    } else {
      return 10; // 30公里以上
    }
  }
  
  // 计算预计安装时间
  private calculateEstimatedDuration(context: InstallationAssignmentContext): number {
    let baseDuration = 180; // 基础时间3小时
    
    // 根据难度调整
    const difficultyDurationMap: Record<string, number> = {
      'EASY': 0,
      'MEDIUM': 60,
      'HARD': 120,
      'EXPERT': 180
    };
    
    baseDuration += difficultyDurationMap[context.difficultyLevel] || 0;
    
    // 根据项目数量调整
    if (context.installationItems && context.installationItems.length > 0) {
      baseDuration += context.installationItems.length * 30; // 每个项目增加30分钟
    }
    
    // 根据特殊要求调整
    if (context.specialRequirements && context.specialRequirements.length > 0) {
      baseDuration += context.specialRequirements.length * 15; // 每个特殊要求增加15分钟
    }
    
    return baseDuration;
  }
  
  // 计算预计安装日期
  private calculateScheduledDate(preferredDate?: Date): Date {
    const date = preferredDate || new Date();
    
    // 如果首选日期是过去的日期，使用明天
    if (date < new Date()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    
    // 如果首选日期是周末，调整到下周一
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const nextMonday = new Date(date);
      nextMonday.setDate(date.getDate() + (8 - dayOfWeek) % 7);
      return nextMonday;
    }
    
    return date;
  }
  
  // 验证安装师傅是否适合特定任务
  validateInstaller(installer: InstallerInfo, context: InstallationAssignmentContext): boolean {
    // 检查安装师傅是否可用
    if (!installer.isAvailable) {
      return false;
    }
    
    // 检查技能等级是否满足难度要求
    const skillLevel = installer.skillLevel || 'BEGINNER';
    const difficultyLevel = context.difficultyLevel || 'MEDIUM';
    
    const skillMap: Record<string, number> = {
      'BEGINNER': 1,
      'INTERMEDIATE': 2,
      'ADVANCED': 3,
      'EXPERT': 4
    };
    
    const difficultyMap: Record<string, number> = {
      'EASY': 1,
      'MEDIUM': 2,
      'HARD': 3,
      'EXPERT': 4
    };
    
    const skillValue = skillMap[skillLevel];
    const difficultyValue = difficultyMap[difficultyLevel];
    
    return skillValue >= difficultyValue;
  }
  
  // 计算安装成本
  calculateInstallationCost(context: InstallationAssignmentContext): number {
    let baseCost = 200; // 基础成本
    
    // 根据难度调整
    const difficultyCostMap: Record<string, number> = {
      'EASY': 0,
      'MEDIUM': 100,
      'HARD': 200,
      'EXPERT': 300
    };
    
    baseCost += difficultyCostMap[context.difficultyLevel] || 0;
    
    // 根据项目数量调整
    if (context.installationItems && context.installationItems.length > 0) {
      baseCost += context.installationItems.length * 50; // 每个项目增加50元
    }
    
    // 根据预计时长调整
    if (context.estimatedDuration) {
      baseCost += Math.ceil(context.estimatedDuration / 60) * 50; // 每小时增加50元
    }
    
    return baseCost;
  }
}

export const installationEngine = new InstallationEngine();
export default InstallationEngine;