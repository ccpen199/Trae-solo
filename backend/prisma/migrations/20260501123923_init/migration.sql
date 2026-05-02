-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mainOrderNo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_DATA_ENTRY',
    "previousStatus" TEXT,
    "declarationType" TEXT NOT NULL,
    "tradeMode" TEXT NOT NULL,
    "customsCode" TEXT NOT NULL,
    "iePort" TEXT NOT NULL,
    "shipper" TEXT NOT NULL,
    "consignee" TEXT NOT NULL,
    "notifyParty" TEXT,
    "transportMode" TEXT NOT NULL,
    "voyageNo" TEXT,
    "billOfLadingNo" TEXT,
    "entryDate" DATETIME,
    "expectedDate" DATETIME,
    "actualDate" DATETIME,
    "creatorId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "lockedBy" TEXT,
    "lockedAt" DATETIME,
    "totalValue" DECIMAL,
    "totalTax" DECIMAL,
    "currency" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Declaration_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Declaration_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeclarationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "hsCode" TEXT,
    "productName" TEXT NOT NULL,
    "specification" TEXT,
    "originCountry" TEXT,
    "quantity" DECIMAL,
    "unit" TEXT,
    "unitPrice" DECIMAL,
    "totalAmount" DECIMAL,
    "currency" TEXT,
    "taxRate" DECIMAL,
    "taxAmount" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_DATA_ENTRY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeclarationItem_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docNo" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaxRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "itemId" TEXT,
    "taxType" TEXT NOT NULL,
    "taxBase" DECIMAL,
    "taxRate" DECIMAL,
    "taxAmount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL,
    "exchangeRate" DECIMAL,
    "paidStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidAt" DATETIME,
    "paymentRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaxRecord_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "inspectionNo" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "inspector" TEXT,
    "inspectionDate" DATETIME,
    "result" TEXT,
    "conclusion" TEXT,
    "needSupplement" BOOLEAN NOT NULL DEFAULT false,
    "supplementItems" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "operatorRole" TEXT NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StatusHistory_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationLog_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TodoItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TodoItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TodoItem_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT,
    "receiverId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "msgType" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExceptionRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "declarationId" TEXT NOT NULL,
    "exceptionType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "handlerId" TEXT,
    "handledAt" DATETIME,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExceptionRecord_declarationId_fkey" FOREIGN KEY ("declarationId") REFERENCES "Declaration" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConfigRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ruleType" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currencyPair" TEXT NOT NULL,
    "rate" DECIMAL NOT NULL,
    "rateDate" DATETIME NOT NULL,
    "source" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CreditLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "totalLimit" DECIMAL NOT NULL,
    "usedLimit" DECIMAL NOT NULL DEFAULT 0,
    "availableLimit" DECIMAL NOT NULL,
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Declaration_mainOrderNo_key" ON "Declaration"("mainOrderNo");

-- CreateIndex
CREATE INDEX "Declaration_mainOrderNo_idx" ON "Declaration"("mainOrderNo");

-- CreateIndex
CREATE INDEX "Declaration_status_idx" ON "Declaration"("status");

-- CreateIndex
CREATE INDEX "Declaration_creatorId_idx" ON "Declaration"("creatorId");

-- CreateIndex
CREATE INDEX "Declaration_assigneeId_idx" ON "Declaration"("assigneeId");

-- CreateIndex
CREATE INDEX "Declaration_createdAt_idx" ON "Declaration"("createdAt");

-- CreateIndex
CREATE INDEX "DeclarationItem_declarationId_idx" ON "DeclarationItem"("declarationId");

-- CreateIndex
CREATE INDEX "Document_declarationId_idx" ON "Document"("declarationId");

-- CreateIndex
CREATE INDEX "TaxRecord_declarationId_idx" ON "TaxRecord"("declarationId");

-- CreateIndex
CREATE INDEX "Inspection_declarationId_idx" ON "Inspection"("declarationId");

-- CreateIndex
CREATE INDEX "StatusHistory_declarationId_idx" ON "StatusHistory"("declarationId");

-- CreateIndex
CREATE INDEX "StatusHistory_createdAt_idx" ON "StatusHistory"("createdAt");

-- CreateIndex
CREATE INDEX "OperationLog_userId_idx" ON "OperationLog"("userId");

-- CreateIndex
CREATE INDEX "OperationLog_declarationId_idx" ON "OperationLog"("declarationId");

-- CreateIndex
CREATE INDEX "OperationLog_createdAt_idx" ON "OperationLog"("createdAt");

-- CreateIndex
CREATE INDEX "TodoItem_assigneeId_idx" ON "TodoItem"("assigneeId");

-- CreateIndex
CREATE INDEX "TodoItem_status_idx" ON "TodoItem"("status");

-- CreateIndex
CREATE INDEX "TodoItem_dueDate_idx" ON "TodoItem"("dueDate");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "Message"("isRead");

-- CreateIndex
CREATE INDEX "ExceptionRecord_declarationId_idx" ON "ExceptionRecord"("declarationId");

-- CreateIndex
CREATE INDEX "ExceptionRecord_status_idx" ON "ExceptionRecord"("status");

-- CreateIndex
CREATE INDEX "ExceptionRecord_createdAt_idx" ON "ExceptionRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigRule_ruleCode_key" ON "ConfigRule"("ruleCode");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_currencyPair_rateDate_key" ON "ExchangeRate"("currencyPair", "rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "CreditLimit_entityType_entityId_key" ON "CreditLimit"("entityType", "entityId");
