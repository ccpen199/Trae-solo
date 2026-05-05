import { Request, Response } from 'express';
import pool from '../config/database';
import { Book, ApiResponse, PaginatedResponse } from '../types';

export const getBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { keyword, categoryId, author, publisher, minPrice, maxPrice, isNew, page = 1, pageSize = 10, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = `
      SELECT b.*, c.name as category_name 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      WHERE 1=1
    `;
    const values: any[] = [];
    let paramIndex = 1;

    if (keyword) {
      query += ` AND (b.title ILIKE $${paramIndex} OR b.author ILIKE $${paramIndex} OR b.publisher ILIKE $${paramIndex})`;
      values.push(`%${keyword}%`);
      paramIndex++;
    }

    if (categoryId) {
      query += ` AND b.category_id = $${paramIndex}`;
      values.push(categoryId);
      paramIndex++;
    }

    if (author) {
      query += ` AND b.author ILIKE $${paramIndex}`;
      values.push(`%${author}%`);
      paramIndex++;
    }

    if (publisher) {
      query += ` AND b.publisher ILIKE $${paramIndex}`;
      values.push(`%${publisher}%`);
      paramIndex++;
    }

    if (minPrice) {
      query += ` AND COALESCE(b.discount_price, b.price) >= $${paramIndex}`;
      values.push(parseFloat(minPrice as string));
      paramIndex++;
    }

    if (maxPrice) {
      query += ` AND COALESCE(b.discount_price, b.price) <= $${paramIndex}`;
      values.push(parseFloat(maxPrice as string));
      paramIndex++;
    }

    if (isNew === 'true') {
      query += ` AND b.is_new = true`;
    }

    query += ` AND b.status = 'active'`;

    const validSortColumns = ['created_at', 'price', 'sales_count', 'title'];
    const validSortOrders = ['asc', 'desc'];
    const column = validSortColumns.includes(sortBy as string) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';
    query += ` ORDER BY b.${column} ${order}`;

    const countQuery = `SELECT COUNT(*) as total FROM (${query}) as count_query`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;
    const offset = (pageNum - 1) * size;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(size, offset);

    const result = await pool.query(query, values);

    const books = result.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
      actual_price: parseFloat(row.discount_price || row.price)
    }));

    const response: PaginatedResponse<any> = {
      items: books,
      total,
      page: pageNum,
      pageSize: size,
      totalPages: Math.ceil(total / size)
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse);
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getBookById = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookId = req.params.id;

    const result = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.id = $1`,
      [bookId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '图书不存在'
      } as ApiResponse);
      return;
    }

    const book = result.rows[0];
    const bookData = {
      ...book,
      price: parseFloat(book.price),
      discount_price: book.discount_price ? parseFloat(book.discount_price) : null,
      actual_price: parseFloat(book.discount_price || book.price)
    };

    res.json({
      success: true,
      data: bookData
    } as ApiResponse);
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: '获取图书详情失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getNewBooks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT b.*, c.name as category_name 
       FROM books b 
       LEFT JOIN categories c ON b.category_id = c.id 
       WHERE b.is_new = true AND b.status = 'active' 
       ORDER BY b.created_at DESC 
       LIMIT $1`,
      [parseInt(limit as string)]
    );

    const books = result.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
      actual_price: parseFloat(row.discount_price || row.price)
    }));

    res.json({
      success: true,
      data: books
    } as ApiResponse);
  } catch (error) {
    console.error('Get new books error:', error);
    res.status(500).json({
      success: false,
      message: '获取新书列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT * FROM categories ORDER BY sort_order ASC, created_at ASC`
    );

    const categories = result.rows;

    const buildCategoryTree = (cats: any[], parentId: string | null = null): any[] => {
      return cats
        .filter(c => c.parent_id === parentId)
        .map(c => ({
          ...c,
          children: buildCategoryTree(cats, c.id)
        }));
    };

    const categoryTree = buildCategoryTree(categories);

    res.json({
      success: true,
      data: {
        flat: categories,
        tree: categoryTree
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getAuthors = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT author FROM books WHERE status = 'active' ORDER BY author ASC`
    );

    const authors = result.rows.map((r: any) => r.author);

    res.json({
      success: true,
      data: authors
    } as ApiResponse);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({
      success: false,
      message: '获取作者列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const getPublishers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT publisher FROM books WHERE status = 'active' ORDER BY publisher ASC`
    );

    const publishers = result.rows.map((r: any) => r.publisher);

    res.json({
      success: true,
      data: publishers
    } as ApiResponse);
  } catch (error) {
    console.error('Get publishers error:', error);
    res.status(500).json({
      success: false,
      message: '获取出版社列表失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
