import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pool } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from project root
dotenv.config({ path: join(__dirname, '..', '..', '.env') })

async function ensureUsersTable() {
  // create table if not exists, minimal columns needed
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'User',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function run() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  try {
    await ensureUsersTable()

    const existing = await pool.query('SELECT email FROM users WHERE email=$1', [email])
    if (existing.rows.length > 0) {
      console.log(`Admin already exists: ${email}`)
      process.exit(0)
    }

    const hash = await bcrypt.hash(password, 10)
    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    await pool.query(
      'INSERT INTO users (user_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, hash, 'Admin']
    )

    console.log(`Admin inserted: ${email}`)
    process.exit(0)
  } catch (e) {
    console.error('Failed to insert admin:', e.message)
    process.exit(1)
  }
}

run()
