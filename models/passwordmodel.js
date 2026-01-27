import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  password: String,
  role: String,
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
  },
});

// Use this pattern to avoid overwrite errors:
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
