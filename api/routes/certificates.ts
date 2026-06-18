import { Router, type Request, type Response } from "express";
import QRCode from "qrcode";
import { mockCertificates } from "../../src/data/mockData";

const router = Router();

router.get("/", (req: Request, res: Response): void => {
  const { status, keyword } = req.query;
  let result = [...mockCertificates];

  if (status && status !== "all") {
    result = result.filter((c) => c.status === status);
  }
  if (keyword) {
    const kw = String(keyword);
    result = result.filter(
      (c) =>
        c.type.includes(kw) ||
        c.certNo.includes(kw) ||
        c.holderName.includes(kw)
    );
  }

  res.json({ success: true, data: result });
});

router.get("/stats", (req: Request, res: Response): void => {
  const stats = {
    total: mockCertificates.length,
    valid: mockCertificates.filter((c) => c.status === "valid").length,
    expiring: mockCertificates.filter((c) => c.status === "expiring").length,
    expired: mockCertificates.filter((c) => c.status === "expired").length,
  };
  res.json({ success: true, data: stats });
});

router.get("/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const cert = mockCertificates.find((c) => c.id === id);
  if (!cert) {
    res.status(404).json({ success: false, error: "证照不存在" });
    return;
  }
  res.json({ success: true, data: cert });
});

router.post("/:id/qrcode", async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const cert = mockCertificates.find((c) => c.id === id);
  if (!cert) {
    res.status(404).json({ success: false, error: "证照不存在" });
    return;
  }
  const data = JSON.stringify({
    certId: cert.id,
    typeCode: cert.typeCode,
    certNo: cert.certNo,
    holder: cert.holderName,
    timestamp: Date.now(),
  });
  const qrDataUrl = await QRCode.toDataURL(data, { width: 240, margin: 2 });
  res.json({
    success: true,
    data: {
      qrCode: qrDataUrl,
      expiresIn: 300,
      certInfo: {
        type: cert.type,
        holder: cert.holderName,
        certNo: cert.certNo,
      },
    },
  });
});

export default router;
