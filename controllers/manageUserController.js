import User from "../models/User.js";
import mongoose from "mongoose";

// Test users for when DB is not available (same as in authController)
const TEST_USERS = [
  {
    _id: "test-admin-id",
    username: "admin",
    email: "admin@test.com",
    fullName: "System Administrator",
    role: "admin",
    isActive: true,
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-wawuu-id",
    username: "wawuu",
    email: "wawuu@test.com",
    fullName: "Wawuu Admin",
    role: "admin",
    isActive: true,
    department: null,
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-alexo-id",
    username: "Alexo",
    email: "alem@gmail.com",
    fullName: "Adane Alemu",
    role: "student",
    isActive: true,
    department: "Information Technology",
    year: "3",
    programType: "regular",
    section: "A",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-instructor-id",
    username: "instructor1",
    email: "instructor@test.com",
    fullName: "Dr. John Smith",
    role: "instructor",
    isActive: true,
    department: "Information Technology",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-depthead-id",
    username: "depthead1",
    email: "depthead@test.com",
    fullName: "Prof. Sarah Johnson",
    role: "departmentHead",
    isActive: true,
    department: "Information Technology",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-committee-id",
    username: "committee1",
    email: "committee@test.com",
    fullName: "Dr. Michael Brown",
    role: "examCommittee",
    isActive: true,
    department: "Information Technology",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-student2-id",
    username: "student2",
    email: "student2@test.com",
    fullName: "Jane Doe",
    role: "student",
    isActive: true,
    department: "Computer Science",
    year: "2",
    programType: "regular",
    section: "B",
    createdAt: "2024-01-01T00:00:00.000Z"
  },
  {
    _id: "test-student3-id",
    username: "student3",
    email: "student3@test.com",
    fullName: "Bob Wilson",
    role: "student",
    isActive: false,
    department: "Information Technology",
    year: "1",
    programType: "extension",
    section: "C",
    createdAt: "2024-01-01T00:00:00.000Z"
  }
];

