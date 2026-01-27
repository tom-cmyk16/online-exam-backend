const Test = require("../models/Test");

// Get all tests
exports.getTests = async (req, res) => {
  try {
    const tests = await Test.find();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: "Cannot fetch tests" });
  }
};

// Create a new test
exports.createTest = async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ message: "Cannot create test" });
  }
};

// Update test
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Cannot update test" });
  }
};

// Delete test
exports.deleteTest = async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: "Test deleted" });
  } catch (err) {
    res.status(500).json({ message: "Cannot delete test" });
  }
};

// Add question
exports.addQuestion = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: "Test not found" });

    test.questions.push(req.body);
    await test.save();
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Cannot add question" });
  }
};

// Assign test
exports.assignTest = async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(
      req.params.id,
      {
        assignedDepartments: req.body.assignedDepartments,
        assignedYears: req.body.assignedYears,
        assignedSections: req.body.assignedSections,
        assignedSubjects: req.body.assignedSubjects,
      },
      { new: true }
    );
    if (!test) return res.status(404).json({ message: "Test not found" });
    res.json(test);
  } catch (err) {
    res.status(500).json({ message: "Cannot assign test" });
  }
};
