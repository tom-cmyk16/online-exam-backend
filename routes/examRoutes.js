import express from "express";
import {
  createExam,
  getExams,
  updateExam,
  deleteExam,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  assignDepartments,
  sendToCommittee,
  getExamsForCommittee,
  approveExam,
  rejectExam,
  getApprovedExamsForCommittee,
  approveStudentForExam,
  rejectStudentForExam,
  bulkApproveStudents,
  getExamsForStudents,
  joinExam,
  verifyExamCode,
  getAvailableExamsForStudent,
  checkStudentApproval,
  getFilteredExamsForStudent,
  checkEditPermissions,
  validateExamEdit,
  changeExamDepartment,
  getAllDepartments,
} from "../controllers/examController.js";
import {
  startExam,
  submitExam,
  getStudentResult,
  getSubmissionStatus,
  reviewSubmission,
  getExamSubmissions,
  getStudentResultsForExam,
  sendResultsToInstructors,
} from "../controllers/takesExamController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes for exams
router
  .route("/")
  .get(protect, getExams)
  .post(protect, authorize("instructor", "departmentHead"), createExam);
router
  .route("/:id")
  .put(protect, authorize("instructor", "departmentHead"), updateExam)
  .delete(protect, authorize("instructor", "departmentHead"), deleteExam);

// New routes for edit permissions and validation
router
  .route("/:id/edit-permissions")
  .get(protect, authorize("instructor", "departmentHead"), checkEditPermissions);
router
  .route("/:id/validate-edit")
  .post(protect, authorize("instructor", "departmentHead"), validateExamEdit);

router
  .route("/:id/questions")
  .post(protect, authorize("instructor", "departmentHead"), addQuestion);
router
  .route("/:id/questions/:questionId")
  .put(protect, authorize("instructor", "departmentHead"), updateQuestion)
  .delete(protect, authorize("instructor", "departmentHead"), deleteQuestion);
router
  .route("/:id/assign-departments")
  .put(protect, authorize("instructor", "departmentHead"), assignDepartments);
router
  .route("/:id/send-to-committee")
  .post(protect, authorize("instructor", "departmentHead"), sendToCommittee);

// Exam Committee routes
router
  .route("/committee")
  .get(protect, authorize("examCommittee"), getExamsForCommittee);
router
  .route("/committee/:id/approve")
  .put(protect, authorize("examCommittee"), approveExam);
router
  .route("/committee/:id/reject")
  .put(protect, authorize("examCommittee"), rejectExam);

// New routes for exam committee department management
router
  .route("/committee/:examId/change-department")
  .put(protect, authorize("examCommittee"), changeExamDepartment);
router
  .route("/departments")
  .get(protect, authorize("examCommittee", "admin"), getAllDepartments);

// Student approval routes for Committee
router
  .route("/committee/approved")
  .get(protect, authorize("examCommittee"), getApprovedExamsForCommittee);
router
  .route("/committee/:examId/students/:studentId/approve")
  .put(protect, authorize("examCommittee"), approveStudentForExam);
router
  .route("/committee/:examId/students/:studentId/reject")
  .put(protect, authorize("examCommittee"), rejectStudentForExam);
router
  .route("/committee/:examId/students/bulk-approve")
  .put(protect, authorize("examCommittee"), bulkApproveStudents);

// Student routes
router
  .route("/student/approved")
  .get(protect, authorize("student"), getExamsForStudents);
router
  .route("/student/available")
  .get(protect, authorize("student"), getAvailableExamsForStudent);
router
  .route("/:id/student-approval")
  .get(protect, authorize("student"), checkStudentApproval);
router.route("/join").post(protect, joinExam);
router.route("/verify-code").post(protect, verifyExamCode);
router.route("/:id/start").post(protect, authorize("student"), startExam);
router.route("/:id/submit").post(protect, authorize("student"), submitExam);
router
  .route("/student/results/:examId")
  .get(protect, authorize("student"), getStudentResult);
router
  .route("/student/:id/submission-status")
  .get(protect, authorize("student"), getSubmissionStatus);

// New route for filtered exams for students by department, year, section
router
  .route("/student/filtered")
  .get(protect, authorize("student"), getFilteredExamsForStudent);

// Committee routes for student results
router
  .route("/committee/:examId/results")
  .get(protect, authorize("examCommittee"), getStudentResultsForExam);

// Instructor routes for reviewing submissions
router
  .route("/instructor/:examId/submissions")
  .get(protect, authorize("instructor", "departmentHead"), getExamSubmissions);
router
  .route("/instructor/submissions/:submissionId/review")
  .put(protect, authorize("instructor", "departmentHead"), reviewSubmission);

// Send results to instructors
router
  .route("/instructor/:examId/send-results")
  .post(protect, authorize("examCommittee"), sendResultsToInstructors);

export default router;
