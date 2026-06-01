-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "avatar" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unifiedSocialCode" TEXT NOT NULL,
    "legalRepresentative" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "address" TEXT,
    "industry" TEXT,
    "registeredCapital" REAL,
    "establishedDate" DATETIME,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualificationProduct" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "qualificationType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "estimatedCycle" INTEGER NOT NULL,
    "description" TEXT,
    "price" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PersonnelRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "certificateType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "level" TEXT,
    "position" TEXT,
    "workExperience" INTEGER,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PersonnelRequirement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QualificationProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PerformanceRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "projectType" TEXT NOT NULL,
    "projectCount" INTEGER NOT NULL,
    "amount" REAL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PerformanceRequirement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QualificationProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MaterialTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "templatePath" TEXT,
    "exampleUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MaterialTemplate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QualificationProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualificationApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "applicationNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currentNode" TEXT,
    "planStartDate" DATETIME,
    "planEndDate" DATETIME,
    "actualStartDate" DATETIME,
    "actualEndDate" DATETIME,
    "agentId" INTEGER,
    "handleBy" INTEGER,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualificationApplication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QualificationApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "QualificationProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QualificationApplication_handleBy_fkey" FOREIGN KEY ("handleBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcessNode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicationId" INTEGER NOT NULL,
    "nodeType" TEXT NOT NULL,
    "nodeName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "operatorId" INTEGER,
    "handleDate" DATETIME,
    "remark" TEXT,
    "rejectReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessNode_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "QualificationApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProcessNode_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerMaterial" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "templateId" INTEGER,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" REAL,
    "fileType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expireDate" DATETIME,
    "uploaderId" INTEGER,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerMaterial_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerMaterial_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MaterialTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerMaterial_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonnelCertificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "applicationId" INTEGER,
    "name" TEXT NOT NULL,
    "idCard" TEXT NOT NULL,
    "certificateType" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "position" TEXT,
    "professionalTitle" TEXT,
    "issueDate" DATETIME NOT NULL,
    "expireDate" DATETIME NOT NULL,
    "issuingAuthority" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonnelCertificate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PersonnelCertificate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "QualificationApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualificationCertificate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "certificateName" TEXT NOT NULL,
    "qualificationType" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "expireDate" DATETIME NOT NULL,
    "issuingAuthority" TEXT,
    "issuerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'VALID',
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualificationCertificate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QualificationCertificate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "QualificationApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnnualInspection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "inspectionDate" DATETIME,
    "result" TEXT,
    "fileUrl" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnnualInspection_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "QualificationCertificate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RenewalRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" INTEGER NOT NULL,
    "oldExpireDate" DATETIME NOT NULL,
    "newExpireDate" DATETIME NOT NULL,
    "renewalDate" DATETIME,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RenewalRecord_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "QualificationCertificate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContinuingEducation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "certificateId" INTEGER NOT NULL,
    "personnelName" TEXT,
    "courseName" TEXT NOT NULL,
    "studyHours" INTEGER,
    "completionDate" DATETIME,
    "result" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContinuingEducation_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "PersonnelCertificate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TodoItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT,
    "applicationId" INTEGER,
    "assigneeId" INTEGER,
    "creatorId" INTEGER,
    "dueDate" DATETIME,
    "completedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TodoItem_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "QualificationApplication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TodoItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TodoItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_unifiedSocialCode_key" ON "Customer"("unifiedSocialCode");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationApplication_applicationNo_key" ON "QualificationApplication"("applicationNo");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationCertificate_applicationId_key" ON "QualificationCertificate"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "QualificationCertificate_certificateNo_key" ON "QualificationCertificate"("certificateNo");
