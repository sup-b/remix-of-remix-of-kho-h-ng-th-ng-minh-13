import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function quickStart() {
  console.log('🚀 Quick Start - Database Setup\n');

  // Check if .env exists
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('⚠️  File .env không tồn tại!');
    console.log('📝 Đang tạo file .env từ .env.example...\n');
    
    const envExamplePath = path.join(__dirname, '../.env.example');
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('✅ Đã tạo file .env');
      console.log('⚠️  Vui lòng chỉnh sửa file .env với thông tin MySQL của bạn!\n');
      console.log('Sau đó chạy lại: npm run setup-db\n');
      return;
    }
  }

  // Run setup database
  try {
    console.log('📦 Đang setup database...\n');
    const { stdout, stderr } = await execAsync('node scripts/setupDatabase.js', {
      cwd: path.join(__dirname, '..')
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log('\n✅ Setup hoàn tất!');
    console.log('🚀 Bạn có thể chạy server bằng: npm run dev\n');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n⚠️  MySQL server chưa chạy!');
      console.error('Vui lòng khởi động MySQL server trước.\n');
    }
  }
}

quickStart();

