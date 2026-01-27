import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/error.js";

// Import Routes
import departmentRoute from "./routes/departmentRoute.js";
import courseRoutes from "./routes/courseRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import manageUserRoutes from "./routes/manageUserRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import studentExamRoutes from "./routes/studentExamRoutes.js";
import questionBankRoutes from "./routes/questionBankRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
dotenv.config();
// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Enable CORS for frontend (React running on Vite: 5173 or 5174)
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174"
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("⚠️ CORS blocked origin:", origin);
        callback(null, true); // Allow anyway for development
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Routes
app.use("/api", assignmentRoutes);
app.use("/api/departments", departmentRoute);
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manageuser", manageUserRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/student-exams", studentExamRoutes);
app.use("/api/questionbank", questionBankRoutes);
app.use("/api/system", systemRoutes);
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

// Test endpoint for debugging
app.get("/api/test", (req, res) => {
  console.log("🧪 Test endpoint hit from:", req.headers.origin || "unknown origin");
  res.json({ 
    message: "Backend is reachable", 
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || "no origin header"
  });
});

// ✅ Error Handling Middleware (must be last)
app.use(errorHandler);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
