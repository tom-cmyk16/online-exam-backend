import mongoose from "mongoose";

const connectDB = async () => {
  // Skip DB connection if specified in env (for testing)
  if (process.env.SKIP_DB_CONNECTION === 'true') {
    console.log("⚠️ Skipping MongoDB connection (SKIP_DB_CONNECTION=true)");
    console.log("🧪 Running in test mode with mock data");
    return;
  }

  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("📍 Connection URI:", process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Failed: ${error.message}`);
    console.log(`\n💡 Quick Solutions:`);
    console.log(`   1. 🌐 Use MongoDB Atlas (Free): https://cloud.mongodb.com/`);
    console.log(`   2. 💻 Install MongoDB locally: https://www.mongodb.com/try/download/community`);
    console.log(`   3. 🧪 Set SKIP_DB_CONNECTION=true in .env for test mode`);
    console.log(`   4. 🐳 Use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest`);
    
    // Don't exit in development, continue with test mode
    if (process.env.NODE_ENV === 'production') {
      console.log(`🚨 Production mode: Exiting due to database connection failure`);
      process.exit(1);
    } else {
      console.log(`⚠️ Development mode: Continuing with test data...`);
      console.log(`🧪 All API endpoints will work with mock data`);
    }
  }
};

export default connectDB;
