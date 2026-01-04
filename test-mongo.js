// Test script untuk koneksi MongoDB
const fs = require('fs');
const path = require('path');

// Manual .env loading
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envData = fs.readFileSync(envPath, 'utf8');
  const lines = envData.split('\n');
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#') && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

const { MongoClient } = require('mongodb');

async function testMongoConnection() {
  console.log('🔄 Testing MongoDB connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');
  
  if (!process.env.DATABASE_URL) {
    console.log('❌ ERROR: DATABASE_URL tidak ditemukan di environment variables');
    return;
  }

  try {
    const client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    
    // Test ping
    await client.db("admin").command({ ping: 1 });
    console.log('✅ MongoDB connection berhasil!');
    
    // Test database access
    const db = client.db();
    console.log('📊 Database name:', db.databaseName);
    
    // List collections (opsional)
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections found:', collections.length);
    
    await client.close();
  } catch (error) {
    console.log('❌ MongoDB connection gagal:');
    console.log('Error:', error.message);
  }
}

testMongoConnection();