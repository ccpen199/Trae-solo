-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "realName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CAR_OWNER',
    "avatar" TEXT,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "totalChargingKw" DECIMAL NOT NULL DEFAULT 0,
    "totalCost" DECIMAL NOT NULL DEFAULT 0,
    "carbonReduction" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "stationId" TEXT,
    CONSTRAINT "User_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "batteryCapacity" DECIMAL NOT NULL,
    "currentSoc" INTEGER NOT NULL DEFAULT 80,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "latitude" DECIMAL NOT NULL,
    "longitude" DECIMAL NOT NULL,
    "operatorId" TEXT NOT NULL,
    "operatorName" TEXT NOT NULL,
    "totalPiles" INTEGER NOT NULL DEFAULT 0,
    "availablePiles" INTEGER NOT NULL DEFAULT 0,
    "chargingPower" DECIMAL NOT NULL DEFAULT 0,
    "serviceHours" TEXT NOT NULL DEFAULT '24小时',
    "supportServices" TEXT NOT NULL,
    "rating" DECIMAL NOT NULL DEFAULT 5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Charger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "maxPower" DECIMAL NOT NULL,
    "currentPower" DECIMAL NOT NULL DEFAULT 0,
    "protocol" TEXT NOT NULL DEFAULT 'OCPP1.6',
    "ipAddress" TEXT,
    "firmwareVersion" TEXT,
    "lastHeartbeat" DATETIME,
    "totalKw" DECIMAL NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentOrderId" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "privatePileId" TEXT,
    CONSTRAINT "Charger_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Charger_currentOrderId_fkey" FOREIGN KEY ("currentOrderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Charger_privatePileId_fkey" FOREIGN KEY ("privatePileId") REFERENCES "PrivatePile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chargerId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "stationName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startSoc" INTEGER NOT NULL,
    "endSoc" INTEGER,
    "startPower" DECIMAL NOT NULL,
    "chargedKw" DECIMAL NOT NULL DEFAULT 0,
    "peakKw" DECIMAL NOT NULL DEFAULT 0,
    "pricePerKw" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL NOT NULL DEFAULT 0,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "greenEnergyType" TEXT,
    "greenEnergyRatio" DECIMAL NOT NULL DEFAULT 0,
    "carbonReduction" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_chargerId_fkey" FOREIGN KEY ("chargerId") REFERENCES "Charger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reservationNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chargerId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledStartTime" DATETIME NOT NULL,
    "scheduledEndTime" DATETIME NOT NULL,
    "actualStartTime" DATETIME,
    "actualEndTime" DATETIME,
    "powerLimit" DECIMAL,
    "depositAmount" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reservation_chargerId_fkey" FOREIGN KEY ("chargerId") REFERENCES "Charger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "payMethod" TEXT NOT NULL,
    "payTime" DATETIME NOT NULL,
    "transactionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRecord_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alarmNo" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "chargerId" TEXT,
    "type" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNHANDLED',
    "handledAt" DATETIME,
    "handledBy" TEXT,
    "handledNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Alarm_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Alarm_chargerId_fkey" FOREIGN KEY ("chargerId") REFERENCES "Charger" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChargerHealth" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chargerId" TEXT NOT NULL,
    "temperature" DECIMAL NOT NULL,
    "voltage" DECIMAL NOT NULL,
    "current" DECIMAL NOT NULL,
    "insulationResistance" DECIMAL NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "checkTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChargerHealth_chargerId_fkey" FOREIGN KEY ("chargerId") REFERENCES "Charger" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GreenCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "certificateNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "energyType" TEXT NOT NULL,
    "energyAmount" DECIMAL NOT NULL,
    "carbonReduction" DECIMAL NOT NULL,
    "gridCompany" TEXT NOT NULL,
    "issuedAt" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GreenCertificate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GreenCertificate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrivatePile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "chargerId" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "chargerType" TEXT NOT NULL,
    "maxPower" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'INACTIVE',
    "pricePerKw" DECIMAL NOT NULL DEFAULT 1.2,
    "serviceFee" DECIMAL NOT NULL DEFAULT 0.5,
    "totalEarnings" DECIMAL NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PrivatePile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharingTimeSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "privatePileId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharingTimeSlot_privatePileId_fkey" FOREIGN KEY ("privatePileId") REFERENCES "PrivatePile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SharingEarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "privatePileId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "chargedKw" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "platformFee" DECIMAL NOT NULL,
    "ownerEarning" DECIMAL NOT NULL,
    "settlementDate" DATETIME NOT NULL,
    "settled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SharingEarning_privatePileId_fkey" FOREIGN KEY ("privatePileId") REFERENCES "PrivatePile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SharingEarning_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StationStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stationId" TEXT NOT NULL,
    "statsDate" DATETIME NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalChargingKw" DECIMAL NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL NOT NULL DEFAULT 0,
    "avgStayMinutes" DECIMAL NOT NULL DEFAULT 0,
    "avgOrderAmount" DECIMAL NOT NULL DEFAULT 0,
    "peakHourStart" INTEGER NOT NULL DEFAULT 18,
    "peakHourEnd" INTEGER NOT NULL DEFAULT 20,
    "trafficDensity" DECIMAL NOT NULL DEFAULT 0,
    "utilizationRate" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StationStats_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ElectricityPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "pricePerKw" DECIMAL NOT NULL,
    "isPeak" BOOLEAN NOT NULL DEFAULT false,
    "isValley" BOOLEAN NOT NULL DEFAULT false,
    "effectiveDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CarbonTrade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tradeNo" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "carbonAmount" DECIMAL NOT NULL,
    "pricePerTon" DECIMAL NOT NULL,
    "totalAmount" DECIMAL NOT NULL,
    "tradeType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tradeTime" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CarbonTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalChargingKw" DECIMAL NOT NULL DEFAULT 0,
    "avgChargingFreq" DECIMAL NOT NULL DEFAULT 0,
    "preferredStation" TEXT,
    "preferredTime" TEXT,
    "avgSocStart" DECIMAL NOT NULL DEFAULT 30,
    "avgSocEnd" DECIMAL NOT NULL DEFAULT 80,
    "chargingLevel" TEXT NOT NULL DEFAULT 'BRONZE',
    "riskScore" INTEGER NOT NULL DEFAULT 100,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GridStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statsDate" DATETIME NOT NULL,
    "totalLoadMw" DECIMAL NOT NULL DEFAULT 0,
    "peakLoadMw" DECIMAL NOT NULL DEFAULT 0,
    "valleyLoadMw" DECIMAL NOT NULL DEFAULT 0,
    "newEnergyRatio" DECIMAL NOT NULL DEFAULT 0,
    "totalChargingKw" DECIMAL NOT NULL DEFAULT 0,
    "chargingPeakKw" DECIMAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_key" ON "Vehicle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Charger_serialNumber_key" ON "Charger"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Charger_currentOrderId_key" ON "Charger"("currentOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Charger_privatePileId_key" ON "Charger"("privatePileId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNo_key" ON "Order"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNo_key" ON "Reservation"("reservationNo");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRecord_orderId_key" ON "PaymentRecord"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Alarm_alarmNo_key" ON "Alarm"("alarmNo");

-- CreateIndex
CREATE UNIQUE INDEX "GreenCertificate_certificateNo_key" ON "GreenCertificate"("certificateNo");

-- CreateIndex
CREATE UNIQUE INDEX "GreenCertificate_orderId_key" ON "GreenCertificate"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivatePile_chargerId_key" ON "PrivatePile"("chargerId");

-- CreateIndex
CREATE UNIQUE INDEX "StationStats_stationId_statsDate_key" ON "StationStats"("stationId", "statsDate");

-- CreateIndex
CREATE UNIQUE INDEX "CarbonTrade_tradeNo_key" ON "CarbonTrade"("tradeNo");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GridStats_statsDate_key" ON "GridStats"("statsDate");
