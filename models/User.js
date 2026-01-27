import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "student",
        "instructor",
        "admin",
        "departmentHead",
        "examCommittee",
      ],
      default: "student",
    },
    department: { type: String },
    year: { type: String },
    programType: { type: String },
    section: { type: String },
    isActive: { type: Boolean, default: true },
    profilePhoto: { type: String }, // Base64 encoded image
  },
  { timestamps: true }
);

// Password comparison - plain text (no hashing)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return enteredPassword === this.password;
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
