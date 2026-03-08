/*
  Warnings:

  - You are about to drop the column `name` on the `WorkItem` table. All the data in the column will be lost.
  - Added the required column `title` to the `WorkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WorkItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- DropIndex
DROP INDEX "WorkItem_projectId_idx";

-- AlterTable
ALTER TABLE "WorkItem" DROP COLUMN "name",
ADD COLUMN     "assignedUserId" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "plannedStartDate" TIMESTAMP(3),
ADD COLUMN     "status" "WorkItemStatus" NOT NULL DEFAULT 'TODO',
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "WorkItem_projectId_plannedEndDate_idx" ON "WorkItem"("projectId", "plannedEndDate");

-- CreateIndex
CREATE INDEX "WorkItem_assignedUserId_idx" ON "WorkItem"("assignedUserId");

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
