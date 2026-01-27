import Exam from "../models/examModel.js";
import User from "../models/User.js";
import { sendExamNotification } from "../utils/email.js";

// ✅ Create Exam
export const createExam = async (req, res) => {
  try {
    // Generate a unique 6-character alphanumeric exam code
    const generateExamCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let examCode;
    let isUnique = false;
    while (!isUnique) {
      examCode = generateExamCode();
      const existingExam = await Exam.findOne({ examCode });
      if (!existingExam) {
        isUnique = true;
      }
    }

    const exam = new Exam({
      ...req.body,
      examCode,
      createdBy: {
        _id: req.user._id,
        fullName: req.user.fullName,
        department: req.user.department,
      },
    });

    const savedExam = await exam.save();
    res.status(201).json(savedExam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating exam", error: err.message });
  }
};

// ✅ Get all exams (for Instructor/Department Head)
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate("assignedStudents", "fullName username department")
      .lean();

    // ensure createdBy always exists
    const safeExams = exams.map((exam) => ({
      ...exam,
      createdBy: exam.createdBy || { fullName: "Unknown", department: "N/A" },
      studentApprovals: exam.studentApprovals || [],
    }));

    res.json(safeExams);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching exams", error: err.message });
  }
};

// ✅ Check if exam can be edited
export const checkEditPermissions = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const canEdit = {
      hasOwnership: exam.createdBy._id.toString() === req.user._id.toString() || req.user.role === "admin",
      isNotApproved: !exam.isApproved,
      hasNoSubmissions: true, // TODO: Check for actual submissions when TakesExam model is available
      canEditExam: false,
      canDeleteExam: false,
      canEditQuestions: false,
      reasons: []
    };

    // Check ownership
    if (!canEdit.hasOwnership) {
      canEdit.reasons.push("You can only edit exams that you created");
    }

    // Check approval status for editing (not for deletion)
    if (exam.isApproved) {
      canEdit.reasons.push("Cannot edit approved exams");
    }

    // TODO: Check for student submissions
    // const hasSubmissions = await TakesExam.findOne({ examId: req.params.id });
    // if (hasSubmissions) {
    //   canEdit.hasNoSubmissions = false;
    //   canEdit.reasons.push("Cannot edit exam with active student submissions");
    // }

    // Determine final permissions
    canEdit.canEditExam = canEdit.hasOwnership && canEdit.isNotApproved && canEdit.hasNoSubmissions;
    canEdit.canDeleteExam = canEdit.hasOwnership; // Allow deletion even for approved exams
    canEdit.canEditQuestions = canEdit.hasOwnership && canEdit.isNotApproved && canEdit.hasNoSubmissions;

    // Add specific reasons for approved exams
    if (exam.isApproved && canEdit.hasOwnership) {
      canEdit.approvedExamWarning = "This is an approved exam. Deletion will remove it from students' access.";
    }

    res.json({
      examId: exam._id,
      examTitle: exam.title,
      permissions: canEdit,
      examStatus: {
        isApproved: exam.isApproved,
        isRejected: exam.isRejected,
        status: exam.status || 'draft'
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error checking edit permissions", error: err.message });
  }
};

// ✅ Validate exam data before editing
export const validateExamEdit = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const validationErrors = [];
    const warnings = [];

    // Validate required fields
    if (!req.body.title || req.body.title.trim().length < 3) {
      validationErrors.push("Exam title must be at least 3 characters");
    }

    if (!req.body.university || req.body.university.trim().length === 0) {
      validationErrors.push("University name is required");
    }

    // Validate duration
    if (req.body.duration && (req.body.duration < 10 || req.body.duration > 300)) {
      validationErrors.push("Duration must be between 10 and 300 minutes");
    }

    // Validate weight
    if (req.body.weight && (req.body.weight < 1 || req.body.weight > 100)) {
      validationErrors.push("Weight must be between 1 and 100 percent");
    }

    // Validate dates
    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      if (start >= end) {
        validationErrors.push("End time must be after start time");
      }
      if (start < new Date()) {
        warnings.push("Start time is in the past");
      }
    }

    // Check for scheduling conflicts (placeholder)
    // TODO: Implement actual conflict checking with course calendar
    if (req.body.startTime) {
      // This would check against course calendar and other exams
      // For now, we'll just add a placeholder
    }

    res.json({
      isValid: validationErrors.length === 0,
      errors: validationErrors,
      warnings: warnings,
      canProceed: validationErrors.length === 0
    });
  } catch (err) {
    res.status(500).json({ message: "Error validating exam", error: err.message });
  }
};

