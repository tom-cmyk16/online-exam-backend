import express from "express";
import {
  startExam,
  getSubmissionStatus,
  submitExam,
  getStudentResult,
  reviewSubmission,
  getExamSubmissions,
  getStudentResultsForExam,
  sendResultsToInstructors,
  deleteSubmission,
  autoSave,
} from "../controllers/takesExamController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes below
router.use(protect);

// Get exams filtered by student department, year, section
router.get(
  "/student/filtered",
  authorize("student"),
  async (req, res, next) => {
    try {
      const { department, year, section } = req.query;

      const Exam =
        (await import("../models/examModel.js")).default ||
        (await import("../models/examModel.js"));

      const now = new Date();

      const filters = {
        status: { $in: ["scheduled", "active", "completed"] },
        $or: [{ isGlobal: true }],
      };

      if (department)
        filters.$or.push({ assignedDepartments: { $in: [department] } });
      if (year) filters.assignedYears = { $in: [year] };
      if (section) filters.assignedSections = { $in: [section] };

      const exams = await Exam.find(filters).sort({ startTime: 1 });

      const categorizedExams = exams.map((exam) => {
        const examObj = exam.toObject();
        const startTime = new Date(exam.startTime);
        const endTime = new Date(exam.endTime);

        let examStatus = "upcoming";
        if (now >= startTime && now <= endTime) {
          examStatus = "active";
        } else if (now > endTime) {
          examStatus = "completed";
        }

        return {
          ...examObj,
          examStatus,
        };
      });

      res.json(categorizedExams);
    } catch (error) {
      next(error);
    }
  }
);

// Start exam
router.post("/start/:id", authorize("student"), startExam);

// Auto-save answers during exam
router.post("/auto-save/:id", authorize("student"), autoSave);

// Get submission status (uses authenticated user)
router.get(
  "/submission-status/:id",
  authorize("student"),
  getSubmissionStatus
);

// Submit exam
router.post("/submit-exam/:id", authorize("student"), submitExam);

// Get student result
router.get("/result/:examId", authorize("student"), getStudentResult);

// Review submission (instructor only)
router.put(
  "/review/:submissionId",
  authorize("instructor", "admin"),
  reviewSubmission
);

// Get exam submissions (instructor only)
router.get(
  "/submissions/:examId",
  authorize("instructor", "admin"),
  getExamSubmissions
);

// Get student results for exam (exam committee)
router.get(
  "/student-results/:examId",
  authorize("examcommittee", "admin"),
  getStudentResultsForExam
);

// Send results to instructors
router.post(
  "/send-results/:examId",
  authorize("examcommittee", "admin"),
  sendResultsToInstructors
);

// Delete submission (instructor/admin only)
router.delete(
  "/submission/:submissionId",
  authorize("instructor", "admin"),
  deleteSubmission
);

export default router;
