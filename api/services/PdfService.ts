import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfParse from 'pdf-parse';
import { db, generateId } from '../db/init';
import { PdfDocument } from '../../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

class PdfService {
  async uploadPdf(
    file: Express.Multer.File,
    cityId: string,
    uploaderId: string,
    version: string = '1.0'
  ): Promise<PdfDocument> {
    const id = generateId();
    const uploadTime = Math.floor(Date.now() / 1000);

    const savePath = path.join(UPLOAD_DIR, `${id}_${file.originalname}`);
    fs.writeFileSync(savePath, file.buffer);

    let parsedContent = '';
    try {
      const dataBuffer = fs.readFileSync(savePath);
      const pdfData = await pdfParse(dataBuffer);
      parsedContent = pdfData.text;
    } catch (err) {
      console.error('PDF parsing error:', err);
      parsedContent = 'PDF解析失败，请手动查看文件内容。';
    }

    db.prepare(`
      INSERT INTO pdf_documents (id, city_id, file_name, file_size, uploader_id,
        parsed_content, linked_item_ids, version, upload_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, cityId, file.originalname, file.size, uploaderId,
      parsedContent, JSON.stringify([]), version, uploadTime);

    return {
      id,
      cityId,
      fileName: file.originalname,
      fileSize: file.size,
      uploadTime,
      uploaderId,
      parsedContent,
      linkedItemIds: [],
      version
    };
  }

  getPdfList(cityId: string): PdfDocument[] {
    const docs = db.prepare(`
      SELECT id, city_id as cityId, file_name as fileName, file_size as fileSize,
             upload_time as uploadTime, uploader_id as uploaderId,
             parsed_content as parsedContent, linked_item_ids as linkedItemIds, version
      FROM pdf_documents
      WHERE city_id = ?
      ORDER BY upload_time DESC
    `).all(cityId) as Array<{
      id: string;
      cityId: string;
      fileName: string;
      fileSize: number;
      uploadTime: number;
      uploaderId: string;
      parsedContent: string;
      linkedItemIds: string;
      version: string;
    }>;

    return docs.map(doc => ({
      ...doc,
      linkedItemIds: JSON.parse(doc.linkedItemIds || '[]')
    }));
  }

  getPdfById(id: string): PdfDocument | null {
    const doc = db.prepare(`
      SELECT id, city_id as cityId, file_name as fileName, file_size as fileSize,
             upload_time as uploadTime, uploader_id as uploaderId,
             parsed_content as parsedContent, linked_item_ids as linkedItemIds, version
      FROM pdf_documents
      WHERE id = ?
    `).get(id) as {
      id: string;
      cityId: string;
      fileName: string;
      fileSize: number;
      uploadTime: number;
      uploaderId: string;
      parsedContent: string;
      linkedItemIds: string;
      version: string;
    } | undefined;

    if (!doc) return null;

    return {
      ...doc,
      linkedItemIds: JSON.parse(doc.linkedItemIds || '[]')
    };
  }

  linkItems(pdfId: string, itemIds: string[]): boolean {
    const existing = db.prepare('SELECT linked_item_ids FROM pdf_documents WHERE id = ?').get(pdfId) as { linked_item_ids: string } | undefined;
    if (!existing) return false;

    const currentIds = JSON.parse(existing.linked_item_ids || '[]') as string[];
    const newIds = [...new Set([...currentIds, ...itemIds])];

    db.prepare('UPDATE pdf_documents SET linked_item_ids = ? WHERE id = ?')
      .run(JSON.stringify(newIds), pdfId);

    return true;
  }

  unlinkItem(pdfId: string, itemId: string): boolean {
    const existing = db.prepare('SELECT linked_item_ids FROM pdf_documents WHERE id = ?').get(pdfId) as { linked_item_ids: string } | undefined;
    if (!existing) return false;

    const currentIds = JSON.parse(existing.linked_item_ids || '[]') as string[];
    const newIds = currentIds.filter(id => id !== itemId);

    db.prepare('UPDATE pdf_documents SET linked_item_ids = ? WHERE id = ?')
      .run(JSON.stringify(newIds), pdfId);

    return true;
  }

  deletePdf(id: string): boolean {
    const doc = db.prepare('SELECT file_name FROM pdf_documents WHERE id = ?').get(id) as { file_name: string } | undefined;
    if (!doc) return false;

    const filePath = path.join(UPLOAD_DIR, `${id}_${doc.file_name}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const result = db.prepare('DELETE FROM pdf_documents WHERE id = ?').run(id);
    return result.changes > 0;
  }

  searchInPdf(pdfId: string, keyword: string): Array<{ line: string; lineNumber: number }> {
    const doc = this.getPdfById(pdfId);
    if (!doc) return [];

    const lines = doc.parsedContent.split('\n');
    const results: Array<{ line: string; lineNumber: number }> = [];

    lines.forEach((line, index) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        results.push({
          line: line.trim(),
          lineNumber: index + 1
        });
      }
    });

    return results.slice(0, 50);
  }
}

export const pdfService = new PdfService();
