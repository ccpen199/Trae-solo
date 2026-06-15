import type { Resume, ResumeModule } from '../types';

function moduleByType(resume: Resume, type: ResumeModule['type']) {
  return resume.modules?.find((module) => module.type === type);
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function normalizeResumeForChecks(resume: Resume): Resume {
  const basic = moduleByType(resume, 'basic')?.fields || {};
  const education = asArray(moduleByType(resume, 'education')?.fields?.items);
  const experience = asArray(moduleByType(resume, 'experience')?.fields?.items).map((item: any) => ({
    ...item,
    highlights: item.highlights || item.responsibilities || item.descriptions || [],
    description: item.description || asArray(item.responsibilities).join(' '),
  }));
  const projects = asArray(moduleByType(resume, 'project')?.fields?.items).map((item: any) => ({
    ...item,
    technologies: item.technologies || item.techStack || item.tools || [],
    highlights: item.highlights || item.metrics || item.achievements || [],
  }));
  const skillGroups = asArray(moduleByType(resume, 'skills')?.fields?.groups);
  const flatSkills = skillGroups.flatMap((group: any) => asArray<string>(group.items));
  const selfEvaluation = moduleByType(resume, 'selfEvaluation')?.fields?.content;

  return {
    ...resume,
    name: resume.name || basic.name,
    email: resume.email || basic.email,
    phone: resume.phone || basic.phone,
    location: resume.location || basic.location,
    website: resume.website || basic.website || basic.github || basic.portfolio,
    summary: resume.summary || selfEvaluation,
    fontFamily: resume.fontFamily || resume.theme?.fontFamily,
    education: resume.education?.length ? resume.education : education,
    experience: resume.experience?.length ? resume.experience : experience,
    projects: resume.projects?.length ? resume.projects : projects,
    skills: resume.skills?.length ? resume.skills : flatSkills,
  };
}

export function collectResumeLinks(resume: Resume): string[] {
  const normalized = normalizeResumeForChecks(resume);
  const links = [
    normalized.website,
    ...asArray(normalized.projects).map((project: any) => project.link || project.portfolioLink),
    ...asArray(normalized.modules).flatMap((module: any) => {
      if (module.type !== 'basic') return [];
      return [module.fields?.website, module.fields?.github, module.fields?.portfolio, module.fields?.linkedin];
    }),
  ];

  return [...new Set(links.filter(Boolean).map(String))];
}