// ✅ Update Exam
export const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check ownership - only creator or admin can edit
    if (exam.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit exams that you created" });
    }

    // Check if exam can be edited (not approved and no active submissions)
    if (exam.isApproved) {
      return res.status(403).json({ 
        message: "Cannot edit approved exams. Exam has been approved by committee and is available to students." 
      });
    }

    // Check for active student submissions (if TakesExam model exists)
    // This would require importing TakesExam model - for now we'll skip this check
    // const hasSubmissions = await TakesExam.findOne({ examId: req.params.id });
    // if (hasSubmissions) {
    //   return res.status(403).json({ 
    //     message: "Cannot edit exam with active student submissions" 
    //   });
    // }

    // Update exam with validation
    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id, 
      {
        ...req.body,
        lastModified: new Date(),
        modifiedBy: req.user._id
      }, 
      {
        new: true,
        runValidators: true
      }
    );

    // Log the modification for audit trail
    console.log(`Exam ${req.params.id} updated by user ${req.user._id} at ${new Date()}`);

    res.json(updatedExam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating exam", error: err.message });
  }
};

// ✅ Delete Exam (Enhanced to allow deletion of approved exams by instructors)
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check ownership - only creator or admin can delete
    if (exam.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete exams that you created" });
    }

    // For approved exams, add additional checks and warnings
    if (exam.isApproved) {
      // Check for student submissions or results (if TakesExam model exists)
      // This would require importing TakesExam model - for now we'll skip this check
      // const hasSubmissions = await TakesExam.findOne({ examId: req.params.id });
      // if (hasSubmissions) {
      //   return res.status(403).json({ 
      //     message: "Cannot delete approved exam with student submissions. Please contact administrator." 
      //   });
      // }

      // Allow deletion but log it as a critical action
      console.log(`⚠️  CRITICAL: Approved exam ${req.params.id} being deleted by instructor ${req.user._id} at ${new Date()}`);
    }

    // Delete the exam and all associated data
    const deletedExam = await Exam.findByIdAndDelete(req.params.id);
    
    // Log the deletion for audit trail
    console.log(`Exam ${req.params.id} deleted by user ${req.user._id} at ${new Date()}`);

    // TODO: Clean up any references in other collections
    // - Remove from student assignments
    // - Remove from schedules
    // - Clean up any cached data
    // - Notify affected students if exam was approved

    res.json({ 
      message: exam.isApproved 
        ? "Approved exam deleted successfully. Students will no longer have access to this exam."
        : "Exam deleted successfully",
      deletedExam: {
        _id: deletedExam._id,
        title: deletedExam.title,
        examCode: deletedExam.examCode,
        wasApproved: deletedExam.isApproved
      }
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting exam", error: err.message });
  }
};

// ✅ Add Question
export const addQuestion = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    exam.questions.push(req.body);
    await exam.save();
    res.json(exam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding question", error: err.message });
  }
};

// ✅ Update Question
export const updateQuestion = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check ownership
    if (exam.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only edit questions in exams that you created" });
    }

    // Check if exam can be modified
    if (exam.isApproved) {
      return res.status(403).json({ 
        message: "Cannot modify questions in approved exams" 
      });
    }

    // Find question by MongoDB subdocument _id, not by index
    const question = exam.questions.id(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Store original question for audit
    const originalQuestion = { ...question.toObject() };

    // Update fields with validation
    Object.assign(question, {
      ...req.body,
      lastModified: new Date()
    });

    // Recalculate total exam score
    const totalScore = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    exam.totalMarks = totalScore;
    exam.lastModified = new Date();

    await exam.save();

    // Log the modification for audit trail
    console.log(`Question ${req.params.questionId} in exam ${req.params.id} updated by user ${req.user._id} at ${new Date()}`);

    res.json(exam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating question", error: err.message });
  }
};

