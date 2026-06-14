import { AppDataSource } from "../database/data-source";
import { Candidate } from "../entities/Candidate";
import { Position } from "../entities/Position";
import { Resume } from "../entities/Resume";

export interface AIScreeningResult {
  keywordMatchScore: number;
  experienceMatchScore: number;
  stabilityScore: number;
  overallScore: number;
  riskLevel: "low" | "medium" | "high";
  summary: string;
  screenedAt: Date;
}

export class AIScreeningService {
  private static calculateKeywordMatch(candidate: Candidate, position: Position, resume?: Resume): number {
    const keywords = position.keywords || [];
    const skillTags = position.skillTags || [];
    const allKeywords = [...keywords, ...skillTags];

    if (allKeywords.length === 0) return 85;

    const candidateSkills = candidate.skillTags || [];
    const resumeSkills = resume?.parsedData?.skills || [];
    const resumeContent = resume?.parsedContent?.toLowerCase() || "";

    let matched = 0;
    for (const keyword of allKeywords) {
      const kw = keyword.toLowerCase();
      if (
        candidateSkills.some((s) => s.toLowerCase().includes(kw)) ||
        resumeSkills.some((s) => s.toLowerCase().includes(kw)) ||
        resumeContent.includes(kw)
      ) {
        matched++;
      }
    }

    return Math.round((matched / allKeywords.length) * 100);
  }

  private static calculateExperienceMatch(candidate: Candidate, position: Position, resume?: Resume): number {
    let score = 70;

    if (position.experienceMin !== undefined && candidate.yearsOfExperience !== undefined) {
      const expDiff = candidate.yearsOfExperience - position.experienceMin;
      if (expDiff >= 0) {
        score += Math.min(expDiff * 5, 20);
      } else {
        score += expDiff * 5;
      }
    }

    if (position.education && candidate.education) {
      const eduLevels = ["中专", "大专", "本科", "硕士", "博士"];
      const reqLevel = eduLevels.indexOf(position.education);
      const candLevel = eduLevels.indexOf(candidate.education);
      if (candLevel >= reqLevel) {
        score += 10;
      }
    }

    const resumeExp = resume?.parsedData?.workExperience || [];
    const relevantExp = resumeExp.filter((exp) => {
      const desc = (exp.description || "").toLowerCase();
      return (position.keywords || []).some((kw) => desc.includes(kw.toLowerCase()));
    });
    score += Math.min(relevantExp.length * 5, 15);

    return Math.max(0, Math.min(100, score));
  }

