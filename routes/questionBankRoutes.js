import express from "express";
import {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionBankController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Routes for question bank
router
  .route("/")
  .get(protect, authorize("instructor", "departmentHead"), getQuestions)
  .post(protect, authorize("instructor", "departmentHead"), createQuestion);
router
  .route("/:id")
  .put(protect, authorize("instructor", "departmentHead"), updateQuestion)
  .delete(protect, authorize("instructor", "departmentHead"), deleteQuestion);

export default router;
