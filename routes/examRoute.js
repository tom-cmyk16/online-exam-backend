import express from "express";
import Exam from "../models/examModel.js";
import {
  protect,
  isInstructor,
  isExamCommittee,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Create Exam (Instructor) ---
router.post("/", protect, isInstructor, async (req, res) => {
  try {
    const exam = new Exam({
      ...req.body,
      createdBy: {
        _id: req.user._id,
        fullName: req.user.fullName,
        department: req.user.department,
      },
      department: req.user.department,
    });
    const saved = await exam.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Update Exam ---
router.put("/:id", protect, isInstructor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    Object.assign(exam, req.body);
    const updated = await exam.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Delete Exam ---
router.delete("/:id", protect, isInstructor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    await exam.remove();
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Add Question ---
router.post("/:id/questions", protect, isInstructor, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    exam.questions.push(req.body);
    const updated = await exam.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Send to Exam Committee ---
router.post(
  "/:id/send-to-committee",
  protect,
  isInstructor,
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      exam.isApproved = false;
      exam.isRejected = false;
      await exam.save();
      res.json(exam);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// --- Assign Departments / Year / Section ---
router.put(
  "/:id/assign-departments",
  protect,
  isInstructor,
  async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id);
      if (!exam) return res.status(404).json({ message: "Exam not found" });
      exam.assignedDepartments = req.body.assignedDepartments || [];
      exam.year = req.body.year || "";
      exam.section = req.body.section || "";
      const updated = await exam.save();
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// --- Get all Exams ---
router.get("/", protect, async (req, res) => {
  try {
    const exams = await Exam.find();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Exam Committee Approve ---
router.put("/:id/approve", protect, isExamCommittee, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    exam.isApproved = true;
    exam.isRejected = false;
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- Exam Committee Reject ---
router.put("/:id/reject", protect, isExamCommittee, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    exam.isApproved = false;
    exam.isRejected = true;
    await exam.save();
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
