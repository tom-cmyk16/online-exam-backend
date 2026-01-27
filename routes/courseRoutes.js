import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";

const router = express.Router();

// Courses accessible by admin, departmentHead, and instructor
router.get("/", protect, getCourses);
router.post("/", protect, authorize("admin", "departmentHead"), createCourse);
router.put("/:id", protect, authorize("admin", "departmentHead"), updateCourse);
router.delete("/:id", protect, authorize("admin", "departmentHead"), deleteCourse);

export default router;
