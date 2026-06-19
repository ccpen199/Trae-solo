import type {
  SelfAssessment,
  DiagnosisReport,
  SkillGap,
  CompetencyModel,
  GapPriority,
} from '../../shared/types/index.js';
import { competencyModels, promotionPaths, diagnosisHistory, sampleDiagnosisReport } from '../data/mockData.js';

function calcGapPriority(gap: number, priority: string): GapPriority {
  const w = { must: 1.5, important: 1, nice: 0.6 }[priority] || 1;
  const score = gap * w;
  if (score >= 2.5) return 'critical';
  if (score >= 1.5) return 'high';
  if (score >= 0.8) return 'medium';
  return 'low';
}

function suggestedAction(skillName: string, gap: number): string {
  if (gap >= 2) return `系统学习${skillName}原理，完成3个实战项目`;
  if (gap >= 1) return `深入学习${skillName}进阶内容，完成2个项目实战`;
  return `巩固${skillName}查漏补缺，完成1个进阶练习`;
}

export class DiagnosisEngineService {
  static assess(assessment: SelfAssessment): DiagnosisReport {
    const model = competencyModels.find(c => c.jobId === assessment.targetJobId);
    if (!model) throw new Error('Competency model not found');
    const hardSkillGaps: SkillGap[] = model.hardSkills.map(hs => {
      const current = assessment.hardSkillRatings[hs.id] || 1;
      const gap = Math.max(0, hs.targetLevel - current);
      return {
        skillId: hs.id,
        skillName: hs.name,
        currentLevel: current,
        targetLevel: hs.targetLevel,
        gap,
        priority: calcGapPriority(gap, hs.priority),
        suggestedAction: suggestedAction(hs.name, gap),
      };
    }).filter(g => g.gap > 0).sort((a, b) => {
      const pw = { critical: 3, high: 2, medium: 1, low: 0 } as const;
      return (b.gap * pw[b.priority]) - (a.gap * pw[a.priority]);
    });
    const softSkillGaps: SkillGap[] = model.softSkills.map(ss => {
      const current = assessment.softSkillRatings[ss.id] || 1;
      const gap = Math.max(0, ss.targetLevel - current);
      const p: GapPriority = gap >= 2 ? 'high' : gap >= 1 ? 'medium' : 'low';
      return {
        skillId: ss.id,
        skillName: ss.name,
        currentLevel: current,
        targetLevel: ss.targetLevel,
        gap,
        priority: p,
        suggestedAction: suggestedAction(ss.name, gap),
      };
    }).filter(g => g.gap > 0).sort((a, b) => b.gap - a.gap);
    const hsAvg = model.hardSkills.reduce((s, h) => s + Math.min(assessment.hardSkillRatings[h.id] || 1, h.targetLevel) / h.targetLevel, 0) / model.hardSkills.length;
    const ssAvg = model.softSkills.reduce((s, ss) => s + Math.min(assessment.softSkillRatings[ss.id] || 1, ss.targetLevel) / ss.targetLevel, 0) / model.softSkills.length;
    const expRatio = Math.min(1, assessment.yearsOfExperience / model.yearsOfExperience.ideal);
    const certRatio = model.certifications.length > 0 ? assessment.certificationsHeld.filter(c => model.certifications.some(mc => mc.id === c)).length / model.certifications.length : 1;
    const overallMatchScore = Math.round((hsAvg * 0.45 + ssAvg * 0.25 + expRatio * 0.2 + certRatio * 0.1) * 1000) / 10;
    const radarDimensions = [
      { dimension: '硬技能掌握', current: Math.round(hsAvg * 50) / 10, target: 5 },
      { dimension: '软技能水平', current: Math.round(ssAvg * 50) / 10, target: 4 },
      { dimension: '工作经验', current: Math.round(expRatio * 50) / 10, target: model.yearsOfExperience.ideal >= 5 ? 5 : model.yearsOfExperience.ideal },
      { dimension: '专业认证', current: Math.round(certRatio * 40) / 10, target: 4 },
      { dimension: '学习能力', current: 3.5, target: 4 },
      { dimension: '沟通协作', current: 3.8, target: 4 },
    ];
    const pw2 = { critical: 2, high: 1.5, medium: 1, low: 0.5 } as const;
    const estimatedReadinessMonths = Math.max(1, Math.round(
      hardSkillGaps.reduce((s, g) => s + g.gap * pw2[g.priority], 0) * 2
    ));
    const promotionPath = promotionPaths.find(p => p.fromJobId === model.jobId) || sampleDiagnosisReport.promotionPath;
    return {
      id: `diag-${Date.now()}`,
      createdAt: new Date().toISOString(),
      targetJob: { id: model.jobId, name: model.jobName, level: assessment.targetJobLevel || model.jobLevel },
      overallMatchScore,
      radarDimensions,
      hardSkillGaps,
      softSkillGaps,
      certificationRecommendations: model.certifications.filter(c => !assessment.certificationsHeld.includes(c.id)),
      promotionPath,
      estimatedReadinessMonths,
      learningPlan: DiagnosisEngineService.generateLearningPlan(hardSkillGaps, softSkillGaps),
    };
  }

  static generateLearningPlan(hardGaps: SkillGap[], softGaps: SkillGap[]) {
    const critical = hardGaps.filter(g => g.priority === 'critical');
    const high = hardGaps.filter(g => g.priority === 'high');
    const others = [...hardGaps.filter(g => g.priority !== 'critical' && g.priority !== 'high'), ...softGaps];
    return [
      {
        phase: '基础补强期',
        durationWeeks: 4,
        tasks: critical.slice(0, 3).map(g => `系统学习${g.skillName}核心原理：${g.suggestedAction}`),
      },
      {
        phase: '进阶实战期',
        durationWeeks: 8,
        tasks: high.slice(0, 3).map(g => `深入掌握${g.skillName}实战：${g.suggestedAction}`),
      },
      {
        phase: '综合提升期',
        durationWeeks: 4,
        tasks: others.slice(0, 3).map(g => `提升${g.skillName}：${g.suggestedAction}`),
      },
      {
        phase: '冲刺面试期',
        durationWeeks: 4,
        tasks: ['梳理项目亮点与技术栈', '刷算法题与八股文', '完成10次模拟面试'],
      },
    ];
  }

  static getHistory() {
    return diagnosisHistory;
  }
}
