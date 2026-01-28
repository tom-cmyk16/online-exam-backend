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

// ✅ Initialize Express
const app = express();
// የስህተት ማስተካከያ፡ እዚህ ጋር || ምልክት መኖር አለበት
const PORT = process.env.PORT || 5000;

// ✅ Connect to MongoDB
connectDB();

// ✅ Enable CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://your-frontend-link.onrender.com", // የFrontend ሊንክህን እዚህ ጨምር
      ];

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(null, true); // ለጊዜው ለዴቨሎፕመንት እንዲሰራ
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ Routes
// ያስታውሱ፡ ሁሉም በ /api ይጀምራሉ
app.use("/api/assignments", assignmentRoutes); // ስሙን ግልጽ ለማድረግ assignments ብለነዋል
app.use("/api/departments", departmentRoute);
app.use("/api/courses", courseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/manageuser", manageUserRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/student-exams", studentExamRoutes);
app.use("/api/questionbank", questionBankRoutes);
app.use("/api/system", systemRoutes);

// Base Route
app.get("/", (req, res) => {
  res.send("API is running successfully 🚀");
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Backend is reachable",
    origin: req.headers.origin || "unknown",
  });
});

// ✅ Error Handling Middleware (ሁልጊዜ መጨረሻ መሆን አለበት)
app.use(errorHandler);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running at: http://localhost:${PORT}`);
});
