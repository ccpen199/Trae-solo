import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { Resume, ResumeModule } from '../types';

const FONT_FAMILY = 'Calibri';

function createTextRun(text: string, options: Partial<{
  bold: boolean;
  size: number;
  color: string;
  italics: boolean;
}> = {}): TextRun {
  return new TextRun({
    text,
    font: FONT_FAMILY,
    bold: options.bold,
    size: options.size,
    color: options.color,
    italics: options.italics,
  });
}

function createSectionTitle(title: string, primaryColor: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: primaryColor },
    },
    children: [
      createTextRun(title, { bold: true, size: 28, color: primaryColor }),
    ],
  });
}

function renderBasicModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const fields = module.fields as Record<string, any>;
  const paragraphs: Paragraph[] = [];

  if (fields.name) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          createTextRun(String(fields.name), { bold: true, size: 48, color: primaryColor }),
        ],
      })
    );
  }

  const contactParts: string[] = [];
  if (fields.phone) contactParts.push(String(fields.phone));
  if (fields.email) contactParts.push(String(fields.email));
  if (fields.location) contactParts.push(String(fields.location));
  if (fields.website) contactParts.push(String(fields.website));

  if (contactParts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          createTextRun(contactParts.join(' | '), { size: 22 }),
        ],
      })
    );
  }

  const jobTitle = fields.jobTitle || fields.title;
  if (jobTitle) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          createTextRun(String(jobTitle), { bold: true, size: 28, color: primaryColor }),
        ],
      })
    );
  }

  return paragraphs;
}

function renderEducationModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionTitle('教育经历', primaryColor)];
  const items = (module.fields.items as any[]) || [];

  for (const item of items) {
    if (item.school || item.degree) {
      const schoolParts: TextRun[] = [];
      if (item.school) {
        schoolParts.push(createTextRun(String(item.school), { bold: true, size: 24 }));
      }
      if (item.degree || item.major) {
        const degreeText = [item.degree, item.major].filter(Boolean).join(' · ');
        if (degreeText) {
          if (schoolParts.length > 0) schoolParts.push(createTextRun(' | ', { size: 24 }));
          schoolParts.push(createTextRun(degreeText, { size: 24 }));
        }
      }
      paragraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: schoolParts,
        })
      );
    }

    const metaParts: string[] = [];
    if (item.startDate && item.endDate) {
      metaParts.push(`${item.startDate} - ${item.endDate}`);
    } else if (item.startDate || item.endDate) {
      metaParts.push(item.startDate || item.endDate);
    }
    if (item.gpa) {
      metaParts.push(`GPA: ${item.gpa}`);
    }
    if (metaParts.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [createTextRun(metaParts.join(' | '), { size: 22, italics: true })],
        })
      );
    }

    if (item.description) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [createTextRun(String(item.description), { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

function renderExperienceModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionTitle('工作经历', primaryColor)];
  const items = (module.fields.items as any[]) || [];

  for (const item of items) {
    if (item.company || item.position) {
      const headerParts: TextRun[] = [];
      if (item.company) {
        headerParts.push(createTextRun(String(item.company), { bold: true, size: 24 }));
      }
      if (item.position) {
        if (headerParts.length > 0) headerParts.push(createTextRun(' | ', { size: 24 }));
        headerParts.push(createTextRun(String(item.position), { size: 24 }));
      }
      paragraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: headerParts,
        })
      );
    }

    if (item.startDate || item.endDate || item.location) {
      const metaParts: string[] = [];
      if (item.startDate && item.endDate) {
        metaParts.push(`${item.startDate} - ${item.endDate}`);
      } else if (item.startDate || item.endDate) {
        metaParts.push(item.startDate || item.endDate);
      }
      if (item.location) {
        metaParts.push(String(item.location));
      }
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [createTextRun(metaParts.join(' | '), { size: 22, italics: true })],
        })
      );
    }

    const descriptions = item.descriptions || item.responsibilities || item.highlights || (item.description ? [item.description] : []);
    for (const desc of descriptions) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          bullet: { level: 0 },
          children: [createTextRun(String(desc), { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

function renderProjectModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionTitle('项目经历', primaryColor)];
  const items = (module.fields.items as any[]) || [];

  for (const item of items) {
    if (item.name) {
      const headerParts: TextRun[] = [createTextRun(String(item.name), { bold: true, size: 24 })];
      if (item.role) {
        headerParts.push(createTextRun(` | ${item.role}`, { size: 24 }));
      }
      paragraphs.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: headerParts,
        })
      );
    }

    const metaParts: string[] = [];
    if (item.startDate && item.endDate) {
      metaParts.push(`${item.startDate} - ${item.endDate}`);
    } else if (item.startDate || item.endDate) {
      metaParts.push(item.startDate || item.endDate);
    }
    if (item.link) {
      metaParts.push(String(item.link));
    }
    if (metaParts.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [createTextRun(metaParts.join(' | '), { size: 22, italics: true })],
        })
      );
    }

    const techStack = item.techStack || item.technologies || item.tools;
    if (techStack) {
      const techText = Array.isArray(techStack) ? techStack.join(' · ') : String(techStack);
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            createTextRun('技术栈: ', { bold: true, size: 22 }),
            createTextRun(techText, { size: 22 }),
          ],
        })
      );
    }

    const descriptions = item.descriptions || item.highlights || item.achievements || item.metrics || (item.description ? [item.description] : []);
    for (const desc of descriptions) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 40 },
          bullet: { level: 0 },
          children: [createTextRun(String(desc), { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

function renderSkillsModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionTitle('专业技能', primaryColor)];
  const fields = module.fields as Record<string, any>;
  const skills = fields.skills || fields.items || [];
  const groups = fields.groups;

  if (groups && Array.isArray(groups) && groups.length > 0) {
    for (const skillGroup of groups) {
      const categoryText = skillGroup.name || skillGroup.category || '';
      const skillList = Array.isArray(skillGroup.items)
        ? skillGroup.items.join(' · ')
        : (skillGroup.items || '');

      if (categoryText || skillList) {
        const children: TextRun[] = [];
        if (categoryText) {
          children.push(createTextRun(`${categoryText}: `, { bold: true, size: 22 }));
        }
        if (skillList) {
          children.push(createTextRun(String(skillList), { size: 22 }));
        }
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children,
          })
        );
      }
    }
  } else if (Array.isArray(skills) && skills.length > 0) {
    const isCategorySkills = typeof skills[0] === 'object' && (skills[0].category || skills[0].name);

    if (isCategorySkills) {
      for (const skillGroup of skills) {
        const categoryText = skillGroup.category || skillGroup.name || '';
        const skillList = Array.isArray(skillGroup.items)
          ? skillGroup.items.join(' · ')
          : (skillGroup.items || '');

        if (categoryText || skillList) {
          const children: TextRun[] = [];
          if (categoryText) {
            children.push(createTextRun(`${categoryText}: `, { bold: true, size: 22 }));
          }
          if (skillList) {
            children.push(createTextRun(String(skillList), { size: 22 }));
          }
          paragraphs.push(
            new Paragraph({
              spacing: { after: 60 },
              children,
            })
          );
        }
      }
    } else {
      const skillText = skills.join(' · ');
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [createTextRun(skillText, { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

function renderSelfEvaluationModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const paragraphs: Paragraph[] = [createSectionTitle('自我评价', primaryColor)];
  const fields = module.fields as Record<string, any>;
  const content = fields.content || fields.description || fields.text;

  if (content) {
    if (Array.isArray(content)) {
      for (const item of content) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [createTextRun(String(item), { size: 22 })],
          })
        );
      }
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [createTextRun(String(content), { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

function renderCustomModule(module: ResumeModule, primaryColor: string): Paragraph[] {
  const fields = module.fields as Record<string, any>;
  const paragraphs: Paragraph[] = [createSectionTitle(String(fields.title || '自定义模块'), primaryColor)];
  const content = fields.content || fields.description || '';

  if (content) {
    if (Array.isArray(content)) {
      for (const item of content) {
        paragraphs.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [createTextRun(String(item), { size: 22 })],
          })
        );
      }
    } else {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [createTextRun(String(content), { size: 22 })],
        })
      );
    }
  }

  return paragraphs;
}

export async function exportResumeToWord(resume: Resume): Promise<void> {
  const sortedModules = [...resume.modules]
    .filter((m) => m.visible)
    .sort((a, b) => a.order - b.order);

  const primaryColor = resume.theme.primaryColor.replace('#', '');

  const children: Paragraph[] = [];

  for (const module of sortedModules) {
    let moduleParagraphs: Paragraph[] = [];

    switch (module.type) {
      case 'basic':
        moduleParagraphs = renderBasicModule(module, primaryColor);
        break;
      case 'education':
        moduleParagraphs = renderEducationModule(module, primaryColor);
        break;
      case 'experience':
        moduleParagraphs = renderExperienceModule(module, primaryColor);
        break;
      case 'project':
        moduleParagraphs = renderProjectModule(module, primaryColor);
        break;
      case 'skills':
        moduleParagraphs = renderSkillsModule(module, primaryColor);
        break;
      case 'selfEvaluation':
        moduleParagraphs = renderSelfEvaluationModule(module, primaryColor);
        break;
      case 'custom':
      default:
        moduleParagraphs = renderCustomModule(module, primaryColor);
        break;
    }

    children.push(...moduleParagraphs);
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: 22,
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'default-bullet',
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: '\u2022',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${resume.title}.docx`);
}
