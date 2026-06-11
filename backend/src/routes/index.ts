import { Router } from "express";
import multer from "multer";
import { AuthController } from "../controllers/auth.controller";
import { PositionController } from "../controllers/position.controller";
import { CandidateController } from "../controllers/candidate.controller";
import { InterviewController } from "../controllers/interview.controller";
import { IMController } from "../controllers/im.controller";
import { ApprovalController } from "../controllers/approval.controller";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { auditMiddleware } from "../middleware/audit";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760"),
  },
});

const serializeUser = (user: any) => {
  if (!user) {
    return null;
  }
  const { password, ...safeUser } = user;
  return safeUser;
};

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.post("/auth/login", auditMiddleware("login", "User"), AuthController.login);
router.post("/auth/register", authenticate, requireRole("admin"), auditMiddleware("system_config", "User"), AuthController.register);
router.post("/auth/logout", authenticate, AuthController.logout);
router.get("/auth/me", authenticate, AuthController.getCurrentUser);
router.put("/auth/password", authenticate, AuthController.changePassword);
router.get("/users/profile", authenticate, (req: any, res) => {
  const user = serializeUser(req.user);
  res.json({ user, profile: user });
});
router.get("/user/profile", authenticate, (req: any, res) => {
  const user = serializeUser(req.user);
  res.json({ user, profile: user });
});

router.get("/positions", authenticate, PositionController.getPositions);
router.get("/positions/:id", authenticate, PositionController.getPositionById);
router.post("/positions", authenticate, auditMiddleware("position_create", "Position"), PositionController.createPosition);
router.put("/positions/:id", authenticate, auditMiddleware("position_update", "Position"), PositionController.updatePosition);
router.post("/positions/:id/submit-approval", authenticate, auditMiddleware("position_publish", "Position"), PositionController.submitForApproval);
router.post("/positions/:id/publish", authenticate, auditMiddleware("position_publish", "Position"), PositionController.publishPosition);
router.post("/positions/:id/close", authenticate, auditMiddleware("position_delete", "Position"), PositionController.closePosition);
router.post("/positions/:id/sync-ats", authenticate, auditMiddleware("ats_sync", "Position"), PositionController.syncToATS);
router.post("/positions/generate-jd", authenticate, PositionController.generateJobDescription);

router.get("/candidates", authenticate, CandidateController.getCandidates);
router.get("/candidates/kanban", authenticate, CandidateController.getKanbanData);
router.get("/candidates/:id", authenticate, CandidateController.getCandidateById);
router.post("/candidates", authenticate, auditMiddleware("candidate_create", "Candidate"), CandidateController.createCandidate);
router.put("/candidates/:id", authenticate, auditMiddleware("candidate_update", "Candidate"), CandidateController.updateCandidate);
router.put("/candidates/:id/stage", authenticate, auditMiddleware("candidate_stage_change", "Candidate"), CandidateController.updateStage);
router.post("/candidates/:id/ai-screening", authenticate, auditMiddleware("ai_screening", "Candidate"), CandidateController.aiScreening);
router.post("/candidates/batch-ai-screening", authenticate, CandidateController.batchAIScreening);
router.post("/candidates/upload-resume", authenticate, upload.single("resume"), auditMiddleware("file_upload", "Resume"), CandidateController.uploadResume);
router.put("/candidates/:id/onboarding-checklist", authenticate, CandidateController.updateOnboardingChecklist);

router.get("/interviews", authenticate, InterviewController.getInterviews);
router.get("/interviews/:id", authenticate, InterviewController.getInterviewById);
router.post("/interviews", authenticate, auditMiddleware("interview_schedule", "Interview"), InterviewController.createInterview);
router.put("/interviews/:id", authenticate, InterviewController.updateInterview);
router.post("/interviews/:id/start", authenticate, auditMiddleware("interview_start", "Interview"), InterviewController.startInterview);
router.post("/interviews/:id/end", authenticate, auditMiddleware("interview_complete", "Interview"), InterviewController.endInterview);
router.post("/interviews/:id/transcript", authenticate, InterviewController.saveTranscript);
router.post("/interviews/:id/behavior-marker", authenticate, InterviewController.addBehaviorMarker);
router.post("/interviews/:id/evaluation", authenticate, InterviewController.submitEvaluation);
router.post("/interviews/generate-questions", authenticate, InterviewController.generateQuestions);
router.post("/interviews/:id/cancel", authenticate, InterviewController.cancelInterview);
router.get("/interviews/room/:roomId", authenticate, InterviewController.getRoomInfo);

router.get("/im/conversations", authenticate, IMController.getConversations);
router.get("/im/messages/:userId", authenticate, IMController.getMessages);
router.post("/im/messages", authenticate, upload.single("file"), auditMiddleware("message_send", "IMMessage"), IMController.sendMessage);
router.post("/im/messages/:senderId/read", authenticate, auditMiddleware("message_read", "IMMessage"), IMController.markAsRead);
router.get("/im/unread-count", authenticate, IMController.getUnreadCount);
router.delete("/im/messages/:id", authenticate, IMController.deleteMessage);
router.get("/im/audit/pending", authenticate, requireRole("admin", "hr"), IMController.getAuditPendingMessages);
router.post("/im/audit/:id", authenticate, requireRole("admin", "hr"), IMController.auditMessage);

router.get("/approvals", authenticate, ApprovalController.getApprovals);
router.get("/approvals/stats", authenticate, ApprovalController.getApprovalStats);
router.get("/approvals/:id", authenticate, ApprovalController.getApprovalById);
router.post("/approvals/:id/approve", authenticate, auditMiddleware("approval_approve", "Approval"), ApprovalController.approve);
router.post("/approvals/:id/reject", authenticate, auditMiddleware("approval_reject", "Approval"), ApprovalController.reject);
router.post("/approvals/:id/cancel", authenticate, ApprovalController.cancel);

router.get("/analytics/dashboard", authenticate, AnalyticsController.getDashboardStats);
router.get("/admin/stats", authenticate, requireRole("admin", "hr"), AnalyticsController.getDashboardStats);
router.get("/admin/dashboard", authenticate, requireRole("admin", "hr"), AnalyticsController.getDashboardStats);
router.get("/analytics/funnel", authenticate, AnalyticsController.getRecruitmentFunnel);
router.get("/analytics/heatmap", authenticate, AnalyticsController.getPositionHeatmap);
router.get("/analytics/tag-stats", authenticate, AnalyticsController.getTalentTagStats);
router.get("/tags", authenticate, AnalyticsController.getTags);
router.post("/tags", authenticate, requireRole("admin", "hr"), AnalyticsController.createTag);
router.put("/tags/:id", authenticate, requireRole("admin", "hr"), AnalyticsController.updateTag);
router.delete("/tags/:id", authenticate, requireRole("admin", "hr"), AnalyticsController.deleteTag);
router.get("/audit-logs", authenticate, requireRole("admin"), AnalyticsController.getAuditLogs);
router.get("/users", authenticate, AnalyticsController.getUsers);

export default router;
