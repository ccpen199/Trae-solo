import { AppDataSource } from '../data-source.js';
import { Expert, ExpertStatus, ExpertCertificationLevel } from '../entities/Expert.js';
import { ExpertAssignment, AssignmentStatus, AssignmentPriority } from '../entities/ExpertAssignment.js';
import { Dispute, DisputeCategory, DisputePriority } from '../entities/Dispute.js';
import { In } from 'typeorm';

export interface ExpertMatchScore {
  expert: Expert;
  totalScore: number;
  breakdown: {
    specialtyMatch: number;
    distanceScore: number;
    availabilityScore: number;
    workloadScore: number;
    ratingScore: number;
    certificationScore: number;
  };
}

export interface AssignmentResult {
  success: boolean;
  assignment?: ExpertAssignment;
  matchedExperts?: ExpertMatchScore[];
  reason?: string;
}

export class ExpertAssignmentEngine {
  private expertRepository = AppDataSource.getRepository(Expert);
  private assignmentRepository = AppDataSource.getRepository(ExpertAssignment);
  private disputeRepository = AppDataSource.getRepository(Dispute);

  async assignExpertToDispute(disputeId: string): Promise<AssignmentResult> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ['order'],
    });

    if (!dispute) {
      return {
        success: false,
        reason: '纠纷不存在',
      };
    }

    const candidates = await this.findEligibleExperts(dispute);

    if (candidates.length === 0) {
      return {
        success: false,
        reason: '没有找到符合条件的专家',
      };
    }

    const scoredExperts = await this.scoreExperts(candidates, dispute);

    if (scoredExperts.length === 0) {
      return {
        success: false,
        reason: '专家评分失败',
      };
    }

    const topExpert = scoredExperts[0];
    const assignment = await this.createAssignment(topExpert.expert, dispute, scoredExperts);

    return {
      success: true,
      assignment,
      matchedExperts: scoredExperts,
    };
  }

  private async findEligibleExperts(dispute: Dispute): Promise<Expert[]> {
    const query = this.expertRepository
      .createQueryBuilder('expert')
      .where('expert.status = :status', { status: ExpertStatus.ACTIVE });

    if (dispute.category) {
      const specialtyMap: Record<DisputeCategory, string[]> = {
        [DisputeCategory.PRODUCT_QUALITY]: ['产品质量', '农药检测', '化肥检测'],
        [DisputeCategory.PEST_DAMAGE]: ['病虫害防治', '植物保护', '农药应用'],
        [DisputeCategory.INEFFECTIVE]: ['农药效果', '化肥效果', '作物营养'],
        [DisputeCategory.SIDE_EFFECT]: ['药害评估', '植物毒性', '环境影响'],
        [DisputeCategory.WRONG_PRODUCT]: ['产品鉴定', '标签审核'],
        [DisputeCategory.PRICE_DISPUTE]: ['市场分析', '价格评估'],
        [DisputeCategory.LOGISTICS_ISSUE]: ['物流管理', '冷链技术'],
        [DisputeCategory.OTHER]: ['综合评估'],
      };

      const targetSpecialties = specialtyMap[dispute.category] || ['综合评估'];
      
      query.andWhere(
        `(
          expert.specialties IS NULL 
          OR ARRAY_LENGTH(expert.specialties, 1) = 0
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(expert.specialties) AS s
            WHERE s = ANY(:targetSpecialties)
          )
        )`,
        { targetSpecialties }
      );
    }

    query.andWhere('expert.pendingAssignments < 5');

    return query.getMany();
  }

  private async scoreExperts(
    experts: Expert[],
    dispute: Dispute
  ): Promise<ExpertMatchScore[]> {
    const now = new Date();
    const results: ExpertMatchScore[] = [];

    for (const expert of experts) {
      const breakdown = {
        specialtyMatch: this.calculateSpecialtyMatch(expert, dispute),
        distanceScore: this.calculateDistanceScore(expert, dispute),
        availabilityScore: this.calculateAvailabilityScore(expert, now),
        workloadScore: this.calculateWorkloadScore(expert),
        ratingScore: this.calculateRatingScore(expert),
        certificationScore: this.calculateCertificationScore(expert),
      };

      const totalScore = this.calculateTotalScore(breakdown, dispute.priority);

      results.push({
        expert,
        totalScore,
        breakdown,
      });
    }

    return results.sort((a, b) => b.totalScore - a.totalScore);
  }

  private calculateSpecialtyMatch(expert: Expert, dispute: Dispute): number {
    if (!expert.specialties || expert.specialties.length === 0) {
      return 30;
    }

    const categorySpecialtyMap: Record<DisputeCategory, string[]> = {
      [DisputeCategory.PRODUCT_QUALITY]: ['产品质量', '农药检测', '化肥检测'],
      [DisputeCategory.PEST_DAMAGE]: ['病虫害防治', '植物保护', '农药应用'],
      [DisputeCategory.INEFFECTIVE]: ['农药效果', '化肥效果', '作物营养'],
      [DisputeCategory.SIDE_EFFECT]: ['药害评估', '植物毒性', '环境影响'],
      [DisputeCategory.WRONG_PRODUCT]: ['产品鉴定', '标签审核'],
      [DisputeCategory.PRICE_DISPUTE]: ['市场分析', '价格评估'],
      [DisputeCategory.LOGISTICS_ISSUE]: ['物流管理', '冷链技术'],
      [DisputeCategory.OTHER]: ['综合评估'],
    };

    const targetSpecialties = categorySpecialtyMap[dispute.category] || ['综合评估'];
    const expertSpecialties = expert.specialties;

    let matchScore = 0;
    for (const target of targetSpecialties) {
      if (expertSpecialties.includes(target)) {
        matchScore += 50;
      }
    }

    return Math.min(100, matchScore);
  }

  private calculateDistanceScore(expert: Expert, dispute: Dispute): number {
    if (!expert.baseLatitude || !expert.baseLongitude) {
      return 50;
    }

    const maxRadius = expert.maxServiceRadiusKm || 50;

    let disputeLat: number | null = null;
    let disputeLng: number | null = null;

    if (dispute.order) {
      disputeLat = dispute.order.deliveryLatitude;
      disputeLng = dispute.order.deliveryLongitude;
    }

    if (disputeLat === null || disputeLng === null) {
      return 50;
    }

    const distance = this.haversineDistance(
      expert.baseLatitude,
      expert.baseLongitude,
      disputeLat,
      disputeLng
    );

    if (distance <= maxRadius * 0.3) {
      return 100;
    } else if (distance <= maxRadius * 0.6) {
      return 75;
    } else if (distance <= maxRadius) {
      return 50;
    } else {
      return 10;
    }
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateAvailabilityScore(expert: Expert, date: Date): number {
    return expert.isAvailableAt(date) ? 100 : 20;
  }

  private calculateWorkloadScore(expert: Expert): number {
    const pending = expert.pendingAssignments;
    
    if (pending === 0) {
      return 100;
    } else if (pending < 2) {
      return 80;
    } else if (pending < 4) {
      return 60;
    } else if (pending < 5) {
      return 30;
    } else {
      return 10;
    }
  }

  private calculateRatingScore(expert: Expert): number {
    if (expert.ratingCount === 0) {
      return 60;
    }

    const rating = expert.averageRating || 0;
    return Math.round(rating * 20);
  }

  private calculateCertificationScore(expert: Expert): number {
    const scoreMap: Record<ExpertCertificationLevel, number> = {
      [ExpertCertificationLevel.JUNIOR]: 40,
      [ExpertCertificationLevel.INTERMEDIATE]: 60,
      [ExpertCertificationLevel.SENIOR]: 85,
      [ExpertCertificationLevel.CHIEF]: 100,
    };

    return scoreMap[expert.certificationLevel] || 40;
  }

  private calculateTotalScore(
    breakdown: ExpertMatchScore['breakdown'],
    priority: DisputePriority
  ): number {
    const baseWeights = {
      specialtyMatch: 0.25,
      distanceScore: 0.2,
      availabilityScore: 0.15,
      workloadScore: 0.15,
      ratingScore: 0.15,
      certificationScore: 0.1,
    };

    const weights = { ...baseWeights };

    if (priority === DisputePriority.URGENT) {
      weights.availabilityScore = 0.25;
      weights.workloadScore = 0.2;
      weights.specialtyMatch = 0.2;
    } else if (priority === DisputePriority.HIGH) {
      weights.availabilityScore = 0.2;
      weights.workloadScore = 0.18;
    }

    let totalScore = 0;
    totalScore += breakdown.specialtyMatch * weights.specialtyMatch;
    totalScore += breakdown.distanceScore * weights.distanceScore;
    totalScore += breakdown.availabilityScore * weights.availabilityScore;
    totalScore += breakdown.workloadScore * weights.workloadScore;
    totalScore += breakdown.ratingScore * weights.ratingScore;
    totalScore += breakdown.certificationScore * weights.certificationScore;

    return Math.round(totalScore);
  }

  private async createAssignment(
    expert: Expert,
    dispute: Dispute,
    scoredExperts: ExpertMatchScore[]
  ): Promise<ExpertAssignment> {
    const assignment = this.assignmentRepository.create({
      assignmentNumber: this.generateAssignmentNumber(),
      status: AssignmentStatus.PENDING,
      priority: this.mapDisputePriority(dispute.priority),
      description: dispute.description,
      requiredSpecialties: this.getRequiredSpecialties(dispute.category),
      deadline: this.calculateDeadline(dispute.priority),
      expertId: expert.id,
      expert,
      disputeId: dispute.id,
      dispute,
      assignmentScores: {
        matchScore: scoredExperts[0]?.breakdown.specialtyMatch || 0,
        distanceScore: scoredExperts[0]?.breakdown.distanceScore || 0,
        availabilityScore: scoredExperts[0]?.breakdown.availabilityScore || 0,
        workloadScore: scoredExperts[0]?.breakdown.workloadScore || 0,
        totalScore: scoredExperts[0]?.totalScore || 0,
      },
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    expert.pendingAssignments += 1;
    expert.totalAssignments += 1;
    await this.expertRepository.save(expert);

    return savedAssignment;
  }

  private mapDisputePriority(priority: DisputePriority): AssignmentPriority {
    const map: Record<DisputePriority, AssignmentPriority> = {
      [DisputePriority.LOW]: AssignmentPriority.LOW,
      [DisputePriority.MEDIUM]: AssignmentPriority.MEDIUM,
      [DisputePriority.HIGH]: AssignmentPriority.HIGH,
      [DisputePriority.URGENT]: AssignmentPriority.URGENT,
    };
    return map[priority] || AssignmentPriority.MEDIUM;
  }

  private getRequiredSpecialties(category: DisputeCategory): string[] {
    const map: Record<DisputeCategory, string[]> = {
      [DisputeCategory.PRODUCT_QUALITY]: ['产品质量'],
      [DisputeCategory.PEST_DAMAGE]: ['病虫害防治'],
      [DisputeCategory.INEFFECTIVE]: ['农药效果'],
      [DisputeCategory.SIDE_EFFECT]: ['药害评估'],
      [DisputeCategory.WRONG_PRODUCT]: ['产品鉴定'],
      [DisputeCategory.PRICE_DISPUTE]: ['价格评估'],
      [DisputeCategory.LOGISTICS_ISSUE]: ['冷链技术'],
      [DisputeCategory.OTHER]: ['综合评估'],
    };
    return map[category] || ['综合评估'];
  }

  private calculateDeadline(priority: DisputePriority): Date {
    const deadline = new Date();
    const hoursMap: Record<DisputePriority, number> = {
      [DisputePriority.URGENT]: 24,
      [DisputePriority.HIGH]: 48,
      [DisputePriority.MEDIUM]: 72,
      [DisputePriority.LOW]: 120,
    };
    const hours = hoursMap[priority] || 72;
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  private generateAssignmentNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EA-${dateStr}-${random}`;
  }

  async reassignExpert(assignmentId: string, reason: string): Promise<AssignmentResult> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['expert', 'dispute'],
    });

    if (!assignment) {
      return {
        success: false,
        reason: '分派记录不存在',
      };
    }

    if (assignment.expert) {
      assignment.expert.pendingAssignments = Math.max(0, assignment.expert.pendingAssignments - 1);
      await this.expertRepository.save(assignment.expert);
    }

    assignment.status = AssignmentStatus.REJECTED;
    assignment.rejectionReason = reason;
    await this.assignmentRepository.save(assignment);

    if (!assignment.dispute) {
      return {
        success: false,
        reason: '关联纠纷不存在',
      };
    }

    return this.assignExpertToDispute(assignment.dispute.id);
  }
}

export const expertAssignmentEngine = new ExpertAssignmentEngine();
