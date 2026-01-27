import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendExamNotification = async (
  studentEmail,
  examTitle,
  examCode
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: studentEmail,
    subject: "Exam Approved and Available",
    text: `Dear Student,\n\nThe exam "${examTitle}" has been approved by the committee and is now available for you to take.\n\nExam Code: ${examCode}\n\nPlease log in to your account and use the code to access the exam.\n\nBest regards,\nExam Management System`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification sent to ${studentEmail}`);
  } catch (error) {
    console.error(`Error sending email to ${studentEmail}:`, error);
  }
};