// ✅ Delete Question
export const deleteQuestion = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Check ownership
    if (exam.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete questions from exams that you created" });
    }

    // Check if exam can be modified
    if (exam.isApproved) {
      return res.status(403).json({ 
        message: "Cannot delete questions from approved exams" 
      });
    }

    // Remove by subdocument _id
    const question = exam.questions.id(req.params.questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Store question info for audit before deletion
    const deletedQuestionInfo = {
      _id: question._id,
      text: question.text,
      marks: question.marks
    };

    question.deleteOne();

    // Recalculate total exam score after deletion
    const totalScore = exam.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    exam.totalMarks = totalScore;
    exam.lastModified = new Date();

    await exam.save();

    // Log the deletion for audit trail
    console.log(`Question ${req.params.questionId} deleted from exam ${req.params.id} by user ${req.user._id} at ${new Date()}`);

    res.json({
      message: "Question deleted successfully",
      exam,
      deletedQuestion: deletedQuestionInfo
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting question", error: err.message });
  }
};

// ✅ Assign departments (without assigning students yet)
export const assignDepartments = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    exam.assignedDepartments = req.body.assignedDepartments || [];
    exam.year = req.body.year;
    exam.section = req.body.section;

    await exam.save();

    // Return the updated exam directly to match frontend expectations
    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: "Error assigning", error: err.message });
  }
};

// ✅ Send to Exam Committee (Commit)
export const sendToCommittee = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    exam.status = "committed";
    exam.isApproved = false;
    exam.isRejected = false;

    await exam.save();

    // Send notification email to exam committee
    await sendExamNotification(
      "examcommittee@university.edu", // Placeholder email for committee
      `Exam Committed: ${exam.title}`,
      `Exam "${exam.title}" has been committed by ${req.user.fullName} and is awaiting approval.`
    );

    // Return the updated exam directly to match frontend expectations
    res.json(exam);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error sending to committee", error: err.message });
  }
};

// ✅ Get exams for Committee Review
export const getExamsForCommittee = async (req, res) => {
  try {
    const exams = await Exam.find({
      isApproved: false,
      isRejected: false,
    }).lean();

    const safeExams = exams.map((exam) => ({
      ...exam,
      createdBy: exam.createdBy || { fullName: "Unknown", department: "N/A" },
    }));

    res.json(safeExams);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching committee exams", error: err.message });
  }
};

// ✅ Approve Exam (Committee)
export const approveExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Assign students based on assignedDepartments, year, section
    const students = await User.find({
      department: { $in: exam.assignedDepartments },
      role: "student",
      ...(exam.year && { year: exam.year }),
      ...(exam.section && { section: exam.section }),
    });

    exam.assignedStudents = students.map((s) => s._id);
    exam.status = "approved";
    exam.isApproved = true;
    exam.isRejected = false;

    // Initialize student approvals - automatically approve all students
    exam.studentApprovals = students.map((student) => ({
      studentId: student._id,
      isApproved: true,
      isRejected: false,
    }));

    await exam.save();

    // Populate the exam with student data before returning
    const populatedExam = await Exam.findById(exam._id)
      .populate("assignedStudents", "fullName username department year section")
      .populate("studentApprovals.studentId", "fullName username department year section")
      .lean();

    // Send notification email to instructor
    await sendExamNotification(
      "instructor@university.edu", // Placeholder, ideally get from exam.createdBy
      `Exam Approved: ${exam.title}`,
      `Your exam "${exam.title}" has been approved by the committee. Students can now be approved individually.`
    );

    res.json({ message: "Exam approved successfully", exam: populatedExam });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error approving exam", error: err.message });
  }
};

