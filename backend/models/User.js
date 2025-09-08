import { pool } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import bcrypt from 'bcryptjs';

export class User {
  // Get all users
  static async getAll() {
    const query = `
      SELECT 
        user_id as "userId",
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  // Get user by ID
  static async getById(userId) {
    const query = `
      SELECT 
        user_id as "userId",
        name,
        email,
        role,
        created_at,
        updated_at
      FROM users 
      WHERE user_id = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Get user by email
  static async getByEmail(email) {
    const query = `
      SELECT 
        user_id as "userId",
        name,
        email,
        password_hash as "passwordHash",
        role,
        created_at,
        updated_at
      FROM users 
      WHERE email = $1
    `;
    
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, role = 'Member' } = userData;
    
    // Check if email already exists
    const existingUser = await this.getByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 400);
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate unique user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO users (user_id, name, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        user_id as "userId",
        name,
        email,
        role,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [userId, name, email, passwordHash, role]);
    return result.rows[0];
  }

  // Update user
  static async update(userId, updateData) {
    const { name, email, password, role } = updateData;
    
    // Check if email already exists for another user
    if (email) {
      const existingUser = await this.getByEmail(email);
      if (existingUser && existingUser.userId !== userId) {
        throw new AppError('User with this email already exists', 400);
      }
    }
    
    let passwordHash = null;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }
    
    const query = `
      UPDATE users 
      SET 
        name = COALESCE($2, name),
        email = COALESCE($3, email),
        password_hash = COALESCE($4, password_hash),
        role = COALESCE($5, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING 
        user_id as "userId",
        name,
        email,
        role,
        created_at,
        updated_at
    `;
    
    const result = await pool.query(query, [userId, name, email, passwordHash, role]);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    return result.rows[0];
  }

  // Delete user
  static async delete(userId) {
    const query = 'DELETE FROM users WHERE user_id = $1 RETURNING user_id';
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    return result.rows[0];
  }

  // Check if user exists
  static async exists(userId) {
    const query = 'SELECT 1 FROM users WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows.length > 0;
  }

  // Verify password
  static async verifyPassword(email, password) {
    const user = await this.getByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
