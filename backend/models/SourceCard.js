import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class SourceCard {
  // Get all source cards
  static async getAll() {
    const query = `
      SELECT 
        sc.card_id as "id",
        sc.text,
        sc.type,
        sc.subtype,
        sc.source_category as "sourceCategory",
        sc.image_url as "imageUrl",
        sc.created_at,
        sc.updated_at,
        sc.hidden,
        json_agg(
          CASE 
            WHEN scm.comment_id IS NOT NULL THEN
              json_build_object(
                'id', scm.comment_id,
                'text', scm.text,
                'createdAt', scm.created_at
              )
            ELSE NULL
          END
        ) FILTER (WHERE scm.comment_id IS NOT NULL) as comments
      FROM source_cards sc
      LEFT JOIN source_comments scm ON sc.card_id = scm.source_card_id
      GROUP BY sc.card_id, sc.text, sc.type, sc.subtype, sc.source_category, sc.image_url, sc.created_at, sc.updated_at, sc.hidden
      ORDER BY sc.source_category, sc.created_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get source cards by category
  static async getByCategory(category) {
    const query = `
      SELECT 
        sc.card_id as "id",
        sc.text,
        sc.type,
        sc.subtype,
        sc.source_category as "sourceCategory",
        sc.image_url as "imageUrl",
        sc.created_at,
        sc.updated_at,
        sc.hidden,
        json_agg(
          CASE 
            WHEN scm.comment_id IS NOT NULL THEN
              json_build_object(
                'id', scm.comment_id,
                'text', scm.text,
                'createdAt', scm.created_at
              )
            ELSE NULL
          END
        ) FILTER (WHERE scm.comment_id IS NOT NULL) as comments
      FROM source_cards sc
      LEFT JOIN source_comments scm ON sc.card_id = scm.source_card_id
      WHERE sc.source_category = $1
      GROUP BY sc.card_id, sc.text, sc.type, sc.subtype, sc.source_category, sc.image_url, sc.created_at, sc.updated_at, sc.hidden
      ORDER BY sc.created_at ASC
    `;
    
    const result = await pool.query(query, [category]);
    return result.rows;
  }

  // Get source card by ID
  static async getById(cardId) {
    const query = `
      SELECT 
        sc.card_id as "id",
        sc.text,
        sc.type,
        sc.subtype,
        sc.source_category as "sourceCategory",
        sc.image_url as "imageUrl",
        sc.created_at,
        sc.updated_at,
        sc.hidden,
        json_agg(
          CASE 
            WHEN scm.comment_id IS NOT NULL THEN
              json_build_object(
                'id', scm.comment_id,
                'text', scm.text,
                'createdAt', scm.created_at
              )
            ELSE NULL
          END
        ) FILTER (WHERE scm.comment_id IS NOT NULL) as comments
      FROM source_cards sc
      LEFT JOIN source_comments scm ON sc.card_id = scm.source_card_id
      WHERE sc.card_id = $1
      GROUP BY sc.card_id, sc.text, sc.type, sc.subtype, sc.source_category, sc.image_url, sc.created_at, sc.updated_at, sc.hidden
    `;
    
    const result = await pool.query(query, [cardId]);
    const sourceCard = result.rows[0];
    
    return sourceCard;
  }

  // Create new source card
  static async create(cardData) {
    const { id, text, type, subtype, sourceCategory, imageUrl } = cardData;
    
    const query = `
      INSERT INTO source_cards (card_id, text, type, subtype, source_category, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        card_id as id,
        text,
        type,
        subtype,
        source_category as sourceCategory,
        image_url as imageUrl,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [id, text, type, subtype, sourceCategory, imageUrl]);
    return result.rows[0];
  }

  // Update source card
  static async update(cardId, updateData) {
    const { text, type, subtype, imageUrl } = updateData;
    
    const query = `
      UPDATE source_cards 
      SET 
        text = COALESCE($2, text),
        type = COALESCE($3, type),
        subtype = COALESCE($4, subtype),
        image_url = COALESCE($5, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE card_id = $1
      RETURNING 
        card_id as id,
        text,
        type,
        subtype,
        source_category as sourceCategory,
        image_url as imageUrl,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [cardId, text, type, subtype, imageUrl]);
    
    if (result.rows.length === 0) {
      throw new AppError('Source card not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete source card
  static async delete(cardId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete the source card
      const deleteResult = await client.query(
        'DELETE FROM source_cards WHERE card_id = $1 RETURNING card_id',
        [cardId]
      );
      
      if (deleteResult.rows.length === 0) {
        throw new AppError('Source card not found', 404);
      }
      
      // Cascade delete: remove all tier cards that reference this source item
      const cascadeResult = await client.query(
        'DELETE FROM cards WHERE text = (SELECT text FROM source_cards WHERE card_id = $1) AND type = (SELECT type FROM source_cards WHERE card_id = $1) RETURNING card_id',
        [cardId]
      );
      
      await client.query('COMMIT');
      
      return {
        deletedSourceCard: deleteResult.rows[0],
        cascadeDeletedCards: cascadeResult.rows
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get all source cards grouped by category
  static async getAllGroupedByCategory() {
    const query = `
      SELECT 
        sc.source_category as category,
        json_agg(
          json_build_object(
            'id', sc.card_id,
            'text', sc.text,
            'type', sc.type,
            'subtype', sc.subtype,
            'sourceCategory', sc.source_category,
            'imageUrl', sc.image_url,
            'createdAt', sc.created_at,
            'updatedAt', sc.updated_at,
            'hidden', sc.hidden,
            'comments', COALESCE(comments.comments, '[]'::json)
          )
        ) as cards
      FROM source_cards sc
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'id', scm.comment_id,
            'text', scm.text,
            'createdAt', scm.created_at
          )
          ORDER BY scm.created_at ASC
        ) as comments
        FROM source_comments scm
        WHERE scm.source_card_id = sc.card_id
      ) comments ON true
      GROUP BY sc.source_category
      ORDER BY sc.source_category
    `;
    
    const result = await pool.query(query);
    
    // Convert to object format expected by frontend
    const groupedCards = {};
    result.rows.forEach(row => {
      groupedCards[row.category] = row.cards;
    });
    
    return groupedCards;
  }

  // Check if source card exists
  static async exists(cardId) {
    const query = 'SELECT 1 FROM source_cards WHERE card_id = $1';
    const result = await pool.query(query, [cardId]);
    return result.rows.length > 0;
  }

  // Bulk create source cards
  static async bulkCreate(cardsData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createdCards = [];
      
      for (const cardData of cardsData) {
        const { id, text, type, subtype, sourceCategory, imageUrl } = cardData;
        
        const query = `
          INSERT INTO source_cards (card_id, text, type, subtype, source_category, image_url)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING 
            card_id as id,
            text,
            type,
            subtype,
            source_category as sourceCategory,
            image_url as imageUrl,
            created_at,
            updated_at
        `;
        
        const result = await client.query(query, [id, text, type, subtype, sourceCategory, imageUrl]);
        createdCards.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdCards;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk delete source cards
  static async bulkDelete(cardIds) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const deletedCards = [];
      
      for (const cardId of cardIds) {
        const result = await this.delete(cardId);
        deletedCards.push(result);
      }
      
      await client.query('COMMIT');
      return deletedCards;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Search source cards
  static async search(query, category = null) {
    let sqlQuery = `
      SELECT 
        card_id as id,
        text,
        type,
        subtype,
        source_category as sourceCategory,
        image_url as imageUrl,
        created_at,
        updated_at
      FROM source_cards 
      WHERE text ILIKE $1
    `;
    
    const params = [`%${query}%`];
    
    if (category) {
      sqlQuery += ' AND source_category = $2';
      params.push(category);
    }
    
    sqlQuery += ' ORDER BY created_at ASC';
    
    const result = await pool.query(sqlQuery, params);
    return result.rows;
  }

  // Get source card statistics
  static async getStats() {
    const query = `
      SELECT 
        source_category as category,
        COUNT(*) as count
      FROM source_cards 
      GROUP BY source_category
      ORDER BY source_category
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
} 