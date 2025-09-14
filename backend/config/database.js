import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

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
    // Create users table (for authentication and personas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Member', -- 'Admin' | 'Member'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        hidden BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Backfill: add hidden column if missing for existing databases
    await client.query(`ALTER TABLE source_cards ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT FALSE`);

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
        assignee_id VARCHAR(255),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tier_id) REFERENCES tiers(tier_id) ON DELETE CASCADE,
        FOREIGN KEY (assignee_id) REFERENCES users(user_id) ON DELETE SET NULL
      )
    `);

    // Add new columns to existing cards table if they don't exist
    await client.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS assignee_id VARCHAR(255)`);
    await client.query(`ALTER TABLE cards ADD COLUMN IF NOT EXISTS due_date DATE`);
    
    // Add foreign key constraint for assignee_id if it doesn't exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'cards_assignee_id_fkey'
        ) THEN
          ALTER TABLE cards ADD CONSTRAINT cards_assignee_id_fkey 
          FOREIGN KEY (assignee_id) REFERENCES users(user_id) ON DELETE SET NULL;
        END IF;
      END $$;
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

    // Create source_comments table (for comments on source cards)
    await client.query(`
      CREATE TABLE IF NOT EXISTS source_comments (
        id SERIAL PRIMARY KEY,
        comment_id VARCHAR(255) UNIQUE NOT NULL,
        text TEXT NOT NULL,
        source_card_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (source_card_id) REFERENCES source_cards(card_id) ON DELETE CASCADE
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
      CREATE INDEX IF NOT EXISTS idx_source_comments_source_card_id ON source_comments(source_card_id);
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