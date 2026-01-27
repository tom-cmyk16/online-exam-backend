import mongoose from "mongoose";

const instructorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
});

export default mongoose.model("Instructor", instructorSchema);
