import { Router, Request, Response } from "express";
import { mockTrafficControls } from "../src/data/mockData.js";

const router = Router();

router.get("/controls", (req: Request, res: Response) => {
  const { route, source } = req.query;
  let result = [...mockTrafficControls];

  if (source) {
    result = result.filter((t) => t.source === source);
  }

  if (route) {
    result = result.filter((t) =>
      t.affectedRoutes.some((r) => r.includes(route as string))
    );
  }

  res.json({ code: 200, message: "success", data: result });
});

router.post("/subscribe", (req: Request, res: Response) => {
  const { driverId, routes } = req.body;
  res.json({
    code: 200,
    message: "订阅成功",
    data: { driverId, subscribedRoutes: routes || [] },
  });
});

export default router;
