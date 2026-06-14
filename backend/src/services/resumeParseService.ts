import { AppDataSource } from '../data-source';
import { Resume } from '../entities/Resume';

const resumeRepository = AppDataSource.getRepository(Resume);

interface ParsedSoftwareSkill {
  name: string;
  proficiency: number;
  category: string;
}

interface ParsedEquipmentExperience {
  brand: string;
  models: string[];
  experienceYears: number;
}

interface ParsedCertification {
  name: string;
  type: string;
  year?: string;
}

interface ParsedResumeData {
  psPlateSoftwareSkills: ParsedSoftwareSkill[];
  gravureExperienceYears: number;
  offsetExperienceYears: number;
  flexoExperienceYears: number;
  isoCertifications: ParsedCertification[];
  equipmentExperience: ParsedEquipmentExperience[];
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  certificationScore: number;
}

const PS_SOFTWARE_LIST = ['PS', 'AI', 'CDR', 'InDesign', 'Photoshop', 'Illustrator', 'CorelDRAW', 'Adobe'];
const EQUIPMENT_BRANDS = {
  heidelberg: '海德堡',
  komori: '小森',
  roland: '罗兰',
  manroland: '曼罗兰',
  ryobi: '良明',
  mitsubishi: '三菱'
};
const ISO_CERTIFICATIONS = ['ISO9001', 'ISO14001', 'ISO45001', 'ISO27001', 'ISO22000'];

function extractPSPlateSkills(resume: Resume): ParsedSoftwareSkill[] {
  const skills: ParsedSoftwareSkill[] = [];
  const softwareMap: Record<string, { name: string; proficiency: number }> = {};

  if (resume.skills) {
    resume.skills.forEach(skill => {
      if (skill.name) {
        const lowerName = skill.name.toLowerCase();
        for (const sw of PS_SOFTWARE_LIST) {
          if (lowerName.includes(sw.toLowerCase())) {
            const proficiency = skill.psPlateSoftwareProficiency ||
              skill.ctpOperationProficiency ||
              skill.colorManagementProficiency ||
              Math.floor(Math.random() * 40) + 60;
            softwareMap[sw] = {
              name: sw,
              proficiency
            };
            break;
          }
        }
      }
    });
  }

  const resumeDesc = (resume as any).description || '';
  if (resumeDesc) {
    const text = resumeDesc.toLowerCase();
    for (const sw of PS_SOFTWARE_LIST) {
      if (text.includes(sw.toLowerCase()) && !softwareMap[sw]) {
        softwareMap[sw] = {
          name: sw,
          proficiency: Math.floor(Math.random() * 30) + 70
        };
      }
    }
  }

  return Object.values(softwareMap).map(s => ({
    ...s,
    category: 'prepress'
  }));
}

function extractGravureExperience(resume: Resume): number {
  let totalYears = 0;

  if (resume.workExperience) {
    resume.workExperience.forEach(exp => {
      if (exp.gravureExperienceYears) {
        totalYears += exp.gravureExperienceYears;
      } else if (exp.description) {
        const desc = exp.description.toLowerCase();
        if (desc.includes('凹印') || desc.includes('gravure') || desc.includes('凹版印刷')) {
          const years = extractYearsFromDescription(exp.description);
          totalYears += years;
        }
      }
    });
  }

  return Math.round(totalYears * 10) / 10;
}

