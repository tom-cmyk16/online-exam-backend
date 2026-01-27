import mongoose from "mongoose";

// Mock system settings for test mode
const DEFAULT_SETTINGS = {
  siteName: "Debre Tabor University Online Exam System",
  allowRegistration: false,
  maintenanceMode: false,
  maxExamDuration: 180, // minutes
  autoSubmitOnTimeUp: true,
  allowExamReview: true,
  emailNotifications: true,
  systemVersion: "1.0.0",
  lastUpdated: new Date().toISOString()
};

// Mock audit logs for test mode
const MOCK_AUDIT_LOGS = [
  {
    _id: "log1",
    action: "USER_LOGIN",
    user: "admin",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: "Admin user logged in successfully",
    ipAddress: "127.0.0.1"
  },
  {
    _id: "log2", 
    action: "EXAM_CREATED",
    user: "instructor",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: "Created new exam: Mathematics Final",
    ipAddress: "127.0.0.1"
  },
  {
    _id: "log3",
    action: "USER_CREATED",
    user: "admin",
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    details: "Created new student user: student123",
    ipAddress: "127.0.0.1"
  }
];

// Mock system stats
const MOCK_STATS = {
  totalUsers: 3,
  totalExams: 0,
  activeExams: 0,
  completedExams: 0,
  totalQuestions: 0,
  systemUptime: "2 days, 5 hours",
  databaseStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected (Test Mode)",
  lastBackup: new Date(Date.now() - 86400000).toISOString()
};

// @desc    Get system settings
// @route   GET /api/system/settings
// @access  Private (Admin only)
export const getSystemSettings = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using default settings (MongoDB not connected)");
      return res.json(DEFAULT_SETTINGS);
    }

    // In a real app, you would fetch from a Settings collection
    // For now, return default settings
    res.json(DEFAULT_SETTINGS);
  } catch (error) {
    console.error("Get system settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Update system settings
// @route   PUT /api/system/settings
// @access  Private (Admin only)
export const updateSystemSettings = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Settings update simulated (MongoDB not connected)");
      const updatedSettings = { ...DEFAULT_SETTINGS, ...req.body, lastUpdated: new Date().toISOString() };
      return res.json(updatedSettings);
    }

    // In a real app, you would update the Settings collection
    const updatedSettings = { ...DEFAULT_SETTINGS, ...req.body, lastUpdated: new Date().toISOString() };
    res.json(updatedSettings);
  } catch (error) {
    console.error("Update system settings error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get audit logs
// @route   GET /api/system/audit-logs
// @access  Private (Admin only)
export const getAuditLogs = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using mock audit logs (MongoDB not connected)");
      return res.json(MOCK_AUDIT_LOGS);
    }

    // In a real app, you would fetch from an AuditLog collection
    res.json(MOCK_AUDIT_LOGS);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Get system statistics
// @route   GET /api/system/stats
// @access  Private (Admin only)
export const getSystemStats = async (req, res) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.log("⚠️ Using mock stats (MongoDB not connected)");
      return res.json(MOCK_STATS);
    }

    // In a real app, you would calculate real statistics from the database
    res.json(MOCK_STATS);
  } catch (error) {
    console.error("Get system stats error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};