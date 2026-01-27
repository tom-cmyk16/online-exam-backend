// models/Assignment.js
import mongoose from "mongoose";

const AssignmentSchema = new mongoose.Schema(
  {
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // assuming instructors are users with role 'instructor'
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate assignments
AssignmentSchema.index({ instructor: 1, course: 1 }, { unique: true });

export default mongoose.model("Assignment", AssignmentSchema);
