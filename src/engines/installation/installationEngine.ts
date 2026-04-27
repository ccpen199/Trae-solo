import { v4 as uuidv4 } from 'uuid';
import { 
  InstallationAssignmentContext, 
  InstallerInfo, 
  Address,
  InstallationItem,
  DifficultyLevel,
  InstallationAssignmentResult
} from '../../types';
import {
  AssignmentInput,
  OptimizationStrategy,
  AssignmentRule,
  AssignmentResult,
  AssignmentCandidate,
  ScoreComponent,
  ScoreBreakdown,
  AssignmentMetadata,
  WorkloadInfo,
  SkillMatchInfo,
  AssignmentConstraint,
  AssignmentConflict,
  InstallerScore,
  AssignmentOptimizationResult
} from './types';
import logger from '../../config/logger';

const ENGINE_VERSION = '1.0.0';
const MAX_DISTANCE_KM = 50;
const AVG_SPEED_KMH = 30;
const MIN_REST_MINUTES = 15;

export class InstallationEngine {
  private defaultRules: AssignmentRule[];
  private defaultStrategy: OptimizationStrategy;
  private distanceCache: Map<string, { distance: number; estimatedTime: number }>;

  constructor() {
    this.defaultRules = this.initializeDefaultRules();
    this.defaultStrategy = 'BALANCED_WORKLOAD';
    this.distanceCache = new Map();
  }

  private initializeDefaultRules(): AssignmentRule[] {
    return [
      {
        id: 'rule_001',
        name: '服务区域优先',
        type: 'AREA_PREFERENCE',
        priority: 1,
        weight: 0.2,
        conditions: [
          { field: 'installer.serviceArea', operator: 'contains', value: '' }
        ],
        actions: [
          { action: 'INCREASE_SCORE', parameters: { value: 20 } }
        ],
        isEnabled: true
      },
      {
        id: 'rule_002',
        name: '技能匹配',
        type: 'SKILL_MATCH',
        priority: 2,
        weight: 0.25,
        conditions: [
          { field: 'installer.skills', operator: 'in', value: '' }
        ],
        actions: [
          { action: 'INCREASE_SCORE', parameters: { value: 30 } }
        ],
        isEnabled: true
      },
      {
        id: 'rule_003',
        name: '工作量限制',
        type: 'WORKLOAD_LIMIT',
        priority: 3,
        weight: 0.15,
        conditions: [
          { field: 'installer.utilizationRate', operator: '<', value: 0.8 }
        ],
        actions: [
          { action: 'INCREASE_SCORE', parameters: { value: 15 } }
        ],
        isEnabled: true
      },
      {
        id: 'rule_004',
        name: '评分阈值',
        type: 'RATING_THRESHOLD',
        priority: 4,
        weight: 0.15,
        conditions: [
          { field: 'installer.rating', operator: '>=', value: 4.0 }
        ],
        actions: [
          { action: 'INCREASE_SCORE', parameters: { value: 20 } }
        ],
        isEnabled: true
      },
      {
        id: 'rule_005',
        name: '难度匹配',
        type: 'DIFFICULTY_MATCH',
        priority: 5,
        weight: 0.15,
        conditions: [
          { field: 'installer.skills', operator: 'in', value: '' }
        ],
        actions: [
          { action: 'INCREASE_SCORE', parameters: { value: 25 } }
        ],
        isEnabled: true
      }
    ];
  }

  public async assignInstaller(input: AssignmentInput): Promise<AssignmentResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    logger.info(`开始执行安装派工: orderId=${input.orderId}`);

    const strategy = input.optimizationStrategy || this.defaultStrategy;
    const rules = input.assignmentRules || this.defaultRules;

    const availableInstallers = input.availableInstallers.filter(i => i.isAvailable);
    
    if (availableInstallers.length === 0) {
      logger.warn(`没有可用的安装师傅: orderId=${input.orderId}`);
      return {
        orderId: input.orderId,
        success: false,
        primaryAssignment: null,
        backupAssignments: [],
        scoreBreakdown: [],
        metadata: {
          assignedAt: new Date(),
          engineVersion: ENGINE_VERSION,
          optimizationStrategy: strategy,
          rulesApplied: [],
          totalInstallersConsidered: 0,
          totalTimeSlotsConsidered: 0,
          calculationTimeMs: Date.now() - startTime
        },
        warnings: ['没有可用的安装师傅']
      };
    }

    const timeSlots = this.generateAvailableTimeSlots(input.context);
    
