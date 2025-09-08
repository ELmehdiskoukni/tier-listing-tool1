import { User } from '../models/User.js';
import { pool } from '../config/database.js';

const createTestUsers = async () => {
  try {
    console.log('Creating test users...');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'admin123',
      role: 'Admin'
    });
    console.log('Created admin user:', adminUser);

    // Create member user
    const memberUser = await User.create({
      name: 'Member User',
      email: 'member@test.com',
      password: 'member123',
      role: 'Member'
    });
    console.log('Created member user:', memberUser);

    console.log('\nTest users created successfully!');
    console.log('Admin login: admin@test.com / admin123');
    console.log('Member login: member@test.com / member123');

  } catch (error) {
    console.error('Error creating test users:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
};

createTestUsers();
