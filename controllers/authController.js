import User from "../models/User.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Temporary test users for when DB is not available
const TEST_USERS = [
  {
    _id: "test-admin-id",
    username: "admin",
    email: "admin@test.com",
    password: "admin123", // In real app, this would be hashed
    fullName: "System Administrator",
    role: "admin",
    isActive: true,
    department: null
  },
  {
    _id: "test-wawuu-id",
    username: "wawuu",
    email: "wawuu@test.com",
    password: "222222",
    fullName: "Wawuu Admin",
    role: "admin",
    isActive: true,
    department: null
  },
  {
    _id: "test-alexo-id",
    username: "Alexo",
    email: "alem@gmail.com",
    password: "777777",
    fullName: "Adane Alemu",
    role: "student",
    isActive: true,
    department: "Information Technology",
    year: "3",
    programType: "regular",
    section: "A"
  },
  {
    _id: "test-instructor-id",
    username: "instructor1",
    email: "instructor@test.com",
    password: "instructor123",
    fullName: "Dr. John Smith",
    role: "instructor",
    isActive: true,
    department: "Information Technology"
  },
  {
    _id: "test-depthead-id",
    username: "depthead1",
    email: "depthead@test.com",
    password: "dept123",
    fullName: "Prof. Sarah Johnson",
    role: "departmentHead",
    isActive: true,
    department: "Information Technology"
  },
  {
    _id: "test-committee-id",
    username: "committee1",
    email: "committee@test.com",
    password: "committee123",
    fullName: "Dr. Michael Brown",
    role: "examCommittee",
    isActive: true,
    department: "Information Technology"
  }
];

export const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log("🔐 Login attempt received:", { 
      username, 
      password: password ? "***" : "undefined",
      body: req.body 
    });

    if (!username || !password) {
      console.log("❌ Missing credentials");
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using test users (MongoDB not connected)");
      console.log("🔍 Available test users:", TEST_USERS.map(u => ({ username: u.username, role: u.role })));
      
      // Use test users when DB is not available
      const testUser = TEST_USERS.find(u => u.username === username && u.password === password);
      
      if (!testUser) {
        console.log("❌ No matching test user found for:", { username, password: "***" });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      console.log("✅ Test user found:", { username: testUser.username, role: testUser.role });

      const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      // Return user without password
      const userResponse = { ...testUser };
      delete userResponse.password;
      
      return res.json({ 
        user: userResponse, 
        token,
        message: "⚠️ Using test mode (database not connected)"
      });
    }

    // Normal database operation
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    res.json({ user: userResponse, token });
  } catch (err) {
    console.error("🚨 Login error:", err);
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    console.log("🔍 getMe called with user:", req.user);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using test user data (MongoDB not connected)");
      console.log("🔍 Looking for user ID:", req.user.id);
      console.log("🔍 Available test users:", TEST_USERS.map(u => ({ id: u._id, username: u.username })));
      
      // Use test user data when DB is not available
      const testUser = TEST_USERS.find(u => u._id === req.user.id);
      if (testUser) {
        console.log("✅ Found test user:", testUser.username);
        const userResponse = { ...testUser };
        delete userResponse.password;
        return res.json(userResponse);
      }
      console.log("❌ Test user not found for ID:", req.user.id);
      return res.status(404).json({ message: "User not found" });
    }

    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    console.error("🚨 getMe error:", err);
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { email, username, profilePhoto } = req.body;
    const userId = req.user._id;

    // Check if username is already taken by another user
    if (username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already taken" });
      }
    }

    // Update user
    const updateData = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.matchPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};
