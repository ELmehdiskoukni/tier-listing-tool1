import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database schema creation
const createTables = async () => {
  const client = await pool.connect();
  
  try {
    // Create tiers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tiers (
        id SERIAL PRIMARY KEY,
        tier_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(100) DEFAULT 'bg-blue-200',
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create source_cards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_cards (
        id SERIAL PRIMARY KEY,
        card_id VARCHAR(255) UNIQUE NOT NULL,
        text VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subtype VARCHAR(50),
        source_category VARCHAR(50) NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create cards table (tier cards)
    await client.query(`
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        card_id VARCHAR(255) UNIQUE NOT NULL,
        text VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subtype VARCHAR(50),
        image_url TEXT,
        hidden BOOLEAN DEFAULT FALSE,
        tier_id VARCHAR(255) NOT NULL,
        position INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tier_id) REFERENCES tiers(tier_id) ON DELETE CASCADE
      )
    `);

    // Create comments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        comment_id VARCHAR(255) UNIQUE NOT NULL,
        text TEXT NOT NULL,
        card_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
      )
    `);

    // Create versions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS versions (
        id SERIAL PRIMARY KEY,
        version_id VARCHAR(255) UNIQUE NOT NULL,
        description VARCHAR(500) NOT NULL,
        tiers_data JSONB NOT NULL,
        source_cards_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tiers_position ON tiers(position);
      CREATE INDEX IF NOT EXISTS idx_cards_tier_id ON cards(tier_id);
      CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(position);
      CREATE INDEX IF NOT EXISTS idx_source_cards_category ON source_cards(source_category);
      CREATE INDEX IF NOT EXISTS idx_comments_card_id ON comments(card_id);
      CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Initialize database
export const initializeDatabase = async () => {
  try {
    await createTables();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
};

// Test database connection
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// If this file is run directly, initialize the database
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
} 