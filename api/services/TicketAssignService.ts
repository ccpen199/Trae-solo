import { UserRepository } from '../repositories/UserRepository.js';
import type { User, WorkTicket, TicketAssignResult } from '../types/index.js';

interface CandidateScore {
  staff: User;
  score: number;
  skillMatch: number;
  workloadScore: number;
  responseScore: number;
  fulfillmentScore: number;
}

export class TicketAssignService {
  private userRepository: UserRepository;

  private readonly SKILL_WEIGHT = 0.4;
  private readonly WORKLOAD_WEIGHT = 0.25;
  private readonly RESPONSE_WEIGHT = 0.2;
  private readonly FULFILLMENT_WEIGHT = 0.15;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public autoAssign(ticket: WorkTicket): TicketAssignResult | null {
    const candidates = this.userRepository.findActivePropertyStaff();
    
    if (candidates.length === 0) {
      return null;
    }

    const skillsRequired = ticket.skills_required 
      ? ticket.skills_required.split(',').map(s => s.trim()) 
      : this.inferSkillsFromTicket(ticket);

    const scoredCandidates: CandidateScore[] = candidates.map(staff => {
      const skillMatch = this.calculateSkillMatch(staff, skillsRequired);
      const workloadScore = this.calculateWorkloadScore(staff.id);
      const responseScore = this.calculateResponseScore(staff.id, ticket.priority);
      const fulfillmentScore = this.calculateFulfillmentScore(staff.id);

      const totalScore = 
        skillMatch * this.SKILL_WEIGHT +
        workloadScore * this.WORKLOAD_WEIGHT +
        responseScore * this.RESPONSE_WEIGHT +
        fulfillmentScore * this.FULFILLMENT_WEIGHT;

      return {
        staff,
        score: totalScore,
        skillMatch,
        workloadScore,
        responseScore,
        fulfillmentScore,
      };
    });

    scoredCandidates.sort((a, b) => b.score - a.score);

    const bestCandidate = scoredCandidates[0];
    const reason = this.generateAssignReason(bestCandidate, skillsRequired);

    return {
      assignee_id: bestCandidate.staff.id,
      score: Math.round(bestCandidate.score * 100) / 100,
      reason,
    };
  }

