import { Router, type Request, type Response } from "express";
import { mockServices, serviceDomains } from "../../src/data/mockData";
import type { ServiceDomain } from "../../src/types";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { domain, keyword, page = 1, pageSize = 20 } = req.query;
  let result = [...mockServices];

  if (domain && domain !== "all") {
    result = result.filter((s) => s.category === domain);
  }
  if (keyword) {
    const kw = String(keyword);
    result = result.filter(
      (s) =>
        s.name.includes(kw) ||
        s.description.includes(kw) ||
        s.department.includes(kw) ||
        s.subCategory.includes(kw)
    );
  }

  const total = result.length;
  const start = (Number(page) - 1) * Number(pageSize);
  const data = result.slice(start, start + Number(pageSize));

  res.json({
    success: true,
    data: {
      list: data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    },
  });
});

router.get("/domains", (req: Request, res: Response): void => {
  res.json({ success: true, data: serviceDomains });
});

router.get("/hot/top", (req: Request, res: Response): void => {
  const { limit = 10 } = req.query;
  const hot = [...mockServices]
    .sort((a, b) => b.applyCount - a.applyCount)
    .slice(0, Number(limit));
  res.json({ success: true, data: hot });
});

router.get("/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const service = mockServices.find((s) => s.id === id);
  if (!service) {
    res.status(404).json({ success: false, error: "服务不存在" });
    return;
  }
  res.json({ success: true, data: service });
});

export default router;
