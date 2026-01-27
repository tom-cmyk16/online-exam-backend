import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ["text", "multiple-choice"], default: "text" },
  options: { type: [String], default: [] },
  correctAnswer: { type: String, required: true },
  duration: Number,
  marks: { type: Number, default: 0 },
});

const examSchema = new mongoose.Schema(
  {
    university: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    instructions: String,
    startTime: String,
    endTime: String,
    activeTime: Number,
    weight: Number,
    questions: [questionSchema],
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isApproved: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    department: { type: String, required: true },
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      fullName: String,
      department: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
