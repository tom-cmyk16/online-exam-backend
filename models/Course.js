import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  courseCode: { type: String, required: true },
  courseName: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  credits: { type: Number, required: true },
  instructor: { type: String },
  programType: { type: String, default: "regular" },
  sections: [{ type: String }],
});

export const Course = mongoose.model("Course", courseSchema);