// ✅ Change exam department (Committee only)
export const changeExamDepartment = async (req, res) => {
  try {
    const { examId } = req.params;
    const { newDepartment, reason } = req.body;

    if (!newDepartment) {
      return res.status(400).json({ message: "New department is required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Store original department for audit
    const originalDepartment = exam.department;

    // Update exam department
    exam.department = newDepartment;
    exam.lastModified = new Date();
    
    // Add audit log entry
    const auditEntry = {
      action: 'department_change',
      performedBy: req.user._id,
      performedByName: req.user.fullName,
      originalDepartment,
      newDepartment,
      reason: reason || 'No reason provided',
      timestamp: new Date()
    };

    // Add to exam's audit trail (if it exists)
    if (!exam.auditTrail) {
      exam.auditTrail = [];
    }
    exam.auditTrail.push(auditEntry);

    await exam.save();

    // Log the change for system audit
    console.log(`Exam ${examId} department changed from ${originalDepartment} to ${newDepartment} by ${req.user.fullName} (${req.user._id})`);

    res.json({
      message: "Exam department changed successfully",
      exam,
      change: {
        from: originalDepartment,
        to: newDepartment,
        changedBy: req.user.fullName,
        reason: reason || 'No reason provided',
        timestamp: new Date()
      }
    });
  } catch (err) {
    console.error("Error changing exam department:", err);
    res.status(500).json({ 
      message: "Error changing exam department", 
      error: err.message 
    });
  }
};

// ✅ Get all departments for dropdown
export const getAllDepartments = async (req, res) => {
  try {
    // Get unique departments from User collection
    const departments = await User.distinct('department', { 
      department: { $exists: true, $ne: null, $ne: "" } 
    });
    
    // Sort departments alphabetically
    departments.sort();
    
    res.json({
      departments,
      count: departments.length
    });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ 
      message: "Error fetching departments", 
      error: err.message 
    });
  }
};

// ✅ Reject Exam (Committee)
export const rejectExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    exam.status = "draft"; // Reset to draft for resubmission
    exam.isApproved = false;
    exam.isRejected = true;
    await exam.save();

    // Send notification email to instructor
    await sendExamNotification(
      "instructor@university.edu", // Placeholder
      `Exam Rejected: ${exam.title}`,
      `Your exam "${exam.title}" has been rejected by the committee. Please review and resubmit.`
    );

    res.json({ message: "Exam rejected successfully", exam });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error rejecting exam", error: err.message });
  }
};

// ✅ Get approved exams with student approvals for Committee
export const getApprovedExamsForCommittee = async (req, res) => {
  try {
    const exams = await Exam.find({
      isApproved: true,
      isRejected: false,
    })
      .populate("assignedStudents", "fullName username department year section")
      .populate(
        "studentApprovals.studentId",
        "fullName username department year section"
      )
      .lean();

    res.json(exams);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching approved exams", error: err.message });
  }
};

// ✅ Approve Student for Exam (Committee)
export const approveStudentForExam = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const approval = exam.studentApprovals.find(
      (a) => a.studentId.toString() === studentId
    );
    if (!approval)
      return res
        .status(404)
        .json({ message: "Student not found in approvals" });

    approval.isApproved = true;
    approval.isRejected = false;
    await exam.save();

    // Send notification email to student
    const student = await User.findById(studentId);
    if (student && student.email) {
      await sendExamNotification(
        student.email,
        `Approved for Exam: ${exam.title}`,
        `You have been approved to take the exam "${exam.title}". Exam Code: ${
          exam.examCode
        }. Start time: ${exam.startTime || "TBD"}.`
      );
    }

    res.json({ message: "Student approved for exam", exam });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error approving student", error: err.message });
  }
};

// ✅ Reject Student for Exam (Committee)
export const rejectStudentForExam = async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const approval = exam.studentApprovals.find(
      (a) => a.studentId.toString() === studentId
    );
    if (!approval)
      return res
        .status(404)
        .json({ message: "Student not found in approvals" });

    approval.isApproved = false;
    approval.isRejected = true;
    await exam.save();

    res.json({ message: "Student rejected for exam", exam });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error rejecting student", error: err.message });
  }
};

