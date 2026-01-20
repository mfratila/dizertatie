/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `endDate` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plannedBudget` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PM', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "KpiType" AS ENUM ('CPI', 'SPI', 'BURN_RATE');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "plannedBudget" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleInProject" "Role" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkItem" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "plannedEndDate" TIMESTAMP(3) NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Timesheet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "workItemId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(6,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Timesheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CostEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Baseline" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "plannedValueTotal" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Baseline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIDefinition" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "type" "KpiType" NOT NULL,
    "thresholdGreen" DECIMAL(8,4) NOT NULL,
    "thresholdYellow" DECIMAL(8,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPIDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPISnapshot" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "kpiDefinitionId" INTEGER NOT NULL,
    "value" DECIMAL(12,6) NOT NULL,
    "status" "KpiStatus" NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPISnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectId_userId_key" ON "ProjectMember"("projectId", "userId");

-- CreateIndex
CREATE INDEX "WorkItem_projectId_idx" ON "WorkItem"("projectId");

-- CreateIndex
CREATE INDEX "Timesheet_userId_date_idx" ON "Timesheet"("userId", "date");

-- CreateIndex
CREATE INDEX "Timesheet_workItemId_date_idx" ON "Timesheet"("workItemId", "date");

-- CreateIndex
CREATE INDEX "CostEntry_projectId_date_idx" ON "CostEntry"("projectId", "date");

-- CreateIndex
CREATE INDEX "Baseline_projectId_idx" ON "Baseline"("projectId");

-- CreateIndex
CREATE INDEX "KPIDefinition_projectId_idx" ON "KPIDefinition"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "KPIDefinition_projectId_type_key" ON "KPIDefinition"("projectId", "type");

-- CreateIndex
CREATE INDEX "KPISnapshot_projectId_computedAt_idx" ON "KPISnapshot"("projectId", "computedAt");

-- CreateIndex
CREATE INDEX "KPISnapshot_kpiDefinitionId_computedAt_idx" ON "KPISnapshot"("kpiDefinitionId", "computedAt");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Timesheet" ADD CONSTRAINT "Timesheet_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostEntry" ADD CONSTRAINT "CostEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Baseline" ADD CONSTRAINT "Baseline_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIDefinition" ADD CONSTRAINT "KPIDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPISnapshot" ADD CONSTRAINT "KPISnapshot_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPISnapshot" ADD CONSTRAINT "KPISnapshot_kpiDefinitionId_fkey" FOREIGN KEY ("kpiDefinitionId") REFERENCES "KPIDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
