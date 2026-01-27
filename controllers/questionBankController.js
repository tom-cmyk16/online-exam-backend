import QuestionBank from "../models/QuestionBank.js";

// ✅ Create Question in Bank
export const createQuestion = async (req, res) => {
  try {
    const question = new QuestionBank({
      ...req.body,
      createdBy: {
        _id: req.user._id,
        fullName: req.user.fullName,
        department: req.user.department,
      },
      department: req.user.department,
    });
    const savedQuestion = await question.save();
    res.status(201).json(savedQuestion);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating question", error: err.message });
  }
};

// ✅ Get Questions for Department
export const getQuestions = async (req, res) => {
  try {
    const questions = await QuestionBank.find({
      department: req.user.department,
    });
    res.json(questions);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching questions", error: err.message });
  }
};

// ✅ Update Question
export const updateQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!question)
      return res.status(404).json({ message: "Question not found" });
    res.json(question);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating question", error: err.message });
  }
};

// ✅ Delete Question
export const deleteQuestion = async (req, res) => {
  try {
    const deletedQuestion = await QuestionBank.findByIdAndDelete(req.params.id);
    if (!deletedQuestion)
      return res.status(404).json({ message: "Question not found" });
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting question", error: err.message });
  }
};