// ✅ Bulk Approve Students for Exam (Committee)
export const bulkApproveStudents = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Find all pending students (not approved and not rejected)
    const pendingApprovals = exam.studentApprovals.filter(
      (approval) => !approval.isApproved && !approval.isRejected
    );

    if (pendingApprovals.length === 0) {
      return res.json({ 
        message: "No pending students to approve", 
        approvedCount: 0,
        exam 
      });
    }

    // Approve all pending students
    let approvedCount = 0;
    const approvedStudentIds = [];

    for (const approval of pendingApprovals) {
      approval.isApproved = true;
      approval.isRejected = false;
      approval.approvedAt = new Date();
      approval.approvedBy = req.user._id;
      approvedCount++;
      approvedStudentIds.push(approval.studentId);
    }

    await exam.save();

    // Send notification emails to all newly approved students
    try {
      const approvedStudents = await User.find({
        _id: { $in: approvedStudentIds }
      });

      for (const student of approvedStudents) {
        if (student.email) {
          await sendExamNotification(
            student.email,
            `Approved for Exam: ${exam.title}`,
            `You have been approved to take the exam "${exam.title}". Exam Code: ${
              exam.examCode
            }. Start time: ${exam.startTime || "TBD"}.`
          );
        }
      }
    } catch (emailError) {
      console.error("Error sending bulk approval emails:", emailError);
      // Don't fail the approval process if emails fail
    }

    // Populate the exam with student data before returning
    const populatedExam = await Exam.findById(exam._id)
      .populate("assignedStudents", "fullName username department year section")
      .populate("studentApprovals.studentId", "fullName username department year section")
      .lean();

    res.json({ 
      message: "Students approved successfully", 
      approvedCount,
      exam: populatedExam 
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error bulk approving students", error: err.message });
  }
};

// ✅ Get exams for students (approved exams for student's department)
export const getExamsForStudents = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Get student details to filter exams
    const student = await User.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    console.log("🎓 Fetching exams for student:", studentId);
    console.log("📍 Student department:", student.department);
    console.log("📅 Student year:", student.year);
    console.log("📚 Student section:", student.section);

    // Build a flexible query - show approved exams for student's department
    // Either the student is specifically approved OR the exam is for their department
    const query = {
      isApproved: true,
      isRejected: { $ne: true },
      $or: [
        // Option 1: Student is specifically approved for this exam
        {
          studentApprovals: {
            $elemMatch: {
              studentId: studentId,
              isApproved: true
            }
          }
        },
        // Option 2: Exam is assigned to student's department (and student matches year/section if specified)
        {
          assignedDepartments: { $in: [student.department] },
          ...(student.year ? { $or: [{ year: student.year }, { year: { $exists: false } }, { year: null }] } : {}),
        },
        // Option 3: Student is in the assignedStudents list
        {
          assignedStudents: studentId
        }
      ]
    };

    console.log("📋 Query:", JSON.stringify(query, null, 2));

    const exams = await Exam.find(query)
      .populate("assignedStudents", "fullName username department")
      .lean();

    console.log("✅ Found exams:", exams.length);
    
    // Log exam details for debugging
    exams.forEach(exam => {
      console.log(`  - ${exam.title} (${exam._id})`);
      console.log(`    Department: ${exam.department}`);
      console.log(`    Assigned Departments: ${exam.assignedDepartments?.join(', ') || 'none'}`);
      console.log(`    Student Approvals: ${exam.studentApprovals?.length || 0}`);
    });

    res.json(exams);
  } catch (err) {
    console.error("❌ Error fetching student exams:", err);
    res
      .status(500)
      .json({ message: "Error fetching student exams", error: err.message });
  }
};

// ✅ Get student results for an exam (for Committee)
export const getStudentResultsForExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Get all submissions for this exam
    const submissions = await TakesExam.find({ examId })
      .populate("studentId", "fullName username department year section")
      .sort({ createdAt: -1 });

    // Calculate total marks
    const totalMarks = exam.questions.reduce(
      (sum, q) => sum + (q.marks || 0),
      0
    );

    const results = submissions.map((submission) => ({
      studentId: submission.studentId,
      examId: submission.examId,
      answers: submission.answers.reduce((acc, ans) => {
        acc[ans.questionId] = ans.value;
        return acc;
      }, {}),
      score:
        submission.adjustedScore !== null
          ? submission.adjustedScore
          : submission.score,
      totalMarks,
      submittedAt: submission.createdAt,
    }));

    res.json(results);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching student results", error: err.message });
  }
};

