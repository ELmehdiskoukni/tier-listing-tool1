import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class Comment {
  // Get all comments
  static async getAll() {
    const query = `
      SELECT 
        comment_id as id,
        text,
        card_id as cardId,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
      FROM comments 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get comment by ID
  static async getById(commentId) {
    const query = `
      SELECT 
        comment_id as id,
        text,
        card_id as cardId,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
      FROM comments 
      WHERE comment_id = $1
    `;
    
    const result = await pool.query(query, [commentId]);
    return result.rows[0];
  }

  // Get comments by card ID
  static async getByCardId(cardId) {
    const query = `
      SELECT 
        comment_id as id,
        text,
        card_id as cardId,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "createdAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as "updatedAt"
      FROM comments 
      WHERE card_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await pool.query(query, [cardId]);
    return result.rows;
  }

  // Create new comment
  static async create(commentData) {
    const { id, text, cardId } = commentData;
    
    const query = `
      INSERT INTO comments (comment_id, text, card_id, created_at, updated_at)
      VALUES ($1, $2, $3, (NOW() AT TIME ZONE 'UTC'), (NOW() AT TIME ZONE 'UTC'))
      RETURNING 
        comment_id as id,
        text,
        card_id as cardId,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "createdAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [id, text, cardId]);
    return result.rows[0];
  }

  // Update comment
  static async update(commentId, updateData) {
    const { text } = updateData;
    
    const query = `
      UPDATE comments 
      SET 
        text = COALESCE($2, text),
        updated_at = (NOW() AT TIME ZONE 'UTC')
      WHERE comment_id = $1
      RETURNING 
        comment_id as id,
        text,
        card_id as cardId,
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "createdAt",
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "updatedAt"
    `;
    
    const result = await pool.query(query, [commentId, text]);
    
    if (result.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete comment
  static async delete(commentId) {
    const query = 'DELETE FROM comments WHERE comment_id = $1 RETURNING comment_id';
    const result = await pool.query(query, [commentId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Comment not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete all comments for a card
  static async deleteByCardId(cardId) {
    const query = 'DELETE FROM comments WHERE card_id = $1 RETURNING comment_id';
    const result = await pool.query(query, [cardId]);
    return result.rows;
  }

  // Check if comment exists
  static async exists(commentId) {
    const query = 'SELECT 1 FROM comments WHERE comment_id = $1';
    const result = await pool.query(query, [commentId]);
    return result.rows.length > 0;
  }

  // Get comment count for a card
  static async getCountByCardId(cardId) {
    const query = 'SELECT COUNT(*) as count FROM comments WHERE card_id = $1';
    const result = await pool.query(query, [cardId]);
    return parseInt(result.rows[0].count);
  }

  // Bulk create comments
  static async bulkCreate(commentsData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createdComments = [];
      
      for (const commentData of commentsData) {
        const { id, text, cardId } = commentData;
        
        const query = `
          INSERT INTO comments (comment_id, text, card_id)
          VALUES ($1, $2, $3)
          RETURNING 
            comment_id as id,
            text,
            card_id as cardId,
            created_at,
            updated_at
        `;
        
        const result = await client.query(query, [id, text, cardId]);
        createdComments.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdComments;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk delete comments
  static async bulkDelete(commentIds) {
    const query = 'DELETE FROM comments WHERE comment_id = ANY($1) RETURNING comment_id';
    const result = await pool.query(query, [commentIds]);
    return result.rows;
  }

  // Get recent comments
  static async getRecent(limit = 10) {
    const query = `
      SELECT 
        c.comment_id as id,
        c.text,
        c.card_id as cardId,
        to_char(c.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "createdAt",
        to_char(c.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"') as "updatedAt",
        card.text as cardText,
        card.type as cardType
      FROM comments c
      JOIN cards card ON c.card_id = card.card_id
      ORDER BY c.created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Search comments
  static async search(query, limit = 50) {
    const sqlQuery = `
      SELECT 
        comment_id as id,
        text,
        card_id as cardId,
        created_at,
        updated_at
      FROM comments 
      WHERE text ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(sqlQuery, [`%${query}%`, limit]);
    return result.rows;
  }
} 