    if (timeSlots.length === 0) {
      warnings.push('没有可用的时间段');
    }

    const optimizationResult = await this.optimizeAssignment(
      input,
      availableInstallers,
      timeSlots,
      rules,
      strategy
    );

    const calculationTimeMs = Date.now() - startTime;
    const rulesApplied = rules.filter(r => r.isEnabled).map(r => r.id);

    logger.info(`安装派工完成: orderId=${input.orderId}, time=${calculationTimeMs}ms`);

    return {
      orderId: input.orderId,
      success: optimizationResult.bestAssignment !== null,
      primaryAssignment: optimizationResult.bestAssignment,
      backupAssignments: optimizationResult.alternatives,
      scoreBreakdown: this.buildScoreBreakdown(optimizationResult),
      metadata: {
        assignedAt: new Date(),
        engineVersion: ENGINE_VERSION,
        optimizationStrategy: strategy,
        rulesApplied,
        totalInstallersConsidered: availableInstallers.length,
        totalTimeSlotsConsidered: timeSlots.length,
        calculationTimeMs
      },
      warnings: [...warnings, ...this.extractWarnings(optimizationResult)]
    };
  }

  private async optimizeAssignment(
    input: AssignmentInput,
    installers: InstallerInfo[],
    timeSlots: { date: Date; timeSlot: string; startTime: Date; endTime: Date }[],
    rules: AssignmentRule[],
    strategy: OptimizationStrategy
  ): Promise<AssignmentOptimizationResult> {
    const candidates: AssignmentCandidate[] = [];
    const conflicts: AssignmentConflict[] = [];

    for (const installer of installers) {
      for (const slot of timeSlots) {
        const validation = this.validateAssignment(input, installer, slot);
        
        if (!validation.valid) {
          conflicts.push(...validation.conflicts);
          continue;
        }

        const score = this.calculateInstallerScore(input, installer, slot, rules, strategy);
        
        const candidate: AssignmentCandidate = {
          installerId: installer.id,
          installerName: installer.name,
          score: score.totalScore,
          normalizedScore: 0,
          rank: 0,
          scheduledDate: slot.date,
          timeSlot: slot.timeSlot,
          estimatedStartTime: slot.startTime,
          estimatedEndTime: slot.endTime,
          reasoning: this.buildReasoning(input, installer, score),
          scoreComponents: this.buildScoreComponents(score)
        };

        candidates.push(candidate);
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const maxScore = candidates.length > 0 ? candidates[0].score : 1;
    candidates.forEach((c, index) => {
      c.normalizedScore = maxScore > 0 ? c.score / maxScore : 0;
      c.rank = index + 1;
    });

    return {
      bestAssignment: candidates[0] || null,
      alternatives: candidates.slice(1, 4),
      conflicts,
      optimizationDetails: {
        objective: this.getStrategyObjective(strategy),
        constraintsApplied: this.getConstraintsApplied(input),
        improvements: []
      }
    };
  }

  private validateAssignment(
    input: AssignmentInput,
    installer: InstallerInfo,
    slot: { date: Date; timeSlot: string; startTime: Date; endTime: Date }
  ): { valid: boolean; conflicts: AssignmentConflict[] } {
    const conflicts: AssignmentConflict[] = [];

    const distance = this.calculateDistance(input.context.customerAddress, installer);
    
    if (distance > MAX_DISTANCE_KM) {
      conflicts.push({
        type: 'DISTANCE_EXCEEDED',
        severity: 'WARNING',
        message: `距离超出范围: ${distance.toFixed(2)}km > ${MAX_DISTANCE_KM}km`,
        installerId: installer.id,
        affectedOrders: [input.orderId]
      });
    }

    const workload = this.estimateWorkload(installer, slot.date);
    
    if (workload.utilizationRate > 0.9) {
      conflicts.push({
        type: 'WORKLOAD_EXCEEDED',
        severity: 'CRITICAL',
        message: `工作量超出限制: ${(workload.utilizationRate * 100).toFixed(1)}%`,
        installerId: installer.id,
        affectedOrders: [input.orderId]
      });
    }

    const skillMatch = this.evaluateSkillMatch(input.context, installer);
    
    if (skillMatch.matchPercentage < 0.3) {
      conflicts.push({
        type: 'SKILL_MISMATCH',
        severity: 'WARNING',
        message: `技能匹配度较低: ${(skillMatch.matchPercentage * 100).toFixed(1)}%`,
        installerId: installer.id,
        affectedOrders: [input.orderId]
      });
    }

    const criticalConflicts = conflicts.filter(c => c.severity === 'CRITICAL');
    
    return {
      valid: criticalConflicts.length === 0,
      conflicts
    };
  }

  private calculateInstallerScore(
    input: AssignmentInput,
    installer: InstallerInfo,
    slot: { date: Date; timeSlot: string; startTime: Date; endTime: Date },
    rules: AssignmentRule[],
    strategy: OptimizationStrategy
  ): InstallerScore {
    const score: InstallerScore = {
      installerId: installer.id,
      totalScore: 0,
      breakdown: {
        availability: 0,
        distance: 0,
        skills: 0,
        workload: 0,
        rating: 0,
        history: 0,
        specialRequirements: 0
      }
    };

    score.breakdown.availability = this.scoreAvailability(input, slot);
    score.breakdown.distance = this.scoreDistance(input.context.customerAddress, installer);
    score.breakdown.skills = this.scoreSkills(input.context, installer);
    score.breakdown.workload = this.scoreWorkload(installer, slot.date);
    score.breakdown.rating = this.scoreRating(installer);
    score.breakdown.history = this.scoreHistory(installer);
    score.breakdown.specialRequirements = this.scoreSpecialRequirements(input.context, installer);

    const weights = this.getStrategyWeights(strategy);

    score.totalScore = 
      score.breakdown.availability * weights.availability +
      score.breakdown.distance * weights.distance +
      score.breakdown.skills * weights.skills +
      score.breakdown.workload * weights.workload +
      score.breakdown.rating * weights.rating +
      score.breakdown.history * weights.history +
      score.breakdown.specialRequirements * weights.specialRequirements;

    for (const rule of rules.filter(r => r.isEnabled)) {
      if (this.shouldApplyRule(rule, input, installer)) {
        for (const action of rule.actions) {
          if (action.action === 'INCREASE_SCORE') {
            score.totalScore += action.parameters.value * rule.weight;
          } else if (action.action === 'DECREASE_SCORE') {
            score.totalScore -= action.parameters.value * rule.weight;
          }
        }
      }
    }

    return score;
  }

  private scoreAvailability(
    input: AssignmentInput,
    slot: { date: Date; timeSlot: string; startTime: Date; endTime: Date }
  ): number {
    if (input.context.preferredDate && 
        slot.date.toDateString() === input.context.preferredDate.toDateString()) {
      return 100;
    }

    if (input.context.timeSlot && slot.timeSlot === input.context.timeSlot) {
      return 80;
    }

    return 60;
  }

  private scoreDistance(address: Address, installer: InstallerInfo): number {
    const distance = this.calculateDistance(address, installer);
    
    if (distance <= 5) return 100;
    if (distance <= 10) return 90;
    if (distance <= 20) return 75;
    if (distance <= 30) return 60;
    if (distance <= 50) return 40;
    
    return 10;
  }

  private scoreSkills(context: InstallationAssignmentContext, installer: InstallerInfo): number {
    const skillMatch = this.evaluateSkillMatch(context, installer);
    
    return skillMatch.matchPercentage * 100;
  }

  private scoreWorkload(installer: InstallerInfo, date: Date): number {
    const workload = this.estimateWorkload(installer, date);
    
    if (workload.utilizationRate <= 0.3) return 100;
    if (workload.utilizationRate <= 0.5) return 80;
    if (workload.utilizationRate <= 0.7) return 60;
    if (workload.utilizationRate <= 0.85) return 40;
    
    return 10;
  }

  private scoreRating(installer: InstallerInfo): number {
    if (installer.rating >= 4.8) return 100;
    if (installer.rating >= 4.5) return 90;
    if (installer.rating >= 4.0) return 75;
    if (installer.rating >= 3.5) return 60;
    if (installer.rating >= 3.0) return 40;
    
    return 20;
  }

  private scoreHistory(installer: InstallerInfo): number {
    const totalInstallations = installer.totalInstallations;
    
    if (totalInstallations >= 500) return 100;
    if (totalInstallations >= 200) return 90;
    if (totalInstallations >= 100) return 75;
    if (totalInstallations >= 50) return 60;
    if (totalInstallations >= 20) return 50;
    if (totalInstallations >= 10) return 40;
    
    return 30;
  }

  private scoreSpecialRequirements(context: InstallationAssignmentContext, installer: InstallerInfo): number {
    if (context.specialRequirements.length === 0) {
      return 100;
    }

    let matchedCount = 0;
    for (const req of context.specialRequirements) {
      if (installer.skills.includes(req)) {
        matchedCount++;
      }
    }

    return (matchedCount / context.specialRequirements.length) * 100;
  }

  private getStrategyWeights(strategy: OptimizationStrategy): {
    availability: number;
    distance: number;
    skills: number;
    workload: number;
    rating: number;
    history: number;
    specialRequirements: number;
  } {
    const weights = {
      availability: 0.15,
      distance: 0.15,
      skills: 0.20,
      workload: 0.15,
      rating: 0.15,
      history: 0.10,
      specialRequirements: 0.10
    };

    switch (strategy) {
      case 'FASTEST_COMPLETION':
        weights.availability = 0.25;
        weights.distance = 0.20;
        weights.workload = 0.20;
        weights.skills = 0.15;
        weights.rating = 0.10;
        weights.history = 0.05;
        weights.specialRequirements = 0.05;
        break;

      case 'LOWEST_COST':
        weights.workload = 0.25;
        weights.distance = 0.25;
        weights.availability = 0.15;
        weights.skills = 0.15;
        weights.rating = 0.10;
        weights.history = 0.05;
        weights.specialRequirements = 0.05;
        break;

      case 'HIGHEST_RATING':
        weights.rating = 0.30;
        weights.history = 0.25;
        weights.skills = 0.20;
        weights.availability = 0.10;
        weights.distance = 0.08;
        weights.workload = 0.05;
        weights.specialRequirements = 0.02;
        break;

      case 'BALANCED_WORKLOAD':
        weights.workload = 0.25;
        weights.availability = 0.20;
        weights.distance = 0.15;
        weights.skills = 0.15;
        weights.rating = 0.10;
        weights.history = 0.08;
        weights.specialRequirements = 0.07;
        break;

      case 'CUSTOMER_PREFERENCE':
        weights.availability = 0.30;
        weights.specialRequirements = 0.20;
        weights.skills = 0.15;
        weights.rating = 0.15;
        weights.distance = 0.10;
        weights.workload = 0.06;
        weights.history = 0.04;
        break;
    }

    return weights;
  }

  private getStrategyObjective(strategy: OptimizationStrategy): string {
    const objectives: Record<OptimizationStrategy, string> = {
      'FASTEST_COMPLETION': '以最快完成为目标，优先考虑可用性和距离',
      'LOWEST_COST': '以最低成本为目标，优先考虑工作量和距离',
      'HIGHEST_RATING': '以最高评级为目标，优先考虑师傅评分和历史记录',
      'BALANCED_WORKLOAD': '以均衡工作量为目标，确保师傅工作量合理分配',
      'CUSTOMER_PREFERENCE': '以客户偏好为目标，优先考虑时间和特殊需求'
    };
    return objectives[strategy];
  }

  private getConstraintsApplied(input: AssignmentInput): string[] {
    const constraints: string[] = [];

    if (input.context.preferredDate) {
      constraints.push('客户偏好日期');
    }
    if (input.context.timeSlot) {
      constraints.push('客户偏好时间段');
    }
    if (input.context.specialRequirements.length > 0) {
      constraints.push('特殊技能要求');
    }
    if (input.context.difficultyLevel !== 'MEDIUM') {
      constraints.push(`难度等级: ${input.context.difficultyLevel}`);
    }

    return constraints;
  }

  private calculateDistance(address: Address, installer: InstallerInfo): number {
    const cacheKey = `${address.longitude},${address.latitude}-${installer.id}`;
    
    if (this.distanceCache.has(cacheKey)) {
      return this.distanceCache.get(cacheKey)!.distance;
    }

    const distance = this.estimateDistanceByLocation(address, installer);
    
    this.distanceCache.set(cacheKey, {
      distance,
      estimatedTime: Math.ceil(distance / AVG_SPEED_KMH * 60)
    });

    return distance;
  }

  private estimateDistanceByLocation(address: Address, installer: InstallerInfo): number {
    let baseDistance = 10;

    if (installer.serviceArea.priorityAreas.length > 0) {
      const isPriorityArea = installer.serviceArea.priorityAreas.some(area => 
        address.district?.includes(area) || 
        address.city?.includes(area)
      );
      
      if (isPriorityArea) {
        baseDistance = 5;
      }
    }

    if (installer.serviceArea.districts.length > 0) {
      const isInDistrict = installer.serviceArea.districts.includes(address.district || '');
      
      if (!isInDistrict) {
        baseDistance += 10;
      }
    }

    return baseDistance + Math.random() * 15;
  }

  private evaluateSkillMatch(context: InstallationAssignmentContext, installer: InstallerInfo): SkillMatchInfo {
    const requiredSkills = this.getRequiredSkills(context);
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const skill of requiredSkills) {
      if (installer.skills.includes(skill)) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    }

    for (const req of context.specialRequirements) {
      if (installer.skills.includes(req)) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    }

    const matchPercentage = requiredSkills.length > 0 
      ? matchedSkills.length / Math.max(requiredSkills.length, 1)
      : 1.0;

    return {
      installerSkills: installer.skills,
      requiredSkills,
      matchedSkills,
      missingSkills,
      matchPercentage
    };
  }

  private getRequiredSkills(context: InstallationAssignmentContext): string[] {
    const skills: string[] = [];

    const difficultySkills: Record<DifficultyLevel, string[]> = {
      'EASY': ['basic_installation'],
      'MEDIUM': ['basic_installation', 'cabinet_assembly'],
      'HARD': ['basic_installation', 'cabinet_assembly', 'custom_fitting'],
      'EXPERT': ['basic_installation', 'cabinet_assembly', 'custom_fitting', 'special_woodworking']
    };

    skills.push(...difficultySkills[context.difficultyLevel]);

    for (const item of context.installationItems) {
      const itemSkills = this.getItemSkills(item.type);
      for (const skill of itemSkills) {
        if (!skills.includes(skill)) {
          skills.push(skill);
        }
      }
    }

    return skills;
  }

  private getItemSkills(itemType: string): string[] {
    const skillMap: Record<string, string[]> = {
      'wardrobe': ['wardrobe_installation', 'hinge_adjustment'],
      'cabinet': ['cabinet_assembly', 'drawer_installation'],
      'bed': ['bed_assembly', 'heavy_lifting'],
      'desk': ['desk_assembly'],
      'bookshelf': ['shelf_installation', 'wall_mounting'],
      'dining_table': ['table_assembly'],
      'tv_cabinet': ['tv_cabinet_installation', 'cable_management'],
      'drawer': ['drawer_slide_installation']
    };

    return skillMap[itemType.toLowerCase()] || [];
  }

  private estimateWorkload(installer: InstallerInfo, date: Date): WorkloadInfo {
    const maxDailyCapacity = installer.maxWorkload || 8;
    const estimatedDailyLoad = installer.currentWorkload;
    const remainingCapacity = maxDailyCapacity - estimatedDailyLoad;
    const utilizationRate = estimatedDailyLoad / maxDailyCapacity;

    return {
      installerId: installer.id,
      currentDate: date,
      assignedOrders: Math.floor(estimatedDailyLoad / 2),
      assignedDuration: estimatedDailyLoad,
      maxDailyCapacity,
      maxWeeklyCapacity: maxDailyCapacity * 5,
      remainingCapacity,
      utilizationRate
    };
  }

  private generateAvailableTimeSlots(context: InstallationAssignmentContext): {
    date: Date;
    timeSlot: string;
    startTime: Date;
    endTime: Date;
  }[] {
    const slots: { date: Date; timeSlot: string; startTime: Date; endTime: Date }[] = [];
    
    const now = new Date();
    let startDate = context.preferredDate || new Date(now.getTime() + 86400000);

    if (startDate < now) {
      startDate = new Date(now.getTime() + 86400000);
    }

    const timeRanges = [
      { slot: 'morning', start: 8, end: 12 },
      { slot: 'afternoon', start: 14, end: 18 },
      { slot: 'evening', start: 18, end: 20 }
    ];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(startDate.getTime() + dayOffset * 86400000);
      
      if (date.getDay() === 0) {
        continue;
      }

      for (const range of timeRanges) {
        const startTime = new Date(date);
        startTime.setHours(range.start, 0, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(range.end, 0, 0, 0);

        if (context.timeSlot && range.slot !== context.timeSlot) {
          continue;
        }

        slots.push({
          date,
          timeSlot: range.slot,
          startTime,
          endTime
        });
      }
    }

    return slots;
  }

  private shouldApplyRule(
    rule: AssignmentRule,
    input: AssignmentInput,
    installer: InstallerInfo
  ): boolean {
    for (const condition of rule.conditions) {
      let value: any;

      if (condition.field.startsWith('installer.')) {
        const field = condition.field.replace('installer.', '');
        value = (installer as any)[field];
      } else if (condition.field.startsWith('context.')) {
        const field = condition.field.replace('context.', '');
        value = (input.context as any)[field];
      } else {
        value = undefined;
      }

      if (!this.evaluateCondition(value, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(
    value: any,
    operator: string,
    conditionValue: any
  ): boolean {
    switch (operator) {
      case '>':
        return value > conditionValue;
      case '>=':
        return value >= conditionValue;
      case '<':
        return value < conditionValue;
      case '<=':
        return value <= conditionValue;
      case '==':
      case '=':
        return value === conditionValue;
      case '!=':
        return value !== conditionValue;
      case 'in':
        return Array.isArray(value) && 
               Array.isArray(conditionValue) && 
               value.some(v => conditionValue.includes(v));
      case 'contains':
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return typeof value === 'string' && value.includes(conditionValue);
      default:
        return true;
    }
  }

  private buildScoreComponents(score: InstallerScore): ScoreComponent[] {
    return [
      {
        category: '可用性',
        score: score.breakdown.availability,
        maxScore: 100,
        weight: 0.15,
        description: '时间和日期匹配度'
      },
      {
        category: '距离',
        score: score.breakdown.distance,
        maxScore: 100,
        weight: 0.15,
        description: '与客户地址的距离'
      },
      {
        category: '技能',
        score: score.breakdown.skills,
        maxScore: 100,
        weight: 0.20,
        description: '技能匹配度'
      },
      {
        category: '工作量',
        score: score.breakdown.workload,
        maxScore: 100,
        weight: 0.15,
        description: '当前工作量负载'
      },
      {
        category: '评分',
        score: score.breakdown.rating,
        maxScore: 100,
        weight: 0.15,
        description: '历史客户评分'
      },
      {
        category: '经验',
        score: score.breakdown.history,
        maxScore: 100,
        weight: 0.10,
        description: '安装经验丰富度'
      },
      {
        category: '特殊需求',
        score: score.breakdown.specialRequirements,
        maxScore: 100,
        weight: 0.10,
        description: '特殊需求匹配度'
      }
    ];
  }

  private buildReasoning(
    input: AssignmentInput,
    installer: InstallerInfo,
    score: InstallerScore
  ): string {
    const reasons: string[] = [];

    if (score.breakdown.skills >= 80) {
      reasons.push('技能高度匹配');
    } else if (score.breakdown.skills >= 60) {
      reasons.push('技能匹配度良好');
    }

    if (score.breakdown.distance >= 80) {
      reasons.push('距离较近');
    } else if (score.breakdown.distance >= 60) {
      reasons.push('距离适中');
    }

    if (score.breakdown.rating >= 80) {
      reasons.push('客户评分优秀');
    } else if (score.breakdown.rating >= 60) {
      reasons.push('客户评分良好');
    }

    if (score.breakdown.workload >= 80) {
      reasons.push('时间安排灵活');
    }

    if (reasons.length === 0) {
      reasons.push('综合评分符合要求');
    }

    return reasons.join('，');
  }

  private buildScoreBreakdown(result: AssignmentOptimizationResult): ScoreBreakdown[] {
    const breakdowns: ScoreBreakdown[] = [];

    if (result.bestAssignment) {
      breakdowns.push({
        installerId: result.bestAssignment.installerId,
        installerName: result.bestAssignment.installerName,
        totalScore: result.bestAssignment.score,
        components: result.bestAssignment.scoreComponents
      });
    }

    for (const alt of result.alternatives) {
      breakdowns.push({
        installerId: alt.installerId,
        installerName: alt.installerName,
        totalScore: alt.score,
        components: alt.scoreComponents
      });
    }

    return breakdowns;
  }

  private extractWarnings(result: AssignmentOptimizationResult): string[] {
    const warnings: string[] = [];

    for (const conflict of result.conflicts) {
      if (conflict.severity === 'WARNING' || conflict.severity === 'INFO') {
        warnings.push(conflict.message);
      }
    }

    if (result.alternatives.length === 0) {
      warnings.push('没有备选安装师傅');
    }

    return warnings;
  }

  public getDefaultRules(): AssignmentRule[] {
    return [...this.defaultRules];
  }

  public updateRules(rules: AssignmentRule[]): void {
    this.defaultRules = rules;
  }

  public getDefaultStrategy(): OptimizationStrategy {
    return this.defaultStrategy;
  }

  public setDefaultStrategy(strategy: OptimizationStrategy): void {
    this.defaultStrategy = strategy;
  }

  public clearDistanceCache(): void {
    this.distanceCache.clear();
  }
}

export const installationEngine = new InstallationEngine();

export default InstallationEngine;