// ✅ Join Exam (by ID or Code)
export const joinExam = async (req, res) => {
  try {
    const { examId, examCode } = req.body;
    let exam;
    if (examId) {
      exam = await Exam.findById(examId);
    } else if (examCode) {
      exam = await Exam.findOne({ examCode });
    } else {
      return res.status(400).json({ message: "examId or examCode required" });
    }
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    res.json(exam);
  } catch (err) {
    res.status(500).json({ message: "Error joining exam", error: err.message });
  }
};

// ✅ Verify Exam Code
export const verifyExamCode = async (req, res) => {
  try {
    const { examCode } = req.body;
    const exam = await Exam.findOne({ examCode: examCode.toUpperCase() });
    if (!exam) return res.status(404).json({ message: "Invalid exam code" });

    // Check exam approval status
    if (!exam.isApproved || exam.isRejected) {
      return res
        .status(403)
        .json({ message: "Exam not approved by committee" });
    }

    // Validate start time
    const now = new Date();
    if (exam.startTime && new Date(exam.startTime) > now) {
      return res.status(403).json({ message: "Exam has not started yet" });
    }

    // Allow joining before start time, but enforce end time
    if (exam.endTime && new Date(exam.endTime) < now) {
      return res.status(410).json({ message: "Exam time finished" });
    }

    // Check if student is assigned and approved
    const studentId = req.user._id;
    const approval = (exam.studentApprovals || []).find(
      (a) => a.studentId.toString() === studentId.toString()
    );
    if (!approval || !approval.isApproved) {
      return res.status(403).json({
        message:
          "You are not approved for this exam. Please contact your instructor or exam committee.",
      });
    }

    // Check if student has any ongoing exam (started but not submitted)
    const ongoingExam = await TakesExam.findOne({
      studentId,
      status: "started",
    });
    if (ongoingExam) {
      return res.status(409).json({
        message:
          "You have an ongoing exam. Please submit or finish your current exam before starting a new one.",
      });
    }

    res.json({
      message: "Code verified successfully! You can now start the exam.",
      exam,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error verifying code", error: err.message });
  }
};

// ✅ Get available exams for student
export const getAvailableExamsForStudent = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();

    const exams = await Exam.find({
      isApproved: true,
      isRejected: false,
      "studentApprovals.studentId": studentId,
      "studentApprovals.isApproved": true,
      startTime: { $lte: now },
      endTime: { $gte: now },
    })
      .populate("assignedStudents", "fullName username department")
      .lean();

    // Additional validation: ensure student is approved (though query already checks)
    const validatedExams = exams.filter((exam) => {
      const approval = exam.studentApprovals?.find(
        (a) => a.studentId.toString() === studentId.toString()
      );
      return approval && approval.isApproved;
    });

    res.json(validatedExams);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching available exams", error: err.message });
  }
};

// ✅ Check student approval for specific exam

export const checkStudentApproval = async (req, res) => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user._id;

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const approval = (exam.studentApprovals || []).find(
      (a) => a.studentId.toString() === studentId.toString()
    );

    if (!approval) {
      return res.json({
        isApproved: false,
        message: "Student not assigned to this exam",
      });
    }

    res.json({
      isApproved: approval.isApproved,
      isRejected: approval.isRejected,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error checking student approval", error: err.message });
  }
};

// ✅ Get exams filtered for students by department, assignedYears, assignedSections
export const getFilteredExamsForStudent = async (req, res) => {
  try {
    // Get filter info from query parameters or user
    const { department, year, section } = req.query;

    if (!department || !year) {
      return res
        .status(400)
        .json({ message: "Department and year are required." });
    }

    const now = new Date();

    const query = {
      isApproved: true,
      isRejected: false,
      assignedDepartments: department,
      assignedYears: year,
      startTime: { $lte: now },
      $or: [{ endTime: { $gte: now } }, { endTime: { $exists: false } }],
    };

    if (section) {
      query.assignedSections = section;
    }

    const exams = await Exam.find(query).sort({ startTime: 1 });

    res.json(exams);
  } catch (error) {
    console.error("Error fetching filtered exams:", error);
    res.status(500).json({ message: "Failed to fetch filtered exams." });
  }
};
