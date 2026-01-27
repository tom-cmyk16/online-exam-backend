// controllers/assignmentController.js
import Assignment from "../models/Assignment.js";

// Assign instructor to course
export const assignInstructor = async (req, res) => {
  const { instructorId, courseId } = req.body;
  if (!instructorId || !courseId) {
    return res
      .status(400)
      .json({ message: "InstructorId and CourseId required" });
  }

  try {
    const assignment = new Assignment({
      instructor: instructorId,
      course: courseId,
    });

    await assignment.save();

    res
      .status(201)
      .json({ message: "Instructor assigned to course successfully" });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (unique index)
      return res
        .status(409)
        .json({
          message: "This instructor is already assigned to this course.",
        });
    }
    res
      .status(500)
      .json({ message: "Failed to assign instructor", error: err.message });
  }
};

// Remove instructor assignment from course
export const removeAssignment = async (req, res) => {
  const { instructorId, courseId } = req.body;
  if (!instructorId || !courseId) {
    return res
      .status(400)
      .json({ message: "InstructorId and CourseId required" });
  }

  try {
    const deleted = await Assignment.findOneAndDelete({
      instructor: instructorId,
      course: courseId,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    res.json({ message: "Instructor removed from course successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to remove instructor", error: err.message });
  }
};

// Get assigned instructors for a course
export const getAssignedInstructors = async (req, res) => {
  const { courseId } = req.params;

  try {
    const assignments = await Assignment.find({ course: courseId }).populate(
      "instructor",
      "fullName username email"
    );

    const instructors = assignments.map((a) => a.instructor);

    res.json(instructors);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Failed to get assigned instructors",
        error: err.message,
      });
  }
};