// @desc    Get all users (filtered by department for departmentHead)
// @route   GET /api/manageuser
// @access  Private
export const getUsers = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using test users (MongoDB not connected)");
      
      let filteredUsers = [...TEST_USERS];
      
      // If user is departmentHead, only show users from their department
      if (req.user.role === "department_head") {
        filteredUsers = TEST_USERS.filter(user => 
          user.department === req.user.department || user.role === "admin"
        );
        console.log(`🔍 Department Head filtering users by department: ${req.user.department}`);
      } else {
        console.log("👑 Admin viewing all users");
      }
      
      console.log(`📊 Returning ${filteredUsers.length} test users`);
      return res.json(filteredUsers);
    }

    // Normal database operation
    let query = {};
    
    // If user is departmentHead, only show users from their department
    if (req.user.role === "departmentHead") {
      query.department = req.user.department;
      console.log(`🔍 Department Head filtering users by department: ${req.user.department}`);
    } else {
      console.log("👑 Admin viewing all users");
    }
    
    const users = await User.find(query).select("-password");
    console.log(`📊 Returning ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Create new user
// @route   POST /api/manageuser
// @access  Private
export const createUser = async (req, res) => {
  try {
    console.log("📝 Creating user with data:", req.body);
    
    const {
      fullName,
      username,
      email,
      password,
      role,
      department,
      year,
      programType,
      section,
      isActive,
    } = req.body;

    // Basic validation
    if (!fullName || !username || !email || !password || !role) {
      console.log("❌ Validation failed: Missing required fields");
      return res.status(400).json({
        message:
          "Missing required fields: fullName, username, email, password, role",
      });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Creating user in test mode (MongoDB not connected)");
      
      // Check for existing username in test users
      const existingUser = TEST_USERS.find(u => u.username === username);
      if (existingUser) {
        console.log("❌ Username already exists in test mode:", username);
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // In test mode, simulate user creation
      const newUser = {
        _id: `test-${username}-${Date.now()}`,
        fullName,
        username,
        email,
        role,
        department: department || null,
        year: year || null,
        programType: programType || null,
        section: section || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString()
      };

      // Add to test users array for this session
      TEST_USERS.push(newUser);

      console.log("✅ User created in test mode:", { username: newUser.username, role: newUser.role });
      return res.status(201).json(newUser);
    }

    // Department Head restriction: can only create users in their own department
    if (req.user.role === "departmentHead") {
      if (department && department !== req.user.department) {
        return res.status(403).json({ 
          message: `You can only create users in your department: ${req.user.department}` 
        });
      }
      // Force the department to be the same as the department head's
      req.body.department = req.user.department;
    }

    // Role-based validation
    if (role === "student") {
      if (!year) {
        return res
          .status(400)
          .json({ message: "Year is required for students" });
      }
    } else if (role !== "admin") {
      if (!department && !req.body.department) {
        return res
          .status(400)
          .json({ message: "Department is required for non-admin roles" });
      }
    }

    // Check for existing username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      console.log("❌ Username already exists:", username);
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check for existing email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      console.log("❌ Email already exists:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    console.log("✅ Validation passed, creating user in MongoDB...");
    
    // Create user directly with User.create()
    const user = await User.create({
      fullName,
      username,
      email,
      password,
      role,
      department,
      year,
      programType,
      section,
      isActive: isActive !== undefined ? isActive : true,
    });

    console.log("✅ User created successfully with ID:", user._id);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("❌ Create user error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: messages.join(", ")
      });
    }
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    res.status(500).json({ 
      message: "Internal server error: " + error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/manageuser/:id
// @access  Private
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Department Head restriction: can only update users in their own department
    if (req.user.role === "departmentHead") {
      if (user.department !== req.user.department) {
        return res.status(403).json({ 
          message: "You can only update users in your department" 
        });
      }
      // Prevent changing department
      if (req.body.department && req.body.department !== req.user.department) {
        return res.status(403).json({ 
          message: "You cannot change user's department" 
        });
      }
    }

    const {
      fullName,
      username,
      email,
      password,
      role,
      department,
      year,
      programType,
      section,
      isActive,
    } = req.body;

    // Role-based validation
    if (role === "student") {
      if (!year) {
        return res
          .status(400)
          .json({ message: "Year is required for students" });
      }
    } else if (role !== "admin") {
      if (!department) {
        return res
          .status(400)
          .json({ message: "Department is required for non-admin roles" });
      }
    }

    // Check for existing username (excluding current user)
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Check for existing email (excluding current user)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    Object.assign(user, req.body);
    if (req.body.password) user.password = req.body.password; // Plain text password
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error("Update user error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Delete user
// @route   DELETE /api/manageuser/:id
// @access  Private (Admin only - enforced in routes)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Toggle user status
// @route   PATCH /api/manageuser/:id/status
// @access  Private
export const toggleUserStatus = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Toggling user status in test mode (MongoDB not connected)");
      
      const userIndex = TEST_USERS.findIndex(u => u._id === req.params.id);
      if (userIndex === -1) {
        return res.status(404).json({ message: "User not found" });
      }

      // Department Head restriction in test mode
      if (req.user.role === "departmentHead") {
        if (TEST_USERS[userIndex].department !== req.user.department) {
          return res.status(403).json({ 
            message: "You can only manage users in your department" 
          });
        }
      }

      TEST_USERS[userIndex].isActive = !TEST_USERS[userIndex].isActive;
      console.log(`✅ User status toggled in test mode: ${TEST_USERS[userIndex].username} -> ${TEST_USERS[userIndex].isActive ? 'Active' : 'Inactive'}`);
      
      return res.json(TEST_USERS[userIndex]);
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Department Head restriction: can only toggle users in their own department
    if (req.user.role === "departmentHead") {
      if (user.department !== req.user.department) {
        return res.status(403).json({ 
          message: "You can only manage users in your department" 
        });
      }
    }

    user.isActive = !user.isActive;
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;
    res.json(userResponse);
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Insert new user without validations or hashing
// @route   POST /api/manageuser/insert
// @access  Private
export const insertUser = async (req, res) => {
  try {
    const user = await User.create(req.body);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Insert user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
