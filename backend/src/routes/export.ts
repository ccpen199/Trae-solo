import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateATSPlainText } from '../utils/parser';
import { ResumeContent } from '../types';

const router = Router();

function generateHTML(content: ResumeContent, templateId: string): string {
  const { basicInfo, education, experience, projects, skills, summary } = content;
  
  let skillHtml = '';
  for (const skill of skills) {
    const skillTitle = skill.category || skill.name || '技能';
    const skillItems = skill.items?.length ? skill.items : (skill.name ? [skill.name] : []);
    skillHtml += `
      <div style="margin-bottom: 12px;">
        <div style="font-weight: 600; margin-bottom: 4px; color: #1a365d;">${skillTitle}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${skillItems.map(item => `<span style="background: #e2e8f0; padding: 3px 10px; border-radius: 4px; font-size: 13px;">${item}</span>`).join('')}
        </div>
      </div>
    `;
  }
  
  let expHtml = '';
  for (const exp of experience) {
    expHtml += `
      <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div style="font-weight: 600; color: #2d3748;">${exp.company} · ${exp.position}</div>
          <div style="color: #718096; font-size: 14px;">${exp.startDate} - ${exp.endDate || '至今'}</div>
        </div>
        <div style="white-space: pre-wrap; line-height: 1.7; color: #4a5568;">${exp.description}</div>
      </div>
    `;
  }
  
  let projHtml = '';
  for (const proj of projects) {
    projHtml += `
      <div style="margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div style="font-weight: 600; color: #2d3748;">${proj.name}${proj.role ? ' · ' + proj.role : ''}</div>
          <div style="color: #718096; font-size: 14px;">${proj.startDate} - ${proj.endDate || '至今'}</div>
        </div>
        ${proj.technologies.length > 0 ? `<div style="color: #4299e1; margin-bottom: 6px; font-size: 14px;">技术栈：${proj.technologies.join('、')}</div>` : ''}
        <div style="white-space: pre-wrap; line-height: 1.7; color: #4a5568;">${proj.description}</div>
      </div>
    `;
  }
  
  let eduHtml = '';
  for (const edu of education) {
    eduHtml += `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <div style="font-weight: 600; color: #2d3748;">${edu.school}</div>
          <div style="color: #718096; font-size: 14px;">${edu.startDate} - ${edu.endDate || '至今'}</div>
        </div>
        <div style="color: #4a5568;">${edu.degree}${edu.major ? ' · ' + edu.major : ''}${edu.gpa ? ' · GPA: ' + edu.gpa : ''}</div>
      </div>
    `;
  }
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${basicInfo.name} - 个人简历</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; margin: 0; padding: 40px; background: #f7fafc; color: #2d3748; }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 50px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-radius: 8px; }
    .section-title { font-size: 18px; font-weight: 700; color: #1a365d; border-bottom: 2px solid #4299e1; padding-bottom: 8px; margin: 24px 0 16px 0; }
    @media print { body { padding: 0; background: white; } .container { box-shadow: none; padding: 30px; } }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
      <h1 style="margin: 0 0 12px 0; font-size: 28px; color: #1a365d;">${basicInfo.name}</h1>
      <div style="color: #718096; font-size: 15px;">
        ${basicInfo.phone ? basicInfo.phone + ' · ' : ''}${basicInfo.email}${basicInfo.location ? ' · ' + basicInfo.location : ''}${basicInfo.website ? ' · ' + basicInfo.website : ''}
      </div>
    </div>
    
    ${summary ? `<div class="section-title">个人简介</div><p style="line-height: 1.8; color: #4a5568; white-space: pre-wrap;">${summary}</p>` : ''}
    
    ${experience.length > 0 ? `<div class="section-title">工作/实习经历</div>${expHtml}` : ''}
    
    ${projects.length > 0 ? `<div class="section-title">项目经历</div>${projHtml}` : ''}
    
    ${education.length > 0 ? `<div class="section-title">教育背景</div>${eduHtml}` : ''}
    
    ${skills.length > 0 ? `<div class="section-title">专业技能</div>${skillHtml}` : ''}
  </div>
</body>
</html>`;
}

function generateDoc(content: ResumeContent): string {
  const atsText = generateATSPlainText(content);
  
  const docContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${content.basicInfo.name}简历</title></head>
    <body style="font-family: 'Microsoft YaHei', sans-serif; line-height: 1.8;">
      <pre style="font-family: 'Microsoft YaHei', sans-serif; white-space: pre-wrap; font-size: 14px;">${atsText}</pre>
    </body>
    </html>
  `;
  
  return docContent;
}

router.get('/:id/html', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = JSON.parse(resume.content) as ResumeContent;
  const html = generateHTML(content, resume.template_id);
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${content.basicInfo.name || '简历'}_可编辑.html"`);
  res.send(html);
});

router.get('/:id/doc', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = JSON.parse(resume.content) as ResumeContent;
  const doc = generateDoc(content);
  
  res.setHeader('Content-Type', 'application/msword; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${content.basicInfo.name || '简历'}_可编辑.doc"`);
  res.send(doc);
});

router.get('/:id/ats', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = JSON.parse(resume.content) as ResumeContent;
  const text = generateATSPlainText(content);
  
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${content.basicInfo.name || '简历'}_ATS友好.txt"`);
  res.send(text);
});

router.post('/:id/ats', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = req.body.content || JSON.parse(resume.content) as ResumeContent;
  const atsText = generateATSPlainText(content);
  
  res.json({ atsText });
});

router.get('/:id/preview', authMiddleware, (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = JSON.parse(resume.content) as ResumeContent;
  const html = generateHTML(content, resume.template_id);
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

router.post('/:id/generate-all', authMiddleware, async (req: AuthRequest, res) => {
  const resume: any = db.prepare(
    'SELECT * FROM resumes WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.id);
  
  if (!resume) {
    return res.status(404).json({ error: '简历不存在' });
  }
  
  const content = JSON.parse(resume.content) as ResumeContent;
  const name = content.basicInfo.name || '简历';
  
  const html = generateHTML(content, resume.template_id);
  const doc = generateDoc(content);
  const atsText = generateATSPlainText(content);
  
  res.json({
    files: [
      { name: `${name}_可编辑.html`, content: html, type: 'text/html' },
      { name: `${name}_可编辑.doc`, content: doc, type: 'application/msword' },
      { name: `${name}_ATS友好.txt`, content: atsText, type: 'text/plain' }
    ]
  });
});

export default router;