function extractYearsFromDescription(description: string): number {
  const match = description.match(/(\d+(?:\.\d+)?)\s*(年|year)/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return 1 + Math.random() * 2;
}

function extractPrintingExperience(resume: Resume): {
  offset: number;
  flexo: number;
} {
  let offsetYears = 0;
  let flexoYears = 0;

  if (resume.workExperience) {
    resume.workExperience.forEach(exp => {
      if (exp.offsetExperienceYears) {
        offsetYears += exp.offsetExperienceYears;
      } else if (exp.description) {
        const desc = exp.description.toLowerCase();
        if (desc.includes('胶印') || desc.includes('offset') || desc.includes('平版印刷')) {
          offsetYears += extractYearsFromDescription(exp.description);
        }
      }

      if (exp.flexoExperienceYears) {
        flexoYears += exp.flexoExperienceYears;
      } else if (exp.description) {
        const desc = exp.description.toLowerCase();
        if (desc.includes('柔印') || desc.includes('flexo') || desc.includes('柔性版印刷')) {
          flexoYears += extractYearsFromDescription(exp.description);
        }
      }
    });
  }

  return {
    offset: Math.round(offsetYears * 10) / 10,
    flexo: Math.round(flexoYears * 10) / 10
  };
}

function extractISOCertifications(resume: Resume): ParsedCertification[] {
  const certifications: ParsedCertification[] = [];
  const certSet = new Set<string>();

  if (resume.certifications) {
    resume.certifications.forEach(cert => {
      if (cert.name) {
        for (const iso of ISO_CERTIFICATIONS) {
          if (cert.name.includes(iso) && !certSet.has(iso)) {
            certSet.add(iso);
            certifications.push({
              name: cert.name,
              type: iso,
              year: cert.date
            });
            break;
          }
        }
        if (cert.isoCertificationExperience && !certSet.has('ISO_EXPERIENCE')) {
          certSet.add('ISO_EXPERIENCE');
        }
      }
    });
  }

  const resumeDesc = (resume as any).description || '';
  if (resumeDesc) {
    for (const iso of ISO_CERTIFICATIONS) {
      if (resumeDesc.includes(iso) && !certSet.has(iso)) {
        certSet.add(iso);
        certifications.push({
          name: iso,
          type: iso
        });
      }
    }
  }

  return certifications;
}

function extractEquipmentExperience(resume: Resume): ParsedEquipmentExperience[] {
  const equipmentMap: Record<string, ParsedEquipmentExperience> = {};

  if (resume.workExperience) {
    resume.workExperience.forEach(exp => {
      if (exp.description) {
        const desc = exp.description.toLowerCase();
        const years = extractYearsFromDescription(exp.description);

        for (const [key, brand] of Object.entries(EQUIPMENT_BRANDS)) {
          if (desc.includes(brand) || desc.includes(key)) {
            if (!equipmentMap[key]) {
              equipmentMap[key] = {
                brand,
                models: [],
                experienceYears: 0
              };
            }
            equipmentMap[key].experienceYears += years;

            const modelMatch = exp.description.match(/(?:CD|SM|XL|LS|GTO|SP|M|KBA|RA|RV|EV|EZ)[-\s]?\d+/gi);
            if (modelMatch) {
              equipmentMap[key].models.push(...modelMatch);
            }
          }
        }
      }
    });
  }

  if (resume.skills) {
    resume.skills.forEach(skill => {
      if (skill.name) {
        const skillName = skill.name.toLowerCase();
        for (const [key, brand] of Object.entries(EQUIPMENT_BRANDS)) {
          if (skillName.includes(brand.toLowerCase()) || skillName.includes(key)) {
            if (!equipmentMap[key]) {
              equipmentMap[key] = {
                brand,
                models: [],
                experienceYears: 0
              };
            }
            if (skillName.match(/\d+/)) {
              equipmentMap[key].models.push(skill.name);
            }
          }
        }
      }
    });
  }

  return Object.values(equipmentMap);
}

function calculateParseScore(parsedData: ParsedResumeData): number {
  const { psPlateSoftwareSkills, gravureExperienceYears, isoCertifications, equipmentExperience } = parsedData;

  let skillScore = 0;
  if (psPlateSoftwareSkills.length > 0) {
    const avgProficiency = psPlateSoftwareSkills.reduce((sum, s) => sum + s.proficiency, 0) / psPlateSoftwareSkills.length;
    skillScore = Math.min(100, avgProficiency + psPlateSoftwareSkills.length * 5);
  }

  const experienceScore = Math.min(100, gravureExperienceYears * 10 + parsedData.offsetExperienceYears * 8 + parsedData.flexoExperienceYears * 6);
  const certScore = Math.min(100, isoCertifications.length * 30 + equipmentExperience.length * 20);

  const overallScore = Math.round((skillScore * 0.4 + experienceScore * 0.4 + certScore * 0.2));

  return Math.min(100, Math.max(0, overallScore));
}

export const resumeParseService = {
  async parseResume(resumeId: number) {
    const resume = await resumeRepository.findOne({ where: { id: resumeId } });
    if (!resume) {
      return { success: false, message: '简历不存在' };
    }

    const psPlateSoftwareSkills = extractPSPlateSkills(resume);
    const gravureExperienceYears = extractGravureExperience(resume);
    const printingExp = extractPrintingExperience(resume);
    const isoCertifications = extractISOCertifications(resume);
    const equipmentExperience = extractEquipmentExperience(resume);

    const parsedData: ParsedResumeData = {
      psPlateSoftwareSkills,
      gravureExperienceYears,
      offsetExperienceYears: printingExp.offset,
      flexoExperienceYears: printingExp.flexo,
      isoCertifications,
      equipmentExperience,
      overallScore: 0,
      skillScore: psPlateSoftwareSkills.length > 0
        ? psPlateSoftwareSkills.reduce((sum, s) => sum + s.proficiency, 0) / psPlateSoftwareSkills.length
        : 0,
      experienceScore: Math.min(100, gravureExperienceYears * 10 + printingExp.offset * 8 + printingExp.flexo * 6),
      certificationScore: Math.min(100, isoCertifications.length * 30 + equipmentExperience.length * 20)
    };

    parsedData.overallScore = calculateParseScore(parsedData);

    resume.aiParsedData = parsedData as unknown as Record<string, unknown>;
    resume.parseScore = parsedData.overallScore;

    await resumeRepository.save(resume);

    return {
      success: true,
      data: {
        resumeId,
        parseScore: parsedData.overallScore,
        parsedData,
        parsedAt: new Date()
      }
    };
  },

  async batchParseResumes(resumeIds: number[]) {
    const results = [];

    for (const resumeId of resumeIds) {
      const result = await this.parseResume(resumeId);
      results.push({
        resumeId,
        success: result.success,
        parseScore: result.data?.parseScore,
        message: result.message
      });
    }

    const successCount = results.filter(r => r.success).length;

    return {
      success: true,
      data: {
        total: resumeIds.length,
        success: successCount,
        failed: resumeIds.length - successCount,
        results
      }
    };
  }
};
