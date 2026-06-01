import { Router } from 'express';
import { prisma } from '../index';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/qualification', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status) where.status = status;

    const certificates = await prisma.qualificationCertificate.findMany({
      where,
      include: {
        customer: true,
        application: {
          include: {
            product: true
          }
        },
        annualInspections: true,
        renewalRecords: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get qualification certificates' });
  }
});

router.get('/personnel', authenticateToken, async (req, res) => {
  try {
    const certificates = await prisma.personnelCertificate.findMany({
      include: {
        customer: true,
        application: true,
        continuingEducation: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get personnel certificates' });
  }
});

router.post('/qualification', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { applicationId, certificateNo, certificateName, qualificationType, issueDate, expireDate, issuingAuthority, fileUrl } = req.body;

    const application = await prisma.qualificationApplication.findUnique({
      where: { id: applicationId },
      include: { customer: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const certificate = await prisma.qualificationCertificate.create({
      data: {
        customerId: application.customerId,
        applicationId,
        certificateNo,
        certificateName,
        qualificationType,
        issueDate: new Date(issueDate),
        expireDate: new Date(expireDate),
        issuingAuthority,
        issuerId: req.user?.id,
        fileUrl,
        status: 'VALID'
      }
    });

    await prisma.qualificationApplication.update({
      where: { id: applicationId },
      data: {
        status: 'COMPLETED',
        actualEndDate: new Date()
      }
    });

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create qualification certificate' });
  }
});

router.post('/personnel', authenticateToken, async (req, res) => {
  try {
    const { customerId, name, idCard, certificateType, certificateNo, position, professionalTitle, issueDate, expireDate, issuingAuthority, fileUrl, isOccupied } = req.body;

    const certificate = await prisma.personnelCertificate.create({
      data: {
        customerId,
        name,
        idCard,
        certificateType,
        certificateNo,
        position,
        professionalTitle,
        issueDate: new Date(issueDate),
        expireDate: new Date(expireDate),
        issuingAuthority,
        fileUrl,
        isOccupied: isOccupied || false,
        status: 'VALID'
      }
    });

    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create personnel certificate' });
  }
});

router.post('/:id/annual-inspection', authenticateToken, async (req, res) => {
  try {
    const { year, inspectionDate, result, fileUrl, remark } = req.body;

    const inspection = await prisma.annualInspection.create({
      data: {
        certificateId: parseInt(req.params.id),
        year: parseInt(year),
        inspectionDate: inspectionDate ? new Date(inspectionDate) : null,
        result,
        fileUrl,
        remark
      }
    });

    res.json(inspection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create annual inspection record' });
  }
});

router.post('/:id/renewal', authenticateToken, async (req, res) => {
  try {
    const { oldExpireDate, newExpireDate, renewalDate, status, fileUrl, remark } = req.body;

    const renewal = await prisma.renewalRecord.create({
      data: {
        certificateId: parseInt(req.params.id),
        oldExpireDate: new Date(oldExpireDate),
        newExpireDate: new Date(newExpireDate),
        renewalDate: renewalDate ? new Date(renewalDate) : null,
        status,
        fileUrl,
        remark
      }
    });

    if (status === 'COMPLETED') {
      await prisma.qualificationCertificate.update({
        where: { id: parseInt(req.params.id) },
        data: {
          expireDate: new Date(newExpireDate),
          status: 'VALID'
        }
      });
    }

    res.json(renewal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create renewal record' });
  }
});

router.get('/expiring', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const today = new Date();
    const expiryDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const [qualificationCerts, personnelCerts] = await Promise.all([
      prisma.qualificationCertificate.findMany({
        where: {
          expireDate: {
            lte: expiryDate
          },
          status: 'VALID'
        },
        include: { customer: true }
      }),
      prisma.personnelCertificate.findMany({
        where: {
          expireDate: {
            lte: expiryDate
          }
        },
        include: { customer: true }
      })
    ]);

    res.json({
      qualificationCertificates: qualificationCerts,
      personnelCertificates: personnelCerts,
      total: qualificationCerts.length + personnelCerts.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expiring certificates' });
  }
});

export default router;
