import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log("🔄 Testing MongoDB connection...");
    console.log("📍 URI:", process.env.MONGO_URI);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("✅ MongoDB Connected Successfully!");
    console.log("🌐 Host:", conn.connection.host);
    console.log("📊 Database:", conn.connection.name);
    console.log("🔗 Connection State:", conn.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ message: String, timestamp: Date });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({
      message: "MongoDB connection test successful!",
      timestamp: new Date()
    });
    
    await testDoc.save();
    console.log("✅ Test document created successfully!");
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("✅ Test document cleaned up!");
    
    await mongoose.connection.close();
    console.log("✅ Connection closed successfully!");
    
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    console.error("🔍 Error details:", error);
  }
};

testConnection();