import Department from "../models/Department.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: "Failed to get departments" });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const dept = new Department({ name: req.body.name });
    await dept.save();
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: "Failed to create department" });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: "Department not found" });
    res.json(dept);
  } catch (error) {
    res.status(500).json({ message: "Failed to update department" });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: "Department deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete department" });
  }
};

export const getDepartmentStats = async (req, res) => {
  try {
    const { department } = req.user; // Assuming user info is in req.user from auth middleware
    
    // Use mongoose.models to get the Exam model if it exists
    const Exam = mongoose.models.Exam || mongoose.model("Exam");
    
    // Get counts for the department
    const [studentCount, instructorCount, examCount] = await Promise.all([
      User.countDocuments({ department, role: "student" }),
      User.countDocuments({ department, role: "instructor" }),
      Exam.countDocuments({ department }),
    ]);
    
    res.json({
      stats: {
        students: studentCount,
        instructors: instructorCount,
        exams: examCount,
      },
      departmentName: department,
    });
  } catch (error) {
    console.error("Error fetching department stats:", error);
    res.status(500).json({ message: "Failed to get department stats" });
  }
};
