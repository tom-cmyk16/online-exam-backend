import jwt from "jsonwebtoken";
import User from "../models/User.js";
import mongoose from "mongoose";

// Same test users as in authController
const TEST_USERS = [
  {
    _id: "test-admin-id",
    username: "admin",
    email: "admin@test.com",
    role: "admin",
    isActive: true
  },
  {
    _id: "test-wawuu-id",
    username: "wawuu",
    email: "wawuu@test.com",
    role: "admin",
    isActive: true
  },
  {
    _id: "test-alexo-id",
    username: "Alexo",
    email: "alem@gmail.com",
    role: "student",
    isActive: true
  }
];

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.log("⚠️ Using test user for auth (MongoDB not connected)");
        
        // Use test users when DB is not available
        const testUser = TEST_USERS.find(u => u._id === decoded.id);
        if (testUser) {
          req.user = testUser;
          return next();
        } else {
          return res.status(401).json({ message: "User not found in test mode" });
        }
      }

      // Normal database operation
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      next();
    } catch (err) {
      console.error("JWT verification error:", err.message);
      return res.status(401).json({ message: "Not authorized" });
    }
  } else {
    return res.status(401).json({ message: "No token, not authorized" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    console.log(`Authorization check - User role: ${userRole}, Required roles: ${roles.join(", ")}`);
    
    if (!roles.some((role) => role.toLowerCase() === userRole)) {
      return res.status(403).json({ 
        message: "Forbidden: Insufficient role",
        userRole: userRole,
        requiredRoles: roles
      });
    }
    next();
  };
};
