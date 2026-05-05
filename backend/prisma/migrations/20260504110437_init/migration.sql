-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelCode" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "isTargetProduct" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccessConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configName" TEXT NOT NULL,
    "unUsedUserPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelAPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelBPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelCPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelDPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelEPass" BOOLEAN NOT NULL DEFAULT true,
    "riskLevelZPass" BOOLEAN NOT NULL DEFAULT true,
    "emptyLevelPass" BOOLEAN NOT NULL DEFAULT true,
    "failedLevelPass" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CollisionConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configName" TEXT NOT NULL,
    "blacklistDays" INTEGER NOT NULL DEFAULT 90,
    "minClearDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Blacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneMd5" TEXT NOT NULL,
    "phonePlain" TEXT,
    "reason" TEXT,
    "expireAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "phonePlain" TEXT,
    "phoneMd5" TEXT NOT NULL,
    "accessResult" TEXT,
    "accessCode" INTEGER,
    "collisionResult" TEXT,
    "collisionCode" INTEGER,
    "registerResult" TEXT,
    "registerCode" INTEGER,
    "returnCode" INTEGER NOT NULL,
    "returnMessage" TEXT NOT NULL,
    "isOldUser" BOOLEAN,
    "downloadUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApiFailure" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "apiName" TEXT NOT NULL,
    "phoneMd5" TEXT,
    "errorMessage" TEXT NOT NULL,
    "errorCount" INTEGER NOT NULL DEFAULT 1,
    "isAlerted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configKey" TEXT NOT NULL,
    "configValue" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_channelCode_key" ON "Channel"("channelCode");

-- CreateIndex
CREATE INDEX "Channel_channelCode_idx" ON "Channel"("channelCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessConfig_configName_key" ON "AccessConfig"("configName");

-- CreateIndex
CREATE UNIQUE INDEX "CollisionConfig_configName_key" ON "CollisionConfig"("configName");

-- CreateIndex
CREATE UNIQUE INDEX "Blacklist_phoneMd5_key" ON "Blacklist"("phoneMd5");

-- CreateIndex
CREATE INDEX "Blacklist_phoneMd5_idx" ON "Blacklist"("phoneMd5");

-- CreateIndex
CREATE INDEX "UserRecord_channelCode_idx" ON "UserRecord"("channelCode");

-- CreateIndex
CREATE INDEX "UserRecord_phoneMd5_idx" ON "UserRecord"("phoneMd5");

-- CreateIndex
CREATE INDEX "UserRecord_createdAt_idx" ON "UserRecord"("createdAt");

-- CreateIndex
CREATE INDEX "ApiFailure_apiName_idx" ON "ApiFailure"("apiName");

-- CreateIndex
CREATE INDEX "ApiFailure_createdAt_idx" ON "ApiFailure"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_configKey_key" ON "SystemConfig"("configKey");
