import { Router } from "express";
import {
  mockUser, mockIdentityProviders, mockServices, mockNews,
  mockDocuments, mockMeetings, mockTasks,
  mockScenicSpots, mockTourRoutes, mockComplaints,
  mockSubsidies, mockMedicalInsurance,
  mockSLAMetrics, mockPolicyFulfillments, mockSLAHistory,
} from "../data/mock.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "广西全域数字生活操作系统-后端" });
});

router.get("/user/profile", (_req, res) => {
  res.json({ data: mockUser, code: 0, message: "success" });
});

router.get("/identity/providers", (_req, res) => {
  res.json({ data: mockIdentityProviders, code: 0, message: "success" });
});

router.get("/services", (req, res) => {
  const role = req.query.role as string | undefined;
  const data = role ? mockServices.filter((s) => s.roles.includes(role)) : mockServices;
  res.json({ data, code: 0, message: "success" });
});

router.get("/news", (_req, res) => {
  res.json({ data: mockNews, code: 0, message: "success" });
});

router.get("/gov/documents", (_req, res) => {
  res.json({ data: mockDocuments, code: 0, message: "success" });
});

router.get("/gov/meetings", (_req, res) => {
  res.json({ data: mockMeetings, code: 0, message: "success" });
});

router.get("/gov/tasks", (_req, res) => {
  res.json({ data: mockTasks, code: 0, message: "success" });
});

router.get("/tour/spots", (_req, res) => {
  res.json({ data: mockScenicSpots, code: 0, message: "success" });
});

router.post("/tour/spots/:id/reserve", (req, res) => {
  const { id } = req.params;
  const { slot } = req.body;
  res.json({ data: { spotId: id, slot, success: true }, code: 0, message: "预约成功" });
});

router.get("/tour/routes", (_req, res) => {
  res.json({ data: mockTourRoutes, code: 0, message: "success" });
});

router.post("/tour/routes/generate", (req, res) => {
  const { preferences } = req.body;
  res.json({ data: mockTourRoutes.slice(0, 2), preferences, code: 0, message: "路线生成成功" });
});

router.get("/tour/complaints", (_req, res) => {
  res.json({ data: mockComplaints, code: 0, message: "success" });
});

router.post("/tour/complaints", (req, res) => {
  const { title, content } = req.body;
  const newComplaint = {
    id: `c${Date.now()}`,
    title,
    content,
    status: "submitted",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  res.json({ data: newComplaint, code: 0, message: "投诉已提交，将直连文旅局处理" });
});

router.get("/livelihood/subsidies", (req, res) => {
  const type = req.query.type as string | undefined;
  const data = type ? mockSubsidies.filter((s) => s.type === type) : mockSubsidies;
  res.json({ data, code: 0, message: "success" });
});

router.post("/livelihood/subsidies/apply", (req, res) => {
  const { id } = req.body;
  res.json({ data: { id, success: true, newStatus: "applying" }, code: 0, message: "申领已提交" });
});

router.get("/livelihood/insurance", (_req, res) => {
  res.json({ data: mockMedicalInsurance, code: 0, message: "success" });
});

router.post("/livelihood/insurance/cross-region", (_req, res) => {
  res.json({ data: { success: true, crossRegionStatus: "active" }, code: 0, message: "异地就医备案成功，已同步全国医保平台" });
});

router.get("/monitor/sla", (_req, res) => {
  res.json({ data: mockSLAMetrics, code: 0, message: "success" });
});

router.get("/monitor/sla/history", (_req, res) => {
  res.json({ data: mockSLAHistory, code: 0, message: "success" });
});

router.get("/monitor/policies", (_req, res) => {
  res.json({ data: mockPolicyFulfillments, code: 0, message: "success" });
});

router.get("/platform/stats", (_req, res) => {
  res.json({
    data: {
      totalUsers: 1560000,
      totalServices: 328,
      avgSLA: 99.7,
      citiesCovered: 14,
    },
    code: 0,
    message: "success",
  });
});

export default router;
