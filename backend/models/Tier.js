import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class Tier {
  // Get all tiers ordered by position
  static async getAll() {
    const query = `
      SELECT 
        tier_id as id,
        name,
        color,
        position,
        created_at,
        updated_at
      FROM tiers 
      ORDER BY position ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get tier by ID
  static async getById(tierId) {
    const query = `
      SELECT 
        tier_id as id,
        name,
        color,
        position,
        created_at,
        updated_at
      FROM tiers 
      WHERE tier_id = $1
    `;
    
    const result = await pool.query(query, [tierId]);
    return result.rows[0];
  }

  // Create new tier
  static async create(tierData) {
    const { id, name, color = 'bg-blue-200', position } = tierData;
    
    const query = `
      INSERT INTO tiers (tier_id, name, color, position)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        tier_id as id,
        name,
        color,
        position,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [id, name, color, position]);
    return result.rows[0];
  }

  // Update tier
  static async update(tierId, updateData) {
    const { name, color, position } = updateData;
    
    const query = `
      UPDATE tiers 
      SET 
        name = COALESCE($2, name),
        color = COALESCE($3, color),
        position = COALESCE($4, position),
        updated_at = CURRENT_TIMESTAMP
      WHERE tier_id = $1
      RETURNING 
        tier_id as id,
        name,
        color,
        position,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [tierId, name, color, position]);
    
    if (result.rows.length === 0) {
      throw new AppError('Tier not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete tier
  static async delete(tierId) {
    const query = 'DELETE FROM tiers WHERE tier_id = $1 RETURNING tier_id';
    const result = await pool.query(query, [tierId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Tier not found', 404);
    }
    
    return result.rows[0];
  }

  // Move tier position
  static async movePosition(tierId, newPosition) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current position
      const currentResult = await client.query(
        'SELECT position FROM tiers WHERE tier_id = $1',
        [tierId]
      );
      
      if (currentResult.rows.length === 0) {
        throw new AppError('Tier not found', 404);
      }
      
      const currentPosition = currentResult.rows[0].position;
      
      if (currentPosition === newPosition) {
        await client.query('COMMIT');
        return this.getById(tierId);
      }
      
      // Update positions of other tiers
      if (currentPosition < newPosition) {
        // Moving down: shift tiers between current and new position up
        await client.query(
          'UPDATE tiers SET position = position - 1, updated_at = CURRENT_TIMESTAMP WHERE position > $1 AND position <= $2',
          [currentPosition, newPosition]
        );
      } else {
        // Moving up: shift tiers between new and current position down
        await client.query(
          'UPDATE tiers SET position = position + 1, updated_at = CURRENT_TIMESTAMP WHERE position >= $1 AND position < $2',
          [newPosition, currentPosition]
        );
      }
      
      // Update the target tier position
      await client.query(
        'UPDATE tiers SET position = $2, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1',
        [tierId, newPosition]
      );
      
      await client.query('COMMIT');
      return this.getById(tierId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Move tier by direction (up or down)
  static async moveByDirection(tierId, direction) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get current position
      const currentResult = await client.query(
        'SELECT position FROM tiers WHERE tier_id = $1',
        [tierId]
      );
      
      if (currentResult.rows.length === 0) {
        throw new AppError('Tier not found', 404);
      }
      
      const currentPosition = currentResult.rows[0].position;
      
      // Get all tiers ordered by position
      const allTiersResult = await client.query(
        'SELECT tier_id, position FROM tiers ORDER BY position ASC'
      );
      
      const allTiers = allTiersResult.rows;
      const currentIndex = allTiers.findIndex(tier => tier.tier_id === tierId);
      
      if (currentIndex === -1) {
        throw new AppError('Tier not found', 404);
      }
      
      let newPosition;
      
      if (direction === 'up') {
        // Moving up: swap with tier above
        if (currentIndex === 0) {
          // Already at the top, can't move up
          await client.query('COMMIT');
          return this.getById(tierId);
        }
        newPosition = allTiers[currentIndex - 1].position;
      } else if (direction === 'down') {
        // Moving down: swap with tier below
        if (currentIndex === allTiers.length - 1) {
          // Already at the bottom, can't move down
          await client.query('COMMIT');
          return this.getById(tierId);
        }
        newPosition = allTiers[currentIndex + 1].position;
      } else {
        throw new AppError('Invalid direction', 400);
      }
      
      // Swap positions with the adjacent tier
      const adjacentTierId = direction === 'up' ? allTiers[currentIndex - 1].tier_id : allTiers[currentIndex + 1].tier_id;
      
      // Update the adjacent tier to the current position
      await client.query(
        'UPDATE tiers SET position = $2, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1',
        [adjacentTierId, currentPosition]
      );
      
      // Update the target tier to the new position
      await client.query(
        'UPDATE tiers SET position = $2, updated_at = CURRENT_TIMESTAMP WHERE tier_id = $1',
        [tierId, newPosition]
      );
      
      await client.query('COMMIT');
      return this.getById(tierId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get tier with cards

// Get tier with cards and comments
static async getWithCards(tierId) {
  const query = `
    SELECT 
      t.tier_id as id,
      t.name,
      t.color,
      t.position,
      t.created_at,
      t.updated_at,
      json_agg(
        CASE 
          WHEN c.card_id IS NOT NULL THEN
            json_build_object(
              'id', c.card_id,
              'text', c.text,
              'type', c.type,
              'subtype', c.subtype,
              'imageUrl', c.image_url,
              'hidden', c.hidden,
              'position', c.position,
              'comments', COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', cm.comment_id,
                    'text', cm.text,
                    'createdAt', to_char(cm.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                  )
                  ORDER BY cm.created_at ASC
                ) FROM comments cm WHERE cm.card_id = c.card_id),
                '[]'::json
              )
            )
          ELSE NULL
        END
      ) FILTER (WHERE c.card_id IS NOT NULL) as cards
    FROM tiers t
    LEFT JOIN cards c ON t.tier_id = c.tier_id
    WHERE t.tier_id = $1
    GROUP BY t.tier_id, t.name, t.color, t.position, t.created_at, t.updated_at
  `;
  
  const result = await pool.query(query, [tierId]);
  const tier = result.rows[0];
  
  if (!tier) {
    throw new AppError('Tier not found', 404);
  }
  
  // Ensure cards is always an array and sort cards by position
  if (!Array.isArray(tier.cards)) {
    tier.cards = [];
  }
  
  // Sort cards by position
  if (tier.cards.length > 0) {
    tier.cards.sort((a, b) => a.position - b.position);
  }
  
  return tier;
}

  // Get all tiers with cards

// Get all tiers with cards and comments
static async getAllWithCards() {
  const query = `
    SELECT 
      t.tier_id as "id",
      t.name,
      t.color,
      t.position,
      t.created_at,
      t.updated_at,
      json_agg(
        CASE 
          WHEN c.card_id IS NOT NULL THEN
            json_build_object(
              'id', c.card_id,
              'text', c.text,
              'type', c.type,
              'subtype', c.subtype,
              'imageUrl', c.image_url,
              'hidden', c.hidden,
              'position', c.position,
              'comments', COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', cm.comment_id,
                    'text', cm.text,
                    'createdAt', to_char(cm.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                  )
                  ORDER BY cm.created_at ASC
                ) FROM comments cm WHERE cm.card_id = c.card_id),
                '[]'::json
              )
            )
          ELSE NULL
        END
      ) FILTER (WHERE c.card_id IS NOT NULL) as cards
    FROM tiers t
    LEFT JOIN cards c ON t.tier_id = c.tier_id
    GROUP BY t.tier_id, t.name, t.color, t.position, t.created_at, t.updated_at
    ORDER BY t.position ASC
  `;
  
  const result = await pool.query(query);
  const tiers = result.rows;
  
  // Ensure each tier has a proper cards array and sort cards by position
  tiers.forEach(tier => {
    // Ensure cards is always an array
    if (!Array.isArray(tier.cards)) {
      tier.cards = [];
    }
    
    // Sort cards by position
    if (tier.cards.length > 0) {
      tier.cards.sort((a, b) => a.position - b.position);
    }
  });
  
  return tiers;
}

  // Check if tier exists
  static async exists(tierId) {
    const query = 'SELECT 1 FROM tiers WHERE tier_id = $1';
    const result = await pool.query(query, [tierId]);
    return result.rows.length > 0;
  }

  // Get next position for new tier
  static async getNextPosition() {
    const query = 'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM tiers';
    const result = await pool.query(query);
    return result.rows[0].next_position;
  }
} 