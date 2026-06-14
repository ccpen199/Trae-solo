-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "idCardEncrypted" TEXT NOT NULL,
    "email" TEXT,
    "avatar" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "institutionId" TEXT,
    "insuranceCompanyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_insuranceCompanyId_fkey" FOREIGN KEY ("insuranceCompanyId") REFERENCES "InsuranceCompany" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Institution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "level" TEXT,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "hisApiConfigEncrypted" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HealthPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "institutionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "originalPrice" DECIMAL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "description" TEXT,
    "notice" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthPackage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "checkupDate" DATETIME NOT NULL,
    "checkupTime" TEXT NOT NULL,
    "checkupPersonEncrypted" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "hisSyncStatus" TEXT NOT NULL DEFAULT 'NOT_SYNCED',
    "hisOrderId" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "amount" DECIMAL NOT NULL,
    "reportId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "HealthPackage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsuranceCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "apiConfigEncrypted" TEXT NOT NULL,
    "commissionRate" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "coverage" TEXT NOT NULL,
    "premium" DECIMAL NOT NULL,
    "underwritingRules" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceProduct_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "InsuranceCompany" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsuranceOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "policyNumber" TEXT,
    "applicantEncrypted" TEXT NOT NULL,
    "insuredEncrypted" TEXT NOT NULL,
    "beneficiary" TEXT,
    "assessmentResult" TEXT,
    "premium" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_ASSESSMENT',
    "effectiveDate" DATETIME,
    "expiryDate" DATETIME,
    "settlementId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsuranceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InsuranceOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InsuranceOrder_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "Settlement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthArchive" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportUrl" TEXT NOT NULL,
    "ocrStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "structuredData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthArchive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "HealthArchive_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "archiveId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "referenceRange" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NORMAL',
    "measureDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HealthIndicator_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "HealthArchive" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AbnormalIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "archiveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "referenceRange" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'MILD',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AbnormalIndicator_archiveId_fkey" FOREIGN KEY ("archiveId") REFERENCES "HealthArchive" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diabetesRisk" DECIMAL NOT NULL,
    "hypertensionRisk" DECIMAL NOT NULL,
    "cardiovascularRisk" DECIMAL NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "suggestions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiskAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalPremium" DECIMAL NOT NULL,
    "commissionRate" DECIMAL NOT NULL,
    "commissionAmount" DECIMAL NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settlement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "InsuranceCompany" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestDataEncrypted" TEXT,
    "responseDataEncrypted" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");

-- CreateIndex
CREATE INDEX "User_insuranceCompanyId_idx" ON "User"("insuranceCompanyId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "Institution_type_idx" ON "Institution"("type");

-- CreateIndex
CREATE INDEX "Institution_status_idx" ON "Institution"("status");

-- CreateIndex
CREATE INDEX "Institution_city_idx" ON "Institution"("city");

-- CreateIndex
CREATE INDEX "HealthPackage_institutionId_idx" ON "HealthPackage"("institutionId");

-- CreateIndex
CREATE INDEX "HealthPackage_type_idx" ON "HealthPackage"("type");

-- CreateIndex
CREATE INDEX "HealthPackage_status_idx" ON "HealthPackage"("status");

-- CreateIndex
CREATE INDEX "HealthPackage_city_idx" ON "HealthPackage"("city");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_packageId_idx" ON "Booking"("packageId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_checkupDate_idx" ON "Booking"("checkupDate");

-- CreateIndex
CREATE INDEX "Booking_paymentStatus_idx" ON "Booking"("paymentStatus");

-- CreateIndex
CREATE INDEX "Booking_hisSyncStatus_idx" ON "Booking"("hisSyncStatus");

-- CreateIndex
CREATE INDEX "InsuranceCompany_status_idx" ON "InsuranceCompany"("status");

-- CreateIndex
CREATE INDEX "InsuranceProduct_companyId_idx" ON "InsuranceProduct"("companyId");

-- CreateIndex
CREATE INDEX "InsuranceProduct_type_idx" ON "InsuranceProduct"("type");

-- CreateIndex
CREATE INDEX "InsuranceProduct_status_idx" ON "InsuranceProduct"("status");

-- CreateIndex
CREATE INDEX "InsuranceOrder_userId_idx" ON "InsuranceOrder"("userId");

-- CreateIndex
CREATE INDEX "InsuranceOrder_productId_idx" ON "InsuranceOrder"("productId");

-- CreateIndex
CREATE INDEX "InsuranceOrder_status_idx" ON "InsuranceOrder"("status");

-- CreateIndex
CREATE INDEX "InsuranceOrder_settlementId_idx" ON "InsuranceOrder"("settlementId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthArchive_bookingId_key" ON "HealthArchive"("bookingId");

-- CreateIndex
CREATE INDEX "HealthArchive_userId_idx" ON "HealthArchive"("userId");

-- CreateIndex
CREATE INDEX "HealthArchive_bookingId_idx" ON "HealthArchive"("bookingId");

-- CreateIndex
CREATE INDEX "HealthArchive_ocrStatus_idx" ON "HealthArchive"("ocrStatus");

-- CreateIndex
CREATE INDEX "HealthIndicator_archiveId_idx" ON "HealthIndicator"("archiveId");

-- CreateIndex
CREATE INDEX "HealthIndicator_category_idx" ON "HealthIndicator"("category");

-- CreateIndex
CREATE INDEX "HealthIndicator_status_idx" ON "HealthIndicator"("status");

-- CreateIndex
CREATE INDEX "AbnormalIndicator_archiveId_idx" ON "AbnormalIndicator"("archiveId");

-- CreateIndex
CREATE INDEX "AbnormalIndicator_level_idx" ON "AbnormalIndicator"("level");

-- CreateIndex
CREATE INDEX "RiskAssessment_userId_idx" ON "RiskAssessment"("userId");

-- CreateIndex
CREATE INDEX "RiskAssessment_assessmentDate_idx" ON "RiskAssessment"("assessmentDate");

-- CreateIndex
CREATE INDEX "Settlement_companyId_idx" ON "Settlement"("companyId");

-- CreateIndex
CREATE INDEX "Settlement_status_idx" ON "Settlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_period_idx" ON "Settlement"("period");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_idx" ON "AuditLog"("targetType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
