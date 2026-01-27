import mongoose from "mongoose";

const questionSubSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ["text", "multiple-choice", "true-false"],
    required: true,
  },
  options: [String],
  correctAnswer: String,
  duration: Number,
  marks: Number,
});

const studentApprovalSubSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
});

const examSchema = new mongoose.Schema({
  university: String,
  title: { type: String, required: true },
  description: String,
  instructions: String,
  startTime: Date,
  endTime: Date,
  activeTime: Date,
  weight: Number,
  department: { type: String, required: true },
  examCode: { type: String, unique: true, required: true },
  duration: { type: Number, required: true }, // in minutes
  isApproved: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  status: { type: String, default: "draft" },
  questions: [questionSubSchema],
  assignedDepartments: [String],
  assignedYears: [String],
  assignedSections: [String],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  studentApprovals: [studentApprovalSubSchema],
  createdBy: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fullName: String,
    department: String,
  },
});

export default mongoose.model("Exam", examSchema);
