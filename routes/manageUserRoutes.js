import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  insertUser,
} from "../controllers/manageUserController.js";

const router = express.Router();

// All routes protected and accessible by admin and departmentHead
router.get("/", protect, authorize("admin", "departmentHead"), getUsers);
router.post("/", protect, authorize("admin", "departmentHead"), createUser);
router.post("/insert", protect, authorize("admin", "departmentHead"), insertUser);
router.put("/:id", protect, authorize("admin", "departmentHead"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser); // Only admin can delete
router.patch("/:id/status", protect, authorize("admin", "departmentHead"), toggleUserStatus);

export default router;
