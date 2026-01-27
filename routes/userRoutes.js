import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleStatus,
} from "../controllers/userController.js";
import {
  protect,
  checkUserActive,
  restrictTo,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes protected and only active users
router.use(protect, checkUserActive);

// CRUD
router.get("/", getUsers);
router.post("/", restrictTo("admin"), createUser);
router.put("/:id", restrictTo("admin"), updateUser);
router.delete("/:id", restrictTo("admin"), deleteUser);
router.patch("/:id/status", restrictTo("admin"), toggleStatus);

export default router;