  public getCandidateScores(ticket: WorkTicket): TicketAssignResult[] {
    const candidates = this.userRepository.findActivePropertyStaff();
    
    if (candidates.length === 0) {
      return [];
    }

    const skillsRequired = ticket.skills_required 
      ? ticket.skills_required.split(',').map(s => s.trim()) 
      : this.inferSkillsFromTicket(ticket);

    const results: TicketAssignResult[] = candidates.map(staff => {
      const skillMatch = this.calculateSkillMatch(staff, skillsRequired);
      const workloadScore = this.calculateWorkloadScore(staff.id);
      const responseScore = this.calculateResponseScore(staff.id, ticket.priority);
      const fulfillmentScore = this.calculateFulfillmentScore(staff.id);

      const totalScore = 
        skillMatch * this.SKILL_WEIGHT +
        workloadScore * this.WORKLOAD_WEIGHT +
        responseScore * this.RESPONSE_WEIGHT +
        fulfillmentScore * this.FULFILLMENT_WEIGHT;

      return {
        assignee_id: staff.id,
        score: Math.round(totalScore * 100) / 100,
        reason: `${staff.name}: 技能匹配${Math.round(skillMatch * 100)}%, 负载${Math.round(workloadScore * 100)}%, 响应${Math.round(responseScore * 100)}%, 履约${Math.round(fulfillmentScore * 100)}%`,
      };
    });

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  private inferSkillsFromTicket(ticket: WorkTicket): string[] {
    const skills: string[] = [];
    const titleDesc = `${ticket.title} ${ticket.description}`.toLowerCase();

    if (ticket.type === 'repair') {
      if (titleDesc.includes('水') || titleDesc.includes('水管') || titleDesc.includes('漏水')) {
        skills.push('管道疏通');
      }
      if (titleDesc.includes('电') || titleDesc.includes('灯') || titleDesc.includes('插座')) {
        skills.push('水电维修');
      }
      if (titleDesc.includes('门') || titleDesc.includes('窗') || titleDesc.includes('锁')) {
        skills.push('门窗维修');
      }
      if (titleDesc.includes('空调') || titleDesc.includes('冰箱') || titleDesc.includes('洗衣机')) {
        skills.push('家电维修');
      }
      if (titleDesc.includes('网络') || titleDesc.includes('wifi') || titleDesc.includes('宽带')) {
        skills.push('网络维护');
      }
    }

    if (ticket.type === 'complaint' || titleDesc.includes('垃圾') || titleDesc.includes('卫生') || titleDesc.includes('清洁')) {
      skills.push('保洁服务');
    }

    if (titleDesc.includes('绿化') || titleDesc.includes('花草') || titleDesc.includes('树木')) {
      skills.push('绿化养护');
    }

    if (titleDesc.includes('电梯') || titleDesc.includes('消防') || titleDesc.includes('公共')) {
      skills.push('公共设施');
    }

    if (skills.length === 0) {
      skills.push('水电维修');
    }

    return skills;
  }

  private calculateSkillMatch(staff: User, requiredSkills: string[]): number {
    if (!staff.skills || requiredSkills.length === 0) {
      return 0.6;
    }

    const staffSkills = staff.skills.split(',').map(s => s.trim());
    let matchedCount = 0;

    for (const skill of requiredSkills) {
      if (staffSkills.some(s => s.includes(skill) || skill.includes(s))) {
        matchedCount++;
      }
    }

    return matchedCount / requiredSkills.length;
  }

  private calculateWorkloadScore(staffId: number): number {
    const performance = this.userRepository.getStaffPerformance(staffId) as {
      total_tickets: number;
      completed_tickets: number;
      cancelled_tickets: number;
      avg_rating: number;
    } | null;

    if (!performance) {
      return 0.8;
    }

    const activeTickets = performance.total_tickets - performance.completed_tickets - performance.cancelled_tickets;
    const maxWorkload = 10;
    const workloadRatio = Math.min(activeTickets / maxWorkload, 1);
    return 1 - workloadRatio * 0.5;
  }

  private calculateResponseScore(staffId: number, priority: string): number {
    const avgResponseDays = this.userRepository.getStaffResponseTime(staffId);
    
    const expectedResponseDays = {
      urgent: 0.1,
      high: 0.25,
      medium: 0.5,
      low: 1,
    };

    const expected = expectedResponseDays[priority as keyof typeof expectedResponseDays] || 0.5;
    
    if (avgResponseDays <= expected) {
      return 1;
    }
    
    const ratio = expected / avgResponseDays;
    return Math.max(ratio, 0.3);
  }

  private calculateFulfillmentScore(staffId: number): number {
    const fulfillmentRate = this.userRepository.getStaffFulfillmentRate(staffId);
    return fulfillmentRate;
  }

  private generateAssignReason(candidate: CandidateScore, requiredSkills: string[]): string {
    const reasons: string[] = [];
    
    reasons.push(`综合评分: ${Math.round(candidate.score * 100)}分`);
    
    if (candidate.skillMatch >= 0.8) {
      reasons.push(`技能高度匹配: ${requiredSkills.join('、')}`);
    } else if (candidate.skillMatch >= 0.5) {
      reasons.push(`技能部分匹配`);
    }

    if (candidate.workloadScore >= 0.8) {
      reasons.push('当前工作负载较低');
    }

    if (candidate.responseScore >= 0.8) {
      reasons.push('响应速度较快');
    }

    if (candidate.fulfillmentScore >= 0.9) {
      reasons.push('历史履约率优秀');
    }

    return reasons.join('；');
  }
}

export default TicketAssignService;
