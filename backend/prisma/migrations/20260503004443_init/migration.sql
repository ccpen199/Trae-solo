-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('SMALL_MEDIUM', 'BULK', 'SELF_PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_ENTRY', 'ENTRY_REJECTED', 'WAITING_SCHEDULE', 'SCHEDULING', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'EXPIRED', 'RELEASED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'scheduler',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_centers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distributionCenterId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_configs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distributionCenterId" TEXT,
    "warehouseId" TEXT,
    "orderType" "OrderType",
    "minPieceCount" INTEGER,
    "maxPieceCount" INTEGER,
    "minVolume" DOUBLE PRECISION,
    "maxVolume" DOUBLE PRECISION,
    "minWeight" DOUBLE PRECISION,
    "maxWeight" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "schedule_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNo" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL,
    "orderStatus" "OrderStatus" NOT NULL,
    "distributionCenterId" TEXT,
    "warehouseId" TEXT,
    "pieceCount" INTEGER NOT NULL DEFAULT 0,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "receiverFixedPhone" TEXT,
    "appointmentCalendar" TEXT,
    "isSelfPickup" BOOLEAN NOT NULL DEFAULT false,
    "isSameDayDelivery" BOOLEAN NOT NULL DEFAULT false,
    "hasTimingCalculated" BOOLEAN NOT NULL DEFAULT true,
    "appointmentConsistent" BOOLEAN NOT NULL DEFAULT true,
    "entryCheckTime" TIMESTAMP(3),
    "entryCheckResult" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "warningAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "beforeReceiverName" TEXT,
    "beforeReceiverPhone" TEXT,
    "beforeReceiverFixedPhone" TEXT,
    "beforeAppointmentCalendar" TEXT,
    "afterReceiverName" TEXT,
    "afterReceiverPhone" TEXT,
    "afterReceiverFixedPhone" TEXT,
    "afterAppointmentCalendar" TEXT,
    "confirmTime" TIMESTAMP(3),
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "rejectReason" TEXT,
    "isMaliciousReject" BOOLEAN NOT NULL DEFAULT false,
    "processingTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_reports" (
    "id" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "distributionCenterId" TEXT,
    "warehouseId" TEXT,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "scheduledOrders" INTEGER NOT NULL DEFAULT 0,
    "completedOrders" INTEGER NOT NULL DEFAULT 0,
    "expiredOrders" INTEGER NOT NULL DEFAULT 0,
    "avgProcessingTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maliciousRejects" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_customers" (
    "id" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "rejectCount" INTEGER NOT NULL DEFAULT 0,
    "maliciousRejectCount" INTEGER NOT NULL DEFAULT 0,
    "isRiskCustomer" BOOLEAN NOT NULL DEFAULT false,
    "riskLevel" INTEGER NOT NULL DEFAULT 0,
    "lastRejectTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_centers_code_key" ON "distribution_centers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNo_key" ON "orders"("orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_orderId_key" ON "schedules"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_reports_reportDate_distributionCenterId_warehouseI_key" ON "schedule_reports"("reportDate", "distributionCenterId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "risk_customers_receiverPhone_key" ON "risk_customers"("receiverPhone");

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_distributionCenterId_fkey" FOREIGN KEY ("distributionCenterId") REFERENCES "distribution_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_configs" ADD CONSTRAINT "schedule_configs_distributionCenterId_fkey" FOREIGN KEY ("distributionCenterId") REFERENCES "distribution_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_configs" ADD CONSTRAINT "schedule_configs_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
