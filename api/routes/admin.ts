import { Router, type Request, type Response } from "express";
import {
  mockAuditLogs,
  mockStatsOverview,
  mockHeatmapData,
  mockServiceMonitors,
  mockPendingApprovals,
  mockDepartments,
} from "../../src/data/mockData";

const router = Router();

router.get("/overview", (req: Request, res: Response): void => {
  res.json({ success: true, data: mockStatsOverview });
});

router.get("/audit-logs", (req: Request, res: Response): void => {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  let result = [...mockAuditLogs];

  if (keyword) {
    const kw = String(keyword);
    result = result.filter(
      (l) =>
        l.userName.includes(kw) ||
        l.action.includes(kw) ||
        l.resource.includes(kw) ||
        l.ip.includes(kw)
    );
  }

  const total = result.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const data = result.slice(start, start + Number(pageSize));

  res.json({
    success: true,
    data: { list: data, total, page: Number(page), pageSize: Number(pageSize) },
  });
});

router.get("/monitor", (req: Request, res: Response): void => {
  res.json({ success: true, data: mockServiceMonitors });
});

router.get("/approvals", (req: Request, res: Response): void => {
  const { dept, priority } = req.query;
  let result = [...mockPendingApprovals];

  if (dept) {
    result = result.filter((p) => p.currentDept === dept || p.requiredDepts.includes(String(dept)));
  }
  if (priority && priority !== "all") {
    result = result.filter((p) => p.priority === priority);
  }

  res.json({ success: true, data: result });
});

router.get("/departments", (req: Request, res: Response): void => {
  res.json({ success: true, data: mockDepartments });
});

router.get("/heatmap", (req: Request, res: Response): void => {
  const { domain } = req.query;
  let data = [...mockHeatmapData];

  if (domain && domain !== "all") {
    data = data.filter((d) => d.serviceCategory === domain);
  }

  res.json({ success: true, data });
});

export default router;
