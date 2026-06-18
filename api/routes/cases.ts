import { Router, type Request, type Response } from "express";
import { mockCases, mockServices } from "../../src/data/mockData";
import type { CaseStatus } from "../../src/types";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { status, keyword, userId = "u001" } = req.query;
  let result = [...mockCases].filter((c) => c.applicantId === userId);

  if (status && status !== "all") {
    result = result.filter((c) => c.status === status);
  }
  if (keyword) {
    const kw = String(keyword);
    result = result.filter(
      (c) => c.serviceName.includes(kw) || c.caseNo.includes(kw)
    );
  }

  result.sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime());

  res.json({ success: true, data: result });
});

router.get("/stats", (req: Request, res: Response): void => {
  const { userId = "u001" } = req.query;
  const userCases = mockCases.filter((c) => c.applicantId === userId);
  const stats = {
    total: userCases.length,
    processing: userCases.filter((c) => ["submitted", "accepted", "processing"].includes(c.status)).length,
    pending_material: userCases.filter((c) => c.status === "pending_material").length,
    completed: userCases.filter((c) => ["approved", "completed"].includes(c.status)).length,
    rejected: userCases.filter((c) => c.status === "rejected").length,
  };
  res.json({ success: true, data: stats });
});

router.get("/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const caseItem = mockCases.find((c) => c.id === id);
  if (!caseItem) {
    res.status(404).json({ success: false, error: "办件不存在" });
    return;
  }
  res.json({ success: true, data: caseItem });
});

router.post("/", (req: Request, res: Response): void => {
  const { serviceId, formData, materials } = req.body;
  const service = mockServices.find((s) => s.id === serviceId);
  if (!service) {
    res.status(400).json({ success: false, error: "服务不存在" });
    return;
  }
  const newCase = {
    id: `c${Date.now()}`,
    caseNo: `KS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, "0")}`,
    serviceId: service.id,
    serviceName: service.name,
    applicantId: "u001",
    applicantName: "张伟",
    status: "submitted" as CaseStatus,
    currentNode: "材料初审",
    timeline: [
      {
        nodeId: "n1",
        nodeName: "在线申报",
        status: "completed",
        handleTime: new Date().toISOString().replace("T", " ").slice(0, 19),
        remark: "申请已提交",
      },
      { nodeId: "n2", nodeName: "材料初审", status: "pending" },
      { nodeId: "n3", nodeName: "业务审核", status: "pending" },
      { nodeId: "n4", nodeName: "结果送达", status: "pending" },
    ],
    materials: materials || [],
    applyTime: new Date().toISOString().replace("T", " ").slice(0, 19),
    formData,
  };
  mockCases.unshift(newCase as any);
  res.json({ success: true, data: newCase });
});

router.post("/:id/review", (req: Request, res: Response): void => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const caseItem = mockCases.find((c) => c.id === id);
  if (!caseItem) {
    res.status(404).json({ success: false, error: "办件不存在" });
    return;
  }
  (caseItem as any).rating = rating;
  (caseItem as any).comment = comment;
  res.json({ success: true, message: "评价提交成功" });
});

export default router;
