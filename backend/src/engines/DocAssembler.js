const db = require('../database/init');
const { diffLines, formatPatch } = require('diff');

const documentTemplates = {
  'complaint': {
    name: '起诉状',
    content: `原告：{{client_name}}
被告：{{defendant_name}}
诉讼请求：
1. 请求判令被告支付欠款人民币{{case_value}}元；
2. 请求判令被告承担本案诉讼费用。

事实与理由：
{{description}}

此致
{{court}}
具状人：{{client_name}}
{{date}}`
  },
  'defense': {
    name: '答辩状',
    content: `答辩人：{{defendant_name}}
因原告{{client_name}}诉答辩人{{case_title}}一案，现答辩如下：

{{description}}

此致
{{court}}
答辩人：{{defendant_name}}
{{date}}`
  },
  'evidence_list': {
    name: '证据清单',
    content: `证据清单

案号：{{case_number}}
原告：{{client_name}}
被告：{{defendant_name}}

证据列表：
{{evidence_list}}

提交人：{{submitter_name}}
{{date}}`
  },
  'power_of_attorney': {
    name: '授权委托书',
    content: `授权委托书

委托人：{{client_name}}
受委托人：{{lawyer_name}}

现委托{{lawyer_name}}在我与{{defendant_name}}{{case_title}}一案中，作为我的诉讼代理人。

代理权限：
1. 代为起诉、应诉；
2. 代为提出、承认、放弃、变更诉讼请求；
3. 代为进行和解、调解；
4. 代为签署法律文书。

委托人：{{client_name}}
{{date}}`
  }
};

class DocAssembler {
  static getTemplates() {
    return Object.entries(documentTemplates).map(([id, tpl]) => ({
      id,
      name: tpl.name
    }));
  }

  static fillTemplate(templateId, variables) {
    const template = documentTemplates[templateId];
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    let content = template.content;
    
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(pattern, value || '');
    }

    return {
      templateId,
      templateName: template.name,
      content,
      variables
    };
  }

  static async createDocument(caseId, title, type, templateId, createdBy, initialContent) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO documents (case_id, title, type, template_id, current_version, is_draft, created_by)
         VALUES (?, ?, ?, ?, 1, 1, ?)`,
        [caseId, title, type, templateId, createdBy],
        function (err) {
          if (err) return reject(err);
          
          const documentId = this.lastID;
          
          db.run(
            `INSERT INTO document_versions (document_id, version, content, edited_by, diff_from_previous)
             VALUES (?, 1, ?, ?, ?)`,
            [documentId, initialContent, createdBy, ''],
            (err2) => {
              if (err2) reject(err2);
              else resolve({
                id: documentId,
                caseId,
                title,
                currentVersion: 1,
                isDraft: true
              });
            }
          );
        }
      );
    });
  }

  static async updateDocument(documentId, newContent, editedBy) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT d.*, dv.content as current_content
         FROM documents d
         JOIN document_versions dv ON d.id = dv.document_id AND d.current_version = dv.version
         WHERE d.id = ?`,
        [documentId],
        async (err, doc) => {
          if (err) return reject(err);
          if (!doc) return reject(new Error('文书不存在'));

          const diffResult = diffLines(doc.current_content || '', newContent || '');
          const diffJson = JSON.stringify(diffResult);
          const newVersion = doc.current_version + 1;

          db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            db.run(
              `INSERT INTO document_versions (document_id, version, content, edited_by, diff_from_previous)
               VALUES (?, ?, ?, ?, ?)`,
              [documentId, newVersion, newContent, editedBy, diffJson]
            );

            db.run(
              `UPDATE documents 
               SET current_version = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [newVersion, documentId]
            );

            db.run('COMMIT', (err2) => {
              if (err2) {
                db.run('ROLLBACK');
                reject(err2);
              } else {
                resolve({
                  documentId,
                  newVersion,
                  diff: diffResult,
                  updatedAt: new Date().toISOString()
                });
              }
            });
          });
        }
      );
    });
  }

  static getDocumentVersions(documentId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT dv.*, u.name as editor_name
         FROM document_versions dv
         LEFT JOIN users u ON dv.edited_by = u.id
         WHERE dv.document_id = ?
         ORDER BY dv.version DESC`,
        [documentId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  static getCaseDocuments(caseId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT d.*, u.name as creator_name
         FROM documents d
         LEFT JOIN users u ON d.created_by = u.id
         WHERE d.case_id = ?
         ORDER BY d.updated_at DESC`,
        [caseId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = DocAssembler;
