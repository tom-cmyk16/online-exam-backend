// routes/assignmentRoutes.js
import express from "express";
import {
  assignInstructor,
  removeAssignment,
  getAssignedInstructors,
} from "../controllers/assignmentController.js";

const router = express.Router();

router.post("/assigning", assignInstructor);
router.post("/assigning/remove", removeAssignment);
router.get("/courses/:courseId/assigned-instructors", getAssignedInstructors);

export default router;
