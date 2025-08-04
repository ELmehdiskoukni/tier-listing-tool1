import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

export class Version {
  // Get all versions
  static async getAll() {
    const query = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get version by ID
  static async getById(versionId) {
    const query = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      WHERE version_id = $1
    `;
    
    const result = await pool.query(query, [versionId]);
    return result.rows[0];
  }

  // Create new version
  static async create(versionData) {
    const { id, description, tiersData, sourceCardsData } = versionData;
    
    const query = `
      INSERT INTO versions (version_id, description, tiers_data, source_cards_data)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
    `;
    
    const result = await pool.query(query, [id, description, tiersData, sourceCardsData]);
    return result.rows[0];
  }

  // Delete version
  static async delete(versionId) {
    const query = 'DELETE FROM versions WHERE version_id = $1 RETURNING version_id';
    const result = await pool.query(query, [versionId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Version not found', 404);
    }
    
    return result.rows[0];
  }

  // Get recent versions (with limit)
  static async getRecent(limit = 20) {
    const query = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
  }

  // Get versions by date range
  static async getByDateRange(startDate, endDate) {
    const query = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      WHERE created_at >= $1 AND created_at <= $2
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Search versions by description
  static async search(query, limit = 50) {
    const sqlQuery = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      WHERE description ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(sqlQuery, [`%${query}%`, limit]);
    return result.rows;
  }

  // Get version count
  static async getCount() {
    const query = 'SELECT COUNT(*) as count FROM versions';
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  }

  // Get latest version
  static async getLatest() {
    const query = `
      SELECT 
        version_id as id,
        description,
        tiers_data as tiersData,
        source_cards_data as sourceCardsData,
        created_at
      FROM versions 
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Check if version exists
  static async exists(versionId) {
    const query = 'SELECT 1 FROM versions WHERE version_id = $1';
    const result = await pool.query(query, [versionId]);
    return result.rows.length > 0;
  }

  // Bulk delete old versions (keep only the most recent N versions)
  static async cleanupOldVersions(keepCount = 20) {
    const query = `
      DELETE FROM versions 
      WHERE version_id NOT IN (
        SELECT version_id 
        FROM versions 
        ORDER BY created_at DESC 
        LIMIT $1
      )
      RETURNING version_id
    `;
    
    const result = await pool.query(query, [keepCount]);
    return result.rows;
  }

  // Get version statistics
  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_versions,
        MIN(created_at) as first_version_date,
        MAX(created_at) as last_version_date,
        AVG(EXTRACT(EPOCH FROM (created_at - LAG(created_at) OVER (ORDER BY created_at)))) as avg_time_between_versions
      FROM versions
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Restore to a specific version
  static async restoreToVersion(versionId) {
    const version = await this.getById(versionId);
    
    if (!version) {
      throw new AppError('Version not found', 404);
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear current data
      await client.query('DELETE FROM comments');
      await client.query('DELETE FROM cards');
      await client.query('DELETE FROM source_cards');
      await client.query('DELETE FROM tiers');
      
      // Parse JSON data from version
      let tiersData = null;
      let sourceCardsData = null;

      try {
        // Handle both camelCase and lowercase field names
        const tiersDataField = version.tiersData || version.tiersdata;
        const sourceCardsDataField = version.sourceCardsData || version.sourcecardsdata;
        
        console.log('Fields to process:', {
          tiersDataField: typeof tiersDataField,
          sourceCardsDataField: typeof sourceCardsDataField
        });
        
        // Check if the data is already an object or needs to be parsed
        if (tiersDataField) {
          if (typeof tiersDataField === 'string') {
            tiersData = JSON.parse(tiersDataField);
          } else {
            tiersData = tiersDataField;
          }
          console.log('Processed tiersData:', tiersData);
        }
        
        if (sourceCardsDataField) {
          if (typeof sourceCardsDataField === 'string') {
            sourceCardsData = JSON.parse(sourceCardsDataField);
          } else {
            sourceCardsData = sourceCardsDataField;
          }
          console.log('Processed sourceCardsData:', sourceCardsData);
        }
      } catch (parseError) {
        console.error('Error processing version data:', parseError);
        // Continue with empty data if processing fails
      }
      
      // Restore tiers
      if (tiersData && Array.isArray(tiersData)) {
        for (const tier of tiersData) {
          await client.query(
            'INSERT INTO tiers (tier_id, name, color, position) VALUES ($1, $2, $3, $4)',
            [tier.id, tier.name, tier.color, tier.position]
          );
          
          // Restore cards for this tier
          if (tier.cards && Array.isArray(tier.cards)) {
            for (const card of tier.cards) {
              await client.query(
                'INSERT INTO cards (card_id, text, type, subtype, image_url, hidden, tier_id, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [card.id, card.text, card.type, card.subtype, card.imageUrl, card.hidden || false, tier.id, card.position || 0]
              );
              
              // Restore comments for this card
              if (card.comments && Array.isArray(card.comments)) {
                for (const comment of card.comments) {
                  await client.query(
                    'INSERT INTO comments (comment_id, text, card_id) VALUES ($1, $2, $3)',
                    [comment.id, comment.text, card.id]
                  );
                }
              }
            }
          }
        }
      }
      
      // Restore source cards
      if (sourceCardsData && typeof sourceCardsData === 'object') {
        for (const [category, cards] of Object.entries(sourceCardsData)) {
          if (Array.isArray(cards)) {
            for (const card of cards) {
              await client.query(
                'INSERT INTO source_cards (card_id, text, type, subtype, source_category, image_url) VALUES ($1, $2, $3, $4, $5, $6)',
                [card.id, card.text, card.type, card.subtype, category, card.imageUrl]
              );
            }
          }
        }
      }
      
      // Ensure at least 2 tiers exist (project requirement)
      const tierCountResult = await client.query('SELECT COUNT(*) as count FROM tiers');
      const tierCount = parseInt(tierCountResult.rows[0].count);
      
      if (tierCount < 2) {
        // Create default tiers (A, B, C, D, E) to meet the 5 default tiers requirement
        const defaultTiers = [
          { id: 'tier-a', name: 'A', color: 'bg-red-200', position: 0 },
          { id: 'tier-b', name: 'B', color: 'bg-orange-200', position: 1 },
          { id: 'tier-c', name: 'C', color: 'bg-yellow-200', position: 2 },
          { id: 'tier-d', name: 'D', color: 'bg-green-200', position: 3 },
          { id: 'tier-e', name: 'E', color: 'bg-blue-200', position: 4 }
        ];
        
        // Only create tiers that don't already exist
        for (let i = tierCount; i < 5; i++) {
          const tier = defaultTiers[i];
          await client.query(
            'INSERT INTO tiers (tier_id, name, color, position) VALUES ($1, $2, $3, $4)',
            [tier.id, tier.name, tier.color, tier.position]
          );
        }
      }
      
      await client.query('COMMIT');
      return version;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
} 