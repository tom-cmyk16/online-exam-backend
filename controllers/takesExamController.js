// controllers/takesExamController.js
import Exam from "../models/examModel.js";
import TakesExam from "../models/TakesExam.js";

// ✅ Auto-save answers during exam (doesn't mark as submitted)
export async function autoSave(req, res) {
  try {
    const { id: examId } = req.params;
    const { answers } = req.body || {};
    const studentId = req.user._id;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "answers are required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    console.log(`Auto-saving answers for student ${studentId}, exam ${examId}`);

    // Find existing submission or create new one
    const submission = await TakesExam.findOneAndUpdate(
      { examId, studentId },
      {
        examId,
        studentId,
        answers: Object.keys(answers).map((questionId) => ({
          questionId,
          value: answers[questionId],
        })),
        // Don't update score or status - just save answers
        status: "started", // Keep as started until final submission
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log(`✅ Auto-saved ${Object.keys(answers).length} answers for student ${studentId}`);

    res.json({
      message: "Answers auto-saved successfully",
      savedAt: new Date(),
      answerCount: Object.keys(answers).length
    });
  } catch (err) {
    console.error("❌ Auto-save failed:", err);
    res.status(500).json({ message: "Failed to auto-save answers" });
  }
}

// ✅ Start Exam (Create TakesExam entry with "started" status)
export async function startExam(req, res) {
  try {
    const { id: examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Note: Removed strict validations to allow students with exam code to take exams
    // The exam code verification happens on the frontend before calling this endpoint
    
    // Optional: Log exam access for auditing
    console.log(`Student ${studentId} attempting to start exam ${examId}`);
    
    // Optional: Validate exam approval (only if explicitly rejected)
    if (exam.isRejected === true) {
      return res.status(403).json({ message: "This exam has been rejected and is not available" });
    }

    // Optional: Warn about time but don't block (for flexibility)
    const now = new Date();
    if (exam.startTime && new Date(exam.startTime) > now) {
      console.log(`Warning: Exam ${examId} accessed before start time`);
    }
    
    if (exam.endTime && new Date(exam.endTime) < now) {
      console.log(`Warning: Exam ${examId} accessed after end time`);
    }

    // Check if already started or submitted
    const existing = await TakesExam.findOne({ examId, studentId });
    if (existing) {
      if (existing.status === "submitted") {
        // Return info about the submitted exam
        return res.status(409).json({ 
          message: "You have already submitted this exam.",
          submission: existing,
          canRetake: true // Allow retake for testing
        });
      }
      // If started, allow continuing
      return res.json({
        message: "Exam already started",
        submission: existing,
      });
    }

    // Create new TakesExam entry with "started" status
    const submission = await TakesExam.create({
      examId,
      studentId,
      status: "started",
    });

    res.status(201).json({ message: "Exam started successfully", submission });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000)
      return res.status(409).json({ message: "Exam already started." });
    res.status(500).json({ message: "Failed to start exam" });
  }
}

export async function getSubmissionStatus(req, res) {
  try {
    const { id: examId } = req.params;
    const studentId = req.user._id; // Get from authenticated user
    
    console.log(`Checking submission status for exam ${examId}, student ${studentId}`);
    
    const sub = await TakesExam.findOne({ examId, studentId });
    if (!sub) {
      console.log("No submission found");
      return res.json({ submitted: false, score: null });
    }
    
    console.log(`Submission found: status=${sub.status}, score=${sub.score}`);
    return res.json({
      submitted: sub.status === "submitted",
      score: sub.score,
    });
  } catch (err) {
    console.error("Error checking submission status:", err);
    res.status(500).json({ message: "Failed to fetch submission status" });
  }
}

export async function submitExam(req, res) {
  try {
    const { id: examId } = req.params;
    const { answers } = req.body || {};
    const studentId = req.user._id;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ message: "answers are required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Note: Removed strict validations to allow students with exam code to submit exams
    // The exam code verification happens on the frontend before starting the exam
    
    // Optional: Log exam submission for auditing
    console.log(`Student ${studentId} submitting exam ${examId}`);
    
    // Optional: Validate exam approval (only if explicitly rejected)
    if (exam.isRejected === true) {
      return res.status(403).json({ message: "This exam has been rejected and submissions are not accepted" });
    }

    // Improved scoring logic with fuzzy matching for text
    const calculateScore = (given, correct, type) => {
      if (!correct || correct.length === 0) return 0;
      const givenTrim = given.toString().trim();
      const correctTrim = correct.toString().trim();

      if (type === "multiple-choice" || type === "true-false") {
        return givenTrim === correctTrim ? 1 : 0;
      }

      if (type === "text") {
        // Exact match (case-insensitive)
        if (givenTrim.toLowerCase() === correctTrim.toLowerCase()) return 1;

        // Fuzzy matching: check if given contains key parts of correct answer
        const givenWords = givenTrim.toLowerCase().split(/\s+/);
        const correctWords = correctTrim.toLowerCase().split(/\s+/);
        const matchCount = correctWords.filter((word) =>
          givenWords.includes(word)
        ).length;
        const matchRatio = matchCount / correctWords.length;

        // Give partial credit if more than 70% words match
        return matchRatio >= 0.7 ? 0.5 : 0;
      }

      return 0;
    };

    let totalScore = 0;
    let scoreDetails = [];
    
    for (const q of exam.questions) {
      const given = answers[q._id] ?? "";
      const marks = Number.isFinite(q.marks) ? q.marks : 1;
      const scoreRatio = calculateScore(given, q.correctAnswer, q.type);
      const questionScore = scoreRatio * marks;
      totalScore += questionScore;
      
      scoreDetails.push({
        questionId: q._id,
        questionText: q.text,
        givenAnswer: given,
        correctAnswer: q.correctAnswer,
        earnedMarks: questionScore,
        totalMarks: marks
      });
    }

    console.log(`Calculated score: ${totalScore}`);
    console.log(`Score details:`, scoreDetails);

    // Use findOneAndUpdate with upsert to handle both new submissions and retakes
    const submission = await TakesExam.findOneAndUpdate(
      { examId, studentId },
      {
        examId,
        studentId,
        answers: Object.keys(answers).map((questionId) => ({
          questionId,
          value: answers[questionId],
        })),
        score: totalScore,
        status: "submitted",
        adjustedScore: null, // Reset adjusted score on new submission
        isReviewed: false, // Reset review status
        reviewNotes: null,
        reviewedBy: null,
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true 
      }
    );

    console.log(`Submission saved successfully with score: ${submission.score}`);

    // Calculate total possible marks
    const totalMarks = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    const percentage = totalMarks > 0 ? ((totalScore / totalMarks) * 100).toFixed(2) : 0;

    res.status(201).json({ 
      score: submission.score,
      totalMarks,
      percentage,
      message: "Exam submitted successfully!"
    });
  } catch (err) {
    console.error(err);
    if (err?.code === 11000)
      return res.status(409).json({ message: "You have already submitted." });
    res.status(500).json({ message: "Failed to submit exam" });
  }
}

export async function getStudentResult(req, res) {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;

    const submission = await TakesExam.findOne({ examId, studentId });
    if (!submission) {
      return res.status(404).json({
        message: "Result not found. You may not have submitted the exam yet.",
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Calculate total marks from questions
    const totalMarks = exam.questions.reduce(
      (sum, q) => sum + (q.marks || 0),
      0
    );
    const percentage =
      totalMarks > 0 ? ((submission.score / totalMarks) * 100).toFixed(2) : 0;

    // Use adjusted score if reviewed, otherwise original score
    const finalScore =
      submission.adjustedScore !== null
        ? submission.adjustedScore
        : submission.score;

    res.json({
      _id: submission._id,
      examTitle: exam.title,
      obtainedMarks: finalScore,
      totalMarks,
      percentage:
        totalMarks > 0
          ? parseFloat(((finalScore / totalMarks) * 100).toFixed(2))
          : 0,
      submittedAt: submission.createdAt,
      isReviewed: submission.isReviewed,
      reviewNotes: submission.reviewNotes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch result" });
  }
}

// New function for instructors to review and correct submissions
export async function reviewSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const { adjustedScore, reviewNotes } = req.body;
    const reviewerId = req.user._id;

    const submission = await TakesExam.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Update submission with corrections
    submission.adjustedScore =
      adjustedScore !== undefined ? adjustedScore : submission.adjustedScore;
    submission.reviewNotes = reviewNotes || submission.reviewNotes;
    submission.reviewedBy = reviewerId;
    submission.isReviewed = true;

    await submission.save();

    res.json({ message: "Submission reviewed successfully", submission });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to review submission" });
  }
}

// Get all submissions for an exam (for instructors)
export async function getExamSubmissions(req, res) {
  try {
    const { examId } = req.params;

    const submissions = await TakesExam.find({ examId })
      .populate("studentId", "fullName username department")
      .populate("reviewedBy", "fullName")
      .sort({ createdAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
}

// Delete a submission (for instructors/admin)
export async function deleteSubmission(req, res) {
  try {
    const { submissionId } = req.params;
    const instructorId = req.user._id;

    console.log(`Instructor ${instructorId} deleting submission ${submissionId}`);

    const submission = await TakesExam.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    await TakesExam.deleteOne({ _id: submissionId });

    console.log(`Submission ${submissionId} deleted successfully`);
    res.json({ message: "Submission deleted successfully" });
  } catch (err) {
    console.error("Error deleting submission:", err);
    res.status(500).json({ message: "Failed to delete submission" });
  }
}

// Get student results for an exam (for exam committee)
export async function getStudentResultsForExam(req, res) {
  try {
    const { examId } = req.params;

    const submissions = await TakesExam.find({ examId, status: "submitted" })
      .populate("studentId", "fullName username department year section")
      .sort({ createdAt: -1 });

    const results = submissions.map((sub) => ({
      _id: sub._id,
      student: sub.studentId,
      score: sub.score,
      adjustedScore: sub.adjustedScore,
      submittedAt: sub.createdAt,
      isReviewed: sub.isReviewed,
      reviewNotes: sub.reviewNotes,
    }));

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch student results" });
  }
}

// Send student results to instructors
export async function sendResultsToInstructors(req, res) {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId).populate(
      "createdBy",
      "fullName email"
    );
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const submissions = await TakesExam.find({ examId, status: "submitted" })
      .populate("studentId", "fullName username department year section")
      .sort({ createdAt: -1 });

    if (submissions.length === 0) {
      return res
        .status(404)
        .json({ message: "No submissions found for this exam" });
    }

    // Calculate total marks
    const totalMarks = exam.questions.reduce(
      (sum, q) => sum + (q.marks || 0),
      0
    );

    // Prepare results data
    const resultsData = submissions.map((sub) => ({
      studentName: sub.studentId.fullName,
      studentUsername: sub.studentId.username,
      department: sub.studentId.department,
      year: sub.studentId.year,
      section: sub.studentId.section,
      score: sub.adjustedScore !== null ? sub.adjustedScore : sub.score,
      totalMarks,
      percentage:
        totalMarks > 0 ? ((sub.score / totalMarks) * 100).toFixed(2) : 0,
      submittedAt: sub.createdAt,
      isReviewed: sub.isReviewed,
      reviewNotes: sub.reviewNotes,
    }));

    // Send email to instructor
    const instructorEmail =
      exam.createdBy?.email || "instructor@university.edu";
    const emailSubject = `Exam Results: ${exam.title}`;
    const emailBody = `
Dear ${exam.createdBy?.fullName || "Instructor"},

The results for the exam "${exam.title}" are now available.

Exam Details:
- Title: ${exam.title}
- Start Time: ${exam.startTime || "TBD"}
- End Time: ${exam.endTime || "TBD"}
- Total Students Submitted: ${submissions.length}

Student Results:
${resultsData
  .map(
    (result) =>
      `Student: ${result.studentName} (${result.studentUsername})
  Department: ${result.department}, Year: ${result.year}, Section: ${
        result.section
      }
  Score: ${result.score}/${result.totalMarks} (${result.percentage}%)
  Submitted: ${result.submittedAt.toLocaleString()}
  Reviewed: ${result.isReviewed ? "Yes" : "No"}
  ${result.reviewNotes ? `Review Notes: ${result.reviewNotes}` : ""}
  ---`
  )
  .join("\n")}

Best regards,
Exam Management System
    `;

    // Import and use email utility
    const { sendExamNotification } = await import("../utils/email.js");
    await sendExamNotification(instructorEmail, emailSubject, emailBody);

    res.json({
      message: "Results sent to instructor successfully",
      resultsCount: submissions.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send results to instructor" });
  }
}
