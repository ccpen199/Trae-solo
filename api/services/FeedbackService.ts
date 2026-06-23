import { db, generateId } from '../db/init';
import { FeedbackRequest } from '../../shared/types';

class FeedbackService {
  submitFeedback(data: FeedbackRequest): { id: string; success: boolean } {
    const id = generateId();

    db.prepare(`
      INSERT INTO feedback (id, item_name, misjudged_category_id, correct_category_id,
        description, image_url, district, street, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.itemName,
      data.misjudgedCategoryId || null,
      data.correctCategoryId,
      data.description || null,
      data.imageUrl || null,
      data.district || null,
      data.street || null,
      data.userAgent || null
    );

    return { id, success: true };
  }

  getFeedbackList(cityId: string, limit: number = 100, offset: number = 0) {
    const feedbacks = db.prepare(`
      SELECT f.id, f.item_name as itemName, f.misjudged_category_id as misjudgedCategoryId,
             f.correct_category_id as correctCategoryId, f.description,
             f.district, f.street, f.created_at as createdAt,
             c_mis.name as misjudgedCategoryName,
             c_correct.name as correctCategoryName,
             c_correct.color as correctCategoryColor
      FROM feedback f
      LEFT JOIN categories c_mis ON f.misjudged_category_id = c_mis.id
      LEFT JOIN categories c_correct ON f.correct_category_id = c_correct.id
      WHERE EXISTS (
        SELECT 1 FROM streets s
        WHERE s.city_id = ? AND s.district = f.district
      )
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `).all(cityId, limit, offset);

    const total = db.prepare(`
      SELECT COUNT(*) as count FROM feedback f
      WHERE EXISTS (
        SELECT 1 FROM streets s
        WHERE s.city_id = ? AND s.district = f.district
      )
    `).get(cityId) as { count: number };

    return {
      list: feedbacks,
      total: total.count
    };
  }

  getFeedbackById(id: string) {
    return db.prepare(`
      SELECT f.id, f.item_name as itemName, f.misjudged_category_id as misjudgedCategoryId,
             f.correct_category_id as correctCategoryId, f.description, f.image_url as imageUrl,
             f.district, f.street, f.user_agent as userAgent, f.created_at as createdAt,
             c_mis.name as misjudgedCategoryName,
             c_correct.name as correctCategoryName,
             c_correct.icon as correctCategoryIcon,
             c_correct.color as correctCategoryColor
      FROM feedback f
      LEFT JOIN categories c_mis ON f.misjudged_category_id = c_mis.id
      LEFT JOIN categories c_correct ON f.correct_category_id = c_correct.id
      WHERE f.id = ?
    `).get(id);
  }
}

export const feedbackService = new FeedbackService();