  private static calculateStability(candidate: Candidate, resume?: Resume): number {
    let score = 60;

    const resumeExp = resume?.parsedData?.workExperience || [];
    if (resumeExp.length > 0) {
      const avgDuration = this.calculateAverageTenure(resumeExp);
      if (avgDuration >= 36) {
        score += 30;
      } else if (avgDuration >= 24) {
        score += 20;
      } else if (avgDuration >= 12) {
        score += 10;
      } else if (avgDuration >= 6) {
        score += 5;
      } else {
        score -= 10;
      }

      if (resumeExp.length > 5) {
        score -= 15;
      } else if (resumeExp.length > 3) {
        score -= 5;
      }
    }

    const resumeReasons = candidate.talentProfile?.resignationReasons || [];
    const negativeReasons = ["薪资不满意", "加班太多", "裁员", "被辞退"];
    const hasNegativeReason = resumeReasons.some((r) =>
      negativeReasons.some((n) => r.includes(n))
    );
    if (hasNegativeReason) {
      score -= 15;
    }

    const age = candidate.age || 0;
    if (age >= 30 && age <= 45) {
      score += 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static calculateAverageTenure(experiences: Array<{ startDate: string; endDate: string }>): number {
    let totalMonths = 0;
    let validCount = 0;

    for (const exp of experiences) {
      const start = new Date(exp.startDate);
      const end = exp.endDate && exp.endDate.toLowerCase() !== "至今" ? new Date(exp.endDate) : new Date();

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += months;
        validCount++;
      }
    }

    return validCount > 0 ? totalMonths / validCount : 0;
  }

  private static generateSummary(keywordScore: number, experienceScore: number, stabilityScore: number, overallScore: number): string {
    const parts: string[] = [];

    if (keywordScore >= 80) {
      parts.push("关键词匹配度高，技能与岗位要求高度契合");
    } else if (keywordScore >= 60) {
      parts.push("关键词匹配度较好，具备大部分所需技能");
    } else {
      parts.push("关键词匹配度较低，部分核心技能有待验证");
    }

    if (experienceScore >= 80) {
      parts.push("工作经验丰富，完全满足岗位要求");
    } else if (experienceScore >= 60) {
      parts.push("工作经验基本满足岗位要求");
    } else {
      parts.push("工作经验与岗位要求有一定差距");
    }

    if (stabilityScore >= 80) {
      parts.push("职业稳定性优秀，长期发展潜力大");
    } else if (stabilityScore >= 60) {
      parts.push("职业稳定性良好");
    } else {
      parts.push("职业稳定性一般，需要进一步考察");
    }

    const overallRating =
      overallScore >= 85
        ? "强烈推荐进入面试环节"
        : overallScore >= 70
        ? "建议进入面试环节"
        : overallScore >= 60
        ? "可考虑安排初筛电话"
        : "建议暂缓或放入人才库";

    parts.push(overallRating);

    return parts.join("；");
  }

  public static async screenCandidate(candidateId: number): Promise<AIScreeningResult> {
    const candidateRepository = AppDataSource.getRepository(Candidate);
    const positionRepository = AppDataSource.getRepository(Position);
    const resumeRepository = AppDataSource.getRepository(Resume);

    const candidate = await candidateRepository.findOne({
      where: { id: candidateId },
      relations: ["position"],
    });

    if (!candidate) {
      throw new Error("候选人不存在");
    }

    const position = await positionRepository.findOne({
      where: { id: candidate.positionId },
    });

    if (!position) {
      throw new Error("关联职位不存在");
    }

    const resume = await resumeRepository.findOne({
      where: { candidateId: candidateId },
      order: { createdAt: "DESC" },
    });

    const keywordMatchScore = this.calculateKeywordMatch(candidate, position, resume || undefined);
    const experienceMatchScore = this.calculateExperienceMatch(candidate, position, resume || undefined);
    const stabilityScore = this.calculateStability(candidate, resume || undefined);

    const overallScore = Math.round(
      keywordMatchScore * 0.4 + experienceMatchScore * 0.35 + stabilityScore * 0.25
    );

    let riskLevel: "low" | "medium" | "high" = "low";
    if (overallScore < 60 || stabilityScore < 50) {
      riskLevel = "high";
    } else if (overallScore < 75 || stabilityScore < 65) {
      riskLevel = "medium";
    }

    const summary = this.generateSummary(keywordMatchScore, experienceMatchScore, stabilityScore, overallScore);

    const result: AIScreeningResult = {
      keywordMatchScore,
      experienceMatchScore,
      stabilityScore,
      overallScore,
      riskLevel,
      summary,
      screenedAt: new Date(),
    };

    candidate.aiScreeningResult = result;
    candidate.stage = "ai_screened";
    await candidateRepository.save(candidate);

    return result;
  }

  public static async batchScreenCandidates(candidateIds: number[]): Promise<Array<{ candidateId: number; result?: AIScreeningResult; error?: string }>> {
    const results: Array<{ candidateId: number; result?: AIScreeningResult; error?: string }> = [];

    for (const id of candidateIds) {
      try {
        const result = await this.screenCandidate(id);
        results.push({ candidateId: id, result });
      } catch (error) {
        results.push({ candidateId: id, error: error instanceof Error ? error.message : "未知错误" });
      }
    }

    return results;
  }
}
