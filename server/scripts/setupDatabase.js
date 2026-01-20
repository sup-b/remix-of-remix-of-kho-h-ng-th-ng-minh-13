import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Starting database setup...\n');

    // Connect to MySQL without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL server');

    // Read schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing schema...');
    await connection.query(schema);
    console.log('✅ Database and tables created successfully!\n');

    // Switch to the database
    await connection.query(`USE ${process.env.DB_NAME || 'quanlybanhang'}`);

    // Create admin user
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

    // Check if admin already exists
    const [existingAdmin] = await connection.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [adminUsername, adminEmail]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Admin user already exists, skipping...');
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminId = generateId();

      await connection.query(
        `INSERT INTO users (id, username, email, password, role, isActive) 
         VALUES (?, ?, ?, ?, 'admin', TRUE)`,
        [adminId, adminUsername, adminEmail, hashedPassword]
      );

      console.log('✅ Admin user created successfully!');
      console.log(`   Username: ${adminUsername}`);
      console.log(`   Password: ${adminPassword}`);
      console.log(`   Email: ${adminEmail}\n`);
    }

    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the server: npm start (or npm run dev)');
    console.log('   2. Use the admin credentials to login\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   Please check your MySQL credentials in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Please make sure MySQL server is running');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Run setup
setupDatabase();

