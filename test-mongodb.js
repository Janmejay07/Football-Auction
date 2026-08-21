const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env file');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    // Test database access
    const db = client.db(dbName);
    console.log(`✅ Database selected: "${dbName}"`);

    // Get admin stats to verify connection
    const adminDb = client.db('admin');
    const pingResult = await adminDb.command({ ping: 1 });
    console.log('✅ Ping result:', pingResult);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log(`✅ Collections in database (${collections.length}):`, 
      collections.map(c => c.name).join(', ') || 'No collections yet');

    // Check connection status
    const serverStatus = await adminDb.command({ serverStatus: 1 });
    console.log('✅ MongoDB Server is running and healthy');

    console.log('\n✅ All tests passed! MongoDB connection is working correctly.\n');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    if (error.message.includes('ENOTFOUND')) {
      console.error('  → Network error: Check your internet connection');
    } else if (error.message.includes('authentication failed')) {
      console.error('  → Authentication error: Check your username/password in MONGODB_URI');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('  → Connection refused: Check if MongoDB Atlas IP is whitelisted');
    }
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

testConnection();
