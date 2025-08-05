import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class Card {
  // Get all cards
  static async getAll() {
    const query = `
      SELECT 
        card_id as id,
        text,
        type,
        subtype,
        image_url as imageUrl,
        hidden,
        tier_id as tierId,
        position,
        created_at,
        updated_at
      FROM cards 
      ORDER BY tier_id, position ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get card by ID
  static async getById(cardId) {
    const query = `
      SELECT 
        card_id as "id",
        text,
        type,
        subtype,
        image_url as "imageUrl",
        hidden,
        tier_id as "tierId",
        position,
        created_at,
        updated_at
      FROM cards 
      WHERE card_id = $1
    `;
    
    const result = await pool.query(query, [cardId]);
    return result.rows[0];
  }

  // Get cards by tier ID
  static async getByTierId(tierId) {
    const query = `
      SELECT 
        c.card_id as id,
        c.text,
        c.type,
        c.subtype,
        c.image_url as imageUrl,
        c.hidden,
        c.tier_id as tierId,
        c.position,
        c.created_at,
        c.updated_at,
        json_agg(
          CASE 
            WHEN cm.comment_id IS NOT NULL THEN
              json_build_object(
                'id', cm.comment_id,
                'text', cm.text,
                'createdAt', cm.created_at
              )
            ELSE NULL
          END
        ) FILTER (WHERE cm.comment_id IS NOT NULL) as comments
      FROM cards c
      LEFT JOIN comments cm ON c.card_id = cm.card_id
      WHERE c.tier_id = $1
      GROUP BY c.card_id, c.text, c.type, c.subtype, c.image_url, c.hidden, c.tier_id, c.position, c.created_at, c.updated_at
      ORDER BY c.position ASC
    `;
    
    const result = await pool.query(query, [tierId]);
    return result.rows;
  }

  // Create new card
  static async create(cardData) {
    const { id, text, type, subtype, imageUrl, hidden = false, tierId, position } = cardData;
    
    const query = `
      INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        card_id as "id",
        text,
        type,
        subtype,
        image_url as "imageUrl",
        hidden,
        tier_id as "tierId",
        position,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [id, text, type, subtype, imageUrl, hidden, tierId, position]);
    const createdCard = result.rows[0];
    
    return createdCard;
  }

  // Update card
  static async update(cardId, updateData) {
    const { text, type, subtype, imageUrl, hidden, position } = updateData;
    
    const query = `
      UPDATE cards 
      SET 
        text = COALESCE($2, text),
        type = COALESCE($3, type),
        subtype = COALESCE($4, subtype),
        image_url = COALESCE($5, image_url),
        hidden = COALESCE($6, hidden),
        position = COALESCE($7, position),
        updated_at = CURRENT_TIMESTAMP
      WHERE card_id = $1
      RETURNING 
        card_id as id,
        text,
        type,
        subtype,
        image_url as imageUrl,
        hidden,
        tier_id as tierId,
        position,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [cardId, text, type, subtype, imageUrl, hidden, position]);
    
    if (result.rows.length === 0) {
      throw new AppError('Card not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete card
  static async delete(cardId) {
    const query = 'DELETE FROM cards WHERE card_id = $1 RETURNING card_id';
    const result = await pool.query(query, [cardId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Card not found', 404);
    }
    
    return result.rows[0];
  }

  // Move card to different tier
  static async moveToTier(cardId, targetTierId, newPosition) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current card info
      const currentResult = await client.query(
        'SELECT tier_id, position FROM cards WHERE card_id = $1',
        [cardId]
      );
      
      if (currentResult.rows.length === 0) {
        throw new AppError('Card not found', 404);
      }
      
      const currentTierId = currentResult.rows[0].tier_id;
      const currentPosition = currentResult.rows[0].position;
      
      // If moving within the same tier, just update position
      if (currentTierId === targetTierId) {
        await this.updatePositionInTier(client, cardId, currentPosition, newPosition, targetTierId);
      } else {
        // Moving to different tier
        // First, get the card data before deleting
        const cardDataResult = await client.query(
          'SELECT text, type, subtype, image_url, hidden FROM cards WHERE card_id = $1',
          [cardId]
        );
        
        if (cardDataResult.rows.length === 0) {
          throw new AppError('Card not found', 404);
        }
        
        const cardData = cardDataResult.rows[0];
        
        // Remove from current tier and shift positions
        await client.query(
          'DELETE FROM cards WHERE card_id = $1',
          [cardId]
        );
        
        await client.query(
          'UPDATE cards SET position = position - 1, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1 AND position > $2',
          [currentTierId, currentPosition]
        );
        
        // Then, shift positions in target tier and insert
        await client.query(
          'UPDATE cards SET position = position + 1, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1 AND position >= $2',
          [targetTierId, newPosition]
        );
        
        await client.query(
          'INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [cardId, cardData.text, cardData.type, cardData.subtype, cardData.image_url, cardData.hidden, targetTierId, newPosition]
        );
      }
      
      await client.query('COMMIT');
      return this.getById(cardId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update position within the same tier
  static async updatePositionInTier(client, cardId, currentPosition, newPosition, tierId) {
    if (currentPosition === newPosition) {
      return;
    }
    
    if (currentPosition < newPosition) {
      // Moving down: shift cards between current and new position up
      await client.query(
        'UPDATE cards SET position = position - 1, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1 AND position > $2 AND position <= $3',
        [tierId, currentPosition, newPosition]
      );
    } else {
      // Moving up: shift cards between new and current position down
      await client.query(
        'UPDATE cards SET position = position + 1, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1 AND position >= $2 AND position < $3',
        [tierId, newPosition, currentPosition]
      );
    }
    
    // Update the target card position
    await client.query(
      'UPDATE cards SET position = $2, updated_at = CURRENT_TIMESTAMP WHERE card_id = $1',
      [cardId, newPosition]
    );
  }

  // Get next position for new card in tier
  static async getNextPositionInTier(tierId) {
    const query = 'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM cards WHERE tier_id = $1';
    const result = await pool.query(query, [tierId]);
    return result.rows[0].next_position;
  }

  // Check if card exists
  static async exists(cardId) {
    const query = 'SELECT 1 FROM cards WHERE card_id = $1';
    const result = await pool.query(query, [cardId]);
    return result.rows.length > 0;
  }

  // Bulk create cards
  static async bulkCreate(cardsData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const createdCards = [];
      
      for (const cardData of cardsData) {
        const { id, text, type, subtype, imageUrl, hidden = false, tierId, position } = cardData;
        
        const query = `
          INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING 
            card_id as id,
            text,
            type,
            subtype,
            image_url as imageUrl,
            hidden,
            tier_id as tierId,
            position,
            created_at,
            updated_at
        `;
        
        const result = await client.query(query, [id, text, type, subtype, imageUrl, hidden, tierId, position]);
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

  // Bulk delete cards
  static async bulkDelete(cardIds) {
    const query = 'DELETE FROM cards WHERE card_id = ANY($1) RETURNING card_id';
    const result = await pool.query(query, [cardIds]);
    return result.rows;
  }

  // Get card with comments
  static async getWithComments(cardId) {
    const query = `
      SELECT 
        c.card_id as id,
        c.text,
        c.type,
        c.subtype,
        c.image_url as imageUrl,
        c.hidden,
        c.tier_id as tierId,
        c.position,
        c.created_at,
        c.updated_at,
        json_agg(
          CASE 
            WHEN cm.comment_id IS NOT NULL THEN
              json_build_object(
                'id', cm.comment_id,
                'text', cm.text,
                'createdAt', cm.created_at
              )
            ELSE NULL
          END
        ) FILTER (WHERE cm.comment_id IS NOT NULL) as comments
      FROM cards c
      LEFT JOIN comments cm ON c.card_id = cm.card_id
      WHERE c.card_id = $1
      GROUP BY c.card_id, c.text, c.type, c.subtype, c.image_url, c.hidden, c.tier_id, c.position, c.created_at, c.updated_at
    `;
    
    const result = await pool.query(query, [cardId]);
    const card = result.rows[0];
    
    if (!card) {
      throw new AppError('Card not found', 404);
    }
    
    return card;
  }
} 