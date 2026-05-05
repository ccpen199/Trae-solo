import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { getRedisClient } from '../config/redis';
import { ApiResponse, CartItem, Book } from '../types';

export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const redisClient = getRedisClient();

    const cartKey = `cart:${userId}`;
    let redisItems: any[] = [];
    
    if (redisClient) {
      try {
        const redisData = await redisClient.get(cartKey);
        if (redisData) {
          redisItems = JSON.parse(redisData);
        }
      } catch (redisErr) {
        console.warn('Redis read error, falling back to DB:', redisErr);
      }
    }

    const dbResult = await pool.query(
      `SELECT ci.*, b.title, b.author, b.publisher, b.price, b.discount_price, b.cover_image, b.stock, b.status 
       FROM cart_items ci 
       JOIN books b ON ci.book_id = b.id 
       WHERE ci.user_id = $1`,
      [userId]
    );

    const dbItems = dbResult.rows.map((row: any) => ({
      ...row,
      price: parseFloat(row.price),
      discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
      actual_price: parseFloat(row.discount_price || row.price),
      book: {
        id: row.book_id,
        title: row.title,
        author: row.author,
        publisher: row.publisher,
        price: parseFloat(row.price),
        discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
        actual_price: parseFloat(row.discount_price || row.price),
        cover_image: row.cover_image,
        stock: row.stock,
        status: row.status
      }
    }));

    let items = [...dbItems];
    
    if (redisItems.length > 0 && dbItems.length === 0) {
      const bookIds = redisItems.map((item: any) => item.bookId);
      const booksResult = await pool.query(
        `SELECT * FROM books WHERE id = ANY($1)`,
        [bookIds]
      );
      
      const booksMap = new Map(booksResult.rows.map((b: any) => [b.id, {
        ...b,
        price: parseFloat(b.price),
        discount_price: b.discount_price ? parseFloat(b.discount_price) : null,
        actual_price: parseFloat(b.discount_price || b.price)
      }]));

      items = redisItems.map((item: any) => {
        const book = booksMap.get(item.bookId);
        return {
          id: item.id || uuidv4(),
          user_id: userId,
          book_id: item.bookId,
          quantity: item.quantity,
          added_at: item.addedAt || new Date(),
          book
        };
      });
    }

    const totalAmount = items.reduce((sum, item) => {
      const price = item.book?.actual_price || item.actual_price || 0;
      return sum + price * item.quantity;
    }, 0);

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    res.json({
      success: true,
      data: {
        items,
        totalAmount,
        totalQuantity
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: '获取购物车失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { bookId, quantity = 1 } = req.body;

    const bookResult = await pool.query(
      'SELECT * FROM books WHERE id = $1 AND status = $2',
      [bookId, 'active']
    );

    if (bookResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '图书不存在或已下架'
      } as ApiResponse);
      return;
    }

    const book = bookResult.rows[0];
    if (book.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `库存不足，当前库存: ${book.stock}`
      } as ApiResponse);
      return;
    }

    const existingCartItem = await pool.query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    let cartItem;
    if (existingCartItem.rows.length > 0) {
      const newQuantity = existingCartItem.rows[0].quantity + quantity;
      const result = await pool.query(
        `UPDATE cart_items 
         SET quantity = $1 
         WHERE user_id = $2 AND book_id = $3 
         RETURNING *`,
        [newQuantity, userId, bookId]
      );
      cartItem = result.rows[0];
    } else {
      const cartItemId = uuidv4();
      const result = await pool.query(
        `INSERT INTO cart_items (id, user_id, book_id, quantity) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [cartItemId, userId, bookId, quantity]
      );
      cartItem = result.rows[0];
    }

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const cartKey = `cart:${userId}`;
        const redisData = await redisClient.get(cartKey);
        let cartItems = redisData ? JSON.parse(redisData) : [];
        
        const existingIndex = cartItems.findIndex((item: any) => item.bookId === bookId);
        if (existingIndex >= 0) {
          cartItems[existingIndex].quantity = cartItem.quantity;
        } else {
          cartItems.push({
            id: cartItem.id,
            bookId,
            quantity: cartItem.quantity,
            addedAt: cartItem.added_at
          });
        }
        
        await redisClient.set(cartKey, JSON.stringify(cartItems), { EX: 86400 });
      } catch (redisErr) {
        console.warn('Redis write error:', redisErr);
      }
    }

    res.json({
      success: true,
      data: {
        ...cartItem,
        book: {
          id: book.id,
          title: book.title,
          author: book.author,
          price: parseFloat(book.price),
          discount_price: book.discount_price ? parseFloat(book.discount_price) : null,
          actual_price: parseFloat(book.discount_price || book.price)
        }
      },
      message: '已加入购物车'
    } as ApiResponse);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: '加入购物车失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const itemId = req.params.id;
    const { quantity } = req.body;

    if (quantity < 1) {
      res.status(400).json({
        success: false,
        message: '数量必须大于0'
      } as ApiResponse);
      return;
    }

    const existingItem = await pool.query(
      `SELECT ci.*, b.stock 
       FROM cart_items ci 
       JOIN books b ON ci.book_id = b.id 
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [itemId, userId]
    );

    if (existingItem.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '购物车项不存在'
      } as ApiResponse);
      return;
    }

    const item = existingItem.rows[0];
    if (item.stock < quantity) {
      res.status(400).json({
        success: false,
        message: `库存不足，当前库存: ${item.stock}`
      } as ApiResponse);
      return;
    }

    const result = await pool.query(
      `UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *`,
      [quantity, itemId]
    );

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const cartKey = `cart:${userId}`;
        const redisData = await redisClient.get(cartKey);
        if (redisData) {
          let cartItems = JSON.parse(redisData);
          const index = cartItems.findIndex((i: any) => i.id === itemId);
          if (index >= 0) {
            cartItems[index].quantity = quantity;
            await redisClient.set(cartKey, JSON.stringify(cartItems), { EX: 86400 });
          }
        }
      } catch (redisErr) {
        console.warn('Redis update error:', redisErr);
      }
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: '数量已更新'
    } as ApiResponse);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: '更新购物车失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const itemId = req.params.id;

    const result = await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2 RETURNING *',
      [itemId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '购物车项不存在'
      } as ApiResponse);
      return;
    }

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        const cartKey = `cart:${userId}`;
        const redisData = await redisClient.get(cartKey);
        if (redisData) {
          let cartItems = JSON.parse(redisData);
          cartItems = cartItems.filter((i: any) => i.id !== itemId);
          await redisClient.set(cartKey, JSON.stringify(cartItems), { EX: 86400 });
        }
      } catch (redisErr) {
        console.warn('Redis remove error:', redisErr);
      }
    }

    res.json({
      success: true,
      message: '已从购物车移除'
    } as ApiResponse);
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: '移除购物车项失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    await pool.query(
      'DELETE FROM cart_items WHERE user_id = $1',
      [userId]
    );

    const redisClient = getRedisClient();
    if (redisClient) {
      try {
        await redisClient.del(`cart:${userId}`);
      } catch (redisErr) {
        console.warn('Redis clear error:', redisErr);
      }
    }

    res.json({
      success: true,
      message: '购物车已清空'
    } as ApiResponse);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: '清空购物车失败',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as ApiResponse);
  }
};